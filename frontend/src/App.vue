<template>
  <div id="app">
    <ConnectionStatus />
    <AuthenticationStatus />
    <Search />

    <div class="queue-hist-container">
      <div class="queue-hist">
        <div class="queue-hist-switch">
          <a
            :class="{ 'queue-select': true, selected: !showHistory }"
            @click="showHistory = false"
            href="#"
            >Queue</a
          >
          <a
            :class="{ 'hist-select': true, selected: showHistory }"
            @click="showHistory = true"
            href="#"
            >History</a
          >
        </div>

        <History v-show="showHistory" />
        <Queue v-show="!showHistory" />
      </div>
    </div>

    <NowPlaying />
  </div>
</template>

<script>
import ConnectionStatus from "./components/ConnectionStatus";
import AuthenticationStatus from "./components/AuthenticationStatus";
import Search from "./components/Search";
import Queue from "./components/Queue";
import History from "./components/History";
import NowPlaying from "./components/NowPlaying";

export default {
  name: "app",
  components: {
    ConnectionStatus,
    AuthenticationStatus,
    Search,
    Queue,
    History,
    NowPlaying,
  },
  data: () => ({ showHistory: false }),
  methods: {
    toggleHistory() {
      this.showHistory = !this.showHistory;
    },
  },
};
</script>

<style lang="less">
body {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  margin: 0;

  background-color: var(--background-secondary);
}

#app {
  position: relative;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--text-primary);
}

.center {
  text-align: center;
}

* {
  box-sizing: border-box;
}

button {
  background: none;
  border: none;
  border-radius: 0;

  font-size: 1rem;

  cursor: pointer;

  color: var(--text-primary);

  &:disabled {
    cursor: not-allowed;
    color: var(--text-secondary);
  }

  &:not(:disabled) {
    &:active,
    &:hover {
      color: var(--theme-color);
    }
  }
}
</style>

<style lang="less" scoped>
.queue-hist-container {
  position: relative;
  height: 100%;
  width: 50vw;
  margin: 0 auto;
  padding: 4rem 0;

  .queue-hist {
    position: relative;
    height: 100%;
    overflow-y: scroll;

    padding: 0.5rem;

    background-color: var(--background-primary);

    .queue-hist-switch {
      width: 100%;
      text-align: center;

      margin-bottom: 0.5rem;

      a {
        text-decoration: none;
        margin: 0 1rem;
        color: var(--text-secondary);

        font-size: 1.25rem;

        &:hover {
          color: var(--text-primary);
        }

        &.selected {
          color: var(--text-primary);
          border-bottom: 1px solid var(--theme-color);
        }
      }
    }
  }
}
</style>
