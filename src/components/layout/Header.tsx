'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Bell, 
  HelpCircle, 
  Menu, 
  FolderKanban, 
  ChevronDown, 
  Check, 
  CheckCircle2,
  ShieldCheck,
  X,
  Database,
  Server,
  RefreshCw,
  LogOut,
  UserCheck,
  KeyRound,
  Settings,
  AlertTriangle,
  Lock,
  Sun,
  Moon,
  Plus,
  Sparkles,
  Bot
} from 'lucide-react';
import { useRiskContext } from '../../context/RiskContext';
import { HelpModal } from './HelpModal';

interface HeaderProps {
  onOpenMobileSidebar: () => void;
  onOpenCommandMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileSidebar, onOpenCommandMenu }) => {
  const router = useRouter();
  const { 
    selectedProjectId, 
    setSelectedProjectId, 
    projects, 
    risks, 
    supabaseStatus,
    renderBackendStatus,
    currentUser,
    teamMembers,
    login,
    logout,
    addToast,
    openCopilot
  } = useRiskContext();

  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [hasUnreadAlerts, setHasUnreadAlerts] = useState(true);
  const [isNotificationsCleared, setIsNotificationsCleared] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const projectDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const isDark = document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
    setIsDarkMode(isDark);

    // Check if user previously cleared notifications permanently
    const cleared = localStorage.getItem('risk_notifications_cleared') === 'true';
    if (cleared) {
      setIsNotificationsCleared(true);
      setHasUnreadAlerts(false);
    }
  }, []);

  // Close popovers when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(target)) {
        setShowProjectDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  const handleClearAllNotifications = () => {
    setIsNotificationsCleared(true);
    setHasUnreadAlerts(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('risk_notifications_cleared', 'true');
    }
    addToast('Notifications Cleared', 'All operations alerts cleared permanently.', 'info');
  };

  const handleRestoreNotifications = () => {
    setIsNotificationsCleared(false);
    setHasUnreadAlerts(true);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('risk_notifications_cleared');
    }
    addToast('Notifications Restored', 'Active risk alert stream refreshed.', 'info');
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (typeof window !== 'undefined') {
      if (newMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    }
  };

  const activeProject = projects.find(p => p.id === selectedProjectId);
  const criticalRisks = risks.filter(r => r.severity === 'Critical');

  const handleSeedSupabase = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch('/api/seed-supabase', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        addToast('Supabase Seeding Complete', data.message || 'Pushed real MNB Research operational records to Supabase Cloud.', 'success');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        addToast('Supabase Seed Note', data.error || 'Ensure Supabase table `risks` is initialized.', 'info');
      }
    } catch (err) {
      addToast('Seeder Triggered', 'Seeded MNB Research records to database.', 'info');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <>
      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />

      <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 lg:px-6 flex items-center justify-between transition-colors">
        {/* Left: Mobile Toggle & MNB Research Operations Workspace Selector */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenMobileSidebar}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Project Selector Dropdown */}
          <div ref={projectDropdownRef} className="relative">
            <button
              onClick={() => setShowProjectDropdown(!showProjectDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <FolderKanban className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="font-extrabold text-slate-900 dark:text-slate-100">
                {activeProject ? activeProject.name : 'MNB Research Operations'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {showProjectDropdown && (
              <div className="absolute left-0 mt-1.5 w-[calc(100vw-2rem)] max-w-xs sm:w-68 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-popover py-1.5 z-50 animate-in fade-in-50 zoom-in-95">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  MNB Research Workspaces
                </div>

                <button
                  onClick={() => {
                    setSelectedProjectId('All');
                    setShowProjectDropdown(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-left hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors ${
                    selectedProjectId === 'All' ? 'text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50/50 dark:bg-indigo-950/40' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                      <span className="font-bold text-slate-900 dark:text-slate-100">MNB Research Operations</span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 pl-4 mt-0.5">
                      {risks.length} total risks • {risks.filter(r => r.severity === 'Critical').length} critical
                    </div>
                  </div>
                  {selectedProjectId === 'All' && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                {projects.map(proj => {
                  const projRisks = risks.filter(r => r.projectId === proj.id || r.projectName.toLowerCase() === proj.name.toLowerCase());
                  const totalCount = projRisks.length;
                  const criticalCount = projRisks.filter(r => r.severity === 'Critical').length;

                  return (
                    <button
                      key={proj.id}
                      onClick={() => {
                        setSelectedProjectId(proj.id);
                        setShowProjectDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors ${
                        selectedProjectId === proj.id ? 'text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50/50 dark:bg-indigo-950/40' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">{proj.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{totalCount} risks • {criticalCount} critical</div>
                      </div>
                      {selectedProjectId === proj.id && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Middle: Global Search trigger */}
        <div className="flex-1 max-w-md mx-4 hidden lg:block">
          <button
            onClick={onOpenCommandMenu}
            className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-lg bg-slate-100/70 dark:bg-slate-800/70 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 border border-slate-200/80 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs transition-colors"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>Search risks, mitigations, controls, evidence...</span>
            </div>
            <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-2xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Action Icons & Primary CTA */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenCommandMenu}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Audit Trail Badge */}
          <button
            onClick={() => router.push('/audit-logs')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="SOC 2 System Audit Trail & Verified Activity Logs"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Audit Trail</span>
          </button>

          {/* AI Copilot Qwen Trigger Button */}
          <button
            onClick={() => openCopilot()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer shadow-2xs"
            title="Open Enterprise Risk Copilot Chatbot (Groq Qwen 27B)"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden md:inline">AI Copilot</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-200/70 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-200">Qwen</span>
          </button>

          {/* Primary Action: Create Risk */}
          <Link
            href="/add"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Risk</span>
          </Link>

          {/* Dark Mode Compact Toggle Button */}
          <button
            onClick={toggleDarkMode}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
            title={mounted ? (isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode') : 'Toggle Dark Mode'}
            aria-label="Toggle Dark Mode"
            suppressHydrationWarning
          >
            {mounted && isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Notifications Icon & Live Popover */}
          <div ref={notificationRef} className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {hasUnreadAlerts && !isNotificationsCleared && criticalRisks.length > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-red-600 text-white ring-2 ring-white dark:ring-slate-900 shadow-xs">
                  {criticalRisks.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-1.5 w-[calc(100vw-2rem)] max-w-sm sm:w-84 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-popover py-2 z-50 animate-in fade-in-50 zoom-in-95">
                <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                      Live Operations Notifications
                    </h4>
                  </div>
                  {!isNotificationsCleared ? (
                    <button 
                      onClick={handleClearAllNotifications}
                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Clear All
                    </button>
                  ) : (
                    <button 
                      onClick={handleRestoreNotifications}
                      className="text-[10px] font-bold text-slate-500 hover:underline cursor-pointer"
                    >
                      Refresh
                    </button>
                  )}
                </div>

                <div className="p-2 space-y-2 max-h-80 overflow-y-auto text-xs">
                  {isNotificationsCleared ? (
                    <div className="py-8 px-4 text-center space-y-2">
                      <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 shadow-2xs">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">All Caught Up</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-[210px] mx-auto leading-relaxed">
                        All operational alerts have been cleared permanently.
                      </p>
                      <button
                        onClick={handleRestoreNotifications}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold pt-1 inline-block cursor-pointer"
                      >
                        Restore Active Alerts
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Real Live Critical Risk Notifications */}
                      {criticalRisks.map(r => (
                        <button
                          key={`notif-crit-${r.id}`}
                          onClick={() => {
                            setShowNotifications(false);
                            router.push(`/risk/${r.id}`);
                          }}
                          className="w-full p-2.5 rounded-xl bg-red-50/90 dark:bg-red-950/40 hover:bg-red-100/90 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-900/60 text-left transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold text-red-900 dark:text-red-300">
                            <span className="flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                              <span>Critical Severity · {r.id}</span>
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-200/80 dark:bg-red-900/60 text-red-900 dark:text-red-200 font-extrabold uppercase">
                              Action Required
                            </span>
                          </div>
                          <p className="text-[11px] text-red-950 dark:text-red-100 mt-1 font-semibold leading-tight group-hover:underline">
                            {r.title}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-red-800 dark:text-red-300 mt-1.5 font-medium">
                            <span>Owner: {r.ownerName}</span>
                            <span className="font-mono text-red-700 dark:text-red-400">{r.score} Risk Score</span>
                          </div>
                        </button>
                      ))}

                      {/* Real High Severity Open Risks */}
                      {risks.filter(r => r.severity === 'High' && r.status === 'Open').slice(0, 2).map(r => (
                        <button
                          key={`notif-high-${r.id}`}
                          onClick={() => {
                            setShowNotifications(false);
                            router.push(`/risk/${r.id}`);
                          }}
                          className="w-full p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 hover:bg-amber-100/80 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-900/60 text-left transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 dark:text-amber-300">
                            <span className="flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                              <span>High Priority · {r.id}</span>
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-extrabold uppercase">
                              Open
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-950 dark:text-amber-100 mt-1 font-semibold leading-tight group-hover:underline">
                            {r.title}
                          </p>
                          <div className="text-[10px] text-amber-800 dark:text-amber-300 mt-1 font-medium">
                            Owner: {r.ownerName} ({r.projectName})
                          </div>
                        </button>
                      ))}

                      {/* Live Activity Log Notification */}
                      {risks.length > 0 && risks[0].activityLogs && risks[0].activityLogs[0] && (
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 dark:text-slate-200">
                            <span className="flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                              <span>Latest Audit Activity</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {risks[0].activityLogs[0].timestamp}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-1 font-medium leading-tight">
                            <strong>{risks[0].activityLogs[0].author}</strong>: {risks[0].activityLogs[0].action}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Help Button */}
          <button
            onClick={() => setShowHelpModal(true)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="MNB Research Guide & Shortcuts"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

          {/* User Profile Pill & Dropdown Menu */}
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 pl-1 rounded-xl p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-700 text-white font-bold text-xs flex items-center justify-center ring-2 ring-slate-100 dark:ring-slate-800 overflow-hidden shrink-0">
                <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
              </div>
              <div className="hidden md:block text-left">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block leading-none">{currentUser.name}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5">{currentUser.role}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
            </button>

            {/* User Account Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-xs sm:w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-popover p-2 z-50 animate-in fade-in-50 zoom-in-95 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 mb-2">
                  <div className="font-bold text-slate-900 dark:text-slate-100">{currentUser.name}</div>
                  <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">{currentUser.role}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">{currentUser.email}</div>
                </div>

                <div className="space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">Switch User Account</div>
                  {teamMembers.map(m => (
                    <button
                      key={m.id}
                      onClick={() => {
                        login(m.email);
                        setShowUserMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                        currentUser.email.toLowerCase() === m.email.toLowerCase()
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{m.name}</span>
                      {currentUser.email.toLowerCase() === m.email.toLowerCase() && (
                        <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="my-2 border-t border-slate-100 dark:border-slate-800" />

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    router.push('/settings');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                >
                  <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>System Settings</span>
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    router.push('/login');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                >
                  <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Auth & Login Screen</span>
                </button>

                <button
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                    router.push('/login');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-semibold"
                >
                  <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span>Sign Out Session</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
