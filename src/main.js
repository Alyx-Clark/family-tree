import { createApp } from 'vue';
import App from './app.vue'

const app = createApp(App);

// If you have global components or plugins, register them here
// app.component('global-component', GlobalComponent);
// app.use(SomePlugin);

app.mount('#app');
