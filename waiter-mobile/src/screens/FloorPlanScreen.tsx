import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import type { MobileTable } from '../types';
import { mobileSignalR } from '../services/socket';
import { mobileApiClient } from '../services/apiClient';

interface FloorPlanScreenProps {
  staffName: string;
  onSelectTable: (table: MobileTable) => void;
  onLogout: () => void;
}

const initialTables: MobileTable[] = [
  { id: '1', tableNumber: 'T-1', section: 'Main Hall', capacity: 4, isOccupied: true, orderTotal: 1890, runningMinutes: 24, status: 'Occupied' },
  { id: '2', tableNumber: 'T-2', section: 'Main Hall', capacity: 2, isOccupied: false, status: 'Vacant' },
  { id: '3', tableNumber: 'T-3', section: 'Main Hall', capacity: 4, isOccupied: false, status: 'Vacant' },
  { id: '4', tableNumber: 'T-4', section: 'AC Section', capacity: 6, isOccupied: true, orderTotal: 3450, runningMinutes: 45, status: 'FoodReady' },
  { id: '5', tableNumber: 'T-5', section: 'AC Section', capacity: 4, isOccupied: false, status: 'Vacant' },
  { id: '6', tableNumber: 'T-6', section: 'AC Section', capacity: 2, isOccupied: false, status: 'Vacant' },
  { id: '7', tableNumber: 'P-1', section: 'Patio', capacity: 4, isOccupied: true, orderTotal: 840, runningMinutes: 12, status: 'Occupied' },
  { id: '8', tableNumber: 'P-2', section: 'Patio', capacity: 4, isOccupied: false, status: 'Vacant' },
];

export const FloorPlanScreen: React.FC<FloorPlanScreenProps> = ({
  staffName,
  onSelectTable,
  onLogout,
}) => {
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [tables, setTables] = useState<MobileTable[]>(initialTables);

  useEffect(() => {
    // Start SignalR
    mobileSignalR.startConnection('default', 'outlet-1');

    // Live table occupancy updates
    const handleStatusChange = (data: any) => {
      if (!data || !data.tableNumber) return;
      const isOccupied = Boolean(data.isOccupied);

      setTables((prev) =>
        prev.map((t) => {
          if (t.tableNumber.toUpperCase() === data.tableNumber.toUpperCase()) {
            return {
              ...t,
              isOccupied,
              status: isOccupied ? 'Occupied' : 'Vacant',
              orderTotal: isOccupied ? (data.orderTotal ?? t.orderTotal) : undefined,
              runningMinutes: isOccupied ? (t.runningMinutes || 1) : undefined,
            };
          }
          return t;
        })
      );
    };

    mobileSignalR.on('TableStatusChanged', handleStatusChange);

    // Fetch initial tables from API if available
    mobileApiClient.get('/tables')
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const apiTables: MobileTable[] = res.data.data.map((item: any) => ({
            id: item.id,
            tableNumber: item.tableNumber,
            section: item.section || 'Main Hall',
            capacity: item.seatingCapacity || 4,
            isOccupied: Boolean(item.isOccupied),
            status: item.isOccupied ? 'Occupied' : 'Vacant',
          }));
          setTables(apiTables);
        }
      })
      .catch(() => {});

    return () => {
      mobileSignalR.off('TableStatusChanged', handleStatusChange);
    };
  }, []);

  const sections = ['All', 'Main Hall', 'AC Section', 'Patio'];

  const filteredTables = tables.filter(
    (t) => selectedSection === 'All' || t.section === selectedSection
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* Top Staff Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.staffTitle}>{staffName}</Text>
          <Text style={styles.branchSub}>QuantroBill Restaurant • Floor Staff</Text>
        </View>

        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Lock PIN</Text>
        </TouchableOpacity>
      </View>

      {/* Section Filter Pills */}
      <View style={styles.sectionScroll}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsContainer}>
          {sections.map((sec) => (
            <TouchableOpacity
              key={sec}
              onPress={() => setSelectedSection(sec)}
              style={[
                styles.pill,
                selectedSection === sec ? styles.pillActive : styles.pillInactive,
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  selectedSection === sec ? styles.pillTextActive : styles.pillTextInactive,
                ]}
              >
                {sec}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tables Grid */}
      <ScrollView contentContainerStyle={styles.gridContainer}>
        {filteredTables.map((t) => {
          let statusBadge = '🟢 Vacant';
          let borderColor = '#10b981';
          let bgColor = '#ffffff';

          if (t.status === 'FoodReady') {
            statusBadge = '🔥 Food Ready';
            borderColor = '#f43f5e';
            bgColor = '#fff1f2';
          } else if (t.status === 'Occupied') {
            statusBadge = '⏳ Active KOT';
            borderColor = '#f59e0b';
            bgColor = '#fffbeb';
          }

          return (
            <TouchableOpacity
              key={t.id}
              style={[styles.tableCard, { borderColor, backgroundColor: bgColor }]}
              onPress={() => onSelectTable(t)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.tableNum}>{t.tableNumber}</Text>
                <Text style={styles.seats}>{t.capacity} Seats</Text>
              </View>

              <Text style={styles.sectionName}>{t.section}</Text>

              {t.isOccupied ? (
                <View style={styles.occupiedInfo}>
                  <Text style={styles.runningTotal}>₹{t.orderTotal}</Text>
                  <Text style={styles.runningTime}>{t.runningMinutes}m ago</Text>
                </View>
              ) : (
                <View style={styles.vacantInfo}>
                  <Text style={styles.vacantText}>Tap to Punch</Text>
                </View>
              )}

              <View style={[styles.badge, { borderColor }]}>
                <Text style={styles.badgeText}>{statusBadge}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  staffTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  branchSub: {
    fontSize: 11,
    color: '#64748b',
  },
  logoutBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  logoutText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionScroll: {
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  pillsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  pillInactive: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pillTextActive: {
    color: '#ffffff',
  },
  pillTextInactive: {
    color: '#64748b',
  },
  gridContainer: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  tableCard: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
    justifyContent: 'space-between',
    minHeight: 130,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tableNum: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  seats: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  sectionName: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  occupiedInfo: {
    marginVertical: 8,
  },
  runningTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#d97706',
  },
  runningTime: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  vacantInfo: {
    marginVertical: 10,
  },
  vacantText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '700',
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1e293b',
  },
});
