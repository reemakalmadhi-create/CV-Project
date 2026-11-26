import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await currentUser()) redirect("/");
  return <main className="flex min-h-svh items-center justify-center px-5 py-16">{children}</main>;
}
