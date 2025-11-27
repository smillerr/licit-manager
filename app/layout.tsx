import "../styles/globals.css";
import Providers from "@/components/Providers";
import NavBar from "@/components/NavBar";

export const metadata = {
  title: "Licit Manager - Analizador de PDFs",
  description: "Analiza documentos PDF con IA para gestión de licitaciones",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-gray-50">
        <Providers>
          <NavBar />   
          {children}
        </Providers>
      </body>
    </html>
  );
}
