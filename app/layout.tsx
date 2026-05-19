import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Serif_SC } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./_components/layout/ThemeProvider";
import BackgroundSlider from "./_components/layout/BackgroundSwitcher";
import BackgroundEffects from "./_components/common/ParticleBg";
import { siteConfig } from "@/lib/siteConfig";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const notoSerif = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.bio,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} ${notoSerif.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="w-screen overflow-x-hidden min-h-full flex flex-col relative transition-colors duration-1000 bg-slate-50 dark:bg-slate-950 font-serif">
        <ThemeProvider>
          <div className="flex-1 flex flex-col">
            {/* Background layers */}
            <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
              {!siteConfig.useGradient && <BackgroundSlider />}
              <div className="absolute inset-0 z-[-9] bg-white/30 dark:bg-slate-900/40 backdrop-blur-md transition-colors duration-1000" />
              <div
                className="absolute inset-0 z-[-8] opacity-60 dark:opacity-20 mix-blend-color transition-opacity duration-1000 transform-gpu"
                style={{
                  background: `linear-gradient(-45deg, ${siteConfig.themeColors.join(", ")})`,
                  backgroundSize: "400% 400%",
                  animation: "gradientMove 15s ease infinite",
                }}
              />
              <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/40 dark:bg-indigo-900/20 blur-[100px] rounded-full z-[-7] md:mix-blend-overlay" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/30 dark:bg-purple-900/30 blur-[100px] rounded-full z-[-7] md:mix-blend-overlay" />
              <div className="hidden md:block absolute inset-0 w-full h-full">
                <BackgroundEffects />
              </div>
            </div>

            {/* Content */}
            <div className="relative z-10 flex-1 flex flex-col">{children}</div>
          </div>

          <style
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html: `
              @keyframes gradientMove {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
            `,
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
