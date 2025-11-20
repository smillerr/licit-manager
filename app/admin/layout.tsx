"use client";

import React from "react";

export default function DashboardPage() {
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
          <p className="text-3xl font-bold text-gray-800 mt-2">24</p>
          <p className="text-xs text-green-600 mt-1">+12% este mes</p>
        </div>

        {/* CARD 2 */}
        <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition-all">
          <h3 className="text-gray-500 text-sm">Documentos analizados</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">183</p>
          <p className="text-xs text-blue-600 mt-1">Procesando en automático</p>
        </div>

        {/* CARD 3 */}
        <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition-all">
          <h3 className="text-gray-500 text-sm">Alertas generadas</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">9</p>
          <p className="text-xs text-red-600 mt-1">3 nuevas hoy</p>
        </div>
      </div>

      {/* Tabla ejemplo */}
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
            <tr className="border-b hover:bg-gray-50">
              <td className="py-3">Adquisición de equipos</td>
              <td>Ministerio de Salud</td>
              <td>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                  Activa
                </span>
              </td>
              <td>2025-11-21</td>
            </tr>
            <tr className="border-b hover:bg-gray-50">
              <td className="py-3">Mantenimiento de vías</td>
              <td>Alcaldía de Bogotá</td>
              <td>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                  En revisión
                </span>
              </td>
              <td>2025-11-20</td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-3">Consultoría jurídica</td>
              <td>Gobernación</td>
              <td>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                  Finalizada
                </span>
              </td>
              <td>2025-11-19</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
