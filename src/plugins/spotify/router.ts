// 3rd party
import { Router } from "express";
// Local
import connect from "./connect";
// Logging
import log from "tlf-log";

export function registerPages(router: Router) {
  router.get("/auth", (_req, res) => {
    connect.isAuthenticated().then(authed => {
      if (authed) {
        res.send(`Already authenticated!`);
      } else {
        res.redirect(connect.authorizeURL);
      }
    });
  });

  router.get("/play", (_req, res) => {
    connect
      .play()
      .then(() => res.send("Playing!"))
      .catch({ message: "Not Authenticated" }, () =>
        res.send("Not Authenticated!")
      )
      .catch(() => {
        log.error("Error while tring to play from Spotify:");
        // console.log(e);
        res.status(500).send("Something went wrong.");
      });
  });

  router.get("/pause", (_req, res) => {
    connect
      .pause()
      .then(() => res.send("Paused!"))
      .catch({ message: "Not Authenticated" }, () =>
        res.send("Not Authenticated!")
      )
      .catch(e => {
        log.error("Error while tring to pause Spotify:");
        console.log(e);
        res.status(500).send("Something went wrong.");
      });
  });
}

export function registerAPI(router: Router) {
  router.get("/auth", (req, res) => {
    return connect
      .getTokenFromCode(req.query.code, req.query.state)
      .then(() => res.send("Success"))
      .tapCatch(e => {
        log.error("Error during spotify auth:");
        console.log(e);
      })
      .catch({ message: "Invalid State" }, () =>
        res.status(403).send("Unauthorized")
      )
      .catch({ name: "WebapiError", message: "Bad Request" }, () =>
        res.status(400).send("Bad Request")
      )
      .catch(() => res.status(500).send("Something went wrong."));
  });
}
