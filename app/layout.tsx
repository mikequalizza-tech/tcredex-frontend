import '../styles/globals.css';
import { AppShell } from '../components/AppShell';

export const metadata={title:'tCredex'};

export default function RootLayout({children}){
 return (<html><body><AppShell>{children}</AppShell></body></html>);
}