//#region Imports
// Built-in
import fs from "fs";
import path from "path";
// 3rd-party
import navigateTo from "../../util/webdriver";
import { By, until } from "selenium-webdriver";
import { Driver } from "selenium-webdriver/firefox";
import Promise from "bluebird";
// Local
// import repeat from "../../util/repeat";
// import sleep from "../../util/sleep";
import { AudioTrack, AudioSource } from "../../player/queue";
import { Plugin } from "../plugin";
// Logging
import log from "tlf-log";
// Data
const stateStr = fs.readFileSync(path.join(__dirname, "scripts/state.js"), {
  encoding: "utf8",
});
//#endregion Imports

//#region Interfaces
interface State {
  paused: boolean | null;
  time: number | null;
  duration: number | null;
}
interface YTVideo {
  slug: string;
  driver?: Driver;
  state?: State;
}
interface YouTubeAudioTrack extends AudioTrack {
  source: "youtube";
  data: YTVideo;
}
interface YouTubeAudioSource extends AudioSource {
  track: YouTubeAudioTrack;
}
//#endregion Interfaces

//#region Type guards
function isYTAudioTrack(at: AudioTrack): at is YouTubeAudioTrack {
  return at.source === "youtube";
}
// function isYTAudioSource(as: AudioSource): as is YouTubeAudioSource {
//   return isYTAudioTrack(as.track);
// }
//#endregion Type guards

//#region Helper functions
function updateState(v: YTVideo): Promise<YTVideo> {
  if (v.driver == null) {
    return Promise.reject("Invalid video -- driver has not been started.");
  }
  const driver: Driver = v.driver;
  return getState(driver)
    .then(s => (v.state = s))
    .return(v);
}

function getState(driver: Driver): Promise<State> {
  return Promise.resolve().then(() => driver.executeScript(stateStr));
}

// function query(driver: Driver) {
//   return sleep(50)
//     .then(() => getState(driver))
//     .then(console.log);
// }

// function paused(driver: Driver): Promise<boolean> {
//   return getState(driver).then(s => s.paused || false);
// }

// function playing(driver: Driver): Promise<boolean> {
//   return paused(driver).then(p => !p);
// }

function play(driver: Driver): Promise<void> {
  return Promise.resolve()
    .then(() => driver.findElements(By.css(".ytp-cued-thumbnail-overlay")))
    .each(el => driver.wait(until.elementIsVisible(el)).then(() => el.click()))
    .return();
}

function createAudioSource(track: YouTubeAudioTrack): YouTubeAudioSource {
  return {
    track,

    loaded() {
      log.fatal("Not implemented");
      return Promise.reject("Not implemented");
    },
    preload() {
      // // Webdriver based plugins cannot preload as only one driver can exist at
      // // a time, and trying to load a second causes a crash.
      // log.debug(
      //   "Attempted to preload a youtube video. This is not supported and results in a noop"
      // );
      // return Promise.resolve();
      return navigateTo(`https://www.youtube.com/watch?v=${track.data.slug}`)
        .then(d => (track.data.driver = d))
        .return();
    },
    pause() {
      log.fatal("Not implemented");
      return Promise.reject("Not implemented");
    },
    resume() {
      return Promise.resolve()
        .then(() => (track.data.driver == null ? this.preload() : null))
        .then(() => track.data.driver as Driver)
        .then(d => play(d))
        .then(() => updateState(track.data))
        .return();
    },
    stop() {
      return Promise.resolve(track.data.driver).then(d =>
        d != null ? d.close() : undefined
      );
    },
  };

  // play(slug: string) {
  //   let driver: Driver;
  //   return (
  //     navigateTo(`https://www.youtube.com/watch?v=${slug}`)
  //       .then(d => (driver = d))
  //       // Play
  //       .then(() => driver.findElements(By.css(".ytp-cued-thumbnail-overlay")))
  //       .each(el =>
  //         driver.wait(until.elementIsVisible(el)).then(() => el.click())
  //       )
  //       .then(() => repeat.until(() => sleep(100), playing.bind(null, driver)))
  //       // Print out info while it's playing
  //       .then(() =>
  //         repeat.while(query.bind(null, driver), playing.bind(null, driver))
  //       )
  //   );
  // },
}
//#endregion Helper functions

//#region Plugin
const plugin: Plugin = {
  createAudioSource(track: AudioTrack): YouTubeAudioSource {
    if (isYTAudioTrack(track)) {
      return createAudioSource(track);
    } else {
      throw new Error("Invalid parameter -- track must be a YouTubeAudioTrack");
    }
  },

  searchFor(query: string): YouTubeAudioTrack[] {
    return [
      {
        source: "youtube",
        name: "hello",
        artist: "world",
        data: { slug: query },
      },
    ];
  },
};
//#endregion Plugin

// Export
export default plugin;
