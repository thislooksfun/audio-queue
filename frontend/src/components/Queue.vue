<template>
  <div class="queue">
    <span v-if="queue.length == 0">Nothing in queue</span>
    <ol>
      <li
        v-for="(track, i) in queue"
        :key="track.source + track.artist + track.name"
      >
        <button @click="shift(i, i - 1)" :disabled="i == 0">
          <span class="fas fa-sort-up"></span>
        </button>
        <button @click="shift(i, i + 1)" :disabled="i == queue.length - 1">
          <span class="fas fa-sort-down"></span>
        </button>

        <button @click="remove(i)">
          <span class="fas fa-trash-alt"></span>
        </button>

        {{ i + 1 }}, {{ track.name }} by {{ track.artist }} via
        {{ track.source }}
      </li>
    </ol>
  </div>
</template>

<script>
export default {
  sockets: {
    queue(q) {
      this.queue = q;
    },
  },
  data: () => ({ queue: [] }),
  methods: {
    shift(from, to) {
      this.$socket.emit("queue.shift", from, to);
    },
    remove(at) {
      this.$socket.emit("queue.remove", at);
    },
  },
};
</script>

<style></style>
