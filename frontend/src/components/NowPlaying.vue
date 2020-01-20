<template>
  <div class="now-playing">
    <div class="album">
      <img :src="artwork" alt="" />
    </div>

    <div class="info">
      <span class="title">{{ trackname }}</span>
      <span class="artist">{{ artist }}</span>
    </div>

    <div class="controls">
      <span class="loading" v-if="loading">Loading...</span>
      <template v-else>
        <button @click="prev">
          <span class="fas fa-step-backward"></span>
        </button>

        <button @click="playpause">
          <span v-if="playing" class="fas fa-pause"></span>
          <span v-else class="fas fa-play"></span>
        </button>

        <button @click="next">
          <span class="fas fa-step-forward"></span>
        </button>
      </template>
    </div>

    <span class="time"
      >{{ timeStr }} /
      <span @click="showRemaining = !showRemaining">{{
        showRemaining ? remainingStr : durationStr
      }}</span></span
    >
    <div class="progress-bar">
      <div class="progress-inner" :style="`width: ${progress * 100}%`"></div>
    </div>
  </div>
</template>

<script>
export default {
  sockets: {
    track(t) {
      this.track = t;
    },
    status(s) {
      this.status = s;
      this.loading = false;
    },
    loading() {
      this.loading = true;
    },
  },
  data: () => ({
    track: null,
    status: null,
    loading: false,
    showRemaining: false,
  }),
  methods: {
    lpad(s, l, w) {
      s = "" + s;
      w = "" + w;
      if (w == "") throw new Error("Padding must not be empty");
      while (s.length < l) {
        s = w + s;
      }
      return s;
    },
    lpad20(s) {
      return this.lpad(s, 2, 0);
    },
    next() {
      this.$socket.emit("queue.next");
    },
    prev() {
      this.$socket.emit("queue.prev");
    },
    playpause() {
      this.$socket.emit("playpause");
    },
    extractTime(t) {
      return {
        hrs: Math.floor(t / (60 * 60)),
        min: Math.floor((t % (60 * 60)) / 60),
        sec: Math.round(t % 60),
      };
    },
  },
  computed: {
    timeStr() {
      if (this.status == null) return `0:00`;
      const { time, duration } = this.status;

      // Clamp time
      const elapsed = Math.max(Math.min(time, duration), 0);

      const { hrs, min, sec } = this.extractTime(elapsed);

      return duration >= 60 * 60
        ? `${hrs}:${this.lpad20(min)}:${this.lpad20(sec)}`
        : `${min}:${this.lpad20(sec)}`;
    },
    remainingStr() {
      if (this.status == null) return `-0:00`;
      const { time, duration } = this.status;

      // Clamp remaining
      const remaining = Math.max(Math.min(duration - time, duration), 0);

      const { hrs, min, sec } = this.extractTime(remaining);

      return duration >= 60 * 60
        ? `-${hrs}:${this.lpad20(min)}:${this.lpad20(sec)}`
        : `-${min}:${this.lpad20(sec)}`;
    },
    durationStr() {
      if (this.status == null) return `0:00`;
      const { duration } = this.status;

      const { hrs, min, sec } = this.extractTime(duration);

      return hrs > 0
        ? `${hrs}:${this.lpad20(min)}:${this.lpad20(sec)}`
        : `${min}:${this.lpad20(sec)}`;
    },
    progress() {
      if (this.status == null) return 0;
      const { time, duration } = this.status;
      return Math.max(Math.min(time / duration, 1), 0);
    },
    playing() {
      return this.status ? this.status.playing : false;
    },
    trackname() {
      return this.track ? this.track.name : "Nothing playing";
    },
    artist() {
      return this.track ? this.track.artist : "";
    },
    artwork() {
      return (
        (this.track ? this.track.artwork : null) ||
        "http://placekitten.com/200/200"
      );
    },
  },
};
</script>

<style lang="less" scoped>
.now-playing {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100vw;
  text-align: center;

  overflow: hidden;

  background-color: var(--background-tertiary);
  color: var(--text-primary);

  padding: 0.5rem;

  display: grid;
  grid-template-columns: 6rem 7rem auto min-content;
  grid-template-rows: 3rem 2.5rem 0.5rem;
  grid-template-areas:
    "art info info info"
    "art controls space time"
    "art progress progress progress";

  .album {
    grid-area: art;

    img {
      height: 100%;
      width: 100%;
      object-fit: contain;
    }
  }

  .info {
    grid-area: info;
    text-align: left;

    padding: 0 0.5rem;

    position: relative;
    width: 100%;

    display: grid;
    grid-template-columns: auto;
    grid-template-rows: auto auto;
    grid-template-areas: "title" "artist";

    .title,
    .artist {
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    .title {
      grid-area: title;
      font-size: 1.2rem;
    }
    .artist {
      min-width: 0;
      grid-area: artist;
    }
  }

  .controls {
    grid-area: controls;
    align-self: center;
    white-space: nowrap;

    padding: 0 0.5rem;

    .loading {
      font-size: 1.1rem;
      vertical-align: middle;
    }

    button {
      font-size: 1.2rem;
      padding: 0.2rem 0.4rem;
    }
  }

  .time {
    grid-area: time;
    align-self: end;

    font-size: 0.9rem;
    white-space: nowrap;
  }

  .progress-bar {
    grid-area: progress;
    align-self: center;

    margin-left: 1rem;

    position: relative;
    height: 0.35rem;
    background-color: var(--background-secondary);

    .progress-inner {
      position: absolute;
      left: 0;
      height: 100%;

      background-color: var(--theme-color);
    }
  }
}
</style>
