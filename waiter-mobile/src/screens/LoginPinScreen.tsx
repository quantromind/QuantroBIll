import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { mobileApiClient, setAuthHeaders } from '../services/apiClient';
import { PairedOutlet, setAuthSession } from '../services/pairingService';

interface LoginPinScreenProps {
  pairedOutlet: PairedOutlet;
  onSuccessLogin: (staffName: string, authData: { token: string; tenantId: string; outletId: string }) => void;
  onUnpairDevice: () => void;
}

export const LoginPinScreen: React.FC<LoginPinScreenProps> = ({
  pairedOutlet,
  onSuccessLogin,
  onUnpairDevice,
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handlePressDigit = async (digit: string) => {
    if (isSubmitting || pin.length >= 4) return;

    const newPin = pin + digit;
    setPin(newPin);
    setError(null);

    // When 4 digits are completed, perform real backend PIN authentication
    if (newPin.length === 4) {
      setIsSubmitting(true);
      try {
        const res = await mobileApiClient.post('/auth/pin-login', {
          outletId: pairedOutlet.outletId,
          pin: newPin,
        });

        if (res.data?.success && res.data.data?.accessToken) {
          const authData = res.data.data;
          const token = authData.accessToken;
          const tenantId = authData.tenant?.id || pairedOutlet.tenantId;
          const outletId = authData.activeOutlet?.id || pairedOutlet.outletId;
          const staffName =
            authData.user?.fullName ||
            authData.user?.username ||
            (authData.user?.role === 'Waiter' ? 'Sunil (Waiter)' : 'Captain');

          // Save auth session securely
          await setAuthSession({
            token,
            refreshToken: authData.refreshToken,
            staffName,
            role: authData.user?.role,
            userId: authData.user?.id,
          });

          // Set client auth headers for subsequent requests
          setAuthHeaders(token, tenantId, outletId);

          setPin('');
          setIsSubmitting(false);
          onSuccessLogin(staffName, { token, tenantId, outletId });
        } else {
          setError(res.data?.message || 'Invalid PIN code.');
          setPin('');
          setIsSubmitting(false);
        }
      } catch (err: any) {
        // Show server's actual error message directly
        const serverMsg =
          err.response?.data?.message ||
          (err.response?.status === 429
            ? 'Too many failed PIN attempts. Outlet is locked.'
            : err.response?.status === 401
            ? 'Invalid PIN code.'
            : err.message || 'Error communicating with authentication server.');
        setError(serverMsg);
        setPin('');
        setIsSubmitting(false);
      }
    }
  };

  const handleDelete = () => {
    if (isSubmitting) return;
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const confirmUnpair = () => {
    Alert.alert(
      'Unpair This Device?',
      `Are you sure you want to unpair from "${pairedOutlet.outletName}"? You will need to enter an Outlet Code to pair again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unpair Terminal',
          style: 'destructive',
          onPress: onUnpairDevice,
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* Paired Outlet Bar */}
      <View style={styles.outletBanner}>
        <View style={styles.outletInfo}>
          <Text style={styles.outletName} numberOfLines={1}>
            📍 {pairedOutlet.outletName}
          </Text>
          <Text style={styles.outletCode}>
            Code: {pairedOutlet.code} • {pairedOutlet.tenantName}
          </Text>
        </View>

        <TouchableOpacity onPress={confirmUnpair} style={styles.unpairBtn} activeOpacity={0.7}>
          <Text style={styles.unpairText}>Switch Outlet</Text>
        </TouchableOpacity>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>QB</Text>
        </View>
        <Text style={styles.title}>QuantroBill Captain</Text>
        <Text style={styles.subtitle}>Enter 4-Digit Staff PIN to Start Taking Orders</Text>
      </View>

      {/* PIN Dots Indicator */}
      <View style={styles.dotsRow}>
        {[0, 1, 2, 3].map((index) => {
          const isFilled = pin.length > index;
          return (
            <View
              key={index}
              style={[
                styles.dot,
                isFilled ? styles.dotFilled : styles.dotEmpty,
              ]}
            />
          );
        })}
      </View>

      {/* Loading & Error Status */}
      <View style={styles.statusArea}>
        {isSubmitting && (
          <View style={styles.verifyingRow}>
            <ActivityIndicator size="small" color="#2563eb" />
            <Text style={styles.verifyingText}>Verifying PIN with Server...</Text>
          </View>
        )}
        {!isSubmitting && error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>

      {/* Keypad */}
      <View style={styles.keypad}>
        {/* Row 1 */}
        <View style={styles.keypadRow}>
          {['1', '2', '3'].map((digit) => (
            <TouchableOpacity
              key={digit}
              style={styles.keyButton}
              activeOpacity={0.7}
              onPress={() => handlePressDigit(digit)}
              disabled={isSubmitting}
            >
              <Text style={styles.keyText}>{digit}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Row 2 */}
        <View style={styles.keypadRow}>
          {['4', '5', '6'].map((digit) => (
            <TouchableOpacity
              key={digit}
              style={styles.keyButton}
              activeOpacity={0.7}
              onPress={() => handlePressDigit(digit)}
              disabled={isSubmitting}
            >
              <Text style={styles.keyText}>{digit}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Row 3 */}
        <View style={styles.keypadRow}>
          {['7', '8', '9'].map((digit) => (
            <TouchableOpacity
              key={digit}
              style={styles.keyButton}
              activeOpacity={0.7}
              onPress={() => handlePressDigit(digit)}
              disabled={isSubmitting}
            >
              <Text style={styles.keyText}>{digit}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Row 4 */}
        <View style={styles.keypadRow}>
          <View style={styles.keyEmpty} />
          <TouchableOpacity
            style={styles.keyButton}
            activeOpacity={0.7}
            onPress={() => handlePressDigit('0')}
            disabled={isSubmitting}
          >
            <Text style={styles.keyText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.keyButtonDel}
            activeOpacity={0.7}
            onPress={handleDelete}
            disabled={isSubmitting}
          >
            <Text style={styles.keyTextDel}>⌫</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footerContainer}>
        <Text style={styles.footerNote}>
          Multi-Tenant Protected • Rate-Limited PIN Security
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  outletBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  outletInfo: {
    flex: 1,
    marginRight: 10,
  },
  outletName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  outletCode: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
  },
  unpairBtn: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  unpairText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  header: {
    alignItems: 'center',
    marginTop: 10,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#2563eb',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 16,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  dotEmpty: {
    backgroundColor: '#e2e8f0',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
  },
  dotFilled: {
    backgroundColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  statusArea: {
    minHeight: 38,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  verifyingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verifyingText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  keypad: {
    maxWidth: 320,
    alignSelf: 'center',
    width: '100%',
    gap: 12,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  keyButton: {
    flex: 1,
    aspectRatio: 1.3,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  keyText: {
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '700',
  },
  keyButtonDel: {
    flex: 1,
    aspectRatio: 1.3,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyTextDel: {
    color: '#334155',
    fontSize: 22,
    fontWeight: '600',
  },
  keyEmpty: {
    flex: 1,
  },
  footerContainer: {
    alignItems: 'center',
    marginBottom: 6,
  },
  footerNote: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center',
  },
});
