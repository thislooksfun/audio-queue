import Promise from "bluebird";
import log from "tlf-log";

export interface AudioStatus {
  playing: boolean;
  time: number;
  duration: number;
}

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
  status: () => Promise<AudioStatus>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
}

const history: AudioSource[] = [];
const queue: AudioSource[] = [];

let nowPlaying: AudioSource | undefined;

const autoplay = true;

function start() {
  if (nowPlaying == null) {
    log.info("Went to start source, but no source was found.");
    return Promise.resolve();
  }
  log.info("Starting audio source...");
  return nowPlaying
    .resume()
    .tap(() => log.info("Audio source started successfully"));
  // TODO: Preload next source?
}

function enqueue(as: AudioSource): Promise<void> {
  const { name, artist, source } = as.track;
  log.info(`Queueing track ${name} by ${artist} from ${source}`);
  queue.push(as);
  // If the queue was empty before, start it playing automatically.
  return Promise.resolve().then(() => {
    if (!autoplay) return;
    if (queue.length > 1) return;
    if (nowPlaying != undefined) return;
    return next();
  });
}

function next() {
  log.info("Transitioning to the next track...");
  return Promise.resolve()
    .then(() => {
      if (!nowPlaying) return;

      log.trace("Audio currently playing, stopping that first...");
      history.push(nowPlaying);
      return nowPlaying.stop();
    })
    .then(() => (nowPlaying = queue.shift()))
    .then(start);
}

function preloadNext() {
  if (queue.length == 0) {
    log.info("Went to preload next track, but the queue is empty.");
    return Promise.resolve();
  }

  log.info("Preloading next track...");
  return queue[0].preload().tap(() => log.info("Preload complete"));
}

function previous() {
  log.info("Transitioning to the previous track...");
  return Promise.resolve()
    .then(() => {
      if (!nowPlaying) return;

      log.trace("Audio currently playing, stopping that first...");
      queue.unshift(nowPlaying);
      return nowPlaying.stop();
    })
    .then(() => (nowPlaying = history.pop()))
    .then(start);
}

function swap<T>(arr: T[], i1: number, i2: number) {
  const tmp = arr[i1];
  arr[i1] = arr[i2];
  arr[i2] = tmp;
}

function shiftUp(index: number) {
  if (index <= 0 || index >= queue.length) {
    throw new Error("Out of bounds!");
  }
  swap(queue, index, index - 1);
}

function shiftDown(index: number) {
  if (index < 0 || index >= queue.length - 1) {
    throw new Error("Out of bounds!");
  }
  swap(queue, index, index + 1);
}

// TODO: Finalize API
export default {
  enqueue,
  next,
  preloadNext,
  previous,

  shiftUp,
  shiftDown,

  // Wrappers for displaying queue and history
  get current() {
    return nowPlaying ? nowPlaying.track : undefined;
  },
  get queue() {
    return queue.map(s => s.track);
  },
  get history() {
    return history.map(s => s.track);
  },
};
