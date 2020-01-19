import Vue from "vue";
import App from "./App.vue";
import VueSocketIO from "vue-socket.io";
import vClickOutside from "v-click-outside";

Vue.config.productionTip = false;

const socket = io(); // eslint-disable-line no-undef
Vue.use(vClickOutside);
Vue.use(new VueSocketIO({ connection: socket }));

new Vue({
  render: h => h(App),
}).$mount("#app");
