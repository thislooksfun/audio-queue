// 3rd party
import Promise from "bluebird";
import log from "tlf-log";
// Local
import swap from "../util/swap";
import server from "../web/server";
import plugins from "../plugins";

export interface AudioStatus {
  playing: boolean;
  finished: boolean;
  time: number;
  duration: number;
}

export interface AudioTrack {
  source: string;
  id: string;
  name: string;
  artist: string;
  artwork: string | null;
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

const trackQueue = () => queue.map(s => s.track);
const trackHistory = () => history.map(s => s.track);

function shiftQueue() {
  const q = queue.shift();
  server.broadcast("queue", trackQueue());
  return q;
}

function pushQueue(s: AudioSource, front: boolean = false) {
  if (front) {
    queue.unshift(s);
  } else {
    queue.push(s);
  }
  server.broadcast("queue", trackQueue());
}

function popHistory() {
  const h = history.pop();
  server.broadcast("history", trackHistory());
  return h;
}

function pushHistory(s: AudioSource) {
  history.push(s);
  server.broadcast("history", trackHistory());
}

function cleanStatus(s: AudioStatus | null) {
  if (s == null) return null;
  return { playing: s.playing, time: s.time, duration: s.duration };
}

function start() {
  if (nowPlaying == null) {
    log.info("Went to start source, but no source was found.");
    server.broadcast("track", null);
    server.broadcast("status", null);
    return Promise.resolve();
  }

  log.info("Starting audio source...");

  updateLock++;
  let np = nowPlaying!;

  server.broadcast("track", np.track);
  server.broadcast("loading");

  return np
    .start()
    .tap(() => log.info("Audio source started successfully"))
    .then(() => server.broadcast("track", np.track))
    .then(() => status())
    .then(status => server.broadcast("status", status))
    .return()
    .finally(() => updateLock--);
}

function enqueueSource(as: AudioSource): Promise<void> {
  const { name, artist, source } = as.track;
  log.info(`Queueing track ${name} by ${artist} from ${source}`);
  pushQueue(as);
  // If the queue was empty before, start it playing automatically.
  return Promise.resolve()
    .then(() => {
      if (!autoplay) return;
      if (queue.length > 1) return;
      if (nowPlaying != undefined) return;
      return next();
    })
    .return();
}

function enqueueTrack(at: AudioTrack): Promise<void> {
  const plugin = plugins[at.source];
  if (plugin == null) return Promise.resolve();

  log.trace(`Enqueuing ${at.name} via ${plugin.name}`);

  return Promise.resolve()
    .then(() => plugin.createAudioSource(at))
    .then(as => enqueueSource(as));
}

function next() {
  log.info("Transitioning to the next track...");
  updateLock++;
  return Promise.resolve()
    .then(() => {
      if (!nowPlaying) return;

      log.trace("Audio currently playing, stopping that first...");
      pushHistory(nowPlaying);
      return nowPlaying.stop();
    })
    .then(() => (nowPlaying = shiftQueue()))
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
      pushQueue(nowPlaying, true);
      return nowPlaying.stop();
    })
    .then(() => (nowPlaying = popHistory()))
    .then(start)
    .finally(() => updateLock--);
}

function playpause() {
  if (nowPlaying == null) {
    return Promise.resolve();
  }

  server.broadcast("loading");

  updateLock++;
  const np: AudioSource = nowPlaying;
  return Promise.resolve()
    .then(() => np.status())
    .then(({ playing }) => (playing ? np.pause() : np.resume()))
    .then(() => status())
    .then(status => server.broadcast("status", status))
    .return()
    .finally(() => updateLock--);
}

function shift(oldIndex: number, newIndex: number) {
  // Bounds checking
  if (oldIndex == newIndex) return;
  if (oldIndex < 0 || oldIndex > queue.length - 1) return;
  if (newIndex < 0 || newIndex > queue.length - 1) return;

  // updateLock is not needed because this is synchronous

  if (oldIndex < newIndex) {
    for (var i = oldIndex; i < newIndex; i++) {
      swap(queue, i, i + 1);
    }
  } else {
    for (var i = oldIndex; i > newIndex; i--) {
      swap(queue, i, i - 1);
    }
  }

  server.broadcast("queue", trackQueue());
}

function remove(index: number) {
  if (index < 0 || index >= queue.length) {
    throw new Error("Out of bounds!");
  }
  queue.splice(index, 1);
  server.broadcast("queue", trackQueue());
}

let updateLock = 0;
function checkState() {
  if (nowPlaying == null) return;

  // Prevent multiple checks at the same time
  if (updateLock > 0) return;
  updateLock++;

  const {
    track: { name },
  } = nowPlaying;

  return nowPlaying
    .status()
    .tap(s =>
      log.trace(
        `Status of ${name}: ${s.time.toFixed(2)}/${s.duration.toFixed(2)} (${
          s.playing ? "playing" : "paused"
        }; ${s.finished ? "finished" : "not finished"})`
      )
    )
    .tap(status => server.broadcast("status", cleanStatus(status)))
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

function status() {
  updateLock++;
  return Promise.resolve(nowPlaying)
    .then(np => (np == null ? null : np.status()))
    .then(cleanStatus)
    .finally(() => updateLock--);
}

export default {
  enqueueSource,
  enqueueTrack,

  next,
  preloadNext,
  previous,

  playpause,

  shift,
  remove,

  status,

  // Wrappers for displaying queue and history
  get current() {
    return nowPlaying ? nowPlaying.track : undefined;
  },
  get queue() {
    return trackQueue();
  },
  get history() {
    return trackHistory();
  },
};

// Check the state every 1/4 second.
setInterval(checkState, 250);
