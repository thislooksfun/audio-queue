// 3rd party
import dotenv from "dotenv";
// Logging
import log from "tlf-log";

const devMode = process.env.NODE_ENV !== "production";
if (devMode) {
  log.trace("Reading from .env file");
  dotenv.config();
}
