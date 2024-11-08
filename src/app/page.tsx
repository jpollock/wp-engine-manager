'use client';

import { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { MainLayout } from '@/components/layout/MainLayout';
import { SitesView } from '@/components/views/SitesView';
import { AccountsView } from '@/components/views/AccountsView';
import { UsersView } from '@/components/views/UsersView';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState('sites');

  if (!isAuthenticated) {
    return <LoginForm onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <MainLayout activeView={activeView} onViewChange={setActiveView}>
      {activeView === 'sites' && <SitesView />}
      {activeView === 'accounts' && <AccountsView />}
      {activeView === 'users' && <UsersView />}
    </MainLayout>
  );
}