// 3rd-party
import Promise from "bluebird";
// Local
import { Plugin } from "../plugin";
import { AudioTrack, AudioSource, AudioStatus } from "../../player/queue";
import { registerPages, registerAPI } from "./router";
// Logging
import log from "tlf-log";
import connect from "./connect";

//#region Interfaces
export interface SpotifyStatus extends AudioStatus {
  deviceID: string | null;
}
export interface SpotifyData {
  id: string;
  uri: string;
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
function createAudioSource(track: SpotifyAudioTrack): SpotifyAudioSource {
  return {
    track,

    loaded() {
      log.fatal("SpotifyAudioSource.loaded: Not implemented");
      return Promise.reject("Not implemented");
    },
    preload() {
      log.fatal("SpotifyAudioSource.preload: Not implemented");
      return Promise.reject("Not implemented");
    },
    status(): Promise<SpotifyStatus> {
      log.debug("SpotifyAudioSource.status()");
      return connect.status().then(st => {
        if (st.device.id == null) {
          return { deviceID: null, playing: false, time: 0, duration: 0 };
        }

        const deviceID = st.device.id;

        if (st.item == null) {
          return { deviceID, playing: false, time: 0, duration: 0 };
        }

        const track: SpotifyApi.TrackObjectFull = st.item;

        const playing = st.is_playing;
        const time = (st.progress_ms || 0) * 1000;
        const duration = track.duration_ms * 1000;

        return { deviceID, playing, time, duration };
      });
    },
    pause() {
      return connect.pause();
    },
    resume() {
      return connect.play();
    },
    start() {
      return connect.play(track.data.uri);
    },
    stop() {
      return connect.pause();
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
  searchFor(query: string): Promise<SpotifyAudioTrack[]> {
    return connect.searchFor(query);
  },
};
//#endregion Plugin

export default plugin;
