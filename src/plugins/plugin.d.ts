import { AudioTrack, AudioSource } from "../player/queue";

export interface Plugin {
  createAudioSource(track: AudioTrack): AudioSource;
  searchFor(query: string): AudioTrack[];
}
