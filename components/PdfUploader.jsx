import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function PdfUploader({ onResult = () => {} }) {
  const inputRef = useRef();
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: "", ok: true });
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileValid, setFileValid] = useState(false);
  const [lastText, setLastText] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [analyzing, setAnalyzing] = useState(false); // Control spinner IA

  const showToast = (msg, ok = true) => {
    setToast({ show: true, msg, ok });
    setTimeout(() => setToast({ show: false, msg: "", ok }), 3500);
  };

  const validateFileIntegrity = async (file) => {
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
  };

  const handleSelect = async (file) => {
    setError("");
    setFileValid(false);
    setLastText("");
    setAnalysis("");
    setProgress(0);
    setSelectedFile(null);
    setFileName("");

    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Solo se permiten archivos PDF (.pdf).");
      showToast("Archivo no válido ❌", false);
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
  };

  const uploadFile = (file) => {
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
        const data = JSON.parse(xhr.responseText);
        const text = data.text || "";
        setLastText(text);
        onResult(text);
        showToast("PDF cargado correctamente ✅", true);

        if (text.trim().length > 0) {
          setAnalyzing(true); // Inicia análisis IA
          try {
            const res = await fetch("/api/analizar", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text }),
            });

            if (res.ok) {
              const result = await res.json();
              setAnalysis(result.analysis || "No se pudo generar el análisis.");
              showToast("Análisis completado 🧠✅", true);
            } else {
              const err = await res.json();
              setAnalysis("Error al analizar el texto.");
              showToast(err.error || "Error en el análisis ❌", false);
            }
          } catch (err) {
            console.error("Error analizando:", err);
            setAnalysis("Error de conexión al analizar el texto.");
            showToast("Error al conectar con la IA ❌", false);
          } finally {
            setAnalyzing(false); // Detener spinner siempre
          }
        }
      } else {
        setProgress(0);
        const err = JSON.parse(xhr.responseText || "{}");
        setError(err.error || "Error al procesar el PDF.");
        setFileValid(false);
        setLastText("");
        showToast("Error al procesar el PDF ❌", false);
        setAnalyzing(false);
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setProgress(0);
      setError("Error de conexión.");
      setFileValid(false);
      showToast("Error de conexión ❌", false);
      setAnalyzing(false);
    };

    xhr.send(form);
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    uploadFile(selectedFile);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    await handleSelect(file);
  };

  return (
    <div className="space-y-4">
      {/* Zona de carga */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
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
            onChange={(e) => handleSelect(e.target.files[0])}
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
            Subir y extraer
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
                ? "PDF cargado correctamente"
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
        <h3 className="text-lg font-semibold">Texto extraído</h3>
        <div
          className="textarea-output"
          role="region"
          aria-label="Texto extraído"
        >
          {lastText ? (
            <pre className="whitespace-pre-wrap">{lastText}</pre>
          ) : (
            <p className="text-gray-500">
              Aquí aparecerá el texto extraído del PDF.
            </p>
          )}
        </div>
      </div>

      {/* 🔄 Spinner de análisis */}
      {analyzing && (
        <div className="flex flex-col items-center mt-6">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-2"></div>
          <p className="text-indigo-700 font-medium">Analizando con IA...</p>
        </div>
      )}

      {/* 🧠 Resultado del análisis */}
      {analysis && (
        <div className="card border border-indigo-200 bg-indigo-50">
          <h3 className="text-lg font-semibold text-indigo-700">Análisis IA</h3>
          <div className="textarea-output text-sm whitespace-pre-wrap text-gray-700">
            {analysis}
          </div>
        </div>
      )}
    </div>
  );
}
