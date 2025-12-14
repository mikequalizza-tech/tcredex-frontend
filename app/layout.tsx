import "./globals.css";
import AOSProvider from "@/components/aosprovider";

export const metadata = {
  title: "tCredex - AI-Powered Tax Credit Marketplace",
  description: "AI-Powered 5-Tax Credit Marketplace including State and Federal Tax Credits for NMTC, LIHTC, HTC, OZ, Brownfield.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 font-inter text-base text-gray-200 antialiased">
        <div className="flex min-h-screen flex-col overflow-hidden supports-[overflow:clip]:overflow-clip">
          <AOSProvider>{children}</AOSProvider>
        </div>
        {/* ChatTC is added by individual layouts that need it */}
      </body>
    </html>
  );
}
