<template>
  <div class="queue">
    <span class="queue-empty" v-if="upcoming.length == 0">Queue is empty</span>
    <ol v-else>
      <li v-for="(track, i) in upcoming" :key="track.source + track.id">
        <div v-if="i == 0" class="now-playing-label">Now Playing</div>

        <div class="actions-wrap">
          <div v-if="i > 0" class="actions">
            <button
              class="shift-up"
              @click="shift(i - 1, i - 2)"
              :disabled="i <= 1"
            >
              <span class="fas fa-chevron-up"></span>
            </button>
            <span class="index">{{ i }}</span>
            <button
              class="shift-down"
              @click="shift(i - 1, i)"
              :disabled="i == upcoming.length - 1"
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

        <div v-if="i == 0" class="upcoming-label">Upcoming</div>
      </li>
    </ol>
  </div>
</template>

<script>
export default {
  sockets: {
    track(t) {
      this.current = t;
    },
    queue(q) {
      this.queue = q;
    },
  },
  data: () => ({ current: null, queue: [] }),
  methods: {
    shift(from, to) {
      this.$socket.emit("queue.shift", from, to);
    },
    remove(at) {
      this.$socket.emit("queue.remove", at);
    },
  },
  computed: {
    upcoming() {
      return this.current ? [this.current, ...this.queue] : [];
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

      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      .now-playing-label,
      .upcoming-label {
        font-size: 1.1rem;
        margin-bottom: 0.5rem;

        border-bottom: 1px solid var(--background-secondary);
      }

      .upcoming-label {
        margin-top: 0.5rem;
      }

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
