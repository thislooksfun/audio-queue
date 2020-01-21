<template>
  <div
    :class="{
      center: true,
      'connection-status': true,
      connecting: connecting,
      connected: connected,
      hidden: hide,
    }"
  >
    <span v-if="connecting">Connecting...</span>
    <span v-else-if="connected">Connected!</span>
    <span v-else>Disconnected</span>

    <div class="overlay"></div>
  </div>
</template>

<script>
export default {
  sockets: {
    connect() {
      this.connected = true;
      this.connecting = false;
      this.hideto = setTimeout(() => (this.hide = true), 1 * 1000);
    },
    disconnect() {
      this.connected = false;
      this.connecting = false;
      this.hide = false;
      clearTimeout(this.hideto);
    },
  },
  data: () => ({
    connecting: true,
    connected: false,
    hide: false,
    hideto: null,
  }),
};
</script>

<style lang="less" scoped>
.connection-status {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 4rem;
  line-height: 4rem;
  font-size: 1.5rem;

  transition: top 0.5s ease-in-out, background-color 0.25s ease-in-out;

  background-color: darken(#f5365c, 10%);
  color: #fff;

  z-index: 999;

  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: -1;
    background-color: #0006;
    backdrop-filter: blur(2px);

    transition-property: backdrop-filter, background-color;
    transition-duration: 0.5s;
    transition-timing-function: ease-in-out;
  }

  &.connecting {
    background-color: lighten(#fb6340, 15%);
  }

  &.connected {
    background-color: darken(#2dce89, 10%);

    .overlay {
      backdrop-filter: blur(0px);
      background-color: #0000;
      pointer-events: none;
    }
  }
  &.hidden {
    top: -5rem;

    .overlay {
      display: none;
    }
  }
}
</style>
