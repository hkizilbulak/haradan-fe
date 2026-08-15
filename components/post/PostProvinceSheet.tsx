import React from 'react';
import { PostPlaceSheet } from './PostPlaceSheet';
import { useProvinces } from '@/hooks/useLocation';

type PostProvinceSheetProps = {
  visible: boolean;
  selectedId: string | null;
  onClose: () => void;
  onSelect: (id: string) => void;
};

export function PostProvinceSheet({
  visible,
  selectedId,
  onClose,
  onSelect,
}: PostProvinceSheetProps) {
  const { items, loading } = useProvinces();
  return (
    <PostPlaceSheet
      visible={visible}
      title="İl seçin"
      items={items}
      selectedId={selectedId}
      loading={loading}
      emptyText="İl listesi boş."
      onClose={onClose}
      onSelect={onSelect}
    />
  );
}
