<template>
  <div class="search-bar" @focusin="focus" v-click-outside="unfocus">
    <div class="logo">
      <img
        class="braid-logo"
        svg-inline
        src="../../../icon/braid.svg"
        alt="Braid Logo"
      />
      <h2 class="braid-name">Braid</h2>
    </div>

    <div class="search-container">
      <div class="search-box">
        <form @submit.prevent>
          <input
            v-model="query"
            type="text"
            class="search"
            placeholder="Search"
          />
          <span class="search-icon fas fa-search"></span>
        </form>

        <search-results
          v-show="focused && results.length > 0"
          :results="results"
        />
      </div>
    </div>
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
        this.results = [];
      } else {
        const i = this.searchIndex++;
        this.$socket.emit("search", this.query, i, this.searchResults);
      }
    },
    searchResults(r, i) {
      if (i < this.lastSearchIndex) return;

      this.results = r;
      this.lastSearchIndex = i;
    },
    onkey(e) {
      if (e.keyCode == 27) {
        this.unfocus();
      }
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
      this.focus();
      this.search();
    },
  },
  created() {
    window.addEventListener("keydown", this.onkey);
  },
  beforeDestroy() {
    window.removeEventListener("keydown", this.onkey);
  },
};
</script>

<style lang="less" scoped>
.search-bar {
  position: fixed;
  width: 100vw;
  top: 0;
  left: 0;
  background-color: var(--background-tertiary);
  color: var(--text-primary);

  z-index: 99;

  .logo {
    position: absolute;
    left: 0;
    top: 0;

    height: 4rem;

    .braid-logo {
      height: 4rem;
      width: 4rem;

      padding: 0.25rem;

      .braid-square,
      .braid-loop {
        stroke: var(--theme-color);
      }
    }

    .braid-name {
      display: inline-block;
      position: absolute;
      top: 0;
      line-height: 4.25rem;
      margin: 0;
      color: var(--theme-color);

      @media (max-width: 20rem) {
        & {
          display: none;
        }
      }
    }
  }

  .search-container {
    @offset: 8.5rem;
    @max-width: 35rem;

    position: relative;
    left: @offset;
    width: calc(100% - (@offset * 2));
    padding: 0 1rem 0 0;
    text-align: center;

    @media (max-width: (@max-width + @offset*2 + 2rem)) {
      & {
        width: calc(100% - @offset);
        text-align: left;
      }
    }

    @media (max-width: 20rem) {
      & {
        left: 4rem;
        width: calc(100% - 4rem);
        text-align: left;
      }
    }

    .search-box {
      display: inline-block;
      position: relative;
      height: 4rem;
      line-height: 4rem;

      width: 100%;
      max-width: @max-width;

      input[type="text"] {
        border: 0;
        border-bottom: 1px solid var(--text-secondary);
        border-radius: 0;
        background: none;
        color: var(--text-primary);
        font-size: 1.5rem;
        width: 100%;

        padding: 0.25em 1.5em 0.25em 0.25em;

        &::placeholder {
          color: var(--text-secondary);
        }

        &:focus {
          outline: none;
          border-bottom-color: var(--theme-color);
        }
      }

      .search-icon {
        position: absolute;
        font-size: 1.25rem;
        right: 0.75rem;
        line-height: 4rem;
        color: var(--text-secondary);
      }
    }
  }
}
</style>
