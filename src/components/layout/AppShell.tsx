'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CommandMenu } from './CommandMenu';
import { ToastContainer } from '../ui/Toast';
import { CopilotChatDrawer } from '../copilot/CopilotChatDrawer';
import { useRiskContext } from '../../context/RiskContext';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [commandMenuOpen, setCommandMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isAuthLoading } = useRiskContext();

  useEffect(() => {
    if (!isAuthLoading) {
      if (!isAuthenticated && pathname !== '/login') {
        router.push('/login');
      }
    }
  }, [isAuthenticated, isAuthLoading, pathname, router]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">Securing Enterprise Session...</p>
      </div>
    );
  }

  if (pathname === '/login') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center font-sans relative overflow-hidden">
        <main className="w-full">
          {children}
        </main>
        <ToastContainer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-400">Redirecting to Login...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col font-sans relative transition-colors">
      {/* Fixed Sidebar */}
      <Sidebar
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-[240px] flex-1 flex flex-col min-w-0 transition-all duration-200">
        <Header
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onOpenCommandMenu={() => setCommandMenuOpen(true)}
        />

        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0 overflow-x-clip">
          {children}
        </main>
      </div>

      {/* Command Menu Modal */}
      <CommandMenu
        isOpen={commandMenuOpen}
        onClose={() => setCommandMenuOpen(false)}
      />

      {/* Enterprise AI Copilot Chatbot */}
      <CopilotChatDrawer />

      {/* Toast Notification Layer */}
      <ToastContainer />
    </div>
  );
};
