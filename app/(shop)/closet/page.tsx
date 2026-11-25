import { ClosetView } from "@/components/closet-view";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Closet — FITTED" };

export default function ClosetPage() {
  return (
    <>
      <PageHeader eyebrow="closet.eyebrow" title="closet.title" />
      <ClosetView />
    </>
  );
}
