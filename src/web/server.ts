"use strict";

// Built-in
// import path from "path";
// import fs from "fs";
import { execSync } from "child_process";
// 3rd-party
import express from "express";
import queue from "../player/queue";
import Promise from "bluebird";
// Local
import youtube from "../plugins/youtube";
// Logging
import log from "tlf-log";

const app = express();
const port = parseInt(process.argv[2]) || 8080;

export default {
  start: function() {
    app.get("/", (_req, res) => res.send("Hello World!"));

    app.get("/next", (_req, res) =>
      queue.next().then(() => res.send("success"))
    );

    app.get("/enqueue/yt/:slug", (req, res) => {
      Promise.resolve()
        .then(() => youtube.searchFor(req.params.slug))
        .then(([at]) => youtube.createAudioSource(at))
        .tap(as => queue.enqueue(as))
        .then(() => res.send("success"))
        .catch((e: any) => {
          res.status(500).send("Something went wrong!");
          log.error(e);
        });
    });

    app.get("/volume/:percent", (req, res) => {
      const volume = parseFloat(req.params.percent);
      if (isNaN(volume)) {
        res.status(400).send("Invalid volume level");
      } else {
        execSync(`amixer sset PCM,0 ${volume}% > /dev/null &`);
        res.send(`Volume set to ${volume}%`);
      }
    });

    app.get("/api/v1/ping", (_req, res) => {
      res.send("Pong!");
    });

    app.listen(port, () =>
      console.log(`Example app listening on port ${port}!`)
    );
  },
};
