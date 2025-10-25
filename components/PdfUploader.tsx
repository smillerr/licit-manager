// components/PdfUploader.tsx
"use client";
import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EditableAIAnalysisComponent from "@/components/EditableAIAnalysisComponent";

interface PdfUploaderProps {
  onResult?: (text: string) => void;
}

interface ToastState {
  show: boolean;
  msg: string;
  ok: boolean;
}

interface AnalysisResult {
  resumen: string;
  experiencia_requerida: string;
  codigos_exigidos: string;
  experiencia_personal: string;
  indicadores_financieros: string;
  documentos_exigidos: string;
}

export default function PdfUploader({ onResult = () => {} }: PdfUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [uploading, setUploading] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    msg: "",
    ok: true,
  });
  const [fileName, setFileName] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileValid, setFileValid] = useState<boolean>(false);
  const [lastText, setLastText] = useState<string>("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);

  const showToast = useCallback((msg: string, ok: boolean = true) => {
    setToast({ show: true, msg, ok });
    setTimeout(() => setToast({ show: false, msg: "", ok }), 3500);
  }, []);

  const validateFileIntegrity = useCallback(
    async (file: File): Promise<boolean> => {
      try {
        if (file.size < 100) {
          setError("El archivo está vacío o es ilegible.");
          setFileValid(false);
          return false;
        }

        const buffer = await file.slice(0, 5).arrayBuffer();
        const header = new TextDecoder().decode(buffer);
        if (!header.startsWith("%PDF-")) {
          setError("El archivo no es un PDF válido o está dañado.");
          setFileValid(false);
          return false;
        }

        setError("");
        setFileValid(true);
        return true;
      } catch {
        setError("Error al validar el archivo.");
        setFileValid(false);
        return false;
      }
    },
    []
  );

  const handleSelect = useCallback(
    async (file: File | null) => {
      setError("");
      setFileValid(false);
      setLastText("");
      setAnalysis(null);
      setProgress(0);
      setSelectedFile(null);
      setFileName("");

      if (!file) return;

      if (file.type !== "application/pdf") {
        setError("Solo se permiten archivos PDF (.pdf).");
        showToast("Archivo no válido ❌", false);
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        setError("El archivo es demasiado grande. Máximo 50MB.");
        showToast("Archivo demasiado grande ❌", false);
        return;
      }

      const isValid = await validateFileIntegrity(file);
      if (!isValid) {
        showToast("Archivo corrupto o ilegible ❌", false);
        return;
      }

      setSelectedFile(file);
      setFileName(file.name);
      setFileValid(true);
      showToast("Archivo válido listo para subir ✅", true);
    },
    [showToast, validateFileIntegrity]
  );

  const uploadFile = useCallback(
    (file: File | null) => {
      if (!file) {
        setError("Selecciona un archivo antes de subir.");
        return;
      }

      setUploading(true);
      setProgress(0);

      const form = new FormData();
      form.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/extract", true);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setProgress(pct);
        }
      };

      xhr.onload = async () => {
        setUploading(false);

        if (xhr.status === 200) {
          setProgress(100);
          try {
            const data = JSON.parse(xhr.responseText);
            const text = data.text || "";

            setLastText(text);
            onResult(text);
            showToast("PDF procesado correctamente ✅", true);

            // Llamar a análisis con DeepSeek
            await analyzeText(text);
          } catch (parseError) {
            console.error("Error parsing response:", parseError);
            setError("Error al procesar la respuesta del servidor.");
            showToast("Error en formato de respuesta ❌", false);
          }
        } else {
          setProgress(0);
          let errorMessage = "Error al procesar el PDF.";

          try {
            const err = JSON.parse(xhr.responseText);
            errorMessage = err.error || errorMessage;
          } catch (parseError) {
            if (
              xhr.responseText &&
              (xhr.responseText.trim().startsWith("<!DOCTYPE") ||
                xhr.responseText.includes("<html>"))
            ) {
              errorMessage = "Error del servidor: respuesta inesperada.";
            } else if (xhr.responseText) {
              errorMessage = `Error: ${xhr.responseText.substring(0, 100)}...`;
            } else {
              errorMessage = `Error del servidor (${xhr.status})`;
            }
          }

          setError(errorMessage);
          setFileValid(false);
          setLastText("");
          showToast("Error al procesar el PDF ❌", false);
        }
      };

      xhr.onerror = () => {
        setUploading(false);
        setProgress(0);
        setError("Error de conexión con el servidor.");
        setFileValid(false);
        showToast("Error de conexión ❌", false);
      };

      xhr.ontimeout = () => {
        setUploading(false);
        setProgress(0);
        setError("Tiempo de espera agotado.");
        setFileValid(false);
        showToast("Tiempo de espera agotado ❌", false);
      };

      xhr.timeout = 30000;
      xhr.send(form);
    },
    [onResult, showToast]
  );

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      uploadFile(selectedFile);
    },
    [selectedFile, uploadFile]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer?.files?.[0];
      await handleSelect(file || null);
    },
    [handleSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const analyzeText = useCallback(
    async (text: string) => {
      setAnalyzing(true);
      try {
        const response = await fetch("/api/analyze-deepseek", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) {
          throw new Error("Error en análisis");
        }

        const data = await response.json();
        setAnalysis(data.analysis);
        showToast("Análisis completado con IA 🤖", true);
      } catch (error) {
        console.error("Error analizando texto:", error);
        showToast("Error en análisis ❌", false);
      } finally {
        setAnalyzing(false);
      }
    },
    [showToast]
  );

  return (
    <div className="space-y-4">
      {/* Zona de carga */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`card border-2 ${
          dragOver
            ? "border-indigo-400 bg-indigo-50"
            : "border-dashed border-gray-200"
        }`}
      >
        <p className="text-gray-600">
          Arrastra y suelta un PDF aquí o usa el botón para seleccionar.
        </p>

        <div className="mt-3 flex items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            id="fileInput"
            onChange={(e) => handleSelect(e.target.files?.[0] || null)}
          />
          <label
            htmlFor="fileInput"
            className="inline-block btn-primary cursor-pointer"
          >
            Seleccionar PDF
          </label>

          <button
            onClick={handleSubmit}
            disabled={uploading || !selectedFile || !fileValid}
            className={`px-4 py-2 rounded-md shadow text-white transition ${
              uploading || !selectedFile || !fileValid
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {uploading ? "Subiendo..." : "Extraer texto"}
          </button>

          <span className="text-sm text-gray-500 ml-auto">{fileName}</span>
        </div>

        {/* Barra de progreso */}
        <div className="mt-4">
          <div className="progress-bg">
            <div
              className="progress-bar"
              style={{
                width: `${progress}%`,
                background: progress === 100 ? "#16a34a" : "#2563eb",
              }}
            ></div>
          </div>
          <div className="mt-2 flex justify-between text-sm text-gray-600">
            <span>
              {uploading
                ? "Subiendo archivo..."
                : progress === 100
                ? "PDF procesado correctamente"
                : "Esperando"}
            </span>
            <span>{progress}%</span>
          </div>
        </div>

        {error && <p className="text-red-600 mt-2">⚠️ {error}</p>}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            className="toast"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div
              className={`px-4 py-2 rounded shadow ${
                toast.ok ? "bg-green-600 text-white" : "bg-red-600 text-white"
              }`}
            >
              {toast.msg}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Texto extraído */}
      <div className="card">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">Texto extraído del PDF</h3>
          {lastText && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(lastText);
                showToast("Texto copiado al portapapeles 📋", true);
              }}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              Copiar texto
            </button>
          )}
        </div>
        <div
          className="textarea-output"
          role="region"
          aria-label="Texto extraído del PDF"
        >
          {lastText ? (
            <div className="space-y-2">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {lastText}
              </pre>
              <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                <strong>Estadísticas:</strong> {lastText.length} caracteres •{" "}
                {lastText.split(/\s+/).filter((word) => word.length > 0).length}{" "}
                palabras • {lastText.split("\n").length} líneas
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Aquí aparecerá el texto extraído del PDF.
            </p>
          )}
        </div>
      </div>

      {/* Análisis con IA */}
{analysis && (
  <div className="card">
    <div className="flex justify-between items-center mb-3">
      <h3 className="text-lg font-semibold">
        Análisis del Pliego con IA
      </h3>
      <button
        onClick={() => {
          const text = Object.entries(analysis)
            .map(([key, value]) => `${key}: ${value}`)
            .join("\n\n");
          navigator.clipboard.writeText(text);
          showToast("Análisis copiado al portapapeles 📋", true);
        }}
        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
      >
        Copiar análisis
      </button>
    </div>

 <EditableAIAnalysisComponent
  initialData={analysis}
  onSave={(updated: AnalysisResult) => {
    setAnalysis(updated);
    showToast("Cambios guardados ✅", true);
  }}
/>


  </div>
)}

    </div>
  );
}
