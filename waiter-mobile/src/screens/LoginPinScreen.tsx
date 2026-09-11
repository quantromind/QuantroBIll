import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';

import { mobileApiClient, setAuthHeaders } from '../services/apiClient';

interface LoginPinScreenProps {
  onSuccessLogin: (staffName: string) => void;
}

export const LoginPinScreen: React.FC<LoginPinScreenProps> = ({ onSuccessLogin }) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handlePressDigit = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError(null);

      // Auto-validate 4 digits
      if (newPin.length === 4) {
        if (newPin === '1234' || newPin === '0000' || newPin === '5555') {
          mobileApiClient.post('/auth/login', {
            identifier: 'biller@spicegarden.com',
            password: 'Biller@123'
          }).then((res) => {
            if (res.data?.data?.accessToken) {
              setAuthHeaders(res.data.data.accessToken, res.data.data.tenant?.id || 'default', res.data.data.activeOutlet?.id || 'outlet-1');
            }
          }).catch(() => {});

          setTimeout(() => {
            onSuccessLogin(newPin === '5555' ? 'Sunil (Waiter)' : 'Raju (Captain)');
          }, 200);
        } else {
          setTimeout(() => {
            setError('Invalid PIN. Default Captain PIN: 1234');
            setPin('');
          }, 300);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>PB</Text>
        </View>
        <Text style={styles.title}>PetBharke Captain</Text>
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

      {/* Error Message */}
      {error && <Text style={styles.errorText}>{error}</Text>}

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
          >
            <Text style={styles.keyText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.keyButtonDel}
            activeOpacity={0.7}
            onPress={handleDelete}
          >
            <Text style={styles.keyTextDel}>⌫</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <Text style={styles.footerNote}>
        Demo Captain PIN: 1234 • Waiter PIN: 5555 • Connected to Live POS
      </Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#2563eb',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
  },
  title: {
    fontSize: 22,
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
    marginVertical: 24,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  dotEmpty: {
    backgroundColor: '#e2e8f0',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  dotFilled: {
    backgroundColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  errorText: {
    color: '#e11d48',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
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
  footerNote: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 10,
  },
});
