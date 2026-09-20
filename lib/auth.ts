import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createClient();
  if (!supabase) return null;
  return (await supabase.auth.getUser()).data.user;
}

export function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireAdmin() {
  const supabase = await createClient();
  if (!supabase) return null;
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return null;
  if (user.email && adminEmails().includes(user.email.toLowerCase())) return user;
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return data?.role === "admin" || data?.role === "owner" ? user : null;
}
