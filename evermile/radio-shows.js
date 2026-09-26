/*
  What the radio people say. Every function returns a segment: a list of lines ({who, text, phone}), sound effects
  ({fx}), pauses ({pause}) and moments where the music comes up ({music}). Lines are written to be spoken: short
  sentences, contractions, and a little of the drive you are on (the time, the weather, the road, the next town).
*/
const pick = (l) => l[Math.floor(Math.random() * l.length)];
const chance = (p) => Math.random() < p;
const L = (who, text, extra) => ({who, text, ...extra});
const H = (t) => L('host', t), C = (t) => L('co', t), P1 = (t) => L('c1', t, {phone: true}), P2 = (t) => L('c2', t, {phone: true}), KID = (t) => L('kid', t, {phone: true});
const FX = (fx) => ({fx}), PAUSE = (pause) => ({pause}), MUSIC = (music) => ({music});

const HER = ['Emma', 'Sophie', 'Aisha', 'Hannah', 'Maryam', 'Chloe', 'Layla', 'Grace', 'Noor', 'Olivia', 'Zara', 'Ruby'];
const HIM = ['James', 'Ahmed', 'Tom', 'Daniel', 'Yusuf', 'Sam', 'Omar', 'Jack', 'Khalid', 'Ben', 'Ryan', 'Adam'];
const KIDS = ['Lily', 'Noah', 'Mia', 'Zayn', 'Ella', 'Leo', 'Amira', 'Theo'];
const PLACES = ['Muscat', 'Salalah', 'Sohar', 'Nizwa', 'Sur', 'the coast', 'the mountains', 'the city', 'the lake', 'Grandma’s house'];

/* ---------- Bits of the moment ---------- */
function daypart(h) { return h < 5 ? 'night' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21.5 ? 'evening' : 'night'; }
function hello(h) { const p = daypart(h); return p === 'night' ? pick(['Hello, night owls', 'Good evening, or should I say good morning', 'Hey there, late-night drivers']) : `Good ${p}`; }
function spokenTime(clock) {
  if (!clock) return '';
  const [h, m] = clock.split(':').map(Number), h12 = h % 12 || 12, words = m === 0 ? `${h12} o'clock` : m < 10 ? `${h12} oh ${m}` : `${h12} ${m}`;
  return `${words} ${h < 12 ? 'in the morning' : h < 17 ? 'in the afternoon' : h < 21 ? 'in the evening' : 'at night'}`;
}
function distance(c) { const km = c.km || 0; if (km < 1) return ''; const n = c.units === 'mi' ? Math.round(km / 1.609) : Math.round(km); const u = c.units === 'mi' ? 'miles' : 'kilometres'; return `${n} ${n === 1 ? u.slice(0, -1) : u}`; }
function weather(c) {
  const h = c.hour ?? 12;
  if (c.rain > .5) return pick(['It is properly raining out there right now, so ease off a little, keep your distance, and enjoy the drumming on the roof.', 'Heavy rain across the hills. Wipers on, lights on, and no rush. The road will wait for you.']);
  if (c.rain > .05) return pick(['A little drizzle about, nothing serious. It should blow through soon.', 'Light rain on the windscreen, the kind that makes everything smell fresh.']);
  if (c.mist > .3 && h < 10) return 'There is mist lying low in the valleys this morning. It looks magical, but take the dips gently.';
  if (c.cloud > .7) return 'Clouds building over the hills. We might get some rain later, so keep an eye on the sky.';
  if (h > 17.2 && h < 19.8) return pick(['The sun is getting low, and the light out there is golden. If you can, pull over at a viewpoint and just look.', 'Golden hour, everybody. The best light of the whole day.']);
  if (h > 21 || h < 4.8) return pick(['Clear skies tonight, and plenty of stars if you get somewhere dark.', 'A cool, quiet night out there. Headlights on and enjoy the empty roads.']);
  if (c.season === 'winter') return 'Crisp and cold out there, so watch for frost on the shady bends.';
  return pick(['Blue skies and sunshine. Honestly, perfect driving weather.', 'Bright and clear across the region. Windows down, if you ask me.', 'Sunny, calm and beautiful. What a day to be on the road.']);
}
function road(c) {
  const name = c.roadName ? `, on the way to ${c.roadName}` : '';
  return ({
    mountain: `If you're up on the mountain pass${name}, take those hairpins slowly, and look out for snow near the top.`,
    highway: `On the motorway${name}, traffic is moving nicely in both directions.`,
    coast: `Down on the lakeside road${name}, the water is looking gorgeous right now.`,
    farm: `Out on the farm lanes${name}? Keep an eye out for tractors, horses and the odd very relaxed cow.`,
  })[c.road] || `On the hill roads${name}, it's a lovely drive through the valleys today.`;
}
function nextTown(c) { return c.town ? pick([`Heading towards ${c.town}? Say hello to everyone there from all of us.`, `Big hello to everyone in ${c.town} today.`, `${c.town} is coming up soon, lovely little place. Mind the speed as you go through.`]) : ''; }
function ident(st) { return pick([`You're listening to ${st.name}, ${st.freq}.`, `This is ${st.name} on ${st.freq}. ${cap(st.tag)}.`, `${st.freq}, ${st.name}.`]); }
function cap(s) { return s[0].toUpperCase() + s.slice(1); }

/* ---------- Song names ---------- */
const TITLES = {
  lofi: [['Paper', 'Rainy', 'Slow', 'Sunday', 'Velvet', 'Warm', 'Quiet', 'Lazy', 'Golden', 'Faded', 'Soft', 'Late'], ['Coffee', 'Windows', 'Mornings', 'Tape', 'Streetlights', 'Clouds', 'Polaroids', 'Pages', 'Rooftops', 'Letters', 'Sweaters', 'Miles']],
  acoustic: [['Salt', 'Harbour', 'Summer', 'Driftwood', 'Blue', 'Open', 'Barefoot', 'Seaside', 'Wild', 'Easy'], ['Road', 'Morning', 'Heart', 'Tide', 'Sky', 'Horizon', 'Window', 'Postcard', 'Sunday', 'Breeze']],
  synthwave: [['Neon', 'Midnight', 'Chrome', 'Electric', 'Starlight', 'Laser', 'Crystal', 'Night', 'Pulse', 'Afterglow'], ['Highway', 'Skyline', 'Runner', 'Horizon', 'Dreams', 'Boulevard', 'City', 'Arcade', 'Drive', 'Mirage']],
};
const ARTISTS = {lofi: ['Kyoto Tapes', 'Mellow Fox', 'Loop Garden', 'Night Owl Club', 'Sleepy Pilot', 'Juniper Beats'], acoustic: ['The Tidewaters', 'Hannah Reed', 'Driftwood Hearts', 'Sam Holloway', 'Salt and Pine', 'The Sunday Porch'], synthwave: ['Neon Harbor', 'Chrome Division', 'Midnight Arcade', 'Vector Sunset', 'Laser Cassette', 'Nova Drive'], classical: ['the Evermile Chamber Orchestra', 'the Hillside Quartet', 'Clara Voss at the piano', 'the Valley Strings']};
const KEYS = ['C', 'C sharp', 'D', 'E flat', 'E', 'F', 'F sharp', 'G', 'A flat', 'A', 'B flat', 'B'];
export function songTitle(st, song) {
  const g = st.genre;
  if (g === 'classical') { const form = song.beats === 3 ? pick(['Waltz', 'Minuet', 'Country Dance']) : pick(['Nocturne', 'Prelude', 'Romance', 'Serenade', 'Pastorale', 'Andante']); return {title: `${form} in ${KEYS[song.root % 12]} ${song.minor ? 'minor' : 'major'}`, artist: pick(ARTISTS.classical)}; }
  const [a, b] = TITLES[g] || TITLES.lofi; return {title: `${pick(a)} ${pick(b)}`, artist: pick(ARTISTS[g] || ARTISTS.lofi)};
}
function back(r) { const s = r.last?.meta; return s ? pick([`That was ${s.title} by ${s.artist}.`, `${s.artist} there, with ${s.title}.`, `Lovely. ${s.title}, from ${s.artist}.`]) : ''; }
function ahead(r) { const s = r.song?.meta; return s ? pick([`Here's ${s.artist}, with ${s.title}.`, `Coming up, ${s.title} by ${s.artist}.`, `This is ${s.title}. Turn it up.`, `Next, it's ${s.artist}.`]) : pick(['Back to the music.', 'More music, right now.']); }

/* ---------- Features on the music stations ---------- */
const FACTS = [
  ['Octopuses have three hearts, and their blood is blue.', 'Three hearts! And I can barely manage one on a Monday.'],
  ['Honey never really goes off. Pots of it found in ancient Egyptian tombs were still edible.', 'Three thousand year old honey. Still better than my cooking.'],
  ['A day on Venus is longer than a whole year on Venus.', 'So you could have your birthday twice before lunch?'],
  ['Bananas are technically berries, but strawberries are not.', 'I refuse to accept that. I simply refuse.'],
  ['Sharks have been around longer than trees.', 'That is deeply unsettling.'],
  ['The Eiffel Tower grows around fifteen centimetres taller on hot summer days, because the metal expands.', 'Same. I also expand in summer. Ice cream.'],
  ['Oman\'s Jebel Shams, the Mountain of the Sun, rises to about three thousand metres.', 'And there\'s a canyon up there they call the Grand Canyon of Arabia. On my list.'],
  ['Frankincense has been harvested in Dhofar, in southern Oman, for thousands of years.', 'It was once worth more than gold, right?'],
  ['A group of flamingos is called a flamboyance.', 'That is the best word I have heard all week.'],
  ['Sea otters hold hands while they sleep, so they don\'t drift apart.', 'Okay, that\'s adorable. That\'s the most adorable thing.'],
  ['The longest road tunnel in the world, the Lærdal tunnel in Norway, is more than twenty four kilometres long.', 'Twenty four kilometres! You\'d want a good radio station for that. Oh wait.'],
  ['Wombats produce cube shaped droppings.', 'On that note, back to the music, shall we?'],
];
const SHOUTS = [
  (n, p) => `A big shout out to ${n}, driving to ${p} for a surprise birthday party. Don't forget the cake!`,
  (n, p) => `${n} is on the way to ${p} for a first day at a new job. Good luck, you'll be brilliant.`,
  (n, p) => `This one goes out to ${n}, on a road trip to ${p} with the whole family. Are we there yet? Not yet!`,
  (n, p) => `${n} messaged to say: I've been driving since sunrise, and this station has kept me smiling. Thank you, ${n}. Safe travels to ${p}.`,
  (n, p) => `Morning to ${n}, heading to ${p} to see an old friend after ten years. That's what it's all about.`,
];

function trivia(r) {
  const [fact, reply] = r.fresh('fact', FACTS), duo = !!r.station.cast.co;
  const opener = pick(['Right, time for a fact you did not know you needed.', 'Fact of the day, coming up.', 'Here is something to think about on the road.']);
  return duo ? [H(opener), H(pick(['Did you know', 'Okay, did you know that']) + ' ' + fact.charAt(0).toLowerCase() + fact.slice(1)), C(reply)] : [H(opener), H(fact)];
}
function shoutout(r) { const n = pick([...HER, ...HIM]); return [H(r.fresh('shout', SHOUTS)(n, pick(PLACES)))]; }

// A listener asks us to call their sweetheart with a message.
function sweetheart(r) {
  const him = chance(.5), from = pick(him ? HIM : HER), to = pick(him ? HER : HIM), pr = him ? 'him' : 'her', st = r.station, host = st.cast.host.name, P1 = him ? (t) => L('c1', t, {phone: true}) : (t) => L('c2', t, {phone: true});
  const msg = pick([
    `I miss you already. I've got the window down and our song on, and I'll be home before dinner. Oh, and look in the glovebox of your car.`,
    `Happy anniversary. Five years, and you still laugh at my terrible jokes. Dinner's booked for eight.`,
    `Thank you for packing me the best lunch ever. I found the little note. It made my whole day.`,
    `I know I left early and didn't say goodbye properly, so here it is on the radio. I love you.`,
  ]);
  return [FX('jingle'), H(`It's time for Call Your Sweetheart! Every day we ring someone special for one of our listeners out on the road. Today's request comes from ${from}, who is driving the long way round right now. So, let's call ${to}.`), FX('ring'), FX('pickup'),
    P1('Hello?'), H(`Hi, is that ${to}? It's ${host} from ${st.name}. You're live on the radio!`), P1(pick(['Oh my goodness! Live? Right now?', 'No way! Is this a joke?', 'Wait, what? Am I on the radio?'])),
    st.cast.co ? C('Right now! Don\'t worry, you sound fantastic.') : H('Right now! Don\'t worry, you sound great.'),
    H(`${from} is out on a long drive, and asked us to give you a little message. Ready?`), P1('I\'m ready. Nervous, but ready!'),
    H(`${from} says: ${msg}`), PAUSE(.5), P1(pick([`Aww! Tell ${pr} I love ${pr}, and to drive carefully. Love you, baby!`, `Oh, stop it, I'm going to cry! Love you, baby. Come home safe.`])),
    H(`You heard that, ${from}. Drive carefully, baby! Thank you, ${to}, have the loveliest day.`), P1('Thank you! Bye!'), FX('hangup'),
    st.cast.co ? C('Honestly, that is my favourite part of the whole show.') : H('Oh, I love doing that.'), H(`This next song is for ${from} and ${to}.`)];
}

// A parent on the road rings home and the baby comes on the phone.
function babyCall(r) {
  const dad = chance(.6), caller = pick(dad ? HIM : HER), kid = pick(KIDS), parent = dad ? 'Daddy' : 'Mummy', other = dad ? 'Mummy' : 'Daddy', callerLine = dad ? P2 : P1, home = dad ? P1 : P2, st = r.station;
  return [H(pick(['We have got a very special call now.', 'Let\'s go to the phones.'])), FX('pickup'),
    H(`${caller}, you're on ${st.name}. Where are you calling from?`), callerLine(`Hi! I'm in a lay-by, pulled over, don't worry. I've been on the road since early and I wanted to say hello to someone at home.`),
    H('Who is that?'), callerLine(`My little one, ${kid}. Nearly two years old. ${other} is at home with the phone, could you ring them?`), H('Let\'s do it! Ringing home now.'),
    FX('ring'), FX('pickup'), home(`Hello? ${kid}, listen, it's ${parent} on the radio!`), FX('giggle'), KID(`${parent === 'Daddy' ? 'Dada' : 'Mama'}!`),
    callerLine(`Hello my sweetheart! Are you being good for ${other}?`), KID(pick(['Yes! Car! Brrrm brrrm!', 'Yeah! Big truck! Beep beep!'])), FX('giggle'),
    home(`${kid} has been driving a toy car round the kitchen all morning, pretending to be ${parent}.`), callerLine(`That's my superstar. ${parent} will be home soon, okay? Big kiss!`), KID('Mwah! Bye bye!'), FX('hangup'),
    H(pick(['Oh, my heart. That has made my whole day.', 'Stop it. I am not crying, you are crying.'])), H(`Safe travels, ${caller}, and bye bye, ${kid}!`)];
}

// Listeners phoning in with a story from the road.
const STORIES = [
  ['I just wanted to say, I stopped at the viewpoint on the lake road this morning and there was a family of ducks crossing right in front of me. Mum and seven babies. Traffic both ways, all stopped.', 'That is the most wholesome traffic jam I have ever heard of.'],
  ['I\'ve been driving buses round here for twenty years, and I still wave at every driver who lets me out. Most of them wave back.', 'That\'s lovely. Wave at your bus drivers, everyone!'],
  ['My tip for a long drive? Pack twice the snacks you think you need, and never, ever let the passenger choose the music.', 'Strong opinions. I respect it.'],
  ['I got completely lost yesterday and ended up at the most beautiful little café in the hills. Best wrong turn of my life.', 'Sometimes the wrong road is the right one.'],
  ['I\'m a nurse, just finished a night shift, driving home with the sun coming up. This station is my little reward.', 'Thank you for everything you do. This next one is for you.'],
];
function phoneIn(r) {
  const him = chance(.5), n = pick(him ? HIM : HER), line = him ? P2 : P1, [story, reply] = r.fresh('story', STORIES);
  return [H('Back to the phones.'), FX('pickup'), H(`${n}, you're on ${r.station.name}. Hello!`), line(`Hi ${r.station.cast.host.name}! Love the show.`), line(story), H(reply), line('Thanks! Have a good one.'), FX('hangup')];
}

const NIGHT = [
  ['Here\'s a story for the dark stretch of road.', 'There\'s an old tale up in the mountains, about a lighthouse keeper who kept his lamp burning long after the last ship stopped sailing. People asked him why. He said, somebody, somewhere, might still be finding their way home.', 'So if you see a light on a hill tonight, give it a little nod. It might just be for you.'],
  ['A little something for the night shift.', 'An old driver once told me that the best part of any journey is the hour just before dawn. The road is empty, the sky starts to turn blue at the edges, and for a while it feels like the whole world is yours.', 'Hang in there. Sunrise is coming.'],
  ['Look up, if you can do it safely.', 'On a clear night like this, away from the towns, you can see thousands of stars. The light from some of them left before there were any roads at all.', 'Makes the traffic feel a lot less important, doesn\'t it.'],
  ['Story time.', 'A man once drove all night to surprise his mother on her birthday. He arrived at six in the morning, and found her already awake, at the window, with two cups of tea. She said, I just had a feeling.', 'Call your mum, everyone. Maybe not at six in the morning.'],
];
const CLASSIC = [
  'A piece that sounds like mist lifting off the valley.', 'Something gentle, to match the rhythm of the road.', 'Close your eyes. Actually, no, please keep them open. Just listen.', 'A little music for the long views and the quiet bends.',
];
function sponsor(r) {
  return [H(pick([`${r.station.name} is brought to you by Hisan Ali, digital marketing in Oman. Find out more at hisanali dot com.`, 'This hour is supported by Hisan Ali, the digital marketer helping businesses across Oman grow online. hisanali dot com.']))];
}

// A break between songs on a music station.
function musicBreak(r, c) {
  const st = r.station, out = [], duo = !!st.cast.co;
  const b = back(r); if (b) out.push(H(b));
  if (chance(.28)) out.unshift(FX('jingle'));
  if (chance(.3)) out.push(H(ident(st)));
  const n = (r.breaks = (r.breaks || 0) + 1), special = n - (r.lastSpecial || -9) >= 3;
  const options = [];
  const chat = () => { const bits = [weather(c), road(c), nextTown(c), c.clock ? `It's ${spokenTime(c.clock)}.` : ''].filter(Boolean); const one = pick(bits), two = pick(bits.filter((x) => x !== one)); return duo ? [H(one), C(two || pick(['Couldn\'t agree more.', 'Honestly, I\'d swap this studio for that road any day.']))] : [H(one), ...(two && chance(.5) ? [H(two)] : [])]; };
  if (st.id === 'evermile') options.push([chat, 3], [() => trivia(r), 2], [() => shoutout(r), 1.5], [() => sponsor(r), .5], ...(special ? [[() => sweetheart(r), 1.4, 1], [() => babyCall(r), 1, 1]] : []));
  if (st.id === 'coast') options.push([chat, 2], [() => phoneIn(r), 2], [() => shoutout(r), 1], [() => sponsor(r), .5], ...(special ? [[() => babyCall(r), 1.3, 1], [() => sweetheart(r), .8, 1]] : []));
  if (st.id === 'night') options.push([chat, 1.5], [() => { const s = r.fresh('night', NIGHT); return s.map(H); }, 2.5], [() => shoutout(r), 1], ...(special ? [[() => sweetheart(r), .6, 1]] : []));
  if (st.id === 'classic') options.push([() => [H(pick(CLASSIC))], 2], [chat, 1.5], [() => trivia(r), .8]);
  let roll = Math.random() * options.reduce((s, o) => s + o[1], 0), chosen = options[0];
  for (const o of options) { roll -= o[1]; if (roll <= 0) { chosen = o; break; } }
  // Phone calls are special: no more than one every few breaks.
  if (chosen[2]) r.lastSpecial = n;
  out.push(...chosen[0]());
  if (st.id === 'night' && chance(.5)) out.push(H(pick(['Stay with me. The night is long, and the music is good.', 'Keep your eyes on the road and your hands on the wheel.'])));
  out.push(H(ahead(r)));
  return out;
}

/* ---------- Road Talk: a two-host podcast ---------- */
const TOPICS = [
  {title: 'road trip snacks', lines: [['host', 'Okay Priya, the big question. The perfect road trip snack.'], ['co', 'Easy. Salted crisps, a bag of grapes, and one emergency chocolate bar that nobody is allowed to touch until the last hour.'], ['host', 'An emergency chocolate bar. I love that there are rules.'], ['co', 'There have to be rules, Ben! Otherwise it\'s gone before the first roundabout.'], ['host', 'Mine is dates and a flask of coffee. Very grown up.'], ['co', 'Very grown up. Very boring.'], ['host', 'Hey!']]},
  {title: 'the driving playlist', lines: [['co', 'Let\'s talk playlists. What makes a good driving song?'], ['host', 'It has to have a build. Quiet start, and then just as you come round a bend and see the view, boom, the chorus hits.'], ['co', 'Yes! And you have to be able to sing it badly with the windows down.'], ['host', 'Badly is essential. If you can sing it well, it\'s not a driving song.'], ['co', 'That explains so much about your singing.']]},
  {title: 'getting lost on purpose', lines: [['host', 'Have you ever just turned off the main road to see where it goes?'], ['co', 'All the time. That\'s how I found the best breakfast I\'ve ever had, in a tiny village with one street and three cats.'], ['host', 'I think we plan too much. Every trip is sat nav, arrival time, done.'], ['co', 'The long way round is the whole point. That\'s literally the name of the show, Ben.'], ['host', 'It is, isn\'t it. We should probably take our own advice.']]},
  {title: 'I spy', lines: [['co', 'Right, road trip game. I spy with my little eye, something beginning with... R.'], ['host', 'Road.'], ['co', 'Oh, come on! Fine. Something beginning with S.'], ['host', 'Sky.'], ['co', 'You are the worst person to play this with.'], ['host', 'It\'s a road trip, Priya. It\'s always road, sky or cows.']]},
  {title: 'slow travel', lines: [['host', 'I read this idea called slow travel. Basically, the journey is the holiday, not just the bit before it.'], ['co', 'I love that. Stopping at the viewpoint. Having the coffee. Actually looking at the place you are driving through.'], ['host', 'Because otherwise you\'ve driven through a hundred beautiful places and seen none of them.'], ['co', 'So everyone listening, next viewpoint you see, pull in. Two minutes. Just look.'], ['host', 'Doctor\'s orders. Well, podcast host\'s orders.']]},
  {title: 'morning or night drivers', lines: [['co', 'Are you a sunrise driver or a midnight driver?'], ['host', 'Sunrise, every time. Empty roads, the mist in the valleys, everything\'s gold.'], ['co', 'I\'m midnight. Just the headlights, a good song, and the feeling that the whole world has gone to sleep except you.'], ['host', 'That\'s quite poetic.'], ['co', 'I have my moments.']]},
  {title: 'car games from childhood', lines: [['host', 'What did your family play in the car when you were little?'], ['co', 'The quiet game. My dad invented it. Whoever stays quiet the longest wins.'], ['host', 'That\'s not a game, that\'s a trick!'], ['co', 'I know that now! I won every time, and I was so proud.'], ['host', 'Your dad is a genius.']]},
  {title: 'the best view', lines: [['co', 'Best view you\'ve ever seen from a car?'], ['host', 'Coming over a mountain pass just after rain, with the clouds sitting below the road. Like driving above the sky.'], ['co', 'Mine\'s the coast road at sunset, when the whole lake turns pink.'], ['host', 'We\'re very lucky, aren\'t we.'], ['co', 'We really are.']]},
];
const QUESTIONS = [
  ['This one\'s from a listener called Sara. She says: I\'m learning to drive and I\'m nervous on roundabouts. Any advice?', 'Take your time, look right, and remember, everyone on that roundabout was a nervous learner once.', 'And the car behind you can wait. It really can.'],
  ['Listener question from Tom: what\'s the one thing you always keep in the car?', 'A blanket. For picnics, for cold nights, for naps at viewpoints.', 'Phone charger and a bag of sweets. Priorities.'],
  ['Aisha asks: how do you stay awake on long drives?', 'Honestly? You don\'t push it. Stop every couple of hours, get out, stretch, have a coffee.', 'If you\'re tired, pull over. No podcast is worth it. Not even this one.'],
];
function podcast(r, c) {
  const S = (r.show ||= {step: 0, ep: Math.floor(Math.random() * 40) + 12, topics: 0}), st = r.station;
  S.step++;
  if (S.step === 1) return [FX('jingle'), H(`${hello(c.hour ?? 12)}, and welcome to The Long Way Round, episode ${S.ep}. I'm Ben.`), C('And I\'m Priya! We\'re the podcast for people who think the journey is the best bit.'), H(`And wherever you're listening from${c.road === 'mountain' ? ', even halfway up a mountain pass' : c.road === 'highway' ? ', even on the motorway' : ''}, we're really glad you're here.`), MUSIC(3)];
  if (S.step % 4 === 0) return chance(.5) ? [H('Quick break. This episode is brought to you by Hisan Ali.'), C('If you run a business in Oman and want more customers finding you online, Hisan is the digital marketer people recommend. S E O, Google Ads, social media, websites, all of it.'), H('hisanali dot com. Tell him Ben and Priya sent you.'), MUSIC(3)] : [H('Time for a listener question.'), ...(() => { const [q, a, b] = r.fresh('q', QUESTIONS); return [H(q), C(a), H(b)]; })(), MUSIC(2)];
  if (S.topics >= 5) { r.show = null; return [H('And that is all we have time for this episode.'), C('Thank you for driving along with us. Stop at a viewpoint, have the coffee, take the long way round.'), H('See you next time.'), C('Bye!'), MUSIC(8)]; }
  S.topics++;
  const t = r.fresh('topic', TOPICS);
  return [...(S.topics > 1 ? [C(pick(['Okay, next thing.', 'Can we talk about something?', 'Right, moving on.']))] : []), ...t.lines.map(([who, text]) => L(who, text)), MUSIC(2.5)];
}

/* ---------- Growth FM: business talk for Oman, with Hisan Ali ---------- */
const TIPS = [
  ['Tip one. If you run a shop, a café or a clinic, your Google Business Profile is your new front door.', 'Fill in every section, add real photos, keep your opening hours right, and reply to every single review. Good ones and bad ones.', 'Hisan says most local businesses in Oman leave half of it empty. Easy win.'],
  ['People in Oman search in Arabic and in English. So your website should speak both.', 'And if you serve different areas, Al Khuwair, Qurum, Seeb, Sohar, Salalah, give each one its own page, so Google knows exactly where you work.', 'That\'s local S E O, and it\'s one of the things Hisan Ali is best known for.'],
  ['Google Ads. Start small, and track everything.', 'Every call, every WhatsApp click, every form. Then you cut what does not bring customers, and put more into what does.', 'Hisan\'s rule: if you can\'t measure it, you\'re just guessing with your money.'],
  ['WhatsApp Business is a sales tool, not just a chat app.', 'Set up quick replies, add your catalogue, and answer fast. The business that replies first usually wins the customer.', 'Hisan builds WhatsApp into the whole journey, from the ad to the sale.'],
  ['Set up tracking before you spend a single rial on ads.', 'Google Analytics four, tag manager, the Meta pixel, conversion events. It sounds technical, but it\'s how you know what\'s actually working.', 'And remember, those accounts should belong to your business, not to your agency. Hisan sets them up under your name.'],
  ['Social media. Show the people behind the business.', 'Short vertical videos, real customers, your team, the kitchen, the workshop. People buy from people.', 'Hisan calls it one idea, ten formats. Film it once, and turn it into a reel, a post, a story and an ad.'],
  ['Your website has to be fast on a phone.', 'Most people in Oman will see your business on a mobile first. If it takes more than a few seconds to load, they\'re gone.', 'Speed, a clear offer, and a big WhatsApp button. Simple, and it works.'],
  ['Plan your Ramadan and Eid campaigns early.', 'Weeks early. Have your creative, your offers and your budgets ready before the season starts, not during it.', 'Hisan says the businesses that plan ahead are the ones that win the season.'],
  ['Ask for reviews. Every happy customer, every time.', 'A simple message after the sale, with a direct link. Reviews bring trust, and trust brings the next customer.', 'It\'s free, and it might be the best marketing you ever do.'],
  ['Search is changing. Google now answers some questions with A I summaries.', 'So your content needs to be clear, helpful and honest, written for people first. That\'s what gets quoted.', 'Hisan has been helping Omani brands stay visible in A I search as well as normal search.'],
];
const CALLERS = [
  ['I have a small bakery in Seeb. We post on Instagram every day, but not many people actually come in. What am I doing wrong?', 'Posting every day is great, but are people finding you when they search for a bakery near them? Start with your Google Business Profile and your reviews.', 'And put your location and a WhatsApp button on every post. Make it easy to buy. This is exactly the kind of thing Hisan Ali sorts out.'],
  ['I run a car rental company in Muscat. We tried Google Ads once and spent a lot for nothing. Is it worth trying again?', 'It can be, if it\'s set up properly. Most wasted budget comes from no tracking, and ads showing to the wrong people.', 'Start small, track calls and bookings, and let the numbers guide you. Hisan does free first chats, so it\'s worth asking him to take a look.'],
  ['I\'m opening a clinic in Sohar next month. Where do I even start with marketing?', 'Congratulations! Start with the basics. A fast bilingual website, a complete Google profile, and a way to book on WhatsApp.', 'Then add ads and content once the foundations are there. If you want a plan, Hisan Ali is the person I\'d call.'],
];
function business(r, c) {
  const S = (r.show ||= {step: 0}), st = r.station;
  S.step++;
  if (S.step === 1) return [FX('jingle'), H(`${hello(c.hour ?? 12)}, and welcome to Growth Hour on Growth FM, ninety six point one. The show for business owners right across Oman. I'm Omar.`), C('And I\'m Sara. Today we\'re talking about getting found online, winning more customers, and the man a lot of Omani businesses call first. Hisan Ali.'), MUSIC(3)];
  if (S.step === 2 || S.step % 9 === 0) return [H('So Sara, for anyone who doesn\'t know, who is Hisan Ali?'), C('Hisan Ali is a digital marketer based in Mabelah, in Muscat. And honestly, ask around, and a lot of people will tell you he is the best digital marketer in Oman.'),
    H('Big claim! What does he actually do?'), C('Pretty much everything a growing business needs online. S E O and local search, Google Ads, Meta ads and social media, analytics and conversion tracking, websites, content, design, video, and even A I automation.'),
    H('That\'s a long list.'), C('It is, but here\'s what I like. He ties all of it to one business goal. Not likes, not vanity numbers. Calls, bookings, leads and sales.'),
    H('And the accounts stay with the client?'), C('Exactly. Your ad accounts, your analytics, your pages, all set up under your business. You own them.'), H('Where do people find him?'), C('hisanali dot com. Or send a WhatsApp message, and you\'ll usually get a proper reply within a day or two.'), MUSIC(3)];
  if (S.step % 5 === 0) return [FX('jingle'), H('Want more customers from Google, Instagram and WhatsApp?'), C('Talk to Hisan Ali. S E O, ads, social media, websites and tracking, all working toward one goal. Your growth.'), H('Hisan Ali. Digital marketing that grows your business. hisanali dot com.'), FX('sting'), MUSIC(3)];
  if (S.step % 4 === 0) { const [q, a, b] = r.fresh('caller', CALLERS), him = chance(.5), n = pick(him ? HIM : HER), line = him ? P2 : P1; return [H('Let\'s take a call.'), FX('pickup'), H(`${n}, you're on Growth Hour.`), line(`Hi Omar, hi Sara. ${q}`), H(a), C(b), line('That\'s really helpful, thank you!'), FX('hangup'), MUSIC(2.5)]; }
  const [a, b, t] = r.fresh('tip', TIPS);
  return [H(pick(['Here\'s a tip from Hisan Ali\'s playbook.', 'Time for Hisan\'s growth tip.', 'Another one from Hisan Ali.'])), H(a), C(b), H(t), MUSIC(2.5)];
}

/* ---------- Entry points ---------- */
export function showFor(r, kind) {
  const st = r.station; if (!st) return null;
  const c = r.getContext?.() || {}, h = c.hour ?? 12, host = st.cast.host.name, duo = st.cast.co;
  if (kind === 'welcome') {
    const where = c.location && c.location !== 'hills' ? ` Even out here on ${c.planetName || 'another world'}, we've got you covered.` : '';
    const intro = [FX('jingle'), H(`${hello(h)}, and welcome to Evermile! You're listening to ${st.name}, ${st.freq}, and I'm ${host}.`)];
    if (duo) intro.push(C(`And I'm ${st.cast.co.name}. ${pick(['Glad you could join us.', 'Great to have you with us.'])}`));
    intro.push(H(`${c.clock ? `It's ${spokenTime(c.clock)}. ` : ''}${weather(c)}`), H(`${where}The road is open, the scenery is beautiful, and we'll be right here with you the whole way. Buckle up, sit back, and enjoy the drive.`));
    if (st.format === 'music') intro.push(H(ahead(r))); else r.show = null;
    return intro;
  }
  if (kind === 'tuned') {
    if (st.format === 'podcast') { r.show = null; return [H('You\'ve tuned in to Road Talk, ninety two point seven. The Long Way Round is starting right now.')]; }
    if (st.format === 'business') { r.show = null; return [H('This is Growth FM, ninety six point one, with Growth Hour.')]; }
    return [H(pick([`You're tuned to ${st.name}, ${st.freq}. I'm ${host}, ${st.tag}.`, `${hello(h)}! ${host} here on ${st.name}, ${st.freq}. ${cap(st.tag)}.`]))];
  }
  if (kind === 'break') return musicBreak(r, c);
  if (kind === 'next') return st.format === 'podcast' ? podcast(r, c) : business(r, c);
  return null;
}

// A word about something that just happened on the drive.
export function eventLine(r, kind, d, c) {
  const st = r.station, talk = st.format !== 'music', pre = talk ? pick(['Quick one from the road.', 'Travel note.']) + ' ' : '';
  const line = {
    town: () => pick([`Coming into ${d.name} now. A big hello to everyone in ${d.name}!`, `Welcome to ${d.name}, everybody. Nice and slow through the streets, watch for people crossing.`, `And here we are in ${d.name}. Lovely little place. Wave at the locals.`]),
    road: () => ({mountain: `We're heading up into the mountains now${d.name ? ', towards ' + d.name : ''}. Take the hairpins gently, and enjoy that view.`, highway: `Onto the motorway${d.name ? ', ' + d.name : ''}. Pick a lane, settle in, and let the kilometres roll by.`, coast: `Down to the lakeside road now${d.name ? ', towards ' + d.name : ''}. Windows down for that fresh air.`, farm: `Farm lanes from here${d.name ? ', out towards ' + d.name : ''}. Narrow roads, so watch for tractors and the odd cow.`})[d.type] || `Back on the hill roads${d.name ? ', towards ' + d.name : ''}. Lovely.`,
    junction: () => d.district ? pick([`Heading for ${d.label}. ${d.name} and a change of scenery, lovely.`, `${d.label} it is. You'll be there in a couple of minutes.`, `Following the signs to ${d.label}. Great spot, that.`]) : d.dir === 'ahead' ? pick(['Straight on at the junction. Good choice.', 'Keeping straight on. The road knows the way.']) : `Taking the turn for the ${d.label}${d.name ? ', towards ' + d.name : ''}? ${pick(['Ooh, adventurous. I like it.', 'Good call, it\'s beautiful that way.', 'Excellent choice.'])}`,
    rain: () => pick(['And here comes the rain. Wipers on, slow it down a touch, and enjoy the sound of it on the roof.', 'Rain\'s arrived. Leave a bit more space to the car in front.']),
    dry: () => 'The rain has cleared. Look out for a rainbow.',
    night: () => pick(['Night is falling. Headlights on, everybody, and let\'s keep each other company.', 'The sun has gone down. From here on it\'s the lights of the road and us.']),
    sunrise: () => pick(['And there\'s the sunrise. Good morning, everybody! A brand new day on the road.', 'The sky\'s getting light. Good morning! Coffee time.']),
    signal: () => pick(['And we\'re back! Lost you in the tunnel there for a moment.', 'Ah, there you are. Tunnels, eh?']),
    view: () => 'Stopped at the viewpoint? Good. Take a breath, take a photo, and take it all in. We\'ll keep the music going.',
    coffee: () => 'Coffee break? Excellent idea. Stretch your legs, and we\'ll be here when you get back.',
    fuel: () => 'Fuel light on? There are petrol stations along the way, keep an eye out for the signs.',
    tank: () => 'Full tank, clean windscreen, good music. You\'re all set.',
    miles: () => `That's ${distance(c)} on the road now. ${pick(['Nicely done.', 'Keep going, you\'re doing great.', 'Time for a stretch soon, maybe?'])}`,
  }[kind];
  if (!line) return null;
  return [H(pre + line())];
}
