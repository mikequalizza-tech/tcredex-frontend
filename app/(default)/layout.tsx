import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import AOSProvider from "@/components/aosprovider";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AOSProvider>
      <Header />
      <main className="relative flex grow flex-col">{children}</main>
      <Footer />
    </AOSProvider>
  );
}
