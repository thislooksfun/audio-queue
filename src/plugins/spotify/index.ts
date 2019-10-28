// 3rd-party
import Promise from "bluebird";
// Local
import { Plugin } from "../plugin";
import { AudioTrack, AudioSource } from "../../player/queue";
import { registerPages, registerAPI } from "./router";
// Logging
import log from "tlf-log";

//#region Interfaces
interface SpotifyAudioTrack extends AudioTrack {
  source: "spotify";
  // TODO:
  data: "data";
}
interface SpotifyAudioSource extends AudioSource {
  track: SpotifyAudioTrack;
}
//#endregion Interfaces

//#region Type guards
function isSpotifyAudioTrack(at: AudioTrack): at is SpotifyAudioTrack {
  return at.source === "spotify";
}
//#endregion Type guards

//#region Helper functions
function createAudioSource(track: SpotifyAudioTrack): SpotifyAudioSource {
  return {
    track,

    loaded() {
      log.fatal("Not implemented");
      return Promise.reject("Not implemented");
    },
    preload() {
      log.fatal("Not implemented");
      return Promise.reject("Not implemented");
    },
    status() {
      log.fatal("Not implemented");
      return Promise.reject("Not implemented");
    },
    pause() {
      log.fatal("Not implemented");
      return Promise.reject("Not implemented");
    },
    resume() {
      log.fatal("Not implemented");
      return Promise.reject("Not implemented");
    },
    stop() {
      log.fatal("Not implemented");
      return Promise.reject("Not implemented");
    },
  };
}
//#endregion Helper functions

//#region Plugin
const plugin: Plugin = {
  // Metadata
  name: "spotify",

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
  searchFor(query: string) {
    log.trace(`Searching Spotify for ${query}`);
    return [];
  },
};
//#endregion Plugin

export default plugin;
