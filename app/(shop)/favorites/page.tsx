import { FavoritesView } from "@/components/favorites-view";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Favorites — FITTED" };

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="fav.eyebrow" title="fav.title" />
      <FavoritesView />
    </>
  );
}
