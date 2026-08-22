export type CoverCandidate = {
  assetId: string;
  displayOrder: number;
  isCover: boolean;
  lifecycleStatus: string;
};

const NON_DELIVERABLE_STATUSES = new Set([
  'UPLOAD_PENDING',
  'VALIDATION_FAILED',
  'CLEANUP_CANDIDATE',
  'DELETING',
  'PHYSICALLY_DELETED',
]);

/**
 * Deliverable / displayable media lifecycles:
 * Accepts MASTER_READY, READY, VALIDATING, UPLOADED or active local/mock media.
 * Rejects unconfirmed UPLOAD_PENDING or failure/deletion lifecycles.
 */
export function isDeliverableMediaLifecycle(status?: string | null): boolean {
  if (!status) return true;
  return !NON_DELIVERABLE_STATUSES.has(status.toUpperCase().trim());
}

/**
 * Kapak: önce deliverable havuz, içinde isCover, yoksa displayOrder.
 * Deliverable yoksa null (kırık URL yerine placeholder).
 */
export function pickDeliverableCover<T extends CoverCandidate>(
  media: T[] | undefined | null
): T | null {
  if (!media?.length) return null;
  const deliverable = media.filter((m) =>
    isDeliverableMediaLifecycle(m.lifecycleStatus)
  );
  if (!deliverable.length) return null;

  // Prefer MASTER_READY / READY items over in-flight items
  const ready = deliverable.filter(
    (m) =>
      m.lifecycleStatus === 'MASTER_READY' ||
      m.lifecycleStatus === 'READY'
  );
  const pool = ready.length > 0 ? ready : deliverable;

  return (
    pool.find((m) => m.isCover) ??
    [...pool].sort((a, b) => a.displayOrder - b.displayOrder)[0] ??
    null
  );
}

export function filterDeliverableMedia<T extends CoverCandidate>(
  media: T[] | undefined | null
): T[] {
  if (!media?.length) return [];
  return media.filter((m) => isDeliverableMediaLifecycle(m.lifecycleStatus));
}
