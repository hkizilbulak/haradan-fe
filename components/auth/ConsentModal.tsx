import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthTheme } from '@/components/auth/AuthThemeContext';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { AuthSubmitButton } from './AuthSubmitButton';
import { HttpClient, resolveApiBaseUrl } from '@/services/http';
import { useAuthSession } from '@/hooks/useAuthSession';

export function ConsentModal({ visible, onSuccess }: { visible: boolean; onSuccess: () => void }) {
  const { tokens } = useAuthTheme();
  const { session } = useAuthSession();
  
  // Initialize API client inside the component to ensure env vars are loaded
  const baseUrl = resolveApiBaseUrl() || 'https://haradan-be-production.up.railway.app/api';
  const api = new HttpClient(baseUrl);

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [campaignAccepted, setCampaignAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!termsAccepted || !kvkkAccepted) {
      setError('Üyelik Sözleşmesi ve KVKK onayı zorunludur.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.request('/v1/me/consent', {
        method: 'POST',
        accessToken: session?.accessToken,
        body: JSON.stringify({
          termsAccepted,
          kvkkAccepted,
          marketingConsent: campaignAccepted,
        }),
      });
      onSuccess();
    } catch (e: any) {
      setError(e.message || 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => {
        // Prevent closing
      }}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
        <SafeAreaView style={{ width: '100%', maxWidth: 500, padding: Spacing.md }}>
          <View style={{ 
            backgroundColor: tokens.background, 
            borderRadius: 16, 
            padding: Spacing.xl,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 24,
            elevation: 10
          }}>
            <View style={{ alignItems: 'center', marginBottom: Spacing.xl }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: tokens.primary + '20', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md }}>
                <Ionicons name="document-text" size={32} color={tokens.primary} />
              </View>
              <Text style={[Typography.h2, { color: tokens.text, textAlign: 'center' }]}>
                Sözleşme Güncellemesi
              </Text>
              <Text style={[Typography.body, { color: tokens.textSecondary, textAlign: 'center', marginTop: Spacing.sm }]}>
                Uygulamamızı kullanmaya devam edebilmeniz için aşağıdaki sözleşmeleri onaylamanız gerekmektedir.
              </Text>
            </View>

            <View style={{ gap: Spacing.md, marginBottom: Spacing.xl }}>
              <TouchableOpacity style={styles.checkboxRow} onPress={() => { setTermsAccepted(!termsAccepted); setError(null); }}>
                <View style={[styles.checkbox, { borderColor: termsAccepted ? tokens.primary : tokens.border, backgroundColor: termsAccepted ? tokens.primary : 'transparent' }]}>
                  {termsAccepted && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={[styles.checkboxLabel, { color: tokens.textSecondary }]}>
                  <Text style={{ color: tokens.primary, fontWeight: '600' }}>
                    Üyelik ve Hizmet Sözleşmesini
                  </Text> okudum, kabul ediyorum.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.checkboxRow} onPress={() => { setKvkkAccepted(!kvkkAccepted); setError(null); }}>
                <View style={[styles.checkbox, { borderColor: kvkkAccepted ? tokens.primary : tokens.border, backgroundColor: kvkkAccepted ? tokens.primary : 'transparent' }]}>
                  {kvkkAccepted && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={[styles.checkboxLabel, { color: tokens.textSecondary }]}>
                  <Text style={{ color: tokens.primary, fontWeight: '600' }}>
                    KVKK Aydınlatma Metnini
                  </Text> okudum ve Açık Rıza Beyanını kabul ediyorum.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.checkboxRow} onPress={() => setCampaignAccepted(!campaignAccepted)}>
                <View style={[styles.checkbox, { borderColor: campaignAccepted ? tokens.primary : tokens.border, backgroundColor: campaignAccepted ? tokens.primary : 'transparent' }]}>
                  {campaignAccepted && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={[styles.checkboxLabel, { color: tokens.textSecondary }]}>
                  Kampanya, indirim ve yeniliklerden haberdar olmak için E-Posta ve SMS ile iletişime geçilmesine izin veriyorum.
                </Text>
              </TouchableOpacity>
              
              {error && (
                <Text style={{ color: tokens.error, fontSize: 13, marginTop: 4 }}>{error}</Text>
              )}
            </View>

            <AuthSubmitButton
              label="Onayla ve Devam Et"
              onPress={handleSubmit}
              loading={loading}
              disabled={!termsAccepted || !kvkkAccepted}
            />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
