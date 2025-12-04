"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";

interface SampleFormat {
  id: string;
  name: string;
  description: string | null;
  file_url: string;
  file_size: number;
  created_at: string;
}

export default function SampleFormats() {
  const { data: session } = useSession();
  const [formats, setFormats] = useState<SampleFormat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isAdmin = (session?.user as any)?.role === "admin";

  console.log("SampleFormats render:", {
    loading,
    error,
    formatsLength: formats.length,
    isAdmin,
  });

  useEffect(() => {
    async function fetchFormats() {
      try {
        console.log("Fetching sample formats...");
        const response = await fetch("/api/sample-formats");
        console.log("Response status:", response.status);
        console.log(
          "Response headers:",
          Object.fromEntries(response.headers.entries())
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Response error:", errorText);
          throw new Error(
            `Failed to fetch formats: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        console.log("Response data:", data);
        setFormats(data.formats || []);
      } catch (err) {
        console.error("Error fetching sample formats:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(`Failed to load sample formats: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    }

    fetchFormats();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleUpload = async (formData: FormData) => {
    setUploading(true);
    try {
      const response = await fetch("/api/sample-formats", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setFormats((prev) => [data.format, ...prev]);
        setShowUploadForm(false);
        alert("¡Formato de muestra subido exitosamente!");
      } else {
        const error = await response.json();
        alert(`Error al subir: ${error.error}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error al subir. Por favor intenta de nuevo.");
    } finally {
      setUploading(false);
    }
  };

  // Always show the component, just change the content
  const renderContent = () => {
    if (loading) {
      return (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      );
    }

    if (error) {
      return <p className="text-red-600">{error}</p>;
    }

    if (formats.length === 0) {
      return (
        <p className="text-gray-500">
          No hay formatos de muestra disponibles en este momento.
        </p>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {formats.map((format) => (
          <motion.div
            key={format.id}
            className="p-4 border rounded-lg hover:shadow-md transition-shadow"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-medium text-gray-900 text-sm">
                {format.name}
              </h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                PDF
              </span>
            </div>

            {format.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {format.description}
              </p>
            )}

            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
              <span>{formatFileSize(format.file_size)}</span>
              <span>{new Date(format.created_at).toLocaleDateString()}</span>
            </div>

            <a
              href={format.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors w-full justify-center"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Descargar
            </a>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="mb-8 p-6 bg-white rounded-xl shadow-sm border">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Formatos de Muestra
          </h2>
          <p className="text-gray-600 mt-1">
            Descarga documentos de ejemplo para entender el formato esperado en
            tus presentaciones.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {showUploadForm ? "Cancelar" : "Subir Formato"}
          </button>
        )}
      </div>

      {isAdmin && showUploadForm && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="font-medium mb-3">Subir Nuevo Formato de Muestra</h3>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              await handleUpload(formData);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ej: Formato 3 - Experiencia General"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Descripción
                </label>
                <textarea
                  name="description"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  placeholder="Descripción opcional del formato"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Archivo PDF *
                </label>
                <input
                  title="PDF UPLOADER"
                  type="file"
                  name="file"
                  accept="application/pdf"
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={uploading}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {uploading ? "Subiendo..." : "Subir Formato"}
              </button>
            </div>
          </form>
        </div>
      )}

      {renderContent()}
    </div>
  );
}
