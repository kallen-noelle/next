import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Serif_SC } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./_components/layout/ThemeProvider";
import BackgroundSlider from "./_components/layout/BackgroundSwitcher";
import BackgroundEffects from "./_components/common/ParticleBg";
import DanmakuBackground from "./_components/layout/DanmakuBackground";
import ClickEffect from "./_components/common/ClickEffect";
import SplashScreen from "./_components/layout/SplashScreen";
import Live2DWidget from "./_components/Live2DWidgetWrapper";
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
  metadataBase: new URL("https://pc-blog.github.io/next"),
  title: { default: siteConfig.title, template: `%s | ${siteConfig.title}` },
  description: siteConfig.bio,
  keywords: ["blog", "web development", "programming", "前端", "全栈", "个人博客", "技术博客"],
  robots: { index: true, follow: true },
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.bio,
    siteName: siteConfig.title,
    type: "website",
    locale: "zh_CN",
  },
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
      <head>
        <meta charSet="utf-8" />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              #app-mount-root { opacity: 0; visibility: hidden; pointer-events: none; }
              html.splash-seen #app-mount-root { opacity: 1 !important; visibility: visible !important; pointer-events: auto !important; }
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (sessionStorage.getItem('hasSeenSplash') === 'true') {
                  document.documentElement.classList.add('splash-seen');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="w-full overflow-y-scroll min-h-full flex flex-col relative transition-colors duration-1000 bg-slate-50 dark:bg-slate-950 font-serif">
        <ThemeProvider>
          <SplashScreen />
          <div id="app-mount-root" className="flex-1 flex flex-col min-h-0 transition-opacity duration-1000">
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
            <div className="hidden md:block">
              <DanmakuBackground />
            </div>
            <div className="relative z-10 flex-1 flex flex-col min-h-0">{children}</div>
            <ClickEffect />
            <Live2DWidget />
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
