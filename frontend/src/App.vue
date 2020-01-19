<template>
  <div id="app">
    <ConnectionStatus />
    <AuthenticationStatus />
    <Search />

    <a @click="toggleHistory" href="#"
      >Show {{ showHistory ? "queue" : "history" }}</a
    >
    <History v-show="showHistory" />
    <Queue v-show="!showHistory" />

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

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 60px;
}

.center {
  text-align: center;
}

* {
  box-sizing: border-box;
}
</style>
