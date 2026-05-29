import Sidebar from "@/components/layout/Sidebar";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-base)" }}>
      <Sidebar />
      <main className="flex-1 min-w-0">
        <div className="pt-16 lg:pt-8 pb-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

