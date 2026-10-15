import { search } from './engine.js?v=1';

self.onmessage = ({ data }) => {
  const result = search(data.fen, data.options);
  self.postMessage({ id: data.id, result });
};
