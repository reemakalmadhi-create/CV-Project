import { ModelStatus, PageHeader } from "@/components/page-header";
import { TryOnView } from "@/components/tryon/tryon-view";
import { MODEL } from "@/lib/model-info";

export const metadata = { title: "Virtual try-on — FITTED" };

export default async function TryOnPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { product } = await searchParams;
  const connected = Boolean(process.env.TRYON_API_URL);
  return (
    <>
      <PageHeader eyebrow="to.eyebrow" title="to.title">
        <ModelStatus connected={connected} model={MODEL.NAME} />
      </PageHeader>
      <TryOnView key={product ?? "none"} initialProductId={product} connected={connected} />
    </>
  );
}
