import type { PatternCellDto } from '../api/types'

export const buildGridFromCells = (cells: PatternCellDto[], cols: number, rows: number) => {
  const grid = Array.from({ length: cols }, () => Array(rows).fill(0))
  cells.forEach((cell) => {
    if (grid[cell.col] && grid[cell.col][cell.row] !== undefined) {
      grid[cell.col][cell.row] = cell.level
    }
  })
  return grid
}

export const buildCellsFromGrid = (grid: number[][]) => {
  const cells: PatternCellDto[] = []
  grid.forEach((col, cIndex) => {
    col.forEach((level, rIndex) => {
      if (level > 0) {
        cells.push({ col: cIndex, row: rIndex, level })
      }
    })
  })
  return cells
}
