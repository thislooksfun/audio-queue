<template>
  <div class="history">
    <span v-if="history.length == 0">Nothing in history</span>
    <ol>
      <li
        v-for="track in history"
        :key="track.source + track.artist + track.name"
      >
        {{ track.name }} by {{ track.artist }} via {{ track.source }}
      </li>
    </ol>
  </div>
</template>

<script>
export default {
  sockets: {
    history(h) {
      this.history = h.reverse();
    },
  },
  data: () => ({ history: [] }),
};
</script>

<style></style>
