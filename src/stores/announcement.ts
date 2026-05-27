/**
 * @file 公告 Pinia store：拉取激活公告 + 持久化关闭状态（今日关闭/永久关闭）+ 热加载。
 */
import { defineStore } from 'pinia'
import { getActiveAnnouncements } from '../api/announcement'
import type { ActiveAnnouncementDto } from '../api/types'

const STORAGE_KEY = 'gw.announcement.state.v1'
const HOT_RELOAD_INTERVAL_MS = 5 * 60 * 1000

interface PersistedState {
  closedToday: Record<string, string>
  closedPermanent: string[]
  /** 上次成功拉取的时间戳，用于在 store 重建后判断是否需要刷新 */
  lastFetchedAt?: number
  /** 上次拉取的公告数据，作为离线回退使用 */
  cachedList?: ActiveAnnouncementDto[]
}

interface AnnouncementState {
  list: ActiveAnnouncementDto[]
  loaded: boolean
  loading: boolean
  closedToday: Record<string, string>
  closedPermanent: Set<string>
  lastFetchedAt: number
  hotReloadTimer: ReturnType<typeof setInterval> | null
}

/**
 * @description 当前本地日期（YYYY-MM-DD）。
 */
function todayKey(): string {
  const d = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * @description 从 localStorage 读取持久化状态。读取失败一律返回空状态，避免阻塞流程。
 */
function loadPersisted(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { closedToday: {}, closedPermanent: [] }
    const parsed = JSON.parse(raw) as Partial<PersistedState>
    return {
      closedToday: parsed.closedToday ?? {},
      closedPermanent: Array.isArray(parsed.closedPermanent) ? parsed.closedPermanent : [],
      lastFetchedAt: parsed.lastFetchedAt,
      cachedList: Array.isArray(parsed.cachedList) ? parsed.cachedList : undefined,
    }
  } catch {
    return { closedToday: {}, closedPermanent: [] }
  }
}

/**
 * @description 仅持久化关闭状态与离线缓存，不持久化 loading / timer 等运行时字段。
 */
function persist(state: AnnouncementState) {
  try {
    const payload: PersistedState = {
      closedToday: state.closedToday,
      closedPermanent: Array.from(state.closedPermanent),
      lastFetchedAt: state.lastFetchedAt || undefined,
      cachedList: state.list,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // 容忍 localStorage 异常（隐私模式 / 写入配额）
  }
}

export const useAnnouncementStore = defineStore('announcement', {
  state: (): AnnouncementState => {
    const persisted = loadPersisted()
    const today = todayKey()
    // 启动即清理非今日的「今日关闭」标记，避免膨胀
    const closedToday: Record<string, string> = {}
    for (const [id, date] of Object.entries(persisted.closedToday)) {
      if (date === today) closedToday[id] = date
    }
    return {
      list: persisted.cachedList ?? [],
      loaded: false,
      loading: false,
      closedToday,
      closedPermanent: new Set(persisted.closedPermanent),
      lastFetchedAt: persisted.lastFetchedAt ?? 0,
      hotReloadTimer: null,
    }
  },
  getters: {
    /**
     * @description 时间线展示的公告（仅过滤掉用户显式「关闭」永久屏蔽的项）。
     */
    displayList(state): ActiveAnnouncementDto[] {
      return state.list.filter((item) => !state.closedPermanent.has(String(item.id)))
    },
    /**
     * @description 仍未读的公告：未永久关闭且未在今天被标记为「今日已读」。
     */
    unreadList(state): ActiveAnnouncementDto[] {
      const today = todayKey()
      return state.list.filter((item) => {
        const id = String(item.id)
        if (state.closedPermanent.has(id)) return false
        if (state.closedToday[id] === today) return false
        return true
      })
    },
    /**
     * @description 顶栏徽标读取的未读数。
     */
    unreadCount(): number {
      return (this as unknown as { unreadList: ActiveAnnouncementDto[] }).unreadList.length
    },
    /**
     * @description 是否存在被用户屏蔽掉的条目（永久或今日），用于在弹窗里显示「重置已读」按钮。
     */
    hasHiddenItems(state): boolean {
      const today = todayKey()
      return state.list.some((item) => {
        const id = String(item.id)
        return state.closedPermanent.has(id) || state.closedToday[id] === today
      })
    },
  },
  actions: {
    /**
     * @description 拉取激活公告（默认带 60s 服务端缓存）。force 时绕过缓存强制刷新。
     */
    async load(force = false): Promise<ActiveAnnouncementDto[]> {
      if (this.loading) return this.list
      this.loading = true
      try {
        const res = await getActiveAnnouncements(force)
        const items = res.data.data ?? []
        // 服务端权威覆盖；id 已不存在的公告需要从关闭列表中移除，避免无效项堆积
        this.list = items
        this.loaded = true
        this.lastFetchedAt = Date.now()
        this.pruneClosedAgainst(items)
        persist(this.$state)
        return items
      } catch (err) {
        // 失败时保留旧数据（离线回退）
        if (!this.loaded && this.list.length > 0) this.loaded = true
        throw err
      } finally {
        this.loading = false
      }
    },
    /**
     * @description 与服务端列表对齐，清理无效的关闭记录。
     */
    pruneClosedAgainst(items: ActiveAnnouncementDto[]) {
      const liveIds = new Set(items.map((i) => String(i.id)))
      for (const id of Object.keys(this.closedToday)) {
        if (!liveIds.has(id)) delete this.closedToday[id]
      }
      for (const id of Array.from(this.closedPermanent)) {
        if (!liveIds.has(id)) this.closedPermanent.delete(id)
      }
    },
    /**
     * @description 标记某条公告「今日已读」。
     */
    markReadToday(id: string | number) {
      this.closedToday[String(id)] = todayKey()
      persist(this.$state)
    },
    /**
     * @description 关闭弹窗时调用：把仍未读的公告整体标为「今日已读」，今天不再自弹。
     */
    markAllUnreadAsReadToday() {
      const today = todayKey()
      let changed = false
      for (const item of this.list) {
        const id = String(item.id)
        if (this.closedPermanent.has(id)) continue
        if (this.closedToday[id] === today) continue
        this.closedToday[id] = today
        changed = true
      }
      if (changed) persist(this.$state)
    },
    /**
     * @description 标记某条公告「永久关闭」（在当前设备）。
     */
    closePermanently(id: string | number) {
      this.closedPermanent.add(String(id))
      persist(this.$state)
    },
    /**
     * @description 重置所有已读状态，恢复显示。
     */
    reopenAll() {
      this.closedToday = {}
      this.closedPermanent.clear()
      persist(this.$state)
    },
    /**
     * @description 启动热加载定时器：定期刷新激活公告，确保新公告及时显示。
     */
    startHotReload() {
      if (this.hotReloadTimer) return
      this.hotReloadTimer = setInterval(() => {
        void this.load(true).catch(() => {})
      }, HOT_RELOAD_INTERVAL_MS)
    },
    stopHotReload() {
      if (this.hotReloadTimer) {
        clearInterval(this.hotReloadTimer)
        this.hotReloadTimer = null
      }
    },
    reset() {
      this.stopHotReload()
      this.list = []
      this.loaded = false
      this.loading = false
      this.closedToday = {}
      this.closedPermanent.clear()
      this.lastFetchedAt = 0
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        // ignore
      }
    },
  },
})
