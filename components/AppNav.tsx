"use client";

import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Building2, Settings, LogOut, User, Plus, Landmark } from "lucide-react";

export function AppNav({ userEmail }: { userEmail?: string }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/sites", label: "Projects", icon: Building2 },
    { href: "/finance", label: "Finance Readiness", icon: Landmark },
    { href: "/sites/new", label: "Create New Project", icon: Plus },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="/sites" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="text-xl font-bold text-gray-900">PlansurAI</span>
          </a>

          <div className="flex flex-wrap items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname?.startsWith(item.href);

              return (
                <a
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </a>
              );
            })}

            <div className="ml-4 pl-4 border-l border-gray-200 flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">{userEmail}</span>
              </div>

              <button
                type="button"
                onClick={() => signOut({ redirect: true, callbackUrl: "/login" })}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
