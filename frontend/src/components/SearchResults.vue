<template>
  <div v-show="results.length > 0" class="search-results">
    <ul>
      <template v-for="{ service, tracks } in results">
        <li class="seperator" :key="service.name"></li>
        <li class="title" :key="service.name">{{ service.displayName }}</li>

        <li
          v-for="t in tracks"
          :key="service.name + t.name"
          class="result"
          @click="enqueue(t)"
        >
          <div class="album">
            <img :src="t.artwork" alt="" />
          </div>
          <span class="name">{{ t.name }}</span> by
          <span class="artist">{{ t.artist }}</span>
        </li>
      </template>
    </ul>
  </div>
</template>

<script>
export default {
  props: {
    results: Array,
  },
  methods: {
    enqueue(t) {
      this.$socket.emit("enqueue", t);
    },
  },
};
</script>

<style lang="less" scoped>
.search-results {
  @width: 30vw;
  position: absolute;
  top: 4rem;
  left: calc((100vw - @width) / 2);
  width: @width;
  background-color: #fff;
  color: #000;
  border: 1px solid #000;
  border-top: 0;
  border-radius: 0 0 5px 5px;

  z-index: 99;

  ul {
    list-style-type: none;
    margin: 0;
    padding: 0.5rem;
    padding-top: 0.25rem;

    li {
      padding: 0.1rem 0;

      &.seperator {
        height: 1px;
        width: 100%;
        padding: 0;
        background-color: #ccc;

        margin: 0.25rem 0;

        &:first-child {
          // If the seperator is the first thing in the list, hide it.
          display: none;
        }
      }

      &.title {
        font-weight: 600;
      }

      &.result {
        cursor: pointer;

        .album {
          position: relative;
          left: 0;
          height: 2rem;
          width: 2rem;
          display: inline-block;

          vertical-align: middle;

          margin-right: 0.25rem;

          img {
            height: 100%;
            width: 100%;
            object-fit: contain;
          }
        }

        .name {
          color: #700;
        }
        .artist {
          color: #070;
        }

        &:hover {
          background-color: #ccc;
        }
      }
    }
  }
}
</style>
