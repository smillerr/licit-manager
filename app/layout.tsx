import '../styles/globals.css';

interface Metadata {
  title: string;
  description: string;
}

export const metadata: Metadata = {
  title: 'Licit Manager - Analizador de PDFs',
  description: 'Analiza documentos PDF con IA para gestión de licitaciones',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es">
      <body className="bg-gray-50">
        {children}
      </body>
    </html>
  );
}