/**
 * @file 贡献图年份计算工具。
 */

export interface YearMeta {
  daysInYear: number
  startDayOfWeek: number
}

export function getYearMeta(year: number): YearMeta {
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
  const daysInYear = isLeap ? 366 : 365
  const startDate = new Date(year, 0, 1)
  const startDayOfWeek = startDate.getDay()
  return { daysInYear, startDayOfWeek }
}

export function calcTotalCols(year: number): number {
  const { daysInYear, startDayOfWeek } = getYearMeta(year)
  return Math.ceil((daysInYear + startDayOfWeek) / 7)
}

export function getDateByCellIndex(year: number, index: number, startDayOfWeek: number): Date | null {
  if (index < startDayOfWeek) return null
  const date = new Date(year, 0, 1)
  date.setDate(date.getDate() + (index - startDayOfWeek))
  return date
}

export function isFutureCell(year: number, index: number, startDayOfWeek: number): boolean {
  const date = getDateByCellIndex(year, index, startDayOfWeek)
  if (!date) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date > today
}
