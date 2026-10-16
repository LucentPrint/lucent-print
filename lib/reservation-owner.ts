type VerifiedUser = { email?: string | null; email_confirmed_at?: string | null } | null;

// The caller must obtain this user from Supabase auth.getUser(), not a client-supplied session/profile.
export function isReservationOwner(user: VerifiedUser, emails: string[]) {
  if (!user?.email || !user.email_confirmed_at) return false;
  const email = user.email.trim().toLowerCase();
  return emails.some((allowed) => allowed.trim().toLowerCase() === email);
}
