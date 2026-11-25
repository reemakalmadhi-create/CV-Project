import { ModelStatus, PageHeader } from "@/components/page-header";
import { TryOnView } from "@/components/tryon/tryon-view";
import { MODEL } from "@/lib/model-info";

export const metadata = { title: "Virtual try-on — FITTED" };

export default async function TryOnPage({ searchParams }: { searchParams: Promise<{ product?: string; garment?: string }> }) {
  const { product, garment } = await searchParams;
  const connected = Boolean(process.env.TRYON_API_URL);
  return (
    <>
      <PageHeader eyebrow="to.eyebrow" title="to.title">
        <ModelStatus connected={connected} model={MODEL.NAME} />
      </PageHeader>
      <TryOnView key={`${garment ?? ""}|${product ?? ""}`} initialProductId={product} initialGarmentId={garment} connected={connected} />
    </>
  );
}
