"use strict";

// Built-in
import path from "path";
// import fs from "fs";
import { execSync } from "child_process";
// 3rd-party
import Promise from "bluebird";
import express, { Response } from "express";
// import * as core from "express-serve-static-core";
import expressVue from "express-vue";
// Local
import queue from "../player/queue";
import plugins from "../plugins";
import "./express-vue-ext";
// Logging
import log from "tlf-log";

const app = express();
const port = parseInt(process.argv[2]) || 8080;

export default {
  start: function() {
    const vueOpts = { rootPath: path.join(__dirname, "../../vue/") };
    console.log(vueOpts);

    // @ts-ignore
    const expressVueMiddleware = expressVue.init(vueOpts);
    // @ts-ignore
    app.use(expressVueMiddleware);

    return (
      Promise.resolve(app)
        // .then(() => <core.Express>expressVue.use(app, vueOpts))
        .then(app => {
          //#region Global routes
          app.get("/", (_req, res: Response) => {
            res.renderVue("main.vue");
          });

          app.get("/next", (_req, res) =>
            queue.next().then(() => res.send("success"))
          );

          app.get("/volume/:percent", (req, res) => {
            const volume = parseFloat(req.params.percent);
            if (isNaN(volume)) {
              res.status(400).send("Invalid volume level");
            } else {
              execSync(`amixer sset PCM,0 ${volume}% > /dev/null &`);
              res.send(`Volume set to ${volume}%`);
            }
          });
          //#endregion Global routes

          const apiv1Router = express.Router();

          //#region Plugin routes
          plugins.forEach(plugin => {
            if (plugin.registerAPI != null) {
              log.trace(`Registering API routes for ${plugin.name}`);
              const pr = express.Router();
              plugin.registerAPI(pr);
              apiv1Router.use("/" + plugin.name, pr);
            }

            if (plugin.registerPages != null) {
              log.trace(`Registering page routes for ${plugin.name}`);
              const pr = express.Router();
              plugin.registerPages(pr);
              app.use("/" + plugin.name, pr);
            }
          });
          //#endregion Plugin routes

          //#region API v1 routes
          apiv1Router.get("/ping", (_req, res) => {
            res.send("Pong!");
          });

          app.use("/api/v1", apiv1Router);
          //#endregion API v1 routes

          app.listen(port, () => log.info(`App listening on port ${port}!`));
        })
    );
  },
};
