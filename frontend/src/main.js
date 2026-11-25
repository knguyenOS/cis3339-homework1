import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router';
import { onServiceUnavailable } from './services/api';
import { useSystemStore } from './stores/system';
import './assets/main.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// When any request reports 503, show the "database unavailable" banner.
const system = useSystemStore(pinia);
onServiceUnavailable(() => system.markUnavailable());

app.mount('#app');
