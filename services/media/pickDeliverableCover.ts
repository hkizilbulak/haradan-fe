export type CoverCandidate = {
  assetId: string;
  displayOrder: number;
  isCover: boolean;
  lifecycleStatus: string;
};

/** Delivery yalnızca MASTER_READY + READY variant ile çalışır. */
export function isDeliverableMediaLifecycle(status: string): boolean {
  return status === 'MASTER_READY';
}

/**
 * Kapak: önce deliverable havuz, içinde isCover, yoksa displayOrder.
 * Deliverable yoksa null (kırık URL yerine placeholder).
 */
export function pickDeliverableCover<T extends CoverCandidate>(
  media: T[] | undefined | null
): T | null {
  if (!media?.length) return null;
  const ready = media.filter((m) =>
    isDeliverableMediaLifecycle(m.lifecycleStatus)
  );
  if (!ready.length) return null;
  return (
    ready.find((m) => m.isCover) ??
    [...ready].sort((a, b) => a.displayOrder - b.displayOrder)[0] ??
    null
  );
}

export function filterDeliverableMedia<T extends CoverCandidate>(
  media: T[] | undefined | null
): T[] {
  if (!media?.length) return [];
  return media.filter((m) => isDeliverableMediaLifecycle(m.lifecycleStatus));
}
