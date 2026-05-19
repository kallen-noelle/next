import Header from "@/app/_components/layout/Header";
import Footer from "@/app/_components/layout/Footer";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 mt-28">
        {children}
      </main>
      <Footer />
    </>
  );
}
