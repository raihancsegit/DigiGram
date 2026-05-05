import ReduxProvider from "@/components/Provider";
import PWARegistration from "@/components/PWARegistration";
import RouteChangeListener from "@/components/common/RouteChangeListener";
import { Suspense } from "react";
import "./globals.css";

export const metadata = {
  title: "DigiGram — উন্নত নাগরিক সেবা পোর্টাল",
  description: "ডিজিগ্রাম - ডিজিটাল ইউনিয়নের স্মার্ট সমাধান।",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DigiGram",
  },
};

export const viewport = {
  themeColor: "#0d9488",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <head>
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body>
        <PWARegistration />
        <ReduxProvider>
          <Suspense fallback={null}>
            <RouteChangeListener />
          </Suspense>
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}