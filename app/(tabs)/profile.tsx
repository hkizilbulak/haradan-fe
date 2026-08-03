/**
 * Profil sayfası — satır skeleton + auth hatası örneği
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenWrapper } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useRouter } from 'expo-router';

interface Profile {
  name: string;
  email: string;
  phone: string;
}

async function fetchProfile(): Promise<Profile> {
  await new Promise((r) => setTimeout(r, 1000));

  // 401 simülasyonu: throw new Error('Oturum süresi doldu');
  return { name: 'Ahmet Yılmaz', email: 'ahmet@example.com', phone: '+90 555 000 00 00' };
}

function ProfileField({ label, value }: { label: string; value: string }) {
  const text = useThemeColor('text');
  const textSecondary = useThemeColor('textSecondary');
  const border = useThemeColor('border');

  return (
    <View style={[styles.field, { borderBottomColor: border }]}>
      <Text style={[styles.label, { color: textSecondary }]}>{label}</Text>
      <Text style={[styles.value, { color: text }]}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch } = useAsync(fetchProfile);
  const bg = useThemeColor('background');

  return (
    <ScreenWrapper
      isLoading={isLoading}
      loadingVariant="rows"
      loadingCount={4}
      isError={isError}
      errorVariant="auth"
      errorMessage={error}
      onRetry={refetch}
      errorSecondaryLabel="Giriş Yap"
      onErrorSecondaryAction={() => router.push('/login' as never)}
      scrollable
    >
      {data ? (
        <View style={[styles.container, { backgroundColor: bg }]}>
          <ProfileField label="Ad Soyad" value={data.name} />
          <ProfileField label="E-posta" value={data.email} />
          <ProfileField label="Telefon" value={data.phone} />
        </View>
      ) : null}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 8 },
  field: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    gap: 4,
  },
  label: { fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 16 },
});
