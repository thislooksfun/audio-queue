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
  return np
    .start()
    .tap(() => log.info("Audio source started successfully"))
    .then(() => server.broadcast("track", np.track))
    .then(() => np.status())
    .then(status => server.broadcast("status", status))
    .return()
    .finally(() => updateLock--);
}

function enqueueSource(as: AudioSource): Promise<void> {
  const { name, artist, source } = as.track;
  log.info(`Queueing track ${name} by ${artist} from ${source}`);
  queue.push(as);
  // If the queue was empty before, start it playing automatically.
  return Promise.resolve()
    .then(() => {
      if (!autoplay) return;
      if (queue.length > 1) return;
      if (nowPlaying != undefined) return;
      return next();
    })
    .then(() =>
      server.broadcast(
        "queue",
        queue.map(s => s.track)
      )
    )
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
    .then(() => np.status())
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

  server.broadcast(
    "queue",
    queue.map(s => s.track)
  );
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

  return nowPlaying
    .status()
    .tap(s =>
      log.trace(
        `${s.time.toFixed(2)}/${s.duration.toFixed(2)} (${
          s.playing ? "playing" : "paused"
        }; ${s.finished ? "finished" : "not finished"})`
      )
    )
    .tap(status => server.broadcast("status", status))
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

function status(): Promise<AudioStatus | null> {
  updateLock++;
  return Promise.resolve(nowPlaying)
    .then(np => (np == null ? null : np.status()))
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
    return queue.map(s => s.track);
  },
  get history() {
    return history.map(s => s.track);
  },
};

// Check the state every 1/4 second.
setInterval(checkState, 250);
