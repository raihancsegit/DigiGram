import ReduxProvider from "@/components/Provider";
import AuthSessionSync from "@/components/auth/AuthSessionSync";
import PWARegistration from "@/components/PWARegistration";
import RouteChangeListener from "@/components/common/RouteChangeListener";
import HouseholdOutboxSync from "@/components/common/HouseholdOutboxSync";
import { Suspense } from "react";
import { Toaster } from 'react-hot-toast';
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
    <html lang="bn" data-scroll-behavior="smooth">
      <head>
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body>
        <PWARegistration />
        <ReduxProvider>
          <AuthSessionSync />
          <HouseholdOutboxSync />
          <Suspense fallback={null}>
            <RouteChangeListener />
          </Suspense>
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#333',
                color: '#fff',
                borderRadius: '16px',
                fontSize: '14px',
                fontWeight: 'bold',
              },
              success: {
                style: {
                  background: '#059669',
                },
              },
              error: {
                style: {
                  background: '#dc2626',
                },
              },
            }}
          />
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}
