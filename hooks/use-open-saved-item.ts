"use client";

import { useEffect, useEffectEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createActivityStore } from "@/lib/history/store";
import { SAVED_ITEM_QUERY_KEY, type SavedFeatureType, type SavedItemRecord } from "@/lib/history/types";

export function useOpenSavedItem(
  featureType: SavedFeatureType,
  onOpen: (record: SavedItemRecord) => void,
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const handleOpen = useEffectEvent(onOpen);

  useEffect(() => {
    const savedId = searchParams.get(SAVED_ITEM_QUERY_KEY);
    if (!savedId) {
      return;
    }

    const record = createActivityStore().get(savedId);
    if (!record || record.featureType !== featureType) {
      return;
    }

    handleOpen(record);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete(SAVED_ITEM_QUERY_KEY);
    const nextUrl = nextParams.size > 0 ? `${pathname}?${nextParams.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [featureType, pathname, router, searchParams]);
}
