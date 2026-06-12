栏轩阁 亮色/暗色模式设计规范
1. 核心配色 Token
品牌色
亮色: indigo-500 (#818cf8)

暗色: indigo-400

深色变体: indigo-600 (#6366f1) — 用于按钮 hover 状态

卡片背景与边框
亮色背景: bg-white/40 (白色 40% 透明度)

暗色背景: dark:bg-slate-800/50 (slate-800 50% 透明度)

亮色边框: border-white/40

暗色边框: dark:border-white/10

文字颜色层级
角色	亮色	暗色
主标题 (h1)	text-slate-900	dark:text-white
描述文字/副标题	text-slate-500	dark:text-slate-400
节标题 (h2)	text-slate-700	dark:text-slate-300
次要文字/标签	text-slate-400	dark:text-slate-500
图表标题	text-slate-600	dark:text-slate-300
输入框配色
亮色背景: bg-white/50

暗色背景: dark:bg-slate-700/50

亮色边框: border-slate-200

暗色边框: dark:border-slate-600

文字颜色: text-slate-800 dark:text-slate-200

状态色
成功: emerald-500 → 暗色 emerald-400

警告: amber-500 → 暗色 amber-400

危险: red-500 → 暗色 red-400

2. 玻璃拟态卡片规范（核心设计语言）
所有卡片必须使用统一的玻璃拟态风格：

text
基础类: rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl
卡片尺寸变体
类型	圆角	内边距	Hover 效果
Hero/大内容块	rounded-3xl	p-5 sm:p-6 md:p-8	hover:scale-[1.01]
标准区块	rounded-2xl	p-5	hover:scale-[1.02]
统计卡片	rounded-2xl	p-4 md:p-5	无或轻微
平台卡片	rounded-2xl	p-3	无
空状态	rounded-2xl	p-8	无
评论区包装	rounded-3xl	p-5 md:p-8	无
3. 文字层级规范
元素	Tailwind 类	用途
页面标题 h1	text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-2	页面顶部
页面副标题	text-sm text-slate-500 dark:text-slate-400 mb-6 (或 mb-8)	h1 下方
节标题 h2	text-lg font-black text-slate-700 dark:text-slate-300 mb-4	段落开头（使用 emoji 前缀: 📈 📊 👥 🔧 🔄 📡 ⏱）
卡片内标题 h3	text-sm font-black text-slate-900 dark:text-white	卡片内部
统计数值	text-xl md:text-2xl font-black	数据展示
统计标签	text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest	数值下方
图表标题	text-xs md:text-sm font-bold text-slate-600 dark:text-slate-300 mb-3	图表上方
次要文字	text-xs text-slate-500 dark:text-slate-400	辅助信息
4. 按钮规范
实色按钮基类
px-4 py-2 text-white text-sm font-bold rounded-xl transition-colors

类型	颜色类
主要操作	bg-indigo-500 hover:bg-indigo-600
成功操作	bg-emerald-500 hover:bg-emerald-600
警告操作	bg-amber-500 hover:bg-amber-600
次要操作	bg-slate-500 hover:bg-slate-600
危险操作	bg-red-500 hover:bg-red-600
玻璃按钮
px-4 py-2 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all

5. 表单元素规范
输入框
w-full bg-white/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm outline-none text-slate-800 dark:text-slate-200

多行文本
w-full bg-white/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl p-3 text-sm outline-none text-slate-800 dark:text-slate-200 resize-y

Checkbox
rounded

范围滑块
w-40

6. 布局规范
标准页面容器
flex-1 w-full mt-28 max-w-6xl mx-auto px-4 sm:px-6 lg:px-10

页面底部间距
pb-16 或 pb-20（为固定定位元素留空间）

工具页面内部
w-[70%] mx-auto py-8 px-4

7. 响应式断点
断点	前缀	常用场景
默认 (手机)	—	单列 grid-cols-1
平板 (≥640px)	sm:	两列 sm:grid-cols-2
桌面 (≥768px)	md:	三列 md:grid-cols-3、两列图表
宽屏 (≥1024px)	lg:	复杂多列布局 lg:grid-cols-12
8. 动画规范
卡片 hover: transition-all duration-700 hover:scale-[1.02] (标准) 或 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-2xl (增强)

按钮点击: active:scale-95

入场动画: framer-motion spring (stiffness: 350, damping: 26)

图表懒加载: opacity 0.5s ease-out

图表动画: recharts animationDuration: 600-800

9. 深色模式切换机制
基于 <html class="dark"> 全局类切换

所有颜色必须同时配置 dark: 变体

非 React 组件 (DOM 操作) 使用 MutationObserver 监听 <html> 的 class 变化

10. 字体规范
无衬线: Geist Sans (变量 --font-geist-sans)

等宽: Geist Mono (变量 --font-geist-mono)

衬线: Georgia / Noto Serif SC (变量 --font-serif)

11. 全局样式规则
SVG/recharts 元素禁用焦点外框 (outline: none; box-shadow: none)

间距使用 Tailwind 间距标度: gap-2 (紧凑) / gap-4 (标准) / gap-6 (宽松)

页面标题下间距: mb-2 (紧) 到 mb-8 (松)