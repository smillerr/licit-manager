"use client";

import { useSession, signOut } from "next-auth/react";

export default function NavBar() {
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <nav className="bg-white shadow px-6 py-4 flex justify-end">
      <button
        onClick={() => signOut({ callbackUrl: "/auth/login" })}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Cerrar sesión
      </button>
    </nav>
  );
}
