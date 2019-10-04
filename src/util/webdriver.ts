// Built-in
import path from "path";
import { execSync } from "child_process";
// 3rd-party
import Promise from "bluebird";
// import { until } from "selenium-webdriver";
import { Options, ServiceBuilder, Driver } from "selenium-webdriver/firefox";
// Logging
const log = require("tlf-log");
const player = require("play-sound")({});

// TODO: Make this configurable?
const maxAttempts = 1;

const options = new Options().headless();
// .addArguments("no-sandbox", "disable-dev-shm-usage");

const service = new ServiceBuilder()
  // .loggingTo(path.join(__dirname, "../../logs/geckodriver.log"))
  .enableVerboseLogging(true)
  .build();

function _navigateTo(
  driver: Driver,
  url: string,
  attempt = 0
): Promise<Driver> {
  if (attempt >= maxAttempts) {
    log.error("Navigation failed too many times, aborting");
    return Promise.reject("Navigation failed too many times, aborting");
  }

  log.info(`Fetching URL '${url}' (attempt ${attempt + 1}/${maxAttempts})`);

  let _errored = false;
  return Promise.resolve()
    .then(() => driver.get(url))
    .then(() => driver.getCurrentUrl())
    .then(u => {
      if (u !== url) {
        // Wrong URL
        _errored = true;
        log.warn("URL mismatch");
        // log.warn("Not logged in, logging in now, then retrying");
        // const { username, password } = loginInfoCB();
        // return login(driver, username, password);
      }
      return;
    })
    .catch(e => {
      // Something went wrong
      _errored = true;
      log.error(`Something went wrong while trying to fetch '${url}'`);
      console.log(e);
      console.log(
        execSync(`ls ${path.join(__dirname, "../../")}`, { encoding: "utf8" })
      );
      log.info("Retrying...");
    })
    .then(() => {
      if (_errored) {
        log.debug("One or more errors occurred, retrying...");
        // If something went wrong, try again
        return _navigateTo(driver, url, attempt + 1);
      }
      return;
    })
    .then(() => driver.getTitle())
    .then(console.log)
    .then(() => driver.getCurrentUrl())
    .then(console.log)
    .then(() => {
      return new Promise((resolve, reject) => {
        player.play(
          path.join(__dirname, "../../audio/audio.mp3"),
          (err: any) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    })
    .then(() => console.log("Finished playing audio"))
    .catch(e => {
      console.log("Something went wrong!");
      console.log(e);
    })
    .return(driver);
}

export function navigateTo(url: string): Promise<Driver> {
  log.info("Creating driver session");
  const driver = Driver.createSession(options, service);
  log.info("Created driver session");
  return _navigateTo(driver, url);
}
export default navigateTo;
