import { type FC } from "react";
import { Feather, Music, BookOpen, PenLine, FileText } from "lucide-react";

export interface TagIconInfo {
  Icon: FC<{ className?: string; strokeWidth?: number }>;
  color: string;
}

export const tagIconMap: Record<string, TagIconInfo> = {
  "诗": { Icon: Feather, color: "text-pink-500" },
  "词": { Icon: Music, color: "text-violet-500" },
  "辞": { Icon: BookOpen, color: "text-indigo-500" },
  "散文": { Icon: PenLine, color: "text-sky-500" },
  "文散": { Icon: FileText, color: "text-amber-500" },
};
