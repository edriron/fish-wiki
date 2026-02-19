import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "@/components/admin/AdminNav";
import { Toaster } from "sonner";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!role || role.role !== "admin") {
    redirect("/");
  }

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split("@")[0] ??
    "Admin";

  return (
    <div className="bg-slate-50 dark:bg-slate-900 md:flex md:h-screen md:overflow-hidden">
      <AdminNav userName={displayName} />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <div className="mx-auto max-w-5xl px-4 sm:px-8 py-6 md:py-8">{children}</div>
      </main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
