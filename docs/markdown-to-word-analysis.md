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

---

## 八、iLovePDF 分析（https://www.ilovepdf.com/zh-cn）

### 8.1 总体架构

**结论：iLovePDF 网页版所有功能均为服务器端（云端）处理，没有纯前端功能。**

技术栈：
- 后端：Node.js + Python 混合微服务架构
- 引擎：Poppler、Ghostscript、LibreOffice、Apache PDFBox 等开源引擎
- 安全：AES-256-GCM 加密传输，文件 2 小时内自动销毁

### 8.2 Web 版 vs Desktop 版

| 版本 | 处理方式 | 说明 |
|------|---------|------|
| **网页版 (Web)** | ❌ 服务器端 | 文件上传到服务器处理，所有功能均需上传 |
| **桌面版 (Desktop)** | ✅ 本地处理 | 下载安装后离线本地处理，无需联网 |

### 8.3 所有功能一览与处理方式

| 功能分类 | 具体功能 | Web 版处理方式 |
|---------|---------|--------------|
| **PDF 合并/拆分** | 合并PDF、拆分PDF | 上传 → 服务器处理 → 下载 |
| **PDF 优化** | 压缩PDF、PDF转PDF/A、修复PDF | 上传 → 服务器处理 → 下载 |
| **格式转换** | PDF转Word/Excel/PPT、Word/Excel/PPT转PDF | 上传 → 服务器处理 → 下载 |
| **图片相关** | PDF转JPG、JPG转PDF | 上传 → 服务器处理 → 下载 |
| **编辑** | 编辑PDF、旋转PDF、排列页面、裁剪、添加页码 | 上传 → 服务器处理 → 下载 |
| **安全** | PDF解锁、PDF加密、水印、签名、标记密文 | 上传 → 服务器处理 → 下载 |
| **高级** | OCR识别、比较PDF、扫描为PDF | 上传 → 服务器处理 → 下载 |
| **AI 功能** | AI摘要、PDF翻译 | 上传 → 服务器处理 → 下载 |

### 8.4 与 markdowntoword.io 的架构对比

| 维度 | iLovePDF.com | markdowntoword.io |
|------|-------------|-------------------|
| **处理位置** | 云端服务器 | 浏览器本地 |
| **文件上传** | 需要上传到服务器 | 不上传 |
| **隐私安全** | 依赖服务端删除策略 | 文件不离开设备 |
| **离线使用** | Web版不支持，Desktop版支持 | 不支持（需要加载JS库） |
| **处理速度** | 受上传/下载带宽影响 | 即时处理 |
| **功能复杂度** | 高（PDF深度处理） | 低（纯文本转换） |

### 8.5 为什么 iLovePDF 不能纯前端

PDF 的复杂处理（如解析 PDF 内部结构、提取文字/图片、OCR 识别、保持复杂排版等）需要底层引擎支持，这些引擎（Ghostscript、LibreOffice、PDFBox）无法在浏览器中以 JavaScript/WebAssembly 高效实现，因此必须依赖后端服务器。

相比之下，Markdown → DOCX 只需要文本解析和 DOCX 打包，这两步都有成熟的前端库可以实现。

### 8.6 建议

如果你的项目需要实现的是 **Markdown 转 Word**，完全可以用纯前端方案（参考本文前几节）。
但如果需要的是 **PDF 转换/编辑**，纯前端方案局限性较大（即使有 pdf-lib 等库，也只能做简单的合并、旋转、提取页面等操作），复杂功能仍需后端支持。