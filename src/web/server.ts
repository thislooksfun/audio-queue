"use strict";

// Built-in
// import path from "path";
// import fs from "fs";
import { execSync } from "child_process";
// 3rd-party
import express, { Request, Response } from "express";
import exphbs from "express-handlebars";
import bodyParser from "body-parser";
import methodOverride from "method-override";
// Local
import queue from "../player/queue";
import plugins from "../plugins";
import youtube from "../plugins/youtube";
// Logging
import log from "tlf-log";

const app = express();
const port = parseInt(process.argv[2]) || 8080;

function hbsSection(this: any, name: string, opts: any) {
  this._sections = this._sections || {};
  this._sections[name] = opts.fn(this);
  return null;
}

function methodOverrideBody(req: Request, _res: Response) {
  if (req.body && typeof req.body === "object" && "_method" in req.body) {
    // look in urlencoded POST bodies and delete it
    var method = req.body._method;
    delete req.body._method;
    return method;
  }
}

export default {
  start: function() {
    // Register handlebars
    const hbsOpts = { extname: ".hbs", helpers: { section: hbsSection } };
    app.engine(".hbs", exphbs(hbsOpts));
    app.set("view engine", ".hbs");

    // Parse both application/x-www-form-urlencoded and application/json bodies
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

    // Allow forms to override method
    app.use(methodOverride("_method"));
    app.use(methodOverride(methodOverrideBody));

    //#region Global routes
    app.get("/", (_req, res) => {
      res.render("home", {
        queue: queue.queue,
        history: queue.history,
        current: queue.current,
      });
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

    apiv1Router.put("/queue/next", (_req, res) => {
      return (
        Promise.resolve()
          .then(() => queue.next())
          // Send them back to the home page on success
          .then(() => res.redirect("/"))
          // Show an error on error
          .catch(e => {
            log.error(`Something went wrong when moving to the next track`);
            console.log(e);
            res.status(500).send("Something went wrong");
          })
      );
    });

    // TODO: Implement
    // apiv1Router.put("/queue/playpause", (_req, res) => {
    //   return (
    //     Promise.resolve()
    //       .then(() => queue.playpause())
    //       // Send them back to the home page on success
    //       .then(() => res.redirect("/"))
    //       // Show an error on error
    //       .catch(e => {
    //         log.error(`Something went wrong when enqueuing ${req.body.slug}`);
    //         console.log(e);
    //         res.status(500).send("Something went wrong");
    //       })
    //   );
    // });

    apiv1Router.put("/queue/previous", (_req, res) => {
      return (
        Promise.resolve()
          .then(() => queue.previous())
          // Send them back to the home page on success
          .then(() => res.redirect("/"))
          // Show an error on error
          .catch(e => {
            log.error(`Something went wrong when moving to the previous track`);
            console.log(e);
            res.status(500).send("Something went wrong");
          })
      );
    });

    apiv1Router.put("/queue/shift", (req, res) => {
      if (typeof req.body !== "object") {
        return res.status(400).send("Invalid Request");
      }

      log.trace(`Shifting ${req.body.index} ${req.body.direction}`);

      const up = queue.shiftUp.bind(queue);
      const down = queue.shiftDown.bind(queue);

      return (
        Promise.resolve()
          .then(() => (req.body.direction == "up" ? up : down))
          .then(shift => shift(parseInt(req.body.index)))
          // Send them back to the home page on success
          .then(() => res.redirect("/"))
          // Show an error on error
          .catch(e => {
            log.error(
              `Something went wrong when shifting ${req.body.index} ${req.body.direction}`
            );
            console.log(e);
            res.status(500).send("Something went wrong");
          })
      );
    });

    apiv1Router.post("/enqueue", (req, res) => {
      if (typeof req.body !== "object") {
        return res.status(400).send("Invalid Request");
      }
      // Currently only YouTube is supported
      // TODO: Allow for other services/plugins
      if (req.body.service !== "youtube") {
        return res.status(400).send("Invalid Request");
      }

      log.trace(`Enqueuing YT video ${req.body.slug}`);

      return (
        Promise.resolve()
          .then(() => youtube.searchFor(req.body.slug))
          .then(arr => arr[0])
          .then(at => youtube.createAudioSource(at))
          .then(as => queue.enqueue(as))
          // Send them back to the home page on success
          .then(() => res.redirect("/"))
          // Show an error on error
          .catch(e => {
            log.error(`Something went wrong when enqueuing ${req.body.slug}`);
            console.log(e);
            res.status(500).send("Something went wrong");
          })
      );
    });

    app.use("/api/v1", apiv1Router);
    //#endregion API v1 routes

    app.listen(port, () => log.info(`App listening on port ${port}!`));
  },
};
