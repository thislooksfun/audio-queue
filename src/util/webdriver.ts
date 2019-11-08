// Built-in
import path from "path";
// 3rd-party
import Promise from "bluebird";
import { Options, ServiceBuilder, Driver } from "selenium-webdriver/firefox";
// Logging
import log from "tlf-log";

// TODO: Make this configurable?
const maxAttempts = 1;

const devMode = process.env.NODE_ENV !== "production";

if (devMode) {
  // Add to the PATH
  log.debug("Adding './bin' to path");
  process.env.PATH += ":" + path.join(process.cwd(), "bin");
}

type Preferences = { [key: string]: string | number | boolean };
function buildSettings(preferences?: Preferences) {
  const updatePrefName = "media.gmp-manager.updateEnabled";
  let options = new Options().setPreference(updatePrefName, true);
  if (!devMode) {
    options.headless();
  } else {
    options.headless();
  }

  if (preferences != null) {
    for (const key in preferences) {
      options.setPreference(key, preferences[key]);
    }
  }

  return options;
}

export function createDriverSession(preferences?: Preferences) {
  log.info("Creating driver session");
  const options = buildSettings(preferences);
  const service = new ServiceBuilder().enableVerboseLogging(true).build();
  return Driver.createSession(options, service);
}

type redirectRule = boolean | string | string[] | RegExp | RegExp[];
interface NavigationOptions {
  driver?: Driver;
  allowRedirect?: redirectRule;
}

function redirectAllowed(to: string, rule?: redirectRule): boolean {
  if (rule == null) return false;
  if (typeof rule == "boolean") return rule;
  if (typeof rule == "string") return to == rule;
  if (rule instanceof RegExp) return rule.test(to);

  // If we get this far then rule is an array
  const rules: string[] | RegExp[] = rule;
  if (rules.length == 0) return false;

  if (typeof rules[0] == "string") {
    return (rules as string[])
      .map(r => redirectAllowed(to, r))
      .reduce((b, bb) => b || bb, false);
  } else {
    return (rules as RegExp[])
      .map(r => redirectAllowed(to, r))
      .reduce((b, bb) => b || bb, false);
  }
}

export function navigateTo(
  url: string,
  opts: NavigationOptions = {},
  attempt = 0
): Promise<Driver> {
  if (attempt >= maxAttempts) {
    log.error("Navigation failed too many times, aborting");
    return Promise.reject("Navigation failed too many times, aborting");
  }

  opts.driver = opts.driver || createDriverSession();

  log.info(`Fetching URL '${url}' (attempt ${attempt + 1}/${maxAttempts})`);

  let _errored = false;
  const driver = opts.driver;
  return Promise.resolve()
    .then(() => driver.get(url))
    .then(() => driver.getCurrentUrl())
    .then(u => {
      if (u !== url && !redirectAllowed(u, opts.allowRedirect)) {
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
    })
    .then(() => {
      if (_errored) {
        log.debug("One or more errors occurred, retrying...");
        // If something went wrong, try again
        return navigateTo(url, opts, attempt + 1);
      }
      return;
    })
    .return(driver);
}
export default navigateTo;
