'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const { user } = useAuth();
  
  // Do not show sidebar on landing page or login page
  const noSidebarRoutes = ['/', '/login'];
  const showSidebar = user && !noSidebarRoutes.includes(pathname);

  if (!showSidebar) {
    return <main>{children}</main>;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
