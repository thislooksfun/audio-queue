<template>
  <div class="history">
    <span class="hist-empty" v-if="history.length == 0">History is empty</span>
    <ol v-else>
      <li
        v-for="(track, i) in history"
        :key="track.source + track.artist + track.name"
      >
        <span class="index">{{ i + 1 }}</span>

        <div class="album">
          <img :src="track.artwork" alt="" />
        </div>

        <div class="track-container">
          <div class="track">
            <span class="name">{{ track.name }}</span>
            <span class="artist">{{ track.artist }}</span>
            <button class="readd" @click="readd(t)">Add to queue</button>
          </div>
        </div>
      </li>
    </ol>
  </div>
</template>

<script>
export default {
  sockets: {
    history(h) {
      this.history = h;
    },
  },
  data: () => ({ history: [] }),
  methods: {
    readd(t) {
      this.$socket.emit("enqueue", t);
    },
  },
};
</script>

<style lang="less" scoped>
.history {
  .hist-empty {
    display: inline-block;
    width: 100%;
    text-align: center;

    margin-top: 1.5rem;
    font-size: 1.5rem;
  }

  ol {
    list-style-type: none;
    margin: 0;
    padding: 0.5rem;
    padding-top: 0.25rem;

    li {
      padding: 0.2rem 0;

      .index {
        display: inline-block;
        vertical-align: middle;
        width: 2rem;
        font-size: 1.25rem;
        text-align: center;
      }

      .album {
        position: relative;
        left: 0;
        height: 4rem;
        width: 4rem;
        display: inline-block;

        vertical-align: middle;

        margin-right: 0.5rem;

        img {
          height: 100%;
          width: 100%;
          object-fit: contain;
        }
      }

      .track-container {
        display: inline-block;
        vertical-align: middle;

        .track {
          display: grid;
          grid-template-columns: auto;
          grid-template-rows: auto auto auto;
          grid-template-areas: "name" "artist" "readd";

          .name {
            grid-area: name;
            font-size: 1.1rem;
          }
          .artist {
            grid-area: artist;
            font-size: 0.95rem;
          }
          .readd {
            grid-area: readd;
            text-align: left;
            font-size: 0.75rem;
            color: var(--text-secondary);

            margin: 0;
            padding: 0;

            &:hover,
            &:active {
              color: var(--theme-color);
            }
          }
        }
      }
    }
  }
}
</style>
