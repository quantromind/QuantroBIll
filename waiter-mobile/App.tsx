import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { showAlert } from './src/utils/alert';
import { PairDeviceScreen } from './src/screens/PairDeviceScreen';
import { LoginPinScreen } from './src/screens/LoginPinScreen';
import { FloorPlanScreen } from './src/screens/FloorPlanScreen';
import { OrderPunchScreen } from './src/screens/OrderPunchScreen';
import type { MobileTable, MobileOrderItem } from './src/types';
import { mobileApiClient, setAuthHeaders, updateApiBaseUrl } from './src/services/apiClient';
import {
  getPairedOutlet,
  clearPairedOutlet,
  getAuthSession,
  clearAuthSession,
  PairedOutlet,
} from './src/services/pairingService';

type AppScreen = 'LOADING' | 'PAIR' | 'LOGIN' | 'FLOOR' | 'ORDER';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('LOADING');
  const [pairedOutlet, setPairedOutlet] = useState<PairedOutlet | null>(null);
  const [authData, setAuthData] = useState<{ token: string; tenantId: string; outletId: string } | null>(null);
  const [staffName, setStaffName] = useState<string>('Staff');
  const [selectedTable, setSelectedTable] = useState<MobileTable | null>(null);

  // Initialize pairing and session on app start
  useEffect(() => {
    const initApp = async () => {
      try {
        const paired = await getPairedOutlet();
        if (paired) {
          setPairedOutlet(paired);
          if (paired.apiBaseUrl) {
            updateApiBaseUrl(paired.apiBaseUrl);
          }

          // Check if existing valid auth session is saved
          const session = await getAuthSession();
          if (session && session.token) {
            setAuthData({
              token: session.token,
              tenantId: paired.tenantId,
              outletId: paired.outletId,
            });
            setStaffName(session.staffName || 'Staff');
            setAuthHeaders(session.token, paired.tenantId, paired.outletId);
            setCurrentScreen('FLOOR');
            return;
          }

          // Pre-set tenant/outlet headers and show PIN screen
          setAuthHeaders('', paired.tenantId, paired.outletId);
          setCurrentScreen('LOGIN');
        } else {
          // No outlet paired yet
          setCurrentScreen('PAIR');
        }
      } catch (err) {
        console.warn('App initialization error:', err);
        setCurrentScreen('PAIR');
      }
    };

    initApp();
  }, []);

  const handlePairedSuccess = (paired: PairedOutlet) => {
    setPairedOutlet(paired);
    setAuthHeaders('', paired.tenantId, paired.outletId);
    setCurrentScreen('LOGIN');
  };

  const handleUnpairDevice = async () => {
    await clearPairedOutlet();
    setPairedOutlet(null);
    setAuthData(null);
    setSelectedTable(null);
    setCurrentScreen('PAIR');
  };

  const handleLoginSuccess = (
    name: string,
    auth: { token: string; tenantId: string; outletId: string }
  ) => {
    setStaffName(name);
    setAuthData(auth);
    setAuthHeaders(auth.token, auth.tenantId, auth.outletId);
    setCurrentScreen('FLOOR');
  };

  const handleLogout = async () => {
    await clearAuthSession();
    setAuthData(null);
    setSelectedTable(null);
    if (pairedOutlet) {
      setAuthHeaders('', pairedOutlet.tenantId, pairedOutlet.outletId);
      setCurrentScreen('LOGIN');
    } else {
      setCurrentScreen('PAIR');
    }
  };

  const handleSelectTable = (table: MobileTable) => {
    setSelectedTable(table);
    setCurrentScreen('ORDER');
  };

  const handleKOTFired = async (tableNum: string, items: MobileOrderItem[]) => {
    try {
      // Real API submission to POST /api/orders
      const res = await mobileApiClient.post('/orders', {
        orderType: 1, // DineIn
        tableNumber: tableNum,
        items: items.map((it) => ({
          menuItemId: it.itemId,
          name: it.name,
          quantity: it.quantity,
          unitPrice: it.price,
          totalPrice: it.price * it.quantity,
          isVeg: it.isVeg,
          itemNote: it.notes || '',
        })),
        orderNotes: items.find((i) => i.notes)?.notes || '',
      });

      if (res.data?.success) {
        setSelectedTable(null);
        setCurrentScreen('FLOOR');
        showAlert(
          'KOT Dispatched Successfully! 🔥',
          `Order with ${items.length} item(s) sent to Kitchen KDS and synced to live Desktop POS for ${tableNum}.`
        );
      } else {
        showAlert(
          'Order Submission Warning',
          res.data?.message || 'Server received the request with warnings.'
        );
      }
    } catch (err: any) {
      const serverErrMsg =
        err.response?.data?.message ||
        err.message ||
        'Failed to dispatch KOT order to server.';
      showAlert('KOT Dispatch Failed', serverErrMsg);
    }
  };

  if (currentScreen === 'LOADING') {
    return (
      <View style={[styles.container, styles.loadingCenter]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Initializing QuantroBill Terminal...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {currentScreen === 'PAIR' && (
        <PairDeviceScreen onPairedSuccess={handlePairedSuccess} />
      )}

      {currentScreen === 'LOGIN' && pairedOutlet && (
        <LoginPinScreen
          pairedOutlet={pairedOutlet}
          onSuccessLogin={handleLoginSuccess}
          onUnpairDevice={handleUnpairDevice}
        />
      )}

      {currentScreen === 'FLOOR' && pairedOutlet && authData && (
        <FloorPlanScreen
          staffName={staffName}
          pairedOutlet={pairedOutlet}
          authData={authData}
          onSelectTable={handleSelectTable}
          onLogout={handleLogout}
        />
      )}

      {currentScreen === 'ORDER' && selectedTable && (
        <OrderPunchScreen
          table={selectedTable}
          onBack={() => setCurrentScreen('FLOOR')}
          onKOTFired={handleKOTFired}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
});
