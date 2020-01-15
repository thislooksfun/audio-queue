<template>
  <div v-show="needsAttention" class="center authentication-status">
    <span>One or more connections need attention:</span>
    <span v-for="service in affected" :key="service">
      &nbsp;<a :href="`/${service}/auth`">{{ service }}</a>
    </span>
  </div>
</template>

<script>
export default {
  sockets: {
    authentications(auths) {
      this.auths = auths;
    },
  },
  data: () => ({ auths: {} }),
  computed: {
    needsAttention() {
      return Object.values(this.auths).reduce((a, b) => a || !b, false);
    },
    affected() {
      return Object.keys(this.auths).filter(k => !this.auths[k]);
    },
  },
};
</script>

<style lang="less" scoped>
.authentication-status {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 4rem;
  line-height: 4rem;
  font-size: 1.5rem;

  transition: top 1s ease-in-out, background-color 0.25s ease-in-out;

  background-color: #f5365c;
  color: #fff;

  z-index: 99;

  &.connected {
    background-color: #2dce89;
  }
  &.hidden {
    top: -5rem;
  }
}
</style>
