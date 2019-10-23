import Promise from "bluebird";
const log = require("tlf-log");

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

function current() {
  return nowPlaying;
}

function previous() {
  log.info("Transitioning to the previous track...");
  if (nowPlaying) {
    nowPlaying.stop();
    queue.unshift(nowPlaying);
  }
  nowPlaying = history.pop();
  start();
}

// TODO: Finalize API
export default { enqueue, next, preloadNext, current, previous };
