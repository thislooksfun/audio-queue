"use strict";

import Promise from "bluebird";
import server from "./web/server";

import nt from "./util/webdriver";

const log = require("tlf-log");

log._setLevel("debug");

Promise.resolve()
  // .then(tracker.init)
  .then(server.start)
  .then(nt.bind(nt, "https://www.youtube.com/watch?v=dQw4w9WgXcQ"));

// Promise
//   .resolve()
//   .then()
//   // .catch()
// ;
