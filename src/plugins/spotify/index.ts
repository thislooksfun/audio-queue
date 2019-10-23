// Built-in
// import fs from "fs";
import path from "path";
import querystring from "querystring";
// 3rd-party
import { navigateTo, createDriverSession } from "../../util/webdriver";
import { By, until } from "selenium-webdriver";
import { Driver } from "selenium-webdriver/firefox";
import untilNot from "../../util/until-not";
import uuidv4 from "uuid/v4";
// Local
// import repeat from "../../util/repeat";
// import sleep from "../../util/sleep";
// Logging
import log from "tlf-log";

// const stateStr = fs.readFileSync(path.join(__dirname, "scripts/state.js"), {
//   encoding: "utf8",
// });

// interface State {
//   paused: boolean | null;
//   time: number | null;
//   duration: number | null;
// }

// function getState(driver: Driver): Promise<State> {
//   return driver.executeScript(stateStr);
// }

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

// Match the login URL
const loginUrl = /^https:\/\/accounts\.spotify\.com\/.*?\/login\?/;
function logIn(driver: Driver) {
  const username = process.env.SPOTIFY_USERNAME || "";
  const password = process.env.SPOTIFY_PASSWORD || "";

  if (username == "" || password == "") {
    log.fatal("Spotify username and/or password was unset!");
  }

  console.log(`Logging in as ${username}`);

  return (
    Promise.resolve()
      // Enter username
      .then(() => driver.findElement(By.id("login-username")))
      .then(el => el.sendKeys(username))
      // Enter password
      .then(() => driver.findElement(By.id("login-password")))
      .then(el => el.sendKeys(password))
      // Don't save login
      .then(() => driver.findElement(By.id("login-remember")))
      .then(el => el.isSelected().then(s => ({ selected: s, el })))
      .then(({ el, selected }) =>
        // If the "remember me" checkbox is checked, click its parent to
        // deselect it.
        selected ? el.findElement(By.xpath("./..")).then(p => p.click()) : null
      )
      // Submit form
      .then(() => driver.findElement(By.id("login-button")))
      .then(el => el.click())
      .then(() => driver.wait(untilNot.urlDoesntMatch(loginUrl)))
  );
}

// Match the authorization URL
const authUrl = /^https:\/\/accounts\.spotify\.com\/.*?\/authorize\?/;
function authorize(driver: Driver) {
  return Promise.resolve()
    .then(() => driver.wait(until.elementLocated(By.id("auth-accept"))))
    .then(() => driver.findElement(By.id("auth-accept")))
    .then(el => el.click())
    .then(() => driver.wait(untilNot.urlDoesntMatch(authUrl)));
}

function getToken(driver: Driver) {
  const query = {
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: "token",
    redirect_uri: "https://developer.spotify.com/",
    state: uuidv4(),
    scope: "streaming user-read-email user-read-private",
  };
  const queryStr = querystring.stringify(query);

  // Allow redirecting to the login page
  const opts = { driver, allowRedirect: loginUrl };
  return (
    navigateTo(`https://accounts.spotify.com/authorize?${queryStr}`, opts)
      // Log in if needed
      .then(() => driver.getCurrentUrl())
      .then(url => (loginUrl.test(url) ? logIn(driver) : null))
      // Authorize the application if needed
      .then(() => driver.getCurrentUrl())
      .then(url => (authUrl.test(url) ? authorize(driver) : null))
      // Retrieve the token
      .then(() => driver.getCurrentUrl())
      .then(url => url.split("#", 2)[1])
      .then(frag => querystring.parse(frag))
      .tap(console.log)
      .tap(({ state }) => {
        if (state !== query.state) {
          log.fatal(
            `Mismatched state! (expected ${state}, got ${query.state})`
          );
        }
      })
      .then(({ access_token }) => access_token)
    // .then(({access_token, state}))
  );
}

export default {
  play() {
    const driver = createDriverSession();
    const pagePath = path.join(
      __dirname,
      "../../../",
      "support/plugins/spotify",
      "page.html"
    );
    return getToken(driver).then(token =>
      navigateTo(`file://${pagePath}#${token}`, {
        driver: driver,
      })
    );
    // let driver: Driver;
    // return (
    //   navigateTo(`https://www.youtube.com/watch?v=${slug}`)
    //     .then(d => (driver = d))
    //     // Play
    //     .then(() => driver.findElements(By.css(".ytp-cued-thumbnail-overlay")))
    //     .each(el =>
    //       driver.wait(until.elementIsVisible(el)).then(() => el.click())
    //     )
    //     .then(() => repeat.until(() => sleep(100), playing.bind(null, driver)))
    //     // Print out info while it's playing
    //     .then(() =>
    //       repeat.while(query.bind(null, driver), playing.bind(null, driver))
    //     )
    // );
  },
};

// import { AudioSource, AudioTrack } from "../../player/queue";
// import Promise from "bluebird";
// const log = require("tlf-log");

// export interface SpotifyAudioTrack extends AudioTrack {
//   source: "spotify";
//   spotify: "stuff";
// }

// export default {
//   createSourceFor(track: AudioTrack): Promise<AudioSource> {
//     if (track.source !== "spotify") {
//       log.warn(`Invalid parameter ${track}`);
//       return Promise.reject(`Invalid parameter ${track}`);
//     }

//     const st = track as SpotifyAudioTrack;
//     let x = st.spotify;

//     console.log(`Hello! ${track.name} -- ${x}`);
//     return Promise.resolve({
//       track,
//       loaded: () => Promise.resolve(true),
//       preload: () => Promise.resolve(),
//       pause: () => Promise.resolve(),
//       resume: () => Promise.resolve(),
//       stop: () => Promise.resolve(),
//     });
//   },
// };
