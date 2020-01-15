"use strict";

// 3rd-party
import Promise from "bluebird";
// Local
import { AudioTrack } from "../player/queue";
import plugins from "../plugins";

// Types
type Service = { name: string; displayName: string };
type SearchResult = { service: Service; tracks: AudioTrack[] };
type SearchCallback = (r: SearchResult[], d: any) => void;

export default function search(q: string, d: any, cb: SearchCallback) {
  console.log(`Searching for '${q}'`);
  if (q == "") cb([], d);

  return Promise.resolve()
    .then(() => Object.values(plugins))
    .map(p =>
      p
        .searchFor(q)
        .catch({ message: "Not Authenticated" }, () => null)
        .then(r => ({
          service: { name: p.name, displayName: p.displayName },
          tracks: r,
        }))
    )
    .all()
    .filter(r => r.tracks != null)
    .then(a => <{ service: Service; tracks: AudioTrack[] }[]>a)
    .then(r => cb(r, d))
    .catch(e => console.log(e));
}
