import PdfUploader from '../components/PdfUploader';

export default function Home() {
  return (
    <main className="container">
      <div className="card mb-6">
        <h1 className="text-2xl font-bold">Extractor de texto desde PDF</h1>
        <p className="text-gray-600 mt-1">Sube un PDF y extraeremos su texto para mostrarlo en pantalla.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <PdfUploader />
      </div>
    </main>
  );
}
