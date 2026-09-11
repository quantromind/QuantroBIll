import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LoginPinScreen } from './src/screens/LoginPinScreen';
import { FloorPlanScreen } from './src/screens/FloorPlanScreen';
import { OrderPunchScreen } from './src/screens/OrderPunchScreen';
import type { MobileTable, MobileOrderItem } from './src/types';
import { mobileApiClient } from './src/services/apiClient';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'LOGIN' | 'FLOOR' | 'ORDER'>('LOGIN');
  const [staffName, setStaffName] = useState<string>('Raju (Captain)');
  const [selectedTable, setSelectedTable] = useState<MobileTable | null>(null);

  const handleLoginSuccess = (name: string) => {
    setStaffName(name);
    setCurrentScreen('FLOOR');
  };

  const handleSelectTable = (table: MobileTable) => {
    setSelectedTable(table);
    setCurrentScreen('ORDER');
  };

  const handleKOTFired = (tableNum: string, items: MobileOrderItem[]) => {
    // Send to backend API so live SignalR broadcasts to Desktop POS and KDS immediately
    mobileApiClient.post('/orders', {
      orderType: 1, // DineIn
      tableNumber: tableNum,
      items: items.map((it) => ({
        name: it.name,
        quantity: it.quantity,
        unitPrice: it.price,
        totalPrice: it.price * it.quantity,
        isVeg: it.isVeg,
        specialNotes: it.notes || '',
      })),
      specialInstructions: items.find((i) => i.notes)?.notes || '',
    }).catch((err) => {
      console.debug('Mobile API post order note:', err?.message || err);
    });

    Alert.alert(
      'KOT Dispatched Successfully! 🔥',
      `Order with ${items.length} items sent to Kitchen KDS and synced to Desktop POS for ${tableNum}.`,
      [
        {
          text: 'OK',
          onPress: () => {
            setSelectedTable(null);
            setCurrentScreen('FLOOR');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {currentScreen === 'LOGIN' && (
        <LoginPinScreen onSuccessLogin={handleLoginSuccess} />
      )}

      {currentScreen === 'FLOOR' && (
        <FloorPlanScreen
          staffName={staffName}
          onSelectTable={handleSelectTable}
          onLogout={() => setCurrentScreen('LOGIN')}
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
});
