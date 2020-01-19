/// <reference types="spotify-api" />

// Built-in
import fs from "fs";
import path from "path";
// 3rd party
import Promise from "bluebird";
import SpotifyWebApi from "spotify-web-api-node";
import uuidv4 from "uuid/v4";
import log from "tlf-log";
// Local
import { SpotifyAudioTrack } from ".";
import scopes from "./scopes";
import player from "./player";
import sleep from "../../util/sleep";
import server from "../../web/server";

type TrackPage = SpotifyApi.PagingObject<SpotifyApi.TrackObjectFull>;

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

let refreshTimeout: NodeJS.Timeout;
function refreshAccessToken() {
  return Promise.resolve()
    .then(() => spotify.refreshAccessToken())
    .then(({ body: { access_token, expires_in } }) => {
      log.trace("Successfully refreshed the Spotify access token");

      // Save the access token so that it's used in future calls
      spotify.setAccessToken(access_token);

      // Set a timer to refresh the token 30s before it expires
      clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(refreshAccessToken, (expires_in - 30) * 1000);
    });
}

// Load previous token from disk, if there is one
if (fs.existsSync(tokenPath)) {
  log.trace("Found cached spotify token");
  const refreshToken = fs.readFileSync(tokenPath, { encoding: "utf-8" });
  spotify.setRefreshToken(refreshToken);
}

export function isAuthenticated() {
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

function transferPlayback() {
  return (
    player
      .getDeviceID()
      .tap(id => log.trace(`Transferring playback to ${id}`))
      // @ts-ignore
      .then(id => spotify.transferMyPlayback({ deviceIds: [id] }))
      // Sleep for half a second to ensure that the device has changed.
      .then(() => sleep(500))
      .tap(() => log.info("Transferred spotify playback"))
      .catch(e => {
        log.error("Something went wrong while trying to transfer playback", e);
        server.checkAuth();
      })
  );
}

function reopenPlayer() {
  const token = spotify.getAccessToken();
  if (token == null) {
    return Promise.reject("No token!");
  }

  return (
    player
      .close()
      .then(() => player.open(token))
      .then(() => transferPlayback())
      // No-op if the player is already closed
      .catch({ message: "Already closed" }, () => {})
      .return()
  );
}

function ensurePlayer() {
  const token = spotify.getAccessToken();
  if (token == null) {
    return Promise.reject("No token!");
  }

  return (
    player
      .open(token)
      // No-op if the player is already open
      .catch({ message: "Already open" }, () => {})
      .then(() => transferPlayback())
      .return()
  );
}

function getAlbumArt(a: SpotifyApi.AlbumObjectSimplified): string | null {
  const artworks = a.images.sort(
    ({ width: a, width: b }) => (b || 0) - (a || 0)
  );
  return artworks.length > 0 ? artworks[0].url : null;
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
      .then(() => reopenPlayer())
      .tapCatch(() => {
        // Something went wrong while authorizing from a token.
        spotify.resetAccessToken();
        spotify.resetRefreshToken();
        fs.unlinkSync(tokenPath);
      });
  },
  play(uri?: string) {
    return ensureAuthenticated()
      .then(ensurePlayer)
      .tap(() => log.debug(`spotify.play(${uri})`))
      .then(() => {
        if (uri) {
          player.setExpectedURI(uri);
        }
      })
      .then(() => (uri ? [uri] : undefined))
      .then(uris => spotify.play({ uris }))
      .then(() => player.waitForPlayback(uri))
      .return();
  },
  pause() {
    return ensureAuthenticated()
      .then(() => spotify.pause())
      .return();
  },

  status() {
    return ensureAuthenticated()
      .then(() => spotify.getMyCurrentPlaybackState())
      .then(resp => resp.body);
  },

  searchFor(query: string): Promise<SpotifyAudioTrack[]> {
    log.trace(`Searching Spotify for ${query}`);
    return ensureAuthenticated()
      .then(() => spotify.searchTracks(query, { limit: 5 }))
      .then(resp => <TrackPage>resp.body.tracks)
      .then(tracks => tracks.items)
      .map(track => ({
        source: "spotify",
        name: track.name,
        artist: track.artists.map(a => a.name).join(" & "),
        artwork: getAlbumArt(track.album),
        data: {
          id: track.id,
          uri: track.uri,
          started: false,
        },
      }));
  },
};
