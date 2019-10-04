"use strict";

// Built-in
// import path from "path";
// import fs from "fs";
// 3rd-party
import express from "express";
// Local
// const track = require("../t");
// const history = require("util/history");
// const stats = require("util/stats");

const app = express();
const port = parseInt(process.argv[2]) || 8080;

export default {
  start: function() {
    app.get("/", (_req, res) => res.send("Hello World!"));

    // app.get("/log", (_req, res) =>
    //   res
    //     .set({ "Content-Type": "text/plain" })
    //     .send(
    //       fs.readFileSync(
    //         path.join(__dirname, "../logs/chromedriver.log"),
    //         "utf-8"
    //       )
    //     )
    // );

    // app.get("/refresh", (_req, res) => {
    //   log.trace("> /reload");
    //   const start = Date.now();
    //   return track().then(r => {
    //     const end = Date.now();
    //     res.send(
    //       `Done!  -- ${JSON.stringify(r)} -- ${new Date()} -- took ${end -
    //         start}ms`
    //     );
    //   });
    // });

    app.get("/api/v1/ping", (_req, res) => {
      res.send("Pong!");
    });

    // app.get("/api/v1/cash", (_req, res) => {
    //   res.json(history.last);
    // });

    // app.get("/api/v1/cash-per-meal", (_req, res) => {
    //   res.json(stats.analyze());
    // });

    app.listen(port, () =>
      console.log(`Example app listening on port ${port}!`)
    );
  },
};
