import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";

export default function DealDetailLayout({ children }: { children: React.ReactNode }) {
  // Public layout - no auth required for viewing deal details
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}
