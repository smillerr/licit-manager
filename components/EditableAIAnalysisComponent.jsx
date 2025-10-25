"use client";
import React, { useState } from "react";

export default function EditableAIAnalysisComponent({ initialData, onSave }) {
  const [data, setData] = useState(initialData);
  const [editMode, setEditMode] = useState(false);

  const handleChange = (key, value) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    localStorage.setItem("analysis", JSON.stringify(data));
    onSave?.(data);
    setEditMode(false);
  };

  return (
    <div className="space-y-4">
      {Object.entries(data).map(([key, value]) => (
        <div key={key}>
          <h4 className="font-semibold text-gray-800 capitalize">
            {key.replace(/_/g, " ")}
          </h4>
          {editMode ? (
            <textarea
              className="w-full border rounded p-2 text-sm text-gray-700"
              rows={3}
              value={value}
              onChange={(e) => handleChange(key, e.target.value)}
            />
          ) : (
            <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
              {value}
            </p>
          )}
        </div>
      ))}

      <div className="flex justify-end gap-2 mt-4">
        {!editMode ? (
          <button
            onClick={() => setEditMode(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Editar
          </button>
        ) : (
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
          >
            Guardar cambios
          </button>
        )}
      </div>
    </div>
  );
}

