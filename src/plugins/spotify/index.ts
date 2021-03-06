// 3rd-party
import Promise from "bluebird";
// Local
import { Plugin } from "../plugin";
import { AudioTrack, AudioSource, AudioStatus } from "../../player/queue";
import { registerPages, registerAPI } from "./router";
// Logging
import log from "tlf-log";
import connect, { isAuthenticated } from "./connect";
import player from "./player";
import server from "../../web/server";

//#region Interfaces
export interface SpotifyStatus extends AudioStatus {
  deviceID: string | null;
}
export interface SpotifyData {
  id: string;
  uri: string;
  started: boolean;
}
export interface SpotifyAudioTrack extends AudioTrack {
  source: "spotify";
  data: SpotifyData;
}
export interface SpotifyAudioSource extends AudioSource {
  track: SpotifyAudioTrack;
}
//#endregion Interfaces

//#region Type guards
function isSpotifyAudioTrack(at: AudioTrack): at is SpotifyAudioTrack {
  return at.source === "spotify";
}
//#endregion Type guards

//#region Helper functions
function handleError(action: string, e: any) {
  log.error(`An error occurred while ${action}`, e);
  server.checkAuth();
}

function createAudioSource(track: SpotifyAudioTrack): SpotifyAudioSource {
  return {
    track,

    loaded: () => log.fatal("SpotifyAudioSource.loaded: Not implemented"),
    preload: () => log.fatal("SpotifyAudioSource.preload: Not implemented"),
    status: () =>
      player
        .getStatus()
        .tap(s => (track.data.started = track.data.started || s.time > 0))
        // When the track is finished it automatically pauses and sets the
        // time to 0
        .tap(
          s => (s.finished = track.data.started && s.time == 0 && !s.playing)
        ),
    pause: () => connect.pause().catch(handleError.bind(null, "pausing")),
    resume: () => connect.play().catch(handleError.bind(null, "resuming")),
    start: () =>
      connect.play(track.data.uri).catch(handleError.bind(null, "starting")),
    stop: () => connect.pause().catch(handleError.bind(null, "stopping")),
  };
}
//#endregion Helper functions

//#region Plugin
const plugin: Plugin = {
  // Metadata
  name: "spotify",
  displayName: "Spotify",

  // Authentication
  isAuthenticated,

  // Routing
  registerPages,
  registerAPI,

  // Playback
  createAudioSource(track: AudioTrack): SpotifyAudioSource {
    if (isSpotifyAudioTrack(track)) {
      return createAudioSource(track);
    } else {
      throw new Error("Invalid parameter -- track must be a YouTubeAudioTrack");
    }
  },
  searchFor(query: string): Promise<SpotifyAudioTrack[]> {
    return connect.searchFor(query);
  },
};
//#endregion Plugin

export default plugin;
