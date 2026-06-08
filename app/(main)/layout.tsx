import Header from "@/app/_components/layout/Header";
import Footer from "@/app/_components/layout/Footer";
import MainLayoutClient from "@/app/_components/layout/MainLayoutClient";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <MainLayoutClient>{children}</MainLayoutClient>
      <Footer />
    </>
  );
}
