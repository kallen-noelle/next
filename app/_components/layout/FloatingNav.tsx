"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { FolderOpen, Wrench, Gamepad2, Bookmark, Lightbulb, ChevronDown } from "lucide-react";
import Tooltip from "@/app/_components/common/Tooltip";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  desc?: string;
}

interface Category {
  icon: React.ReactNode;
  label: string;
  items: NavItem[];
}

const CATEGORIES: Category[] = [
  {
    icon: <FolderOpen className="w-5 h-5" />,
    label: "文件处理",
    items: [
      { icon: "🎨", label: "图片处理", desc: "图片转换/压缩/裁剪/旋转一体化工具", href: "/tools/image" },
      { icon: "🔒", label: "文件加密", desc: "文件加密解密工具，保护隐私安全", href: "/tools/file-encrypt" },
    ],
  },
  {
    icon: <Wrench className="w-5 h-5" />,
    label: "开发工具",
    items: [
      { icon: "🔢", label: "进制转换", desc: "二进制/八进制/十进制/十六进制互相转换", href: "/tools/base-convert" },
      { icon: "📱", label: "二维码生成", desc: "文本/链接生成二维码，支持下载", href: "/tools/qrcode" },
      { icon: "📋", label: "JSON格式化", desc: "JSON 格式化/压缩/校验/树形查看", href: "/tools/json-formatter" },
      { icon: "🔑", label: "密码生成", desc: "随机密码生成器，自定义长度与字符集", href: "/tools/password" },
    ],
  },
  {
    icon: <Gamepad2 className="w-5 h-5" />,
    label: "轻松一下",
    items: [
      { icon: "🧱", label: "俄罗斯方块", desc: "经典俄罗斯方块益智游戏", href: "/tools/tetris" },
      { icon: "🐍", label: "贪吃蛇", desc: "经典贪吃蛇小游戏", href: "/tools/snake" },
      { icon: "🔢", label: "2048", desc: "数字合并益智游戏，挑战最高分", href: "/tools/2048" },
      { icon: "💣", label: "扫雷", desc: "经典扫雷推理游戏", href: "/tools/minesweeper" },
      { icon: "⚫", label: "五子棋", desc: "人机对战五子棋，AI 自动评估", href: "/tools/gomoku" },
      { icon: "🧩", label: "图片拼图", desc: "上传图片分割成拼图碎片，挑战复原", href: "/tools/image-puzzle" },
    ],
  },
  {
    icon: <Bookmark className="w-5 h-5" />,
    label: "收藏夹",
    items: [
      { icon: "🎬", label: "Bibz Video", desc: "B站视频无水印下载，支持4K/1080P高清画质及弹幕导出", href: "https://bibz.me/video-extractor" },
      { icon: "⬇️", label: "Kdown", desc: "百度网盘高速下载解析服务，加速下载网盘文件", href: "https://kdown.moiu.cn/" },
      { icon: "🧰", label: "遐客", desc: "GitHub文件、Releases、归档代理加速下载", href: "https://xiake.pro/" },
      { icon: "📄", label: "CDKM", desc: "免费在线将Word、Excel等文档批量转换为PDF", href: "https://cdkm.com/cn/doc-to-pdf" },
      { icon: "📝", label: "MD转Word", desc: "免费在线Markdown转Word文档转换器", href: "https://markdowntoword.io/zh" },
      { icon: "📄", label: "老鱼简历", desc: "免费在线简历制作工具", href: "https://www.laoyujianli.com/" },
    ],
  },
  {
    icon: <Lightbulb className="w-5 h-5" />,
    label: "心愿",
    items: [
      { icon: "💡", label: "功能建议", href: "/tools/wishes" },
    ],
  },
];

const submenuVariants: Variants = {
  hidden: { opacity: 0, y: -8, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 350, damping: 26 },
  },
  exit: {
    opacity: 0,
    y: -4,
    scale: 0.97,
    transition: { duration: 0.12 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export default function FloatingNav() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <div className="relative w-full">
      <div className="rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-6 flex items-center gap-8 flex-wrap">
        {CATEGORIES.map((cat, i) => {
          const isDirect = cat.items.length === 1;

          if (isDirect) {
            const item = cat.items[0];
            const isExternal = item.href.startsWith("http");
            const Comp = isExternal ? "a" : Link;
            const extraProps = isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {};

            return (
              <Comp
                key={cat.label}
                href={item.href}
                {...extraProps}
                className="flex items-center gap-1.5 text-slate-600 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
              >
                <div>{cat.icon}</div>
                <span className="text-xs font-bold">{cat.label}</span>
              </Comp>
            );
          }

          return (
            <div
              key={cat.label}
              className="relative"
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
            >
              <motion.button
                className={`flex items-center gap-1.5 transition-colors duration-200 ${
                  active === i
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-slate-600 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div>{cat.icon}</div>
                <span className="text-xs font-bold">{cat.label}</span>
                <span className="text-[10px]">▾</span>
              </motion.button>

              <AnimatePresence>
                {active === i && (
                  <motion.div
                    key={cat.label}
                    variants={submenuVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="absolute top-full left-0 mt-2 z-50 w-[260px] bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl rounded-xl p-3"
                  >
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200/50 dark:border-white/5">
                      {cat.icon}
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{cat.label}</span>
                    </div>
                    <div className="space-y-1">
                      {cat.items.map((item) => {
                        const isExternal = item.href.startsWith("http");
                        const Comp = isExternal ? "a" : Link;
                        const extraProps = isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {};

                        const link = (
                          <Comp
                            key={item.href}
                            href={item.href}
                            {...extraProps}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                          >
                            <span className="text-lg">{item.icon}</span>
                            <span className="text-xs font-medium">{item.label}</span>
                          </Comp>
                        );

                        return (
                          <motion.div key={item.href} variants={cardVariants}>
                            {item.desc ? (
                              <Tooltip text={item.desc} position="right">
                                {link}
                              </Tooltip>
                            ) : link}
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}