import Promise from "bluebird";

export interface AudioTrack {
  source: string;
  name: string;
  artist: string;
  data: any;
}

export interface AudioSource {
  track: AudioTrack;

  loaded: () => Promise<boolean>;
  preload: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
}

const history: AudioSource[] = [];
const queue: AudioSource[] = [];

let nowPlaying: AudioSource | undefined;

function start() {
  if (nowPlaying == null) return;
  nowPlaying.resume();
  // TODO: Preload next source?
}

function enqueue(as: AudioSource) {
  queue.push(as);
}

function next() {
  if (nowPlaying) {
    nowPlaying.stop();
    history.push(nowPlaying);
  }
  nowPlaying = queue.shift();
  start();
}

function current() {
  return nowPlaying;
}

function previous() {
  if (nowPlaying) {
    nowPlaying.stop();
    queue.unshift(nowPlaying);
  }
  nowPlaying = history.pop();
  start();
}

// TODO: Finalize API
export default { enqueue, next, current, previous };
