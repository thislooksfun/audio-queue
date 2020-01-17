import Vue from "vue";
import App from "./App.vue";
import VueSocketIO from "vue-socket.io";
import vClickOutside from "v-click-outside";

Vue.config.productionTip = false;

Vue.use(vClickOutside);
Vue.use(
  new VueSocketIO({
    debug: true,
    darkMode: true,
    connection: io(), // eslint-disable-line no-undef
  })
);

new Vue({
  render: h => h(App),
}).$mount("#app");
