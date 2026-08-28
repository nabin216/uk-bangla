import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "UK Bangla Guardian", description: "Independent news for the British-Bangladeshi community." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" suppressHydrationWarning><body suppressHydrationWarning>{children}</body></html>; }
