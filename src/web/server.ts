"use strict";

// Built-in
// import path from "path";
// import fs from "fs";
import { execSync } from "child_process";
import httpServer from "http";
// 3rd-party
import Promise from "bluebird";
import express, { Request, Response } from "express";
import socketIO from "socket.io";
import bodyParser from "body-parser";
import methodOverride from "method-override";
import log from "tlf-log";
// Local
import queue, { AudioTrack } from "../player/queue";
import plugins from "../plugins";

const app = express();
const http = httpServer.createServer(app);
const io = socketIO(http);
const port = parseInt(process.argv[2]) || 8080;

function methodOverrideBody(req: Request, _res: Response) {
  if (req.body && typeof req.body === "object" && "_method" in req.body) {
    // look in urlencoded POST bodies and delete it
    var method = req.body._method;
    delete req.body._method;
    return method;
  }
}

type Promiseable<T> = T | Promise<T>;
function apiWrap<T>(
  res: Response,
  action: string,
  p: () => Promiseable<T>
): Promise<void> {
  return (
    Promise.resolve()
      .then(p)
      // Send them back to the home page on success
      .then(() => res.redirect("/"))
      // Show an error on error
      .catch(e => {
        log.error(`Something went wrong when ${action}`);
        console.log(e);
        res.status(500).send("Something went wrong");
      })
  );
}

// function getAuthenticationStatuses() {
//   return Promise.resolve()
//     .then(() => Object.values(plugins))
//     .filter(({ isAuthenticated }) => isAuthenticated != null)
//     .map(plugin =>
//       // @ts-ignore
//       Promise.all([plugin.name, plugin.isAuthenticated()])
//     )
//     .then(entries =>
//       entries.reduce((o: { [key: string]: boolean }, [n, a]) => {
//         o[n] = a;
//         return o;
//       }, {})
//     );
// }

export default {
  start() {
    app.use(express.static("frontend/dist"));

    // Parse application/x-www-form-urlencoded
    app.use(bodyParser.urlencoded({ extended: false }));
    // Parse application/json bodies
    app.use(bodyParser.json());

    // Allow forms to override method
    app.use(methodOverride("_method"));
    app.use(methodOverride(methodOverrideBody));

    //#region Global routes
    app.get("/", (_req, res) => {
      res.sendFile("frontend/dist/index.html");

      // return Promise.resolve()
      //   .then(getAuthenticationStatuses)
      //   .then(authenticated =>
      //     res.render("home", {
      //       queue: queue.queue,
      //       history: queue.history.slice(-5),
      //       current: queue.current,
      //       authenticated,
      //     })
      //   );
    });

    // app.get("/history", (_req, res) => {
    //   return Promise.resolve().then(() =>
    //     res.render("history", {
    //       history: queue.history,
    //       current: queue.current,
    //     })
    //   );
    // });

    // app.get("/search", (req, res) => {
    //   const q = req.query.q || "";

    //   if (q == "") {
    //     return res.status(400).send("Bad Request");
    //   }

    //   return Promise.resolve()
    //     .then(() => Object.values(plugins))
    //     .map(p => p.searchFor(q).then(r => ({ name: p.name, results: r })))
    //     .all()
    //     .filter(r => r.results != null)
    //     .then(a => <{ name: string; results: AudioTrack[] }[]>a)
    //     .then(arr =>
    //       arr.reduce((o: { [key: string]: AudioTrack[] }, t) => {
    //         o[t.name] = o[t.name] || [];
    //         o[t.name].push(...t.results);
    //         return o;
    //       }, {})
    //     )
    //     .then(results =>
    //       res.render("search", {
    //         current: queue.current,
    //         results,
    //       })
    //     )
    //     .catch(e => {
    //       console.log(e);
    //       res.status(500).send("Something went wrong!");
    //     });
    // });
    //#endregion Global routes

    const apiv1Router = express.Router();

    //#region Plugin routes
    Object.values(plugins).forEach(plugin => {
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

    apiv1Router.put("/volume", (req, res) => {
      const volume = parseFloat(req.body.percent);
      if (isNaN(volume)) {
        res.status(400).send("Invalid volume level");
      }

      return apiWrap(res, `setting volume to ${volume}`, () =>
        execSync(`amixer sset PCM,0 ${volume}% > /dev/null &`)
      );
    });

    apiv1Router.put("/queue/next", (_req, res) => {
      log.trace("Moving to next track");
      return apiWrap(res, "moving to the next track", () => queue.next());
    });

    apiv1Router.put("/queue/playpause", (_req, res) => {
      log.trace("Play / pause");
      return apiWrap(res, "playing/pausing", () => queue.playpause());
    });

    apiv1Router.put("/queue/previous", (_req, res) => {
      log.trace("Moving to previous track");
      return apiWrap(res, "moving to the previous track", () =>
        queue.previous()
      );
    });

    apiv1Router.put("/queue/shift", (req, res) => {
      if (typeof req.body !== "object") {
        return res.status(400).send("Invalid Request");
      }

      log.trace(`Shifting ${req.body.index} ${req.body.direction}`);

      const up = queue.shiftUp.bind(queue);
      const down = queue.shiftDown.bind(queue);
      const shift = req.body.direction == "up" ? up : down;

      const action = `shifting ${req.body.index} ${req.body.direction}`;
      return apiWrap(res, action, () => shift(parseInt(req.body.index)));
    });

    apiv1Router.put("/queue/remove", (req, res) => {
      if (typeof req.body !== "object") {
        return res.status(400).send("Invalid Request");
      }

      log.trace(`Removing item at index ${req.body.index}`);

      const action = `removing item at index ${req.body.index}`;
      return apiWrap(res, action, () => queue.remove(parseInt(req.body.index)));
    });

    apiv1Router.post("/enqueue", (req, res) => {
      if (typeof req.body !== "object") {
        return res.status(400).send("Invalid Request");
      }

      const plugin = plugins[req.body.service];
      if (plugin == null) {
        return res.status(400).send("Invalid Request");
      }

      const track = <AudioTrack>JSON.parse(req.body.track);

      log.trace(`Enqueuing ${track.name} via ${plugin.name}`);

      return apiWrap(res, `enqueuing ${track.name} via ${plugin.name}`, () => {
        return Promise.resolve()
          .then(() => plugin.createAudioSource(track))
          .then(as => queue.enqueue(as));
      });
    });

    app.use("/api/v1", apiv1Router);
    //#endregion API v1 routes

    http.listen(port, () => log.info(`App listening on port ${port}!`));
  },
};
