declare module 'vue-cropper/lib/vue-cropper.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, any>
  export default component
}

declare module 'vue-cropper' {
  import type { DefineComponent } from 'vue'
  const VueCropper: DefineComponent<Record<string, unknown>, Record<string, unknown>, any>
  export { VueCropper }
  export default VueCropper
}
