import { BagView } from "@/components/bag-view";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Shopping bag — FITTED" };

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="bag.eyebrow" title="bag.title" />
      <BagView />
    </>
  );
}
