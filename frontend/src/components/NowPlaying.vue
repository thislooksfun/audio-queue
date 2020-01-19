<template>
  <div class="now-playing">
    <div class="track">
      <div class="album">
        <img :src="artwork" alt="" />
      </div>

      <div class="info">
        <div class="info-grid">
          <span class="title">{{ trackname }}</span>
          <span class="artist">{{ artist }}</span>
        </div>
      </div>
    </div>

    <div class="controls">
      <span class="fas fa-step-backward" @click="prev"></span>

      <span v-if="loading">Loading...</span>
      <template v-else>
        <span v-if="playing" class="fas fa-pause" @click="playpause"></span>
        <span v-else class="fas fa-play" @click="playpause"></span>
      </template>

      <span class="fas fa-step-forward" @click="next"></span>
    </div>

    <div class="progress">
      <span class="time-elapsed" @click="toggleRemaining">{{ timeStr }}</span>
      <div class="progress-bar">
        <div class="progress-inner" :style="`width: ${progress * 100}%`"></div>
      </div>
      <span class="time-duration">{{ durationStr }}</span>
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
    showRemaining: false,
    loading: false,
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
    toggleRemaining() {
      this.showRemaining = !this.showRemaining;
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
  },
  computed: {
    timeStr() {
      const prefix = this.showRemaining ? "-" : "";

      if (this.status == null) return `${prefix}0:00`;
      let { time, duration } = this.status;

      if (this.showRemaining) {
        time = duration - time;
      }

      // Clamp time
      time = Math.max(Math.min(time, duration), 0);

      const hrs = Math.floor(time / (60 * 60));
      const min = Math.floor(time / 60);
      const sec = Math.round(time % 60);

      return duration >= 60 * 60
        ? `${prefix}${hrs}:${this.lpad20(min)}:${this.lpad20(sec)}`
        : `${prefix}${min}:${this.lpad20(sec)}`;
    },
    durationStr() {
      if (this.status == null) return "0:00";
      const { duration } = this.status;
      const hrs = Math.floor(duration / (60 * 60));
      const min = Math.floor(duration / 60);
      const sec = Math.round(duration % 60);

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
  height: 4rem;
  text-align: center;

  background-color: #400;
  color: #fff;

  padding: 1rem;

  .track {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;

    // width: 15vw;

    background-color: #600;

    text-align: left;

    .album {
      position: relative;
      left: 0;
      height: 4rem;
      width: 4rem;
      display: inline-block;

      img {
        height: 100%;
        width: 100%;
        object-fit: contain;
      }
    }

    .info {
      display: inline-block;
      position: relative;
      vertical-align: top;
      height: 100%;

      padding: 0 0.5rem;

      .info-grid {
        height: 100%;

        display: grid;
        grid-template-columns: auto;
        grid-template-rows: 50% 50%;
        grid-template-areas: "title" "artist";
        align-items: center;

        .title {
          grid-area: title;
          white-space: nowrap;
        }

        .artist {
          grid-area: artist;
          white-space: nowrap;
        }
      }
    }
  }

  .controls {
    span {
      cursor: pointer;
      margin: 0 2rem;
    }
  }

  .progress {
    position: relative;

    display: grid;
    grid-template-columns: auto 50vw auto;
    grid-template-rows: auto;
    grid-template-areas: "elapsed pgbar duration";
    column-gap: 1rem;

    line-height: 1rem;

    .time-elapsed {
      grid-area: elapsed;
      text-align: right;
    }

    .time-duration {
      grid-area: duration;
      text-align: left;
    }

    .progress-bar {
      grid-area: pgbar;
      align-self: center;

      position: relative;
      display: inline-block;
      width: 100%;
      height: 0.25rem;
      background-color: #080;

      .progress-inner {
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        background-color: #008;
      }
    }
  }
}
</style>
