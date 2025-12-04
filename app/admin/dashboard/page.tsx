"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabaseClient";

interface DashboardStats {
  activeTenders: number;
  analyzedDocuments: number;
  generatedAlerts: number;
}

interface Tender {
  id: string;
  titulo: string;
  entidad: string;
  estado: string;
  fecha_publicacion: string;
}

interface SampleFormat {
  id: string;
  name: string;
  description: string | null;
  file_url: string;
  file_size: number;
  created_at: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    activeTenders: 0,
    analyzedDocuments: 0,
    generatedAlerts: 0,
  });

  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [sampleFormats, setSampleFormats] = useState<SampleFormat[]>([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isAdmin = (session?.user as any)?.role === "admin";

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    async function loadDashboardData() {
      try {
        // Count active tenders
        const { count: countTenders, error: errorTenders } = await supabase
          .from("licitaciones")
          .select("*", { count: "exact", head: true })
          .eq("estado", "Activa");

        // Count analyzed documents
        const { count: countDocuments, error: errorDocuments } = await supabase
          .from("documentos")
          .select("*", { count: "exact", head: true });

        // Count alerts
        const { count: countAlerts, error: errorAlerts } = await supabase
          .from("alertas")
          .select("*", { count: "exact", head: true });

        // Get latest tenders
        const { data: dataTenders, error: errorTable } = await supabase
          .from("licitaciones")
          .select("*")
          .order("fecha_publicacion", { ascending: false })
          .limit(5);

        if (errorTenders || errorDocuments || errorAlerts || errorTable) {
          console.error("Error loading dashboard data");
        }

        setStats({
          activeTenders: countTenders || 0,
          analyzedDocuments: countDocuments || 0,
          generatedAlerts: countAlerts || 0,
        });

        if (dataTenders) {
          setTenders(dataTenders);
        }
      } catch (error) {
        console.error("General error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [isAdmin]);

  // Load sample formats
  useEffect(() => {
    if (!isAdmin) return;

    async function loadSampleFormats() {
      try {
        const response = await fetch("/api/sample-formats");
        if (response.ok) {
          const data = await response.json();
          setSampleFormats(data.formats || []);
        }
      } catch (error) {
        console.error("Error loading sample formats:", error);
      }
    }

    loadSampleFormats();
  }, [isAdmin]);

  const handleUploadFormat = async (formData: FormData) => {
    setUploading(true);
    try {
      const response = await fetch("/api/sample-formats", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setSampleFormats((prev) => [data.format, ...prev]);
        setShowUploadForm(false);
        alert("Sample format uploaded successfully!");
      } else {
        const error = await response.json();
        alert(`Upload failed: ${error.error}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFormat = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sample format?")) return;

    try {
      const response = await fetch(`/api/sample-formats?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSampleFormats((prev) => prev.filter((format) => format.id !== id));
        alert("Sample format deleted successfully!");
      } else {
        alert("Failed to delete sample format.");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete sample format.");
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-600">Loading dashboard data...</div>;
  }

  return (
    <div className="p-6">
      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
      <p className="text-gray-600 mt-1">Welcome to the administration panel</p>

      {/* Sample Formats Management */}

      {/* Welcome message */}
      <div className="mt-6 p-6 rounded-xl bg-white border">
        <p>Welcome to the admin panel ✔️</p>
      </div>

      <div className="mt-6 p-6 rounded-xl bg-white border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Sample Formats Management</h2>
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {showUploadForm ? "Cancel" : "Upload New Format"}
          </button>
        </div>

        {showUploadForm && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-medium mb-3">Upload Sample Format</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                await handleUploadFormat(formData);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g., Formato 3 - Experiencia General"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                  placeholder="Optional description of the format"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  PDF File *
                </label>
                <input
                  title="PDF UPLOADER"
                  type="file"
                  name="file"
                  accept="application/pdf"
                  required
                  className="w-full"
                />
              </div>
              <button
                type="submit"
                disabled={uploading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload Format"}
              </button>
            </form>
          </div>
        )}

        <div className="space-y-3">
          {sampleFormats.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No sample formats uploaded yet.
            </p>
          ) : (
            sampleFormats.map((format) => (
              <div
                key={format.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-medium">{format.name}</h4>
                  {format.description && (
                    <p className="text-sm text-gray-600">
                      {format.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    {(format.file_size / 1024).toFixed(1)} KB •{" "}
                    {new Date(format.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={format.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                  >
                    View
                  </a>
                  <button
                    onClick={() => handleDeleteFormat(format.id)}
                    className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Summary - Only for admins */}
      {isAdmin && (
        <>
          {/* Stats Cards */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* CARD 1 */}
            <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition-all">
              <h3 className="text-gray-500 text-sm">Active Tenders</h3>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {stats.activeTenders}
              </p>
              <p className="text-xs text-green-600 mt-1">Real-time updated</p>
            </div>

            {/* CARD 2 */}
            <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition-all">
              <h3 className="text-gray-500 text-sm">Analyzed Documents</h3>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {stats.analyzedDocuments}
              </p>
              <p className="text-xs text-blue-600 mt-1">Total historical</p>
            </div>

            {/* CARD 3 */}
            <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition-all">
              <h3 className="text-gray-500 text-sm">Generated Alerts</h3>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {stats.generatedAlerts}
              </p>
              <p className="text-xs text-red-600 mt-1">Require attention</p>
            </div>
          </div>

          {/* Latest Tenders Table */}
          <div className="mt-10 bg-white rounded-2xl shadow p-6 overflow-auto">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Latest Tenders
            </h2>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-gray-600">
                  <th className="pb-3">Title</th>
                  <th className="pb-3">Entity</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {tenders.map((tender) => (
                  <tr key={tender.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">{tender.titulo}</td>
                    <td>{tender.entidad}</td>
                    <td>
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          tender.estado === "Activa"
                            ? "bg-green-100 text-green-700"
                            : tender.estado === "En revisión"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {tender.estado}
                      </span>
                    </td>
                    <td>{tender.fecha_publicacion}</td>
                  </tr>
                ))}
                {tenders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-500">
                      No tenders registered
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
