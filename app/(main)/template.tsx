import PageTransition from "../_components/layout/PageTransition";

export default function MainTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
