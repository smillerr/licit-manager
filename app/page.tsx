'use client';
import { useCallback } from 'react';
import PdfUploader from '@/components/PdfUploader';

export default function Home() {
  const handleAnalysisResult = useCallback((text: string) => {
    console.log('Texto extraído:', text);
    // Aquí puedes agregar más lógica para procesar el resultado
  }, []);

  return (
    <main className="container mx-auto p-4 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Licit Manager
        </h1>
        <p className="text-lg text-gray-600">
          Analiza documentos de licitaciones con IA y extrae requisitos automáticamente
        </p>
      </div>
      <PdfUploader onResult={handleAnalysisResult} />
    </main>
  );
}