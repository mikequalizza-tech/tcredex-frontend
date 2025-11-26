import "../styles/theme.css";
import "../styles/globals.css";
import { AppShell } from "../components/AppShell";

export const metadata = {
  title: "tCredex",
  description: "tCredex — Community Tax Credit Marketplace"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
