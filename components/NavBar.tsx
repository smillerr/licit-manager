"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function NavBar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  // No mostrar navbar si no hay sesión o estamos en login
  if (!session || pathname === "/auth/login") return null;

  const isAdmin = (session.user as any)?.role === "admin";

  return (
    <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
      <div className="flex gap-4">
        <Link
          href="/"
          className="text-gray-700 hover:text-gray-900 font-medium"
        >
          Home
        </Link>
        {isAdmin && (
          <Link
            href="/admin/dashboard"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Admin Dashboard
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          Welcome, {session.user?.name || session.user?.email}
          {isAdmin && (
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
              Admin
            </span>
          )}
        </span>
        <button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
}
