<template>
  <div class="search-results">
    <ul>
      <template v-for="{ service, tracks } in results">
        <li class="seperator" :key="service.name"></li>
        <li class="title" :key="service.name">{{ service.displayName }}</li>

        <li
          v-for="t in tracks"
          :key="service.name + t.id"
          class="result"
          @click="enqueue(t)"
        >
          <div class="album">
            <img :src="t.artwork" alt="" />
          </div>

          <div class="track-container">
            <div class="track">
              <span class="name">{{ t.name }}</span>
              <span class="artist">{{ t.artist }}</span>
            </div>
          </div>
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
  text-align: left;

  @width: 30vw;
  position: absolute;
  top: 4rem;
  left: 0;
  width: 100%;
  max-width: 35rem;
  background-color: var(--background-primary);
  color: var(--text-primary);
  border: 1px solid var(--background-secondary);
  border-top: 0;
  border-radius: 0 0 5px 5px;

  // max-height: 50vh;
  max-height: 80vh;
  overflow-y: scroll;

  z-index: 99;

  ul {
    list-style-type: none;
    margin: 0;
    padding: 0.25rem 0 0.25rem 0;

    li {
      padding: 0.1rem 0.5rem;

      &.seperator {
        height: 1px;
        width: 100%;
        padding: 0;
        background-color: #ccc;

        padding-left: 0;
        padding-right: 0;
        margin: 0.25rem 0;

        &:first-child {
          // If the seperator is the first thing in the list, hide it.
          display: none;
        }
      }

      &.title {
        font-weight: 600;
        line-height: 1em;
        margin: 0.25rem 0;
      }

      &.result {
        position: relative;
        display: block;
        width: 100%;

        cursor: pointer;

        &:hover {
          background-color: var(--background-secondary);
        }

        .album {
          position: relative;
          left: 0;
          height: 3rem;
          width: 3rem;
          display: inline-block;

          vertical-align: middle;

          img {
            height: 100%;
            width: 100%;
            object-fit: contain;
          }
        }

        .track-container {
          display: inline-block;
          vertical-align: middle;
          position: relative;
          width: calc(100% - 3.25rem);
          margin-left: 0.25rem;

          .track {
            position: relative;
            width: 100%;

            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;

            display: grid;
            grid-template-columns: auto;
            grid-template-rows: auto auto;
            grid-template-areas: "name" "artist";
            row-gap: 0.5rem;

            align-items: center;

            .name,
            .artist {
              white-space: nowrap;
              text-overflow: ellipsis;
              overflow: hidden;
            }

            .name {
              grid-area: name;
              font-size: 1.1rem;
              line-height: 1em;
            }
            .artist {
              grid-area: artist;
              font-size: 0.95rem;
              line-height: 1em;
            }
          }
        }
      }
    }
  }
}
</style>
