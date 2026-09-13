import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import type { MobileTable } from '../types';
import { mobileSignalR } from '../services/socket';
import { mobileApiClient } from '../services/apiClient';
import { PairedOutlet } from '../services/pairingService';

interface FloorPlanScreenProps {
  staffName: string;
  pairedOutlet: PairedOutlet;
  authData: { token: string; tenantId: string; outletId: string };
  onSelectTable: (table: MobileTable) => void;
  onLogout: () => void;
}

export const FloorPlanScreen: React.FC<FloorPlanScreenProps> = ({
  staffName,
  pairedOutlet,
  authData,
  onSelectTable,
  onLogout,
}) => {
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [tables, setTables] = useState<MobileTable[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchTables = useCallback(async () => {
    try {
      setError(null);
      const res = await mobileApiClient.get('/tables');

      if (res.data?.success && Array.isArray(res.data.data)) {
        const apiTables: MobileTable[] = res.data.data.map((item: any) => ({
          id: item.id,
          tableNumber: item.tableNumber,
          section: item.section || 'Main Hall',
          capacity: item.seatingCapacity || 4,
          isOccupied: Boolean(item.isOccupied),
          status: item.isOccupied ? 'Occupied' : 'Vacant',
          orderTotal: item.orderTotal,
          runningMinutes: item.runningMinutes,
        }));
        setTables(apiTables);
      } else {
        setError(res.data?.message || 'Failed to retrieve tables from server.');
        setTables([]);
      }
    } catch (err: any) {
      const serverMsg =
        err.response?.data?.message ||
        err.message ||
        'Error connecting to server. Please check your network or try again.';
      setError(serverMsg);
      setTables([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // 1. Start SignalR with real tenantId, outletId, and JWT token
    mobileSignalR.startConnection(authData.tenantId, authData.outletId, authData.token);

    // 2. Real-time table occupancy listener
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

    // 3. Real-time table structure changes (created/deleted/bulk)
    const handleListChange = () => {
      fetchTables();
    };

    mobileSignalR.on('TableStatusChanged', handleStatusChange);
    mobileSignalR.on('TableListChanged', handleListChange);

    // 4. Initial live tables fetch
    fetchTables();

    return () => {
      mobileSignalR.off('TableStatusChanged', handleStatusChange);
      mobileSignalR.off('TableListChanged', handleListChange);
    };
  }, [authData.tenantId, authData.outletId, authData.token, fetchTables]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTables();
  };

  const handleLogoutPress = () => {
    mobileSignalR.stopConnection();
    onLogout();
  };

  // Derive sections dynamically from live table records
  const uniqueSections = Array.from(new Set(tables.map((t) => t.section).filter(Boolean)));
  const sections = ['All', ...uniqueSections];

  const filteredTables = tables.filter(
    (t) => selectedSection === 'All' || t.section === selectedSection
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Top Staff Bar */}
      <View style={styles.topBar}>
        <View style={styles.staffInfoCol}>
          <Text style={styles.staffTitle}>{staffName}</Text>
          <Text style={styles.branchSub} numberOfLines={1}>
            {pairedOutlet.outletName} • Floor Terminal
          </Text>
        </View>

        <TouchableOpacity onPress={handleLogoutPress} style={styles.logoutBtn} activeOpacity={0.7}>
          <Text style={styles.logoutText}>🔒 Lock PIN</Text>
        </TouchableOpacity>
      </View>

      {/* Section Filter Pills */}
      {sections.length > 1 && (
        <View style={styles.sectionScroll}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsContainer}
          >
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
      )}

      {/* Main Content: Loading, Error, or Tables Grid */}
      {isLoading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingMessage}>Loading tables from {pairedOutlet.outletName}...</Text>
          <Text style={styles.loadingSub}>Connecting to live backend</Text>
        </View>
      ) : error ? (
        <View style={styles.centeredState}>
          <View style={styles.errorCard}>
            <Text style={styles.errorBigIcon}>⚠️</Text>
            <Text style={styles.errorHeading}>Unable to Load Tables</Text>
            <Text style={styles.errorBody}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchTables} activeOpacity={0.8}>
              <Text style={styles.retryBtnText}>↻ Retry Connecting</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : tables.length === 0 ? (
        <View style={styles.centeredState}>
          <Text style={styles.emptyIcon}>🍽️</Text>
          <Text style={styles.emptyTitle}>No Tables Found</Text>
          <Text style={styles.emptySub}>
            No dining tables have been created for {pairedOutlet.outletName} yet.
          </Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchTables} activeOpacity={0.8}>
            <Text style={styles.refreshBtnText}>↻ Refresh Live Data</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.gridContainer}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#2563eb']} />
          }
        >
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
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.tableNum}>{t.tableNumber}</Text>
                  <Text style={styles.seats}>{t.capacity} Seats</Text>
                </View>

                <Text style={styles.sectionName}>{t.section}</Text>

                {t.isOccupied ? (
                  <View style={styles.occupiedInfo}>
                    {t.orderTotal !== undefined && (
                      <Text style={styles.runningTotal}>₹{t.orderTotal}</Text>
                    )}
                    {t.runningMinutes !== undefined && (
                      <Text style={styles.runningTime}>{t.runningMinutes}m ago</Text>
                    )}
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
      )}
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
  staffInfoCol: {
    flex: 1,
    marginRight: 10,
  },
  staffTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  branchSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
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
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingMessage: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 14,
    textAlign: 'center',
  },
  loadingSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  errorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 20,
    alignItems: 'center',
    maxWidth: 340,
    width: '100%',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  errorBigIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  errorHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#dc2626',
    marginBottom: 6,
    textAlign: 'center',
  },
  errorBody: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    maxWidth: 280,
  },
  refreshBtn: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  refreshBtnText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
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
