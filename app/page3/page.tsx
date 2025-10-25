'use client';

import { useState } from 'react';

export default function Page3() {
  const [data, setData] = useState({
    resumen: 'Aquí aparecerá el resumen general extraído del documento...',
    objetivos: 'Objetivo 1: ...\nObjetivo 2: ...',
    cronograma: 'Tarea 1: Fecha...\nTarea 2: Fecha...',
    requisitos: 'Requisito 1: ...\nRequisito 2: ...',
  });

  const [edited, setEdited] = useState({
    resumen: false,
    objetivos: false,
    cronograma: false,
    requisitos: false,
  });

  const [saved, setSaved] = useState(false);

  const handleChange = (field: keyof typeof data, value: string) => {
    setData({ ...data, [field]: value });
    setEdited({ ...edited, [field]: true });
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setEdited({
      resumen: false,
      objetivos: false,
      cronograma: false,
      requisitos: false,
    });
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <main className="container mx-auto max-w-5xl p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
        Resultados del Análisis
      </h1>

      {/* Tarjetas editables */}
      <div className="space-y-6">
        {Object.entries(data).map(([key, value]) => (
          <div
            key={key}
            className={`p-4 rounded-lg shadow-md border transition-colors ${
              edited[key as keyof typeof edited]
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-2 capitalize">
              {key}
            </h2>
            <textarea
              value={value}
              onChange={(e) =>
                handleChange(key as keyof typeof data, e.target.value)
              }
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 resize-y"
              rows={4}
            />
          </div>
        ))}
      </div>

      {/* Botón guardar */}
      <div className="text-center mt-6">
        <button
          onClick={handleSave}
          className="btn-primary hover:scale-105 transition-transform"
        >
          Guardar cambios
        </button>
      </div>

      {/* Notificación visual */}
      {saved && (
        <div className="toast bg-green-600 text-white px-4 py-2 rounded-lg fade-in">
          ✅ Cambios guardados correctamente
        </div>
      )}
    </main>
  );
}


