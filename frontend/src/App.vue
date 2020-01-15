<template>
  <div id="app">
    <ConnectionStatus />
    <AuthenticationStatus />
  </div>
</template>

<script>
import ConnectionStatus from "./components/ConnectionStatus";
import AuthenticationStatus from "./components/AuthenticationStatus";

export default {
  name: "app",
  components: {
    ConnectionStatus,
    AuthenticationStatus,
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
