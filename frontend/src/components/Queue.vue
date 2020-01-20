<template>
  <div class="queue">
    <span class="queue-empty" v-if="queue.length == 0">Queue is empty</span>
    <ol v-else>
      <li v-for="(track, i) in queue" :key="track.source + track.id">
        <div class="actions-wrap">
          <div class="actions">
            <button
              class="shift-up"
              @click="shift(i, i - 1)"
              :disabled="i == 0"
            >
              <span class="fas fa-chevron-up"></span>
            </button>
            <span class="index">{{ i + 1 }}</span>
            <button
              class="shift-down"
              @click="shift(i, i + 1)"
              :disabled="i == queue.length - 1"
            >
              <span class="fas fa-chevron-down"></span>
            </button>
          </div>
        </div>

        <div class="album">
          <img :src="track.artwork" alt="" />
        </div>

        <div class="track-container">
          <div class="track">
            <span class="name">{{ track.name }}</span>
            <span class="artist">{{ track.artist }}</span>
            <button class="remove" @click="remove(i)">Remove from queue</button>
          </div>
        </div>
      </li>
    </ol>
  </div>
</template>

<script>
export default {
  sockets: {
    queue(q) {
      this.queue = q;
    },
  },
  data: () => ({ queue: [] }),
  methods: {
    shift(from, to) {
      this.$socket.emit("queue.shift", from, to);
    },
    remove(at) {
      this.$socket.emit("queue.remove", at);
    },
  },
};
</script>

<style lang="less" scoped>
.queue {
  .queue-empty {
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

      .actions-wrap {
        display: inline-block;
        vertical-align: middle;
        width: 2rem;

        .actions {
          display: grid;
          grid-template-columns: auto;
          grid-template-rows: auto auto auto;
          grid-template-areas: "up" "index" "down";

          text-align: center;

          button {
            margin: -0.5rem 0;
          }

          button,
          .index {
            font-size: 1.25rem;
          }

          .shift-up {
            grid-area: up;
          }
          .index {
            grid-area: index;
          }
          .shift-down {
            grid-area: down;
          }
        }
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
          grid-template-areas: "name" "artist" "remove";

          .name {
            grid-area: name;
            font-size: 1.1rem;
          }
          .artist {
            grid-area: artist;
            font-size: 0.95rem;
          }
          .remove {
            grid-area: remove;
            text-align: left;
            font-size: 0.75rem;
            color: #555;

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
