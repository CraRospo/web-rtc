import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import CustomButton from './components/CustomButton.vue'

createApp(App)
  .component('CustomButton', CustomButton)
  .use(createPinia())
  .mount('#app')
