"use client";

import OAuthButtons from "@/components/auth/OAuthButtons";

export default function LoginPage() {
  return (
    <main className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Iniciar sesión</h1>
        <OAuthButtons />
      </div>
    </main>
  );
}
