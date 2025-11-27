"use client";

import React, { useState } from "react";
import { signIn, useSession } from "next-auth/react";

export default function LoginPage() {
  const { data: session } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();

  const res = await signIn("credentials", {
    redirect: false, // 👈 IMPORTANTE
    email,
    password,
  });

  if (res?.error) {
    console.log("Error al iniciar sesión");
    return;
  }

  // 👇 Una vez logueado, revisamos el rol del usuario
  const session = await fetch("/api/auth/session").then((r) => r.json());

  if (session?.user?.role === "admin") {
    window.location.href = "/admin/dashboard";   // 👈 REDIRECCIÓN A DASHBOARD
  } else {
    window.location.href = "/";                  // 👈 NORMAL USER
  }
}


  return (
    <>
      <div className="h-screen w-full flex justify-center items-center page_bg p-4">
        <form
          onSubmit={handleLogin}
          className="bg-white/90 backdrop-blur-md w-full max-w-md rounded-2xl shadow-2xl p-8"
        >
          <h1 className="text-gray-800 font-bold text-2xl mb-1">Hello Again!</h1>
          <p className="text-sm text-gray-600 mb-8">Welcome Licit Manager</p>

          {/* EMAIL */}
          <div className="flex items-center border-2 mb-6 py-2 px-3 rounded-2xl">
            <input
              className="pl-2 w-full outline-none border-none"
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* PASSWORD */}
          <div className="flex items-center border-2 mb-6 py-2 px-3 rounded-2xl">
            <input
              className="pl-2 w-full outline-none border-none"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="block w-full bg-indigo-600 py-2 rounded-2xl 
              hover:bg-indigo-700 hover:-translate-y-1 transition-all duration-500 
              text-white font-semibold mb-4"
          >
            Login
          </button>

          {/* OAuth */}
          <div className="flex flex-col mt-4 gap-3">

            {/* GOOGLE */}
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="flex items-center justify-center gap-3 border-2 py-2 rounded-2xl 
                bg-white hover:bg-gray-100 transition-all duration-300"
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                className="w-5 h-5"
                alt="Google logo"
              />
              <span className="font-semibold text-gray-700">Sign in with Google</span>
            </button>

            {/* GITHUB */}
            <button
              type="button"
              onClick={() => signIn("github", { callbackUrl: "/" })}
              className="flex items-center justify-center gap-3 py-2 rounded-2xl
                bg-[#24292f] text-white hover:bg-black transition-all duration-300 shadow-lg"
            >
              <img
                src="https://www.svgrepo.com/show/512317/github-142.svg"
                className="w-5 h-5 invert"
                alt="Github logo"
              />
              <span className="font-semibold">Sign in with GitHub</span>
            </button>

          </div>

        </form>
      </div>
    </>
  );
}
