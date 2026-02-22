import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export type FeedbackComment = {
  id: string;
  name: string;
  text: string;
  createdAt: string;
  emailHash: string;
};

export type FeedbackPost = {
  ratings: Record<string, number>;
  comments: FeedbackComment[];
};

type FeedbackStore = {
  posts: Record<string, FeedbackPost>;
};

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'blog-feedback.json');

const EMPTY_STORE: FeedbackStore = { posts: {} };

let writeChain: Promise<void> = Promise.resolve();

async function ensureStoreFile(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(STORE_FILE, 'utf8');
  } catch {
    await writeFile(STORE_FILE, JSON.stringify(EMPTY_STORE, null, 2), 'utf8');
  }
}

async function readStore(): Promise<FeedbackStore> {
  await ensureStoreFile();
  try {
    const raw = await readFile(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<FeedbackStore>;
    if (!parsed || typeof parsed !== 'object') return { ...EMPTY_STORE };
    if (!parsed.posts || typeof parsed.posts !== 'object') return { ...EMPTY_STORE };
    return { posts: parsed.posts as Record<string, FeedbackPost> };
  } catch {
    return { ...EMPTY_STORE };
  }
}

async function writeStore(data: FeedbackStore): Promise<void> {
  await ensureStoreFile();
  await writeFile(STORE_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function normalizeSlug(rawSlug: string): string {
  return rawSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
}

function ensurePost(store: FeedbackStore, slug: string): FeedbackPost {
  if (!store.posts[slug]) {
    store.posts[slug] = { ratings: {}, comments: [] };
  }
  if (!store.posts[slug].ratings) store.posts[slug].ratings = {};
  if (!Array.isArray(store.posts[slug].comments)) store.posts[slug].comments = [];
  return store.posts[slug];
}

export async function getPostFeedback(rawSlug: string, visitorId?: string) {
  const slug = normalizeSlug(rawSlug);
  const store = await readStore();
  const post = ensurePost(store, slug);

  const ratingValues = Object.values(post.ratings).filter((n) => n >= 1 && n <= 5);
  const ratingCount = ratingValues.length;
  const averageRating = ratingCount ? Number((ratingValues.reduce((a, b) => a + b, 0) / ratingCount).toFixed(1)) : 0;
  const myRating = visitorId && post.ratings[visitorId] ? post.ratings[visitorId] : null;

  return {
    slug,
    averageRating,
    ratingCount,
    myRating,
    comments: post.comments
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((c) => ({
        id: c.id,
        name: c.name,
        text: c.text,
        createdAt: c.createdAt
      }))
  };
}

export async function setRating(rawSlug: string, visitorId: string, rating: number) {
  const slug = normalizeSlug(rawSlug);
  writeChain = writeChain.then(async () => {
    const store = await readStore();
    const post = ensurePost(store, slug);
    post.ratings[visitorId] = rating;
    await writeStore(store);
  });
  await writeChain;
  return getPostFeedback(slug, visitorId);
}

export async function addComment(rawSlug: string, name: string, text: string, emailHash: string) {
  const slug = normalizeSlug(rawSlug);
  const comment = {
    id: `c_${randomUUID()}`,
    name,
    text,
    createdAt: new Date().toISOString(),
    emailHash
  };

  writeChain = writeChain.then(async () => {
    const store = await readStore();
    const post = ensurePost(store, slug);
    post.comments.push(comment);
    await writeStore(store);
  });
  await writeChain;
  return comment;
}

