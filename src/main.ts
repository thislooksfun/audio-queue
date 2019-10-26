"use strict";

// Setup scripts
import "./util/log-setup";
import "./util/env";
// 3rd party
import Promise from "bluebird";
// Local
import server from "./web/server";

Promise.resolve().then(server.start);
