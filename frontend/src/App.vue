<template>
  <div id="app">
    <ConnectionStatus />
    <AuthenticationStatus />
    <Search />
  </div>
</template>

<script>
import ConnectionStatus from "./components/ConnectionStatus";
import AuthenticationStatus from "./components/AuthenticationStatus";
import Search from "./components/Search";

export default {
  name: "app",
  components: {
    ConnectionStatus,
    AuthenticationStatus,
    Search,
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
