@AGENTS.md

# personal-site — 项目上下文

> **这份文档同时写给人和 AI。** Claude Code 每次会话会自动把它加载进上下文，所以它是跨会话记忆的载体——对话记录会丢，这里不会。
>
> **维护约定**：做了新决策、完成了里程碑、或发现了新陷阱，就更新本文件，并同步「最后更新」日期。决策只增不删——推翻旧决策时把它标记为「已废弃」并说明原因，保留推理链比保留结论更有价值。

**最后更新**：2026-08-07

---

## 1. 项目是什么

Yixuan "Coda" Shi（GitHub [@Coda-Shi](https://github.com/Coda-Shi)）的个人网站。

| 项 | 值 |
|---|---|
| 仓库 | [Coda-Shi/personal-site](https://github.com/Coda-Shi/personal-site)（Public） |
| 本地路径 | `C:\Users\shiyi\dev\personal-site` |
| 主分支 | `main`（受保护） |
| 托管 | Vercel |
| 正式域名 | 未购买，暂用 `*.vercel.app` 子域名 |
| 开发环境 | Windows 11、PowerShell、Node v24.18.1、npm 11.16.0 |

## 2. 技术栈

- **Next.js 16.3**（App Router，Turbopack）
- **React 19.2**
- **TypeScript 5**
- **Tailwind CSS 4**
- **ESLint 9**（`eslint-config-next`）

目录结构为 `src/` + App Router，路径别名 `@/*` → `src/*`。

## 3. 关键决策记录

> 格式借鉴 ADR（Architecture Decision Record）。**每条决策都必须写"代价"**——只记好处的决策记录会诱导后来者（包括 AI）以为这是无损选择，从而在该重新权衡时不重新权衡。

### D1 — 用 Next.js，而非 Astro 或纯 HTML ✅ 生效中

**决策**：Next.js + TypeScript + Tailwind。

**理由**：
1. 项目所有者以 vibe coding 为主，几乎不手写代码 → **「AI 对该框架有多熟」是一等决策因素**。Next.js 是文档和社区示例最多的 React 框架，生成代码的准确率显著更高。
2. Vercel 是 Next.js 的开发公司，部署零配置，契合度无可替代。
3. 不会撞天花板——将来要加表单、API、后台、AI 接口都不用换框架。
4. TypeScript 让错误在编辑器和构建期暴露，而不是等浏览器白屏。**对无法靠阅读代码发现 bug 的使用者，这层自动校对的价值被放大。**

**代价**：概念负担明显重于 Astro（服务端组件 vs 客户端组件、路由约定、缓存语义）。对纯展示型网站属于杀鸡用牛刀。这是为「长期可扩展」主动付出的成本，**不是没意识到**。

### D2 — 托管选 Vercel ✅ 生效中

**决策**：Vercel Hobby（免费）。

**理由**：与 D1 的框架选择相互强化；PR 预览部署对「改完想先看看效果」这个高频动作帮助极大；将来需要服务端能力时不用迁移。

**代价**：Hobby 计划**条款上禁止商业用途**。一旦网站要挂广告、卖东西或用于商业推广，必须升级付费计划。

**备选**：Cloudflare Pages（带宽无限、性能更好，但生态不如 Vercel 顺手）。

### D3 — 仓库设为 Public ✅ 生效中

**理由**：分支保护和 CI 分钟数在公开仓库上免费，私有仓库需要 GitHub Pro（$4/月）；网站代码本来就会公开部署，藏不住；同时充当作品集。

**代价**：提交历史永久可被爬取 → 直接导致了 D4。

### D4 — 提交邮箱使用 GitHub noreply ✅ 生效中

**决策**：本仓库的 `user.email` 设为 `<ID>+Coda-Shi@users.noreply.github.com`（repo 级配置，非全局）。

**理由**：公开仓库的提交历史会被爬虫永久收录，真实邮箱一旦推上去**无法事后撤回**。noreply 地址照样能让提交归属到 GitHub 头像和贡献格子。

**执行细节**：`create-next-app` 生成的头两个提交带的是真实邮箱，已在**首次推送前**用 `git rebase --root --exec "git commit --amend --no-edit --reset-author"` 重写。哈希因此全变（`845584c` → `1c3a3b2`）。

> ⚠️ **给未来的 AI**：全局 `user.email` 仍是真实邮箱。**再帮他新建任何公开仓库时，必须在首次推送前设置 noreply**，否则真实邮箱泄漏且不可逆。

### D5 — 分支保护开启，但管理员可豁免 ✅ 生效中

**决策**：`main` 要求 PR + `build` 检查通过 + 禁止 force push/删除，但 `enforce_admins = false`。

**理由**：所有者是 git 新手。第一天就用硬约束把他锁在门外会造成挫败，且单人项目无人可批准 PR。留逃生口让默认路径是 PR、紧急时仍能直推。

**代价**：对所有者本人而言这是护栏而非硬约束——真正的强制只对未来的协作者生效。**这是刻意为之，不是配置遗漏。**

**何时重新评估**：等所有者对 PR 流程熟练后，或有真实协作者加入时，改为 `enforce_admins = true`。

### D6 — 域名暂不购买 ⏸ 待执行

**理由**：先用免费的 `*.vercel.app`，等网站成型再决定。**绑定自定义域名的迁移成本为零**，随时可加。

**已调研**：域名费与 Vercel 无关，是付给注册商的独立开销。倾向 **Porkbun**（.com 约 $11.08/年，首年与续费同价，DNS 可自由指向）。Cloudflare Registrar 更便宜（$10.46，按批发成本零加价）但强制使用其 DNS。

> 💡 **选购原则**：看续费价，不看首年价。GoDaddy 等首年 $1–5、次年 $20–25。后缀的影响远大于注册商——`.com` ≈ $11、`.dev` ≈ $12–15、`.io` 高达 $40–60。

## 4. 工作流约定

**不要直接改 `main`。** 标准循环：

```bash
git switch -c feat/描述性名字      # 开分支（分支只是指针，开销近乎为零，随便开）
# ... 改代码 ...
git add -A; git commit -m "feat: 说明"
git push                           # push.autoSetupRemote 已配置，无需 -u
gh pr create --fill
```

推送后自动发生：
1. **CI** 跑 `npm run lint` + `npm run build`，失败则阻止合并
2. **Vercel** 部署一个仅含该分支内容的预览网址，正式站不受影响
3. 确认无误后 `gh pr merge --squash --delete-branch` → 合入 main 触发正式部署

提交信息用 [Conventional Commits](https://www.conventionalcommits.org/)：`feat:` / `fix:` / `chore:` / `docs:` / `refactor:`。

## 5. 环境事实

- **`gh` CLI 不在本会话 shell 的 PATH 中**（winget 装后需新终端才刷新）。AI 调用时用完整路径：`C:\Program Files\GitHub CLI\gh.exe`
- SSH 密钥 `~/.ssh/id_ed25519` 已注册到 GitHub，**无密码短语**，推送免交互
- 全局 git 配置已设 `init.defaultBranch=main`、`push.autoSetupRemote=true`、`core.longpaths=true`

## 6. 已知陷阱

| 陷阱 | 说明 |
|---|---|
| **Next.js 16 有破坏性变更** | 见 `AGENTS.md`。写任何 Next.js 代码前先读 `node_modules/next/dist/docs/`，**不要凭训练数据里的旧 API 写**。 |
| **PowerShell 5.1 管道会破坏 JSON** | 用 `$json \| gh api --input -` 会导致 HTTP 400。改用 `[System.IO.File]::WriteAllText($p, $json, (New-Object System.Text.UTF8Encoding $false))` 写无 BOM 临时文件，再 `--input $p`。 |
| **PowerShell 会吞 jq 的反斜杠** | `--jq '"\(.a)"'` 形式的字符串插值会解析失败。用简单表达式或直接取原始 JSON。 |
| **PowerShell 5.1 无 `&&`** | 用 `;` 或 `if ($?) { }`。 |
| **原生命令 stderr 被当错误** | git/gh 写 stderr 时 PowerShell 报 `NativeCommandError` 且 `$?` 为 false，**即使退出码是 0**。别据此判断失败。 |
| **`gh` token 缺 `workflow` scope** | 当前 scope 为 `gist, read:org, repo`。走 SSH 推送不受影响；若将来需通过 API 改工作流文件，需 `gh auth refresh -s workflow`。 |

## 7. 当前进度

- [x] Git 环境与 SSH 打通
- [x] 安装并授权 `gh` CLI
- [x] Next.js 项目脚手架（lint + build 本地验证通过）
- [x] `.gitattributes`（统一 LF，防跨平台假 diff）
- [x] CI 工作流（PR 上跑 lint + build，首次运行 37s 通过）
- [x] 创建公开仓库并推送
- [x] 配置 `main` 分支保护
- [ ] **连接 Vercel 完成首次部署** ← 进行中
- [ ] 把部署网址写入仓库 homepage 字段
- [ ] 设计并实现实际的网站内容（尚未开始，脚手架仍是 Next.js 默认首页）
- [ ] 购买域名并绑定（见 D6）

## 8. 待决事项

| 问题 | 状态 |
|---|---|
| 全局 `user.email` 是否也改为 noreply？ | **未定**。改了则所有新仓库默认匿名，但影响机器上全部项目。已向所有者提出，等答复。 |
| 网站要有哪些内容/板块？ | 未讨论。设计方向、信息架构、视觉风格全部空白。 |
| 是否加备用邮箱到 GitHub 账号？ | 未做。GitHub 已警告只有单一验证邮箱，丢失即无法找回账号。 |
