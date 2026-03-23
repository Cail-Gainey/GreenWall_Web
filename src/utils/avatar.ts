import userAvatarFallback from '../assets/user.png'

const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8888/api'
const safeApiBase = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase

const apiOrigin = (() => {
  try {
    return new URL(safeApiBase, window.location.origin).origin
  } catch {
    return window.location.origin
  }
})()

const qiniuHost = 'oss.whisperlink.icu'

export function resolveAvatar(avatar?: string | null) {
  const src = avatar?.trim()
  if (!src) return userAvatarFallback

  if (src.startsWith('//')) {
    return `${window.location.protocol}${src}`
  }

  if (src.startsWith('http://') || src.startsWith('https://')) {
    try {
      const url = new URL(src)
      if (url.hostname === qiniuHost) {
        url.protocol = 'https:'
        return `${safeApiBase}/proxy/avatar?url=${encodeURIComponent(url.toString())}`
      }
      return url.toString()
    } catch {
      return src
    }
  }

  if (src.startsWith('/')) {
    return src
  }

  if (src.startsWith('avatars/')) {
    const url = `https://oss.whisperlink.icu/${src}`
    return `${safeApiBase}/proxy/avatar?url=${encodeURIComponent(url)}`
  }

  return `${apiOrigin}/${src.replace(/^\.?\//, '')}`
}

export { userAvatarFallback }
