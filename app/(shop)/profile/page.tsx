import { ProfileView } from "@/components/profile-view";

export const metadata = { title: "My profile — FITTED" };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  return <ProfileView initialTab={tab} />;
}
