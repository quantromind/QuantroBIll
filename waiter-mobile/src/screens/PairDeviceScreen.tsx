import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { mobileApiClient, updateApiBaseUrl, API_BASE_URL, setAuthHeaders } from '../services/apiClient';
import { setPairedOutlet, PairedOutlet } from '../services/pairingService';

interface PairDeviceScreenProps {
  onPairedSuccess: (pairedOutlet: PairedOutlet) => void;
}

const PRESET_OUTLETS = [
  { label: 'Spice Garden (Baner High St)', code: 'R889021', pinHint: 'PIN: 4321' },
  { label: 'Jay Malhar (Main Branch)', code: 'JM-01', pinHint: 'PIN: 1234 / 5555' },
  { label: 'Magic Bottle (Wakad)', code: 'R443077', pinHint: 'PIN: 1234' },
];

export const PairDeviceScreen: React.FC<PairDeviceScreenProps> = ({ onPairedSuccess }) => {
  const [outletCode, setOutletCode] = useState('');
  const [serverUrl, setServerUrl] = useState(API_BASE_URL);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQrHelper, setShowQrHelper] = useState(false);
  const [qrRawInput, setQrRawInput] = useState('');

  const handlePair = async (codeToPair?: string) => {
    const code = (codeToPair || outletCode).trim();
    if (!code) {
      setError('Please enter an Outlet Code or select a preset.');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Apply any updated server URL
    if (serverUrl.trim() && serverUrl.trim() !== API_BASE_URL) {
      updateApiBaseUrl(serverUrl.trim());
    }

    try {
      const res = await mobileApiClient.get(`/auth/resolve-outlet/${encodeURIComponent(code)}`);

      if (res.data?.success && res.data.data) {
        const data = res.data.data;
        const paired: PairedOutlet = {
          outletId: data.outletId,
          tenantId: data.tenantId,
          outletName: data.outletName || data.name || 'Restaurant Outlet',
          tenantName: data.tenantName || 'Restaurant Tenant',
          code: data.code || code,
          apiBaseUrl: serverUrl.trim(),
        };

        // Persist to expo-secure-store
        await setPairedOutlet(paired);

        // Pre-configure client headers with tenant and outlet context
        setAuthHeaders('', paired.tenantId, paired.outletId);

        onPairedSuccess(paired);
      } else {
        setError(res.data?.message || 'Failed to resolve outlet code.');
      }
    } catch (err: any) {
      const serverMsg =
        err.response?.data?.message ||
        (err.response?.status === 404
          ? `Outlet code "${code}" not found. Please verify with your store manager.`
          : err.message || 'Network error connecting to backend.');
      setError(serverMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQrPayloadSubmit = () => {
    if (!qrRawInput.trim()) return;
    try {
      const parsed = JSON.parse(qrRawInput.trim());
      if (parsed.code) {
        setOutletCode(parsed.code);
        if (parsed.apiUrl) {
          setServerUrl(parsed.apiUrl);
        }
        setShowQrHelper(false);
        handlePair(parsed.code);
        return;
      }
    } catch {
      // Plain text code pasted
      setOutletCode(qrRawInput.trim());
      setShowQrHelper(false);
      handlePair(qrRawInput.trim());
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header Branding */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>QB</Text>
            </View>
            <Text style={styles.title}>Pair This Waiter Device</Text>
            <Text style={styles.subtitle}>
              Link this mobile terminal to a specific restaurant outlet before taking orders.
            </Text>
          </View>

          {/* Error Banner */}
          {error && (
            <View style={styles.errorCard}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Main Pairing Card */}
          <View style={styles.card}>
            <Text style={styles.label}>Enter Outlet Code</Text>
            <Text style={styles.helperText}>
              Find your 6-character code in your Web POS or Owner Settings (e.g. R889021).
            </Text>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="e.g. R889021"
                placeholderTextColor="#94a3b8"
                autoCapitalize="characters"
                autoCorrect={false}
                value={outletCode}
                onChangeText={(text) => {
                  setOutletCode(text.toUpperCase());
                  setError(null);
                }}
                editable={!isLoading}
              />

              <TouchableOpacity
                style={styles.qrIconBtn}
                onPress={() => setShowQrHelper(!showQrHelper)}
                activeOpacity={0.7}
              >
                <Text style={styles.qrIconText}>📷 QR</Text>
              </TouchableOpacity>
            </View>

            {/* QR Code Payload Paste / Simulation Box */}
            {showQrHelper && (
              <View style={styles.qrBox}>
                <Text style={styles.qrBoxTitle}>Scan / Paste QR Code Data</Text>
                <Text style={styles.qrBoxSub}>
                  Paste the QR scanner string or JSON payload from the terminal QR:
                </Text>
                <TextInput
                  style={styles.qrInput}
                  placeholder='{"code":"R889021"} or plain code'
                  placeholderTextColor="#94a3b8"
                  value={qrRawInput}
                  onChangeText={setQrRawInput}
                />
                <View style={styles.qrBoxActions}>
                  <TouchableOpacity
                    style={styles.qrCancelBtn}
                    onPress={() => setShowQrHelper(false)}
                  >
                    <Text style={styles.qrCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.qrApplyBtn}
                    onPress={handleQrPayloadSubmit}
                  >
                    <Text style={styles.qrApplyText}>Apply QR Code</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Primary Action Button */}
            <TouchableOpacity
              style={[styles.pairButton, isLoading && styles.pairButtonDisabled]}
              onPress={() => handlePair()}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#ffffff" size="small" />
                  <Text style={styles.pairButtonText}>Verifying Outlet...</Text>
                </View>
              ) : (
                <Text style={styles.pairButtonText}>🔗 PAIR THIS TERMINAL</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Quick Presets for Demo & Testing */}
          <View style={styles.presetsSection}>
            <Text style={styles.presetsTitle}>Quick Outlet Presets (For Testing):</Text>
            {PRESET_OUTLETS.map((preset) => (
              <TouchableOpacity
                key={preset.code}
                style={styles.presetCard}
                onPress={() => {
                  setOutletCode(preset.code);
                  handlePair(preset.code);
                }}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <View style={styles.presetInfo}>
                  <Text style={styles.presetName}>{preset.label}</Text>
                  <Text style={styles.presetCode}>Code: {preset.code} • {preset.pinHint}</Text>
                </View>
                <Text style={styles.presetArrow}>Pair →</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Advanced Server Settings Toggle */}
          <View style={styles.serverSection}>
            <TouchableOpacity
              onPress={() => setShowServerConfig(!showServerConfig)}
              style={styles.serverToggle}
            >
              <Text style={styles.serverToggleText}>
                {showServerConfig ? '▼ Hide Server Settings' : '⚙️ Advanced: Server URL Settings'}
              </Text>
            </TouchableOpacity>

            {showServerConfig && (
              <View style={styles.serverCard}>
                <Text style={styles.label}>Backend API Base URL</Text>
                <Text style={styles.helperText}>
                  Change this if connecting from a physical phone on local Wi-Fi (e.g. http://192.168.1.10:5000/api).
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="http://10.0.2.2:5000/api"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={serverUrl}
                  onChangeText={setServerUrl}
                />
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#2563eb',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  errorIcon: {
    fontSize: 18,
  },
  errorText: {
    flex: 1,
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: 1,
  },
  qrIconBtn: {
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    borderRadius: 14,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrIconText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '800',
  },
  qrBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    padding: 12,
    marginBottom: 16,
  },
  qrBoxTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e40af',
    marginBottom: 4,
  },
  qrBoxSub: {
    fontSize: 11,
    color: '#3b82f6',
    marginBottom: 8,
  },
  qrInput: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0f172a',
    marginBottom: 10,
  },
  qrBoxActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  qrCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  qrCancelText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  qrApplyBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  qrApplyText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  pairButton: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  pairButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pairButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  presetsSection: {
    marginBottom: 20,
  },
  presetsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presetCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  presetInfo: {
    flex: 1,
  },
  presetName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  presetCode: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
  },
  presetArrow: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '800',
  },
  serverSection: {
    marginTop: 8,
  },
  serverToggle: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  serverToggleText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  serverCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginTop: 8,
  },
});
