// Built-in
import path from "path";
// 3rd-party
import Promise from "bluebird";
import { until, By } from "selenium-webdriver";
import { Driver } from "selenium-webdriver/firefox";
// Local
import navigateTo, { createDriverSession } from "../../util/webdriver";

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
