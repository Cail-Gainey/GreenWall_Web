<script setup lang="ts">
/**
 * @file 隐私条款页面：说明数据收集与使用方式。
 */
import { NCard, NDivider, NTag } from 'naive-ui'

const effectiveDate = '2026-03-19'
const lastUpdated = '2026-03-19'
</script>

<template>
  <div class="privacy-page">
    <section class="hero">
      <div class="hero-text">
        <div class="eyebrow">隐私条款</div>
        <h1>我们如何保护你的数据与权益</h1>
        <p>
          本条款说明 GreenWall 在提供服务时对个人信息的收集、使用、共享与保护方式。我们坚持最小必要原则，
          仅在实现功能与合规需要时处理信息。
        </p>
        <div class="meta">
          <n-tag size="small" type="success">生效日期 {{ effectiveDate }}</n-tag>
          <n-tag size="small">最近更新 {{ lastUpdated }}</n-tag>
        </div>
      </div>
      <n-card class="hero-card" size="small">
        <div class="card-title">核心要点</div>
        <ul>
          <li>不出售或出租你的个人信息。</li>
          <li>仅在提供服务与合规需要时处理数据。</li>
          <li>支持访问、更正、删除与撤回授权。</li>
          <li>隐私设置与通知偏好可随时调整。</li>
        </ul>
      </n-card>
    </section>

    <section class="content-grid">
      <n-card class="section-card">
        <h2>1. 适用范围与定义</h2>
        <p>
          本条款适用于 GreenWall 的网页端与桌面端服务，涵盖账号注册、内容创作、社区互动与运维支持等场景。
          “个人信息”指以电子或其他方式记录的、与已识别或可识别自然人有关的信息。
        </p>
      </n-card>

      <n-card class="section-card">
        <h2>2. 收集的信息</h2>
        <ul>
          <li>账户信息：账号、昵称、头像、登录方式与邮箱。</li>
          <li>内容与社区：你创建/编辑的内容、评论、点赞或反馈。</li>
          <li>使用与偏好：主题、语言、通知设置与功能使用记录。</li>
          <li>设备与日志：设备信息、浏览器类型、IP、操作与错误日志。</li>
          <li>第三方信息：如 GitHub 授权登录时的公开资料。</li>
          <li>敏感信息：原则上不主动收集，确有需要会单独告知并征得同意。</li>
        </ul>
      </n-card>

      <n-card class="section-card">
        <h2>3. 使用方式</h2>
        <ul>
          <li>提供、维护与改进核心功能与社区体验。</li>
          <li>完成登录验证、权限校验与安全风控。</li>
          <li>通知服务更新、功能变更与必要的运营消息。</li>
          <li>进行统计分析、性能优化与问题排查。</li>
        </ul>
      </n-card>

      <n-card class="section-card">
        <h2>4. 共享、委托处理与披露</h2>
        <ul>
          <li>仅在提供服务所必需时与可信第三方共享或委托处理。</li>
          <li>例如 OAuth 登录、云存储、邮件发送或日志分析服务。</li>
          <li>我们不会向任何第三方出售或出租你的个人信息。</li>
          <li>依法配合监管或司法要求时进行必要披露。</li>
          <li>发生合并、收购或业务重组时会提前通知并确保安全过渡。</li>
        </ul>
      </n-card>

      <n-card class="section-card">
        <h2>5. 存储、保留与跨境</h2>
        <ul>
          <li>仅在实现目的所需期限内保留数据，超期将删除或匿名化处理。</li>
          <li>账号注销后，相关信息将按法规与业务需要进行删除或去标识化。</li>
          <li>如涉及跨境传输，将依法采取必要的安全保障措施。</li>
        </ul>
      </n-card>

      <n-card class="section-card">
        <h2>6. 安全保护措施</h2>
        <ul>
          <li>采用加密传输、访问控制与最小权限策略保护数据。</li>
          <li>对关键操作进行审计与异常检测，防止未授权访问。</li>
          <li>如发生安全事件，将依法进行通知与补救。</li>
        </ul>
      </n-card>

      <n-card class="section-card">
        <h2>7. 你的权利与管理方式</h2>
        <ul>
          <li>访问与复制：查询你在平台的个人信息。</li>
          <li>更正与补充：修正不准确或不完整的信息。</li>
          <li>删除与撤回：在符合法律要求时删除或撤回授权。</li>
          <li>撤回同意不影响此前基于授权已进行的处理。</li>
          <li>注销账号：可在设置中申请或通过反馈渠道协助处理。</li>
        </ul>
      </n-card>

      <n-card class="section-card">
        <h2>8. Cookie 与本地存储</h2>
        <ul>
          <li>用于维持登录状态、保存主题等偏好设置。</li>
          <li>你可以通过浏览器设置清理或禁止相关存储。</li>
        </ul>
      </n-card>

      <n-card class="section-card">
        <h2>9. 未成年人保护</h2>
        <ul>
          <li>建议未成年人在监护人指导下使用服务。</li>
          <li>如发现未成年人信息被不当收集，请联系删除。</li>
        </ul>
      </n-card>

      <n-card class="section-card">
        <h2>10. 条款更新</h2>
        <ul>
          <li>我们可能适时更新条款，并在页面上公示更新内容。</li>
          <li>若涉及重大变更，将通过站内通知或邮件告知。</li>
        </ul>
      </n-card>
    </section>

    <n-divider />

    <section class="contact">
      <n-card class="section-card">
        <h2>联系我们</h2>
        <p>
          如对本条款或个人信息处理有任何疑问，请通过应用内反馈联系我们。
        </p>
      </n-card>
    </section>
  </div>
</template>

<style scoped>
.privacy-page {
  position: relative;
  padding: 32px 32px 48px;
  display: flex;
  flex-direction: column;
  gap: 28px;
  min-height: 100%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.2), rgba(0, 0, 0, 0))
    var(--color-bg);
  overflow: hidden;
}

.privacy-page::before {
  content: '';
  position: absolute;
  inset: -40% auto auto -20%;
  width: 480px;
  height: 480px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.18), transparent 60%);
  opacity: 0.6;
  pointer-events: none;
}

.privacy-page::after {
  content: '';
  position: absolute;
  inset: auto -25% -35% auto;
  width: 520px;
  height: 520px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.14), transparent 60%);
  opacity: 0.5;
  pointer-events: none;
}

.hero {
  position: relative;
  display: flex;
  gap: 24px;
  align-items: stretch;
  flex-wrap: wrap;
  z-index: 1;
}

.hero-text {
  flex: 1 1 360px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hero-text h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-main);
}

.hero-text p {
  margin: 0;
  color: var(--color-text-muted);
  line-height: 1.7;
}

.eyebrow {
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.hero-card {
  flex: 0 1 280px;
  align-self: flex-start;
  background: var(--color-surface);
}

.card-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--color-text-main);
}

.content-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.section-card h2 {
  margin: 0 0 10px;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-main);
}

.section-card p {
  margin: 0;
  color: var(--color-text-muted);
  line-height: 1.7;
}

.section-card p + ul {
  margin-top: 8px;
}

ul {
  margin: 0;
  padding-left: 18px;
  color: var(--color-text-muted);
  line-height: 1.7;
}

li + li {
  margin-top: 6px;
}

.contact {
  position: relative;
  z-index: 1;
}

@media (max-width: 980px) {
  .privacy-page {
    padding: 24px 20px 36px;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .hero-text h1 {
    font-size: 22px;
  }
}
</style>
