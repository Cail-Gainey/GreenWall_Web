/**
 * @file 时间格式化工具类。
 */

export type DateInput = string | number | Date | null | undefined

export class TimeFormatter {
  /**
   * @description 解析时间输入为 Date。
   */
  static parse(input: DateInput): Date | null {
    if (!input) return null
    if (input instanceof Date) {
      return Number.isNaN(input.getTime()) ? null : input
    }
    if (typeof input === 'number') {
      const date = new Date(input)
      return Number.isNaN(date.getTime()) ? null : date
    }
    const normalized = TimeFormatter.normalize(input)
    const date = new Date(normalized)
    return Number.isNaN(date.getTime()) ? null : date
  }

  /**
   * @description 格式化为 YYYY-MM-DD HH:mm:ss。
   */
  static formatDateTime(input: DateInput, fallback = '-'): string {
    const date = TimeFormatter.parse(input)
    if (!date) return fallback
    return [
      TimeFormatter.formatDate(date),
      TimeFormatter.formatTime(date),
    ].join(' ')
  }

  /**
   * @description 格式化为 YYYY-MM-DD。
   */
  static formatDate(input: DateInput, fallback = '-'): string {
    const date = TimeFormatter.parse(input)
    if (!date) return fallback
    const y = date.getFullYear()
    const m = TimeFormatter.pad(date.getMonth() + 1)
    const d = TimeFormatter.pad(date.getDate())
    return `${y}-${m}-${d}`
  }

  /**
   * @description 格式化为 HH:mm:ss。
   */
  static formatTime(input: DateInput, fallback = '-'): string {
    const date = TimeFormatter.parse(input)
    if (!date) return fallback
    const hh = TimeFormatter.pad(date.getHours())
    const mm = TimeFormatter.pad(date.getMinutes())
    const ss = TimeFormatter.pad(date.getSeconds())
    return `${hh}:${mm}:${ss}`
  }

  private static pad(value: number) {
    return String(value).padStart(2, '0')
  }

  private static normalize(value: string) {
    return value.replace(/\.\d{3}\d+/, (match) => match.slice(0, 4))
  }
}

export const formatDateTime = TimeFormatter.formatDateTime
