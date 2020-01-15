// 3rd party
import Promise from "bluebird";
import { Router } from "express";
// Local
import { AudioTrack, AudioSource } from "../player/queue";

export interface Plugin {
  // Metadata
  name: string;
  displayName: string;

  // Authentication
  isAuthenticated?(): Promise<boolean>;

  // Routing
  registerPages?(router: Router): void;
  registerAPI?(router: Router): void;

  // Playback
  createAudioSource(track: AudioTrack): AudioSource;
  searchFor(query: string): Promise<AudioTrack[] | null>;
}
