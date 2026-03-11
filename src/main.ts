/**
 * @file 应用入口：创建并挂载 Vue 实例。
 */
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

/**
 * @description 初始化应用并注册路由。
 */
const app = createApp(App)
app.use(router)
app.mount('#app')
