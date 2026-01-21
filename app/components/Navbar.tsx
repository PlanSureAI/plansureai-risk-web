'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthContext } from '@/app/providers/AuthProvider';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useRouter } from 'next/navigation';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export function Navbar({ onToggleSidebar }: NavbarProps) {
  const { user, signOut } = useAuthContext();
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="px-6 py-4 flex justify-between items-center">
        {/* Left: Menu Toggle + Primary Nav */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link
            href="/sites"
            className="text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-200"
          >
            Projects
          </Link>
        </div>

        {/* Right: CTA + User & Settings */}
        <div className="flex items-center gap-4">
          <Link
            href="/sites/new"
            className="hidden sm:inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create New Project
          </Link>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {isDark ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.536l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm5.657-9.193a1 1 0 00-1.414 0l-.707.707A1 1 0 005.05 6.464l.707-.707a1 1 0 001.414-1.414zM3 11a1 1 0 100-2H2a1 1 0 100 2h1z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* User Menu Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {user?.email?.[0].toUpperCase() || 'U'}
              </div>
              <span className="text-sm font-medium">{user?.email?.split('@')[0]}</span>
            </button>

            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-200 dark:border-gray-700">
              <Link href="/sites/new" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 sm:hidden rounded-t-lg">
                Create New Project
              </Link>
              <Link href="/settings/billing" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg">
                Settings
              </Link>
              <Link href="/billing" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                Billing
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg text-red-600"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
