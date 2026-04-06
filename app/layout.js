import ReduxProvider from "@/components/Provider";
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <body>
        <ReduxProvider>
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}