import { MyClosetView } from "@/components/my-closet-view";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "My closet — FITTED" };

export default function MyClosetPage() {
  return (
    <>
      <PageHeader eyebrow="mc.eyebrow" title="mc.title" />
      <MyClosetView />
    </>
  );
}
