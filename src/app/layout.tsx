import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: 'Plataforma de Pagos - Bechapra',
  description: 'Sistema de gestión de solicitudes de pago con autenticación y autorización por roles',
};

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  preload: true,
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${montserrat.variable} font-montserrat`}>
      <body className={`font-montserrat antialiased ${montserrat.className}`}>
        <AuthProvider>
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#ffffff',
                color: '#111827',
                fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                fontWeight: '500',
              },
              success: {
                style: {
                  borderLeft: '4px solid #10b981',
                },
              },
              error: {
                style: {
                  borderLeft: '4px solid #ef4444',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}