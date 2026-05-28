/**
 * @file Markdown 渲染工具：markdown-it 解析 + DOMPurify 消毒，避免公告/富文本场景的 XSS。
 */
import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
  typographer: false,
})

// 让所有外链在新标签打开，并加 noopener/noreferrer
const defaultLinkRender =
  md.renderer.rules.link_open ||
  ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  const hrefIndex = token.attrIndex('href')
  const href = hrefIndex >= 0 ? token.attrs![hrefIndex][1] : ''
  if (href && /^https?:\/\//i.test(href)) {
    token.attrSet('target', '_blank')
    token.attrSet('rel', 'noopener noreferrer')
  }
  return defaultLinkRender(tokens, idx, options, env, self)
}

/**
 * @description 把 Markdown 文本渲染为可直接 v-html 的安全 HTML。
 * 空输入返回空字符串，便于调用方 v-if/三元短路。
 */
export function renderMarkdown(input?: string | null): string {
  if (!input) return ''
  const rawHtml = md.render(input)
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class'],
  })
}
