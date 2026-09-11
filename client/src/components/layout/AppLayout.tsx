import React from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { NavigationDrawer } from './NavigationDrawer';

export const AppLayout: React.FC = () => {
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
