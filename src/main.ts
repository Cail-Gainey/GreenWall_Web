/**
 * @file 应用入口：创建并挂载 Vue 实例。
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
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
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.use(router)
setupPermissionDirective(app)
app.mount('#app')

const preventContextMenu = (event: MouseEvent) => {
  event.preventDefault()
}

window.addEventListener('contextmenu', preventContextMenu, { capture: true })
document.addEventListener('contextmenu', preventContextMenu, { capture: true })
