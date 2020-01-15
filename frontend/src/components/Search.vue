<template>
  <div class="search-bar" @click="focus" v-click-outside="unfocus">
    <div class="logo">
      <img
        class="braid-logo"
        svg-inline
        src="../../../icon/braid.svg"
        alt="Braid Logo"
      />
      <h2 class="braid-name">Braid</h2>
    </div>

    <div class="center">
      <div class="search-box">
        <form @submit.prevent>
          <input
            v-model="query"
            type="text"
            class="search"
            placeholder="Search"
            @focus="focus"
            @blur="unfocus"
          />
          <span class="search-icon fas fa-search"></span>
        </form>
      </div>
    </div>

    <search-results v-show="focused" :results="results" />
  </div>
</template>

<script>
import SearchResults from "./SearchResults";

export default {
  components: {
    SearchResults,
  },
  data: () => ({
    query: "",
    results: [],
    focused: false,
    searchIndex: 0,
    lastSearchIndex: 0,
  }),
  methods: {
    search() {
      if (this.query == "") {
        // eslint-disable-next-line no-console
        console.log(`Clearing search`);
        this.results = [];
      } else {
        // eslint-disable-next-line no-console
        console.log(`Searching for ${this.query}`);
        const i = this.searchIndex++;
        this.$socket.emit("search", this.query, i, this.searchResults);
      }
    },
    searchResults(r, i) {
      if (i < this.lastSearchIndex) return;
      // eslint-disable-next-line no-console
      console.log(`Got search results:`, r);
      this.results = [
        ...r,
        {
          service: { name: "other", displayName: "Other" },
          tracks: [{ name: "foo", artist: "bar" }],
        },
      ];
      // this.results = r;
      this.lastSearchIndex = i;
    },
    focus() {
      this.focused = true;
    },
    unfocus() {
      this.focused = false;
    },
  },
  watch: {
    query() {
      this.search();
    },
  },
};
</script>

<style lang="less" scoped>
.search-bar {
  position: fixed;
  width: 100vw;
  top: 0;
  left: 0;
  background-color: #712f79;
  color: #fff;

  .logo {
    position: absolute;
    left: 1.5rem;
    top: 0;

    height: 4rem;

    .braid-logo {
      height: 4rem;
      width: 4rem;

      padding: 0.25rem;

      .braid-square,
      .braid-loop {
        stroke: #fff;
      }
    }

    .braid-name {
      display: inline-block;
      position: absolute;
      top: 0;
      line-height: 4.25rem;
      margin: 0;
    }
  }

  .search-box {
    display: inline-block;
    position: relative;
    height: 4rem;
    line-height: 4rem;

    input[type="text"] {
      border: 0;
      border-bottom: 1px solid #ccc;
      border-radius: 0;
      background-color: #0000;
      color: #fff;
      font-size: 1.5rem;

      width: 30vw;

      padding: 0.25em 1.5em 0.25em 0.25em;

      &::placeholder {
        color: #ccc;
      }

      &:focus {
        outline: none;
        border-bottom-color: #fff;
      }
    }

    .search-icon {
      position: absolute;
      font-size: 1.25rem;
      right: 0.75rem;
      line-height: 4rem;
    }
  }
}
</style>
