"use client";

import OAuthButtons from "@/components/auth/OAuthButtons";
import "@/styles/globals.css";

export default function LoginPage() {
  return (
    <main
      className="flex justify-center items-center min-h-screen bg-cover bg-center"
      style={{
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.75)), url('https://images.unsplash.com/photo-1554224154-22dec7ec8818?auto=format&fit=crop&w=1920&q=80)",
      }}
    >
      <OAuthButtons />
    </main>
  );
}
