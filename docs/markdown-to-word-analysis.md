# Markdown 转 Word 实现分析

> 分析来源：https://markdowntoword.io/zh
> 结论：**纯前端实现**，所有转换在浏览器本地完成，不上传服务器。

---

## 一、架构确认

根据官网 FAQ 明确声明：

> "所有转换均在您的浏览器中本地完成，文档内容永远不会离开您的电脑。"

同类型工具 markdownftw.com、allmarkdowntools.com 也采用同样的纯前端架构。

**验证方式**：打开浏览器 DevTools → Network 标签，在转换/下载时观察是否有网络请求。纯前端方案在点击下载时不会有任何 POST/PUT 请求到服务器。

---

## 二、核心技术流程

```
Markdown 文本
    │
    ▼
┌─────────────────────────────┐
│   Markdown 解析为结构化数据  │  ← marked / markdown-it
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│   生成 DOCX 文档对象         │  ← docx (npm) / html-docx-js
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│   导出为 .docx 文件并下载    │  ← Blob + URL.createObjectURL
└─────────────────────────────┘
```

### 方案 A：Markdown → HTML → DOCX（传统方式）

```
marked/markdown-it          html-docx-js
  Markdown ──────────→ HTML ───────────→ DOCX Blob ──→ 下载
```

**依赖库**：
- `marked` 或 `markdown-it`：将 Markdown 解析为 HTML
- `html-docx-js`：将 HTML 转换为 DOCX 格式

**优点**：成熟稳定，社区资源多
**缺点**：HTML 到 DOCX 的样式映射有限，复杂排版效果一般

### 方案 B：Markdown → DOCX（直接转换，推荐）

```
markdown-docx / docx-markdown-utils
  Markdown ──────────────────────────→ DOCX Buffer/Blob ──→ 下载
```

**依赖库**：
- `markdown-docx` (npm: `markdown-docx`)：专注 Markdown→DOCX，支持代码高亮、LaTeX 公式、Mermaid 图表
- `docx-markdown-utils` (npm: `docx-markdown-utils`)：双向转换（Markdown↔DOCX），支持自定义样式

**优点**：转换 fidelity 高，DOCX 原生样式映射更好（标题样式、列表样式等）
**缺点**：包体积稍大

---

## 三、核心库对比

| 库名 | 环境 | 功能 | 包大小 | 推荐度 |
|------|------|------|--------|--------|
| `marked` + `html-docx-js` | 浏览器/Node | Markdown→HTML→DOCX | 中等 | ⭐⭐⭐ |
| `markdown-docx` | 浏览器/Node | Markdown→DOCX 直转 | 较大 | ⭐⭐⭐⭐⭐ |
| `docx-markdown-utils` | 浏览器/Node | Markdown↔DOCX 双向 | 中等 | ⭐⭐⭐⭐ |
| `docx` (dolan) + `marked` | 浏览器/Node | 自行编排 DOCX 生成 | 灵活 | ⭐⭐⭐⭐ |

---

## 四、推荐技术选型

### 推荐方案：`markdown-docx`

```bash
npm install markdown-docx
```

**浏览器端实现代码**：

```typescript
import markdownDocx, { Packer } from 'markdown-docx';

async function convertMarkdownToWord(markdownText: string, filename = 'document.docx') {
  // 1. 转换 Markdown 为 DOCX 文档对象
  const doc = await markdownDocx(markdownText, {
    math: { engine: 'katex' },       // LaTeX 公式支持
    title: filename.replace('.docx', ''),
  });

  // 2. 生成 Blob
  const blob = await Packer.toBlob(doc);

  // 3. 触发下载
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

### 备选方案：`docx` + `marked`（更灵活的自定义）

```bash
npm install docx marked
```

```typescript
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { marked } from 'marked';

async function convertMarkdownToWord(markdownText: string) {
  // 解析 Markdown 为 tokens
  const tokens = marked.lexer(markdownText);

  // 将 tokens 映射为 docx 的 Paragraph
  const paragraphs: Paragraph[] = tokens.map(token => {
    switch (token.type) {
      case 'heading':
        return new Paragraph({
          heading: HeadingLevel[`HEADING_${token.depth}` as keyof typeof HeadingLevel],
          children: [new TextRun({ text: token.text, bold: true })],
        });
      case 'paragraph':
        return new Paragraph({
          children: [new TextRun(token.text)],
        });
      // ... 处理更多类型
      default:
        return new Paragraph({ children: [new TextRun(token.text || '')] });
    }
  });

  const doc = new Document({
    title: 'Converted Document',
    sections: [{ children: paragraphs }],
  });

  const blob = await Packer.toBlob(doc);
  // ... 触发下载
}
```

---

## 五、功能特性规划表（参考 markdowntoword.io）

| 功能 | 说明 | 优先级 |
|------|------|--------|
| Markdown 文本编辑 | 文本域输入或粘贴 | P0 |
| 文件上传 | 拖拽/选择 .md 文件 | P0 |
| 实时预览 | 右侧渲染 Markdown 效果 | P0 |
| 下载 DOCX | 导出为 Word 文档 | P0 |
| 代码语法高亮 | 代码块带语言着色 | P1 |
| LaTeX 公式 | 数学公式渲染 | P1 |
| Mermaid 图表 | 流程图渲染 | P2 |
| 自定义样式 | 字体、字号、页边距可配置 | P2 |
| 图片处理 | 远程图片嵌入文档 | P2 |

---

## 六、markdowntoword.io 的额外细节

1. **文件限制**：最大 10MB
2. **实时预览**：基于浏览器的 Markdown 渲染（可能是 `marked` + 自定义 CSS）
3. **编辑器**：大概率使用 CodeMirror 或 Monaco Editor 作为编辑组件
4. **样式映射**：标题→Word 原生 Heading 样式，列表→Word 原生 List 样式
5. **兼容性**：输出的 .docx 兼容 Microsoft Word、Google Docs、WPS

---

## 七、在你的项目中集成

你的 `analytics/page.tsx` 已有 `file-processing` 标签页，建议：

1. 创建独立的组件 `app/_components/file-processing/MarkdownToWord.tsx`
2. 在 `analytics/page.tsx` 的 `file-processing` tab 中引用该组件
3. 安装 `markdown-docx` 作为依赖

```
npm install markdown-docx
```

如需进一步帮助（如代码高亮、LaTeX 公式渲染的集成），请参考 `markdown-docx` 官方文档：https://www.npmjs.com/package/markdown-docx
