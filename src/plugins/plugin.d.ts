import { AudioTrack, AudioSource } from "../player/queue";
import { Router } from "express";

export interface Plugin {
  // Metadata
  name: string;

  // Routing
  registerPages?(router: Router): void;
  registerAPI?(router: Router): void;

  // Playback
  createAudioSource(track: AudioTrack): AudioSource;
  searchFor(query: string): AudioTrack[];
}
