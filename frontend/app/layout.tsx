import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";

const SITE_URL = "https://ukbanglaguardian.com";
const SITE_NAME = "UK Bangla Guardian";
const DESCRIPTION =
  "Independent bilingual news for the British-Bangladeshi community — UK, Bangladesh and world coverage in English and বাংলা.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ইউকে বাংলা গার্ডিয়ান`,
    template: `%s — ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ইউকে বাংলা গার্ডিয়ান`,
    description: DESCRIPTION,
    url: SITE_URL,
    locale: "bn_BD",
    alternateLocale: "en_GB",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.png",
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "NewsMediaOrganization",
  name: SITE_NAME,
  alternateName: "ইউকে বাংলা গার্ডিয়ান",
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/logo.png`,
    width: 720,
    height: 366,
  },
  description: DESCRIPTION,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
