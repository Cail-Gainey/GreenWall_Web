export type PatternVisibility = 'public' | 'followers' | 'private'

export const visibilityLabel = (visibility?: PatternVisibility | string) => {
  if (visibility === 'followers') return '仅关注者'
  if (visibility === 'private') return '私密'
  return '公开'
}

export const visibilityTagType = (visibility?: PatternVisibility | string) => {
  if (visibility === 'followers') return 'warning'
  if (visibility === 'private') return 'error'
  return 'success'
}
