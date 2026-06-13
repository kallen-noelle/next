📐 博客技术成长提交规范（Technical Blog Growth Convention）
核心理念
技术可追溯：每次提交清晰说明代码层面的变更，包括模块、算法、配置、依赖等。

面向读者：提交信息会成为博客“成长记录”的一部分，因此需要有一定的可读性，但核心是技术描写。

结构化：采用轻量级标记（如类型、范围、主体、技术细节），便于自动化生成更新日志。

格式定义
text
<type>(<scope>): <subject>

<technical body>  (必填，至少一条技术描述)

[optional footer]
1. Type（类型，技术语义）
Type	含义	示例场景
feat	新增功能/页面/组件	添加文章搜索功能、新增评论系统、增加 RSS 订阅
fix	修复代码或内容缺陷	修复 Markdown 渲染 XSS 漏洞、修复分页计数错误
perf	性能优化	图片懒加载、CDN 缓存策略调整、Webpack 分包优化
refactor	代码重构（不改变功能）	将 jQuery 重写为原生 JS、统一 API 请求层
style	UI/样式变更	修改主题色、调整响应式断点、增加暗黑模式
docs	博客文章内容更新	新增/修改/删除文章、修改 about 页面文案
chore	构建/依赖/配置变更	升级 Hexo 版本、修改 Nginx 配置、调整 GitHub Actions
revert	回滚某次技术变更	因兼容性问题回滚字体方案
2. Scope（范围，必填）
用单词语义指定影响的技术模块，例如：

template（页面模板）

router（路由）

comment（评论系统）

style（全局样式）

markdown（Markdown 解析）

deploy（部署脚本）

seo（SEO 相关）

analytics（分析统计）

article/{slug}（具体某篇文章的内容）

3. Subject（主题，简洁技术描述）
用中文，10~20 字。

直接说明做了什么技术变更，例如：

重构文章列表的分页逻辑，改用游标分页

升级 marked 库至 4.3.0 并修复 XSS 隐患

添加 webp 格式支持并实现降级方案

4. Technical Body（技术正文，必填）
这里必须包含具体的技术描写，至少一条，多条可以用列表。内容包括但不限于：

实现方式：用了什么 API、算法、数据结构、设计模式。

修改前后对比：关键代码逻辑的变化。

性能指标：优化前后的加载时间、包体积等。

依赖变更：新增/升级了哪些 npm 包，版本号。

配置调整：webpack、babel、eslint 等配置改动。

Bug 根因：错误产生的原因及修复原理。

示例格式：

text
- 技术实现：
  - 将分页参数 from offset 改为 after timestamp，基于 createTime 索引查询，减少大偏移量下的慢查询。
  - 前端修改 API 调用方式：`GET /posts?after=xxx&limit=10`。
- 性能影响：首页加载时间从 320ms 降至 210ms（Lighthouse 测试）。
- 涉及文件：`routes/posts.js`, `static/js/blog.js`
5. Footer（脚注，可选）
Breaking change: 描述不兼容的变更。

Closes #issue 关联任务或问题。

See also 相关文档链接。

完整示例
示例1：功能新增（技术细节）
text
feat(comment): 集成 Giscus 评论系统，替换原有的 Disqus

- 技术实现：
  - 移除 Disqus 通用代码及加载脚本。
  - 按 Giscus 官方文档生成配置，通过 data-repo、data-category 等属性挂载到文章页。
  - 添加主题跟随功能：监听博客暗黑模式切换，动态更新 Giscus iframe 的 theme 参数。
- 依赖变更：无需新增 npm 包，仅添加一段内嵌脚本。
- 影响范围：所有文章页面模板 `post.ejs` 及全局脚本 `theme.js`。
- 原因：Disqus 含有广告且国内访问慢，Giscus 基于 GitHub Discussions 无广告且轻量。

Closes #42
示例2：性能优化
text
perf(assets): 实现图片自动转 WebP 并启用 HTTP/2 推送

- 技术实现：
  - 在 `hexo generate` 阶段增加自定义 filter，利用 sharp 库将 `.jpg/.png` 转换为 `.webp` 并保留原图作为降级。
  - 修改 Nginx 配置，对支持 WebP 的请求头返回 `.webp` 文件。
  - 在首页 `<head>` 中预先推送关键图片的 `Link: rel=preload` 头。
- 性能结果：LCP 从 2.1s 降至 1.3s（WebPageTest 重复 3 次平均值）。
- 涉及文件：`scripts/webp.js`, `_config.yml`, `nginx/conf.d/blog.conf`
示例3：修复 Bug（技术根因）
text
fix(markdown): 修复代码块内长行无法横向滚动的问题

- 问题根因：`highlight.js` 生成的 `<pre><code>` 未设置 `overflow-x: auto`，且父容器未限制最大宽度。
- 技术修复：
  - 在全局样式 `_code.scss` 中为 `.hljs` 添加 `overflow-x: auto; white-space: pre;`。
  - 设置 `pre` 最大宽度为父容器的 `100%`，避免溢出破坏布局。
- 测试验证：在 Chrome/Firefox/Safari 上使用包含 200 字符的单行代码测试，均出现滚动条。
- 影响版本：v2.3.0 ~ v2.4.1
示例4：文章内容更新（技术化描述）
text
docs(article/hello-world): 更新“关于本站”技术栈说明

- 变更内容：
  - 将原本含糊的“基于 Node.js”改为具体栈：Hexo v6.3.0 + NexT 主题 + 阿里云 OSS 存储。
  - 新增一节“自动化部署流程”：GitHub Actions 监听 master 分支，自动构建并同步至 OSS。
- 数据/链接更新：更新仓库地址为 https://github.com/xxx/blog，添加构建状态徽章。
- 涉及文件：`source/about/index.md` 和 `source/_data/links.yml`
AI 行为准则（作为 Skill）
当用户要求“根据本次博客代码变更生成提交信息”时，主动询问变更的文件列表或描述。

生成的提交信息必须包含至少一条技术描写，不能只写“更新了样式”这种模糊描述。

如果用户没有提供技术细节，AI 可以基于文件扩展名和常见模式推断（如 .scss 变化写样式技术细节，.js 写逻辑细节），并提醒用户补充。

输出格式为纯文本，可直接用于 git commit -m。