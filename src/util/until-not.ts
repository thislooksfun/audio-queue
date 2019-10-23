import { Condition } from "selenium-webdriver";

export default {
  urlIsnt(url: string) {
    return new Condition("for URL to not be " + JSON.stringify(url), driver => {
      return driver.getCurrentUrl().then(u => u !== url);
    });
  },
  urlContains(substrUrl: string) {
    return new Condition(
      "for URL to not contain " + JSON.stringify(substrUrl),
      driver => {
        return driver
          .getCurrentUrl()
          .then(url => !url || url.indexOf(substrUrl) === -1);
      }
    );
  },
  urlDoesntMatch(regex: RegExp) {
    return new Condition("for URL to not match " + regex, function(driver) {
      return driver.getCurrentUrl().then(function(url) {
        return !regex.test(url);
      });
    });
  },
};
