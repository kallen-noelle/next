import Header from "@/app/_components/layout/Header";
import Footer from "@/app/_components/layout/Footer";
import MusicPlayer from "@/app/_components/layout/MusicPlayer";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-16">
        {children}
      </main>
      <Footer />
      <MusicPlayer />
    </>
  );
}
