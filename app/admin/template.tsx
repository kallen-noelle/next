import PageTransition from "../_components/layout/PageTransition";

export default function AdminTemplate({ children }: { children: React.ReactNode }) {
  return (
    <PageTransition>
      <div className="flex flex-col flex-1 min-h-0">{children}</div>
    </PageTransition>
  );
}
