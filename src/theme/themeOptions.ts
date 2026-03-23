import { h } from 'vue'
import type { DropdownOption } from 'naive-ui'
import { getPalette } from './palette'
import type { Theme } from '../composables/useTheme'

export const themeLabelMap: Record<Theme, string> = {
  light: '浅色',
  dark: '暗色',
  purple: '紫色',
  pink: '粉色',
  ocean: '海蓝',
  amber: '琥珀',
  slate: '石板',
  monet: '莫奈',
  auto: '系统',
}

const themeOrder: Theme[] = ['light', 'dark', 'purple', 'pink', 'ocean', 'amber', 'slate', 'monet', 'auto']

const previewStyleMap: Record<Theme, string> = {
  light: `background: linear-gradient(135deg, ${getPalette('light').primary} 0%, ${getPalette('light').bg} 100%);`,
  dark: `background: linear-gradient(135deg, ${getPalette('dark').primary} 0%, ${getPalette('dark').bg} 100%);`,
  purple: `background: linear-gradient(135deg, ${getPalette('purple').primary} 0%, ${getPalette('purple').bg} 100%);`,
  pink: `background: linear-gradient(135deg, ${getPalette('pink').primary} 0%, ${getPalette('pink').bg} 100%);`,
  ocean: `background: linear-gradient(135deg, ${getPalette('ocean').primary} 0%, ${getPalette('ocean').bg} 100%);`,
  amber: `background: linear-gradient(135deg, ${getPalette('amber').primary} 0%, ${getPalette('amber').bg} 100%);`,
  slate: `background: linear-gradient(135deg, ${getPalette('slate').primary} 0%, ${getPalette('slate').bg} 100%);`,
  monet: `background: linear-gradient(135deg, ${getPalette('monet').primary} 0%, ${getPalette('monet').bg} 100%);`,
  auto: 'background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 48%, #1f2937 52%, #111827 100%);',
}

export const getThemeLabel = (theme?: string) => themeLabelMap[(theme as Theme) || 'auto'] || String(theme || '系统')

export const createThemeDropdownOptions = (): DropdownOption[] => themeOrder.map((key) => ({
  key,
  label: () => h('div', { class: 'theme-option-label' }, [
    h('span', {
      class: 'theme-option-swatch',
      style: `${previewStyleMap[key]} width: 12px; height: 12px; border-radius: 3px; display: inline-block; margin-right: 8px; border: 1px solid rgba(0, 0, 0, 0.08); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.2); flex-shrink: 0;`,
    }),
    h('span', themeLabelMap[key]),
  ]),
}))

export const getThemeSwatchStyle = (theme: Theme | string) => `${previewStyleMap[theme as Theme] || previewStyleMap.auto} width: 12px; height: 12px; border-radius: 3px; display: inline-block; border: 1px solid rgba(0, 0, 0, 0.08); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.2); flex-shrink: 0;`
