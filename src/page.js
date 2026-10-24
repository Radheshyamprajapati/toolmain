"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { FiArrowRight, FiTool } from "react-icons/fi";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white">
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-2xl font-bold">
          <FiTool className="w-8 h-8" />
          ToolHive
        </div>
        <div className="flex gap-4">
          {session ? (
            <Link href="/tools" className="bg-white text-indigo-700 px-6 py-2 rounded-lg font-medium hover:bg-opacity-90 transition">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="px-4 py-2 rounded-lg hover:bg-white/10 transition">
                Sign In
              </Link>
              <Link href="/register" className="bg-white text-indigo-700 px-6 py-2 rounded-lg font-medium hover:bg-opacity-90 transition">
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl md:text-6xl font-bold leading-tight">
          Rent Tools. <br /> Get the Job Done.
        </h1>
        <p className="mt-6 text-xl text-white/80 max-w-2xl mx-auto">
          Find professional equipment from nearby electricians and builders. Or list your own tools and earn money.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register" className="bg-white text-indigo-700 px-8 py-3 rounded-lg font-semibold text-lg shadow-lg hover:bg-opacity-90 transition flex items-center justify-center gap-2">
            Start Renting <FiArrowRight />
          </Link>
          <Link href="/tools" className="border border-white/40 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-white/10 transition">
            Browse Tools
          </Link>
        </div>

        {/* Demo credentials hint */}
        <div className="mt-16 p-6 bg-white/10 rounded-xl inline-block text-left">
          <p className="font-semibold text-lg mb-2">🔑 Demo Users</p>
          <p>john@demo.com / demo1234 (Electrician)</p>
          <p>sarah@demo.com / demo1234 (Builder)</p>
          <p>tom@demo.com / demo1234 (Customer)</p>
        </div>
      </main>
    </div>
  );
}
