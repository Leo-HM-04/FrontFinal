import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Gestión de Usuarios - Plataforma de Pagos",
  description: "Administra usuarios, roles y permisos del sistema",
  robots: "noindex, nofollow",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#004AB7',
};

export default function UsuariosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}