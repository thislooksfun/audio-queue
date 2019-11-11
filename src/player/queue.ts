// 3rd party
import Promise from "bluebird";
import log from "tlf-log";
// Local
import swap from "../util/swap";

export interface AudioStatus {
  playing: boolean;
  finished: boolean;
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
  start: () => Promise<void>;
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
  updateLock++;
  return nowPlaying
    .start()
    .tap(() => log.info("Audio source started successfully"))
    .finally(() => updateLock--);
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
  updateLock++;
  return Promise.resolve()
    .then(() => {
      if (!nowPlaying) return;

      log.trace("Audio currently playing, stopping that first...");
      history.push(nowPlaying);
      return nowPlaying.stop();
    })
    .then(() => (nowPlaying = queue.shift()))
    .then(start)
    .finally(() => updateLock--);
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
  updateLock++;
  return Promise.resolve()
    .then(() => {
      if (!nowPlaying) return;

      log.trace("Audio currently playing, stopping that first...");
      queue.unshift(nowPlaying);
      return nowPlaying.stop();
    })
    .then(() => (nowPlaying = history.pop()))
    .then(start)
    .finally(() => updateLock--);
}

function playpause() {
  if (nowPlaying == null) {
    return Promise.resolve();
  }

  updateLock++;
  const np: AudioSource = nowPlaying;
  return Promise.resolve()
    .then(() => np.status())
    .then(({ playing }) => (playing ? np.pause() : np.resume()))
    .finally(() => updateLock--);
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

function remove(index: number) {
  if (index < 0 || index >= queue.length - 1) {
    throw new Error("Out of bounds!");
  }
  queue.splice(index, 1);
}

let updateLock = 0;
function checkState() {
  if (nowPlaying == null) return;

  // Prevent multiple checks at the same time
  if (updateLock > 0) return;
  updateLock++;

  log.trace_(`Checking status of ${nowPlaying.track.name}: `);

  nowPlaying
    .status()
    .tap(s =>
      log.trace(
        `${s.time.toFixed(2)}/${s.duration.toFixed(2)} (${
          s.playing ? "playing" : "paused"
        }; ${s.finished ? "finished" : "not finished"})`
      )
    )
    .tapCatch(() => log.trace())
    .then(s => {
      // TODO: Preload next source?
      if (s.finished && autoplay) {
        log.trace("Track finished! Loading the next one...");
        next();
      }
    })
    .finally(() => updateLock--);
}

export default {
  enqueue,
  next,
  preloadNext,
  previous,

  playpause,

  shiftUp,
  shiftDown,
  remove,

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

// Check the state every 1/4 second.
setInterval(checkState, 250);
