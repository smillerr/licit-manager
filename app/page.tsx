'use client';
import { useCallback, useState } from 'react';
import PdfUploader from '@/components/PdfUploader';
import Link from 'next/link';

export default function Home() {
  const [showButton, setShowButton] = useState(false);

  const handleAnalysisResult = useCallback((text: string) => {
    console.log('Texto extraído:', text);
    // Aquí puedes agregar más lógica para procesar el resultado
    setShowButton(true); // Muestra el botón solo después de que se haya hecho el análisis
  }, []);

  return (
    <main className="container mx-auto p-4 max-w-6xl text-center">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Licit Manager</h1>
        <p className="text-lg text-gray-600">
          Analiza documentos de licitaciones con IA y extrae requisitos automáticamente
        </p>
      </div>

      <PdfUploader onResult={handleAnalysisResult} />

      {showButton && (
        <div className="mt-6">
          <Link href="/page3">
            <button className="btn-primary hover:scale-105 transition-transform">
              Seguir
            </button>
          </Link>
        </div>
      )}
    </main>
  );
}
