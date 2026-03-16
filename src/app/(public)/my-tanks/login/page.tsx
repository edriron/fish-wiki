"use client";

import { createClient } from "@/lib/supabase/client";
import { FcGoogle } from "react-icons/fc";
import { Waves } from "lucide-react";

export default function MyTanksLoginPage() {
  const supabase = createClient();

  const login = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/my-tanks`,
      },
    });
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-100 dark:bg-teal-900/40 mb-4">
            <Waves className="w-8 h-8 text-teal-600 dark:text-teal-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My Tanks</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
            Track your aquariums, manage your fish and plants,<br />and view stats at a glance.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 shadow-sm">
          <div className="grid grid-cols-3 gap-4 mb-8 text-center">
            {[
              { label: "Multiple tanks", icon: "🐠" },
              { label: "Track livestock", icon: "📊" },
              { label: "Private & secure", icon: "🔒" },
            ].map((f) => (
              <div key={f.label}>
                <div className="text-2xl mb-1">{f.icon}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{f.label}</p>
              </div>
            ))}
          </div>

          <button
            onClick={login}
            className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
          >
            <FcGoogle size={20} />
            Continue with Google
          </button>
          <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
            Your tanks are private and only visible to you.
          </p>
        </div>
      </div>
    </div>
  );
}
