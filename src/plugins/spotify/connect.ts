// Built-in
import fs from "fs";
import path from "path";
// 3rd party
import Promise from "bluebird";
import SpotifyWebApi from "spotify-web-api-node";
import uuidv4 from "uuid/v4";
// Local
import scopes from "./scopes";
// Logging
import log from "tlf-log";

const isBalena = process.env.BALENA === "1";
const uuid = process.env.BALENA_DEVICE_UUID;

const dataRoot = isBalena ? "/data" : path.join(__dirname, "../../../data");
const tokenPath = path.join(dataRoot, "spotify/refreshToken");

const redirectUri = isBalena
  ? `https://${uuid}.balena-devices.com/api/v1/spotify/auth`
  : "http://localhost:8080/api/v1/spotify/auth";

const spotify = new SpotifyWebApi({
  redirectUri: redirectUri,
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

let authState: string = "";

function storeToken(refreshToken: string) {
  fs.mkdirSync(path.parse(tokenPath).dir, { recursive: true });
  fs.writeFileSync(tokenPath, refreshToken);
}

function refreshAccessToken() {
  return Promise.resolve()
    .then(() => spotify.refreshAccessToken())
    .then(({ body: { access_token } }) => {
      log.trace("Successfully refreshed the Spotify access token");

      // Save the access token so that it's used in future calls
      spotify.setAccessToken(access_token);
    });
}

// Load previous token from disk, if there is one
if (fs.existsSync(tokenPath)) {
  log.trace("Found cached spotify token");
  const refreshToken = fs.readFileSync(tokenPath, { encoding: "utf-8" });
  spotify.setRefreshToken(refreshToken);
}

function isAuthenticated() {
  if (spotify.getRefreshToken() == null) {
    // No refresh token found, definitely not authenticated.
    return Promise.resolve(false);
  } else if (spotify.getAccessToken() != null) {
    // Access token found, definitely are authenticated.
    return Promise.resolve(true);
  } else {
    // We have a refresh token but no access token. Try to get a new access
    // token. If it succeeds, then we are authenticated, if not then we
    // aren't.
    return refreshAccessToken()
      .return(true)
      .catchReturn(false);
  }
}

function ensureAuthenticated() {
  return isAuthenticated().then(authed => {
    if (!authed) {
      throw new Error("Not Authenticated");
    }
  });
}

export default {
  isAuthenticated,

  get authorizeURL() {
    authState = uuidv4();
    return spotify.createAuthorizeURL(scopes, authState);
  },
  getTokenFromCode(code: string, state: string) {
    // Ensure the state is valid
    if (authState != "" && state != authState) {
      return Promise.reject(new Error("Invalid State"));
    }

    // Clear the auth state after it has been used
    authState = "";

    return Promise.resolve()
      .then(() => spotify.authorizationCodeGrant(code))
      .then(({ body: { access_token, refresh_token } }) => {
        log.trace("Successfully authenticated with Spotify");

        // Set the access token on the API object to use it in later calls
        spotify.setAccessToken(access_token);
        spotify.setRefreshToken(refresh_token);

        // Store token on disk
        storeToken(refresh_token);
      })
      .tapCatch(() => {
        // Something went wrong while authorizing from a token.
        spotify.resetAccessToken();
        spotify.resetRefreshToken();
        fs.unlinkSync(tokenPath);
      });
  },
  play() {
    return ensureAuthenticated()
      .then(() => spotify.play())
      .return();
  },
  pause() {
    return ensureAuthenticated()
      .then(() => spotify.pause())
      .return();
  },
};
