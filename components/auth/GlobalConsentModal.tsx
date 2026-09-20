import React, { useEffect, useState } from 'react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { ConsentModal } from './ConsentModal';
import { getAuthSession, patchAuthSession } from '@/services/auth/sessionStore';

export function GlobalConsentModal() {
  const { session, ready } = useAuthSession();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (ready && session?.user?.hasPendingConsents) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [ready, session]);

  if (!visible) return null;

  return (
    <ConsentModal 
      visible={visible} 
      onSuccess={async () => {
        setVisible(false);
        const s = getAuthSession();
        if (s) {
          patchAuthSession({ user: { ...s.user, hasPendingConsents: false } });
        }
      }} 
    />
  );
}
