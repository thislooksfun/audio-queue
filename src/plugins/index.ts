import { Plugin } from "./plugin";
import youtube from "./youtube";
import spotify from "./spotify";

export const plugins: { [key: string]: Plugin } = { youtube, spotify };
export default plugins;
