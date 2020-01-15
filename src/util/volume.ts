"use strict";

// Built-in
import { execSync } from "child_process";
// Local
import clamp from "./clamp";
import server from "../web/server";

export default function setVolume(vol: number) {
  if (isNaN(vol)) return;
  let v = clamp(vol, 0, 100);
  execSync(`amixer sset PCM,0 ${v}% > /dev/null &`);
  server.broadcast("volume", v);
}
