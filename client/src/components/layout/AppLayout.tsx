import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { NavigationDrawer } from './NavigationDrawer';
import { useAuthStore } from '../../store/authStore';
import { usePosSyncStore } from '../../store/posSyncStore';
import { useTableStore } from '../../store/tableStore';

export const AppLayout: React.FC = () => {
  const { tenant, activeOutlet } = useAuthStore();
  const fetchInitialData = usePosSyncStore((state) => state.fetchInitialData);
  const initializeSignalRSync = usePosSyncStore((state) => state.initializeSignalRSync);
  const initializeTableSync = useTableStore((state) => state.initializeSignalRSync);
  const fetchTablesFromApi = useTableStore((state) => state.fetchTablesFromApi);

  useEffect(() => {
    // Only synchronize POS tables and orders when operating within restaurant tenant/outlet scope
    if (tenant || activeOutlet) {
      fetchInitialData();
      initializeSignalRSync();
      initializeTableSync();
      fetchTablesFromApi();
    }
  }, [tenant, activeOutlet, fetchInitialData, initializeSignalRSync, initializeTableSync, fetchTablesFromApi]);

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col antialiased">
      <TopBar />
      <NavigationDrawer />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};
