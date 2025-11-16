"use client";
import React from "react";
import { signIn, useSession, signOut } from "next-auth/react";

export default function OAuthButtons() {
  const { data: session, status } = useSession();

  if (status === "loading") return <div>Cargando...</div>;

  if (session) {
    return (
      <div className="flex flex-col gap-4">
        <p>Conectado como {session.user?.email}</p>
        <button
          className="bg-red-500 text-white px-4 py-2 rounded"
          onClick={() => signOut()}
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-sm">
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={() => signIn("google")}
      >
        Iniciar con Google
      </button>



      <button
        className="bg-indigo-600 text-white px-4 py-2 rounded"
        onClick={() => signIn("github")}
      >
        Iniciar con GitHub
      </button>

     
    </div>
  );
}
