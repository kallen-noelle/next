"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code, Rocket, Globe, Atom, BookOpen, Server, Database, GitBranch, Layers, Brain, TrendingUp, Palette, Container } from "lucide-react";

interface TimelineEvent {
  id: number;
  title: string;
  description: string;
  eventDate: string;
  sortOrder: number;
  icon: string;
  color: string;
}

interface TimelineData {
  rows: TimelineEvent[];
  total: number;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "code": Code,
  "rocket": Rocket,
  "globe": Globe,
  "atom": Atom,
  "book-open": BookOpen,
  "typescript": Code,
  "server": Server,
  "container": Container,
  "palette": Palette,
  "database": Database,
  "git-branch": GitBranch,
  "layers": Layers,
  "brain": Brain,
  "trending-up": TrendingUp,
};

const colorMap: Record<string, string> = {
  "indigo": "bg-indigo-500",
  "green": "bg-green-500",
  "cyan": "bg-cyan-500",
  "blue": "bg-blue-500",
  "purple": "bg-purple-500",
  "orange": "bg-orange-500",
  "pink": "bg-pink-500",
  "yellow": "bg-yellow-500",
  "red": "bg-red-500",
};

const colorBgMap: Record<string, string> = {
  "indigo": "bg-indigo-500/10",
  "green": "bg-green-500/10",
  "cyan": "bg-cyan-500/10",
  "blue": "bg-blue-500/10",
  "purple": "bg-purple-500/10",
  "orange": "bg-orange-500/10",
  "pink": "bg-pink-500/10",
  "yellow": "bg-yellow-500/10",
  "red": "bg-red-500/10",
};

const colorTextMap: Record<string, string> = {
  "indigo": "text-indigo-500",
  "green": "text-green-500",
  "cyan": "text-cyan-500",
  "blue": "text-blue-500",
  "purple": "text-purple-500",
  "orange": "text-orange-500",
  "pink": "text-pink-500",
  "yellow": "text-yellow-500",
  "red": "text-red-500",
};

export default function TimelineClient() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/data/timeline.json")
      .then((res) => res.json())
      .then((data: TimelineData) => {
        const sorted = [...data.rows].sort((a, b) => b.sortOrder - a.sortOrder);
        setEvents(sorted);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
            时光河流
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            记录每一个重要的时刻
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 text-slate-400 dark:text-slate-500">
            <p className="text-lg font-bold">暂无时光记录</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500" />
            
            <AnimatePresence>
              {events.map((event, index) => {
                const IconComponent = iconMap[event.icon] || Code;
                const isLeft = index % 2 === 0;
                
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className={`relative mb-12 flex ${isLeft ? "md:flex-row" : "md:flex-row-reverse"} flex-col md:items-center gap-6`}
                  >
                    <div className={`w-full md:w-1/2 ${isLeft ? "md:pr-12" : "md:pl-12"}`}>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="group rounded-3xl overflow-hidden bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl"
                      >
                  
                        <div className="p-6">
                          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3">
                            {event.title}
                          </h3>
                          <p className="text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                            {event.description}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-slate-400 font-mono">
                            <span className="w-2 h-2 rounded-full bg-indigo-500" />
                            {formatDate(event.eventDate)}
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    <div className="absolute left-6 md:left-1/2 -translate-x-1/2 z-10">
                      <motion.div
                        whileHover={{ scale: 1.2 }}
                        className={`w-12 h-12 rounded-full ${colorMap[event.color]} flex items-center justify-center shadow-lg`}
                      >
                        <IconComponent className="w-6 h-6 text-white" />
                      </motion.div>
                    </div>

                    <div className="w-full md:w-1/2" />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}