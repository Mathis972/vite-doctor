import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import router from './router';
import VCalendar from 'v-calendar';
import 'v-calendar/dist/style.css';

createApp(App).use(router).use(VCalendar, {}).mount('#app');
