/** Shared by the forms (instant feedback) and the API (the real check). */
export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/;

export function emailError(email: string): string | null {
  const e = email.trim();
  if (!e) return "Please enter your email.";
  if (!EMAIL_RE.test(e) || e.length > 254) return "Please enter a valid email address.";
  return null;
}

export function passwordProblems(pw: string): string[] {
  const out: string[] = [];
  if ((pw || "").length < 8) out.push("at least 8 characters");
  if (!/[A-Za-z]/.test(pw || "")) out.push("a letter");
  if (!/\d/.test(pw || "")) out.push("a number");
  return out;
}

export function nameError(name: string): string | null {
  const n = name.trim().replace(/\s+/g, " ");
  if (n.length < 2) return "Please enter your full name.";
  if (n.length > 80) return "Name is too long.";
  return null;
}
