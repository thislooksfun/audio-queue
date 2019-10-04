import { AudioSource, AudioTrack } from "../../player/queue";
import Promise from "bluebird";
const log = require("tlf-log");

export interface SpotifyAudioTrack extends AudioTrack {
  source: "spotify";
  spotify: "stuff";
}

export default {
  createSourceFor(track: AudioTrack): Promise<AudioSource> {
    if (track.source !== "spotify") {
      log.warn(`Invalid parameter ${track}`);
      return Promise.reject(`Invalid parameter ${track}`);
    }

    const st = track as SpotifyAudioTrack;
    let x = st.spotify;

    console.log(`Hello! ${track.name} -- ${x}`);
    return Promise.resolve({
      track,
      loaded: () => Promise.resolve(true),
      preload: () => Promise.resolve(),
      pause: () => Promise.resolve(),
      resume: () => Promise.resolve(),
      stop: () => Promise.resolve(),
    });
  },
};
