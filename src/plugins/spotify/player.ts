// Built-in
import path from "path";
// 3rd-party
import Promise from "bluebird";
import { until, By } from "selenium-webdriver";
import { Driver } from "selenium-webdriver/firefox";
// Local
import navigateTo, { createDriverSession } from "../../util/webdriver";
import { SpotifyStatus } from ".";

let driver: Driver | undefined;
export default {
  open(token: string) {
    if (driver) {
      return Promise.reject(new Error("Already open"));
    }

    const pagePath = path.join(
      __dirname,
      "../../../",
      "support/plugins/spotify",
      "page.html"
    );
    let dd: Driver;
    return (
      Promise.resolve()
        .then(() => createDriverSession({ "media.autoplay.default": 0 }))
        .tap(d => (driver = dd = d))
        .then(d => navigateTo(`file://${pagePath}#${token}`, { driver: d }))
        .then(() => dd.wait(until.titleIs("Spotify Web Player")))
        // Getting the device ID forces a wait until the device id is ready.
        .then(() => this.getDeviceID())
        .return()
    );
  },

  getDeviceID() {
    if (!driver) {
      return Promise.reject(new Error("No driver"));
    }
    let d: Driver = driver;
    return Promise.resolve()
      .then(() => d.findElement(By.id("device_id")))
      .tap(el => d.wait(until.elementTextMatches(el, /.+/)))
      .then(el => el.getText());
  },

  getStatus() {
    if (!driver) {
      return Promise.reject(new Error("No driver"));
    }

    let d: Driver = driver;
    let status: SpotifyStatus = {
      deviceID: "",
      playing: false,
      finished: false,
      time: 0,
      duration: 0,
    };
    // Get the device ID
    return (
      this.getDeviceID()
        .then(id => (status.deviceID = id))
        .then(() => d.findElement(By.id("refresh_state")).click())
        // Get the device state
        .then(() => d.findElement(By.id("device_state")).getText())
        .then(ds => (status.playing = ds == "playing"))
        // Get the track position
        .then(() => d.findElement(By.id("track_position")).getText())
        .then(tp => (status.time = parseInt(tp) / 1000))
        // Get the track duration
        .then(() => d.findElement(By.id("track_duration")).getText())
        .then(td => (status.duration = parseInt(td) / 1000))
        .return(status)
    );
  },

  waitForPlayback(uri?: string) {
    if (!uri) {
      return Promise.resolve();
    }

    if (!driver) {
      return Promise.reject(new Error("No driver"));
    }

    let d: Driver = driver;
    return Promise.resolve()
      .then(() => d.findElement(By.id("track_uri")))
      .then(el => d.wait(until.elementTextIs(el, uri)))
      .return();
  },

  close() {
    if (!driver) {
      return Promise.reject(new Error("Already closed"));
    }
    const d: Driver = driver;
    return Promise.resolve()
      .then(() => d.close())
      .then(() => (driver = undefined));
  },
};
