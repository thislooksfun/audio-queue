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
const encoding = { encoding: "utf8" };
const scriptsDir = path.join(__dirname, "scripts");
const infoStr = fs.readFileSync(path.join(scriptsDir, "info.js"), encoding);
const stateStr = fs.readFileSync(path.join(scriptsDir, "state.js"), encoding);
//#endregion Imports

//#region Interfaces
interface Info {
  name: string;
  artist: string;
}
interface State {
  paused: boolean | null;
  time: number | null;
  duration: number | null;
  ended: boolean | null;
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
function updateInfo(t: YouTubeAudioTrack): Promise<YouTubeAudioTrack> {
  if (t.data.driver == null) {
    return Promise.reject("Invalid video -- driver has not been started.");
  }
  const driver: Driver = t.data.driver;
  return getInfo(driver)
    .then(i => {
      t.name = i.name;
      t.artist = i.artist;
    })
    .return(t);
}
function updateState(v: YTVideo): Promise<YTVideo> {
  if (v.driver == null) {
    return Promise.reject("Invalid video -- driver has not been started.");
  }
  const driver: Driver = v.driver;
  return getState(driver)
    .then(s => (v.state = s))
    .return(v);
}

function getInfo(driver: Driver): Promise<Info> {
  return Promise.resolve().then(() => driver.executeScript(infoStr));
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

function playpause(driver: Driver): Promise<void> {
  return Promise.resolve()
    .then(() => driver.findElement(By.id("movie_player")))
    .tap(el => driver.wait(until.elementIsVisible(el)))
    .then(el => el.click())
    .return();
}

function disableAutoplay(driver: Driver): Promise<void> {
  return (
    Promise.resolve()
      // Wait until the autoplay toggle appears
      .then(() => driver.wait(until.elementLocated(By.id("autoplay"))))
      // If it's turned on, turn it off
      .then(() => By.css("#autoplay + paper-toggle-button#toggle[checked]"))
      .then(by => driver.findElements(by))
      .each(e => e.click())
      .return()
  );
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
    status: () => {
      return Promise.resolve()
        .then(() => updateState(track.data))
        .then(() => <State>track.data.state)
        .then(state => ({
          playing: !state.paused,
          finished: !!state.ended,
          time: state.time || -1,
          duration: state.duration || -1,
        }));
    },
    pause() {
      return (
        Promise.resolve()
          .then(() => (track.data.driver == null ? this.preload() : null))
          .then(() => this.status())
          .then(({ playing }) => {
            if (!playing) throw new Error("Already paused");
          })
          .then(() => track.data.driver as Driver)
          .then(d => playpause(d))
          // No-op on "Already paused" error
          .catch({ message: "Already paused" }, () => {})
          // Update the info and state in parallel
          .then(() => [updateInfo(track), updateState(track.data)])
          .all()
          .return()
      );
    },
    resume() {
      return (
        Promise.resolve()
          .then(() => (track.data.driver == null ? this.preload() : null))
          .then(() => this.status())
          .then(({ playing }) => {
            if (playing) throw new Error("Already playing");
          })
          .then(() => track.data.driver as Driver)
          .then(d => playpause(d))
          // No-op on "Already playing" error
          .catch({ message: "Already playing" }, () => {})
          // Update the info and state in parallel
          .then(() => [updateInfo(track), updateState(track.data)])
          .all()
          .return()
      );
    },
    start() {
      return this.preload()
        .then(() => track.data.driver as Driver)
        .then(d => disableAutoplay(d))
        .then(() => this.resume());
    },
    stop() {
      return Promise.resolve(track.data.driver)
        .then(d => (d ? d.close() : undefined))
        .then(() => delete track.data.driver)
        .return();
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
  name: "youtube",

  createAudioSource(track: AudioTrack): YouTubeAudioSource {
    if (isYTAudioTrack(track)) {
      return createAudioSource(track);
    } else {
      throw new Error("Invalid parameter -- track must be a YouTubeAudioTrack");
    }
  },

  searchFor(query: string): Promise<YouTubeAudioTrack[]> {
    return Promise.resolve([
      {
        source: "youtube",
        name: `hello -- ${query}`,
        artist: "world",
        data: { slug: query },
      },
    ]);
  },
};
//#endregion Plugin

// Export
export default plugin;
