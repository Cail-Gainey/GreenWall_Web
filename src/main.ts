/**
 * @file 应用入口：创建并挂载 Vue 实例。
 */
import { createApp } from 'vue'
import 'vfonts/Lato.css'
import 'vfonts/FiraCode.css'
import './style.css'
import App from './App.vue'
import router from './router'
import { setupPermissionDirective } from './directives/permission'

/**
 * @description 初始化应用并注册路由和指令。
 */
const app = createApp(App)
app.use(router)
setupPermissionDirective(app)
app.mount('#app')
