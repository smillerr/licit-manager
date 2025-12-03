'use client';

import React, { useEffect, useState } from "react";
import { supabase } from '@/lib/supabaseClient';

interface DashboardStats {
  licitacionesActivas: number;
  documentosAnalizados: number;
  alertasGeneradas: number;
}

interface Licitacion {
  id: string;
  titulo: string;
  entidad: string;
  estado: string;
  fecha_publicacion: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    licitacionesActivas: 0,
    documentosAnalizados: 0,
    alertasGeneradas: 0
  });
  
  const [licitaciones, setLicitaciones] = useState<Licitacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // 1. Contar licitaciones activas
        const { count: countLicitaciones, error: errorLicitaciones } = await supabase
          .from('licitaciones')
          .select('*', { count: 'exact', head: true })
          .eq('estado', 'Activa');

        // 2. Contar documentos analizados
        const { count: countDocumentos, error: errorDocumentos } = await supabase
          .from('documentos')
          .select('*', { count: 'exact', head: true });

        // 3. Contar alertas (todas o del día)
        const { count: countAlertas, error: errorAlertas } = await supabase
          .from('alertas')
          .select('*', { count: 'exact', head: true });

        // 4. Traer últimas licitaciones
        const { data: dataLicitaciones, error: errorTable } = await supabase
          .from('licitaciones')
          .select('*')
          .order('fecha_publicacion', { ascending: false })
          .limit(5);

        if (errorLicitaciones || errorDocumentos || errorAlertas || errorTable) {
          console.error("Error cargando datos del dashboard");
        }

        setStats({
          licitacionesActivas: countLicitaciones || 0,
          documentosAnalizados: countDocumentos || 0,
          alertasGeneradas: countAlertas || 0
        });

        if (dataLicitaciones) {
          setLicitaciones(dataLicitaciones);
        }

      } catch (error) {
        console.error("Error general:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return <div className="p-6 text-gray-600">Cargando datos del dashboard...</div>;
  }

  return (
    <div className="p-6">
      {/* Título */}
      <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
      <p className="text-gray-600 mt-1">
        Resumen general del sistema de licitaciones
      </p>

      {/* Contenedor principal */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* CARD 1 */}
        <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition-all">
          <h3 className="text-gray-500 text-sm">Licitaciones activas</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">{stats.licitacionesActivas}</p>
          <p className="text-xs text-green-600 mt-1">Actualizado en tiempo real</p>
        </div>

        {/* CARD 2 */}
        <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition-all">
          <h3 className="text-gray-500 text-sm">Documentos analizados</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">{stats.documentosAnalizados}</p>
          <p className="text-xs text-blue-600 mt-1">Total histórico</p>
        </div>

        {/* CARD 3 */}
        <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition-all">
          <h3 className="text-gray-500 text-sm">Alertas generadas</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">{stats.alertasGeneradas}</p>
          <p className="text-xs text-red-600 mt-1">Requieren atención</p>
        </div>
      </div>

      {/* Tabla Dinámica */}
      <div className="mt-10 bg-white rounded-2xl shadow p-6 overflow-auto">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Últimas licitaciones
        </h2>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b text-gray-600">
              <th className="pb-3">Título</th>
              <th className="pb-3">Entidad</th>
              <th className="pb-3">Estado</th>
              <th className="pb-3">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {licitaciones.map((lic) => (
              <tr key={lic.id} className="border-b hover:bg-gray-50">
                <td className="py-3">{lic.titulo}</td>
                <td>{lic.entidad}</td>
                <td>
                  <span className={`px-2 py-1 text-xs rounded ${
                    lic.estado === 'Activa' ? 'bg-green-100 text-green-700' :
                    lic.estado === 'En revisión' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {lic.estado}
                  </span>
                </td>
                <td>{lic.fecha_publicacion}</td>
              </tr>
            ))}
            {licitaciones.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-gray-500">No hay licitaciones registradas</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
