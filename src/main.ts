"use strict";

import Promise from "bluebird";
import server from "./web/server";

import queue from "./player/queue";

import youtube from "./plugins/youtube";
import sleep from "./util/sleep";
// import spotify from "./plugins/spotify";

import log from "tlf-log";

log._setLevel("debug");

const devMode = process.env.NODE_ENV !== "production";
if (devMode) {
  require("dotenv").config();
}

const enqueueYT = (slug: string) =>
  Promise.resolve()
    .then(() => youtube.searchFor(slug))
    .then(([at]) => youtube.createAudioSource(at))
    .tap(as => queue.enqueue(as));

Promise.resolve()
  // .then(tracker.init)
  .then(server.start)
  .tap(() => sleep(1000))
  // Queue first song
  .then(() => enqueueYT("qAeybdD5UoQ"))
  // Queue second song
  .then(() => enqueueYT("cHHLHGNpCSA"))
  // Preload second song after 10s
  .tap(() => sleep(10 * 1000))
  .tap(() => queue.preloadNext())
  // Start second song after 20s more
  .tap(() => sleep(30 * 1000))
  .then(() => queue.next())
  // Stop after 30s
  .tap(() => sleep(30 * 1000))
  .then(() => queue.next());
