"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FcGoogle } from "react-icons/fc";

export default function LoginPage() {
  const supabase = createClient();

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <Card className="w-full max-w-md border-neutral-800 bg-neutral-900 shadow-2xl">
        <CardContent className="flex flex-col items-center gap-8 p-10">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Admin Access
            </h1>
            <p className="text-sm text-neutral-400">
              Sign in to manage fish species
            </p>
          </div>

          <Button
            onClick={loginWithGoogle}
            variant="outline"
            className="w-full bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-white flex items-center gap-3 h-12 text-base"
          >
            <FcGoogle size={20} />
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
