<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png" />
    <HelloWorld msg="Welcome to Your Vue.js App" />
    <ConnectionStatus />
    <AuthenticationStatus />
  </div>
</template>

<script>
import HelloWorld from "./components/HelloWorld.vue";
import ConnectionStatus from "./components/ConnectionStatus";
import AuthenticationStatus from "./components/AuthenticationStatus";

export default {
  name: "app",
  components: {
    HelloWorld,
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
