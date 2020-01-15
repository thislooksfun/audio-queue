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
import queue from "../player/queue";
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
  broadcast: io.emit.bind(io),

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
    app.get("/", (_req, res) => res.sendFile("frontend/dist/index.html"));
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

    apiv1Router.put("/queue/remove", (req, res) => {
      if (typeof req.body !== "object") {
        return res.status(400).send("Invalid Request");
      }

      log.trace(`Removing item at index ${req.body.index}`);

      const action = `removing item at index ${req.body.index}`;
      return apiWrap(res, action, () => queue.remove(parseInt(req.body.index)));
    });

    app.use("/api/v1", apiv1Router);
    //#endregion API v1 routes

    http.listen(port, () => log.info(`App listening on port ${port}!`));
  },
};
