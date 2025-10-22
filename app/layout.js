import '../styles/globals.css';

export const metadata = {
  title: 'Licit Manager - Analizador de PDFs',
  description: 'Analiza documentos PDF con IA para gestión de licitaciones',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-gray-50">
        {children}
      </body>
    </html>
  );
}