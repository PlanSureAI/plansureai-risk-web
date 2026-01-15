'use client';

import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/app/components/MainLayout';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/app/providers/AuthProvider';

export default function SettingsPage() {
  const router = useRouter();
  const { session, loading, user } = useAuthContext();
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (!loading && !session) {
      router.push('/login');
    }
  }, [session, loading, router]);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Settings</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {[
                { id: 'profile', label: 'Profile' },
                { id: 'notifications', label: 'Notifications' },
                { id: 'billing', label: 'Billing' },
                { id: 'security', label: 'Security' },
                { id: 'integrations', label: 'Integrations' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && <ProfileSettings user={user} />}
            {activeTab === 'notifications' && <NotificationSettings />}
            {activeTab === 'billing' && <BillingSettings />}
            {activeTab === 'security' && <SecuritySettings />}
            {activeTab === 'integrations' && <IntegrationSettings />}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function ProfileSettings({ user }: { user: any }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold mb-6">Profile Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Company Name
          </label>
          <input
            type="text"
            placeholder="Your company"
            className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
          />
        </div>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Save Changes
        </button>
      </div>
    </div>
  );
}

function NotificationSettings() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>
      <div className="space-y-4">
        {[
          { id: 'email_alerts', label: 'Email Alerts', description: 'Receive weekly digest emails' },
          { id: 'policy_changes', label: 'Policy Changes', description: 'Be notified of planning policy updates' },
          { id: 'new_approvals', label: 'New Approvals', description: 'Alert when new approvals match your sites' },
          { id: 'risk_score', label: 'Risk Score Updates', description: 'Notify when risk assessments change' },
        ].map((pref) => (
          <div key={pref.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">{pref.label}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{pref.description}</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </div>
        ))}
      </div>
    </div>
  );
}

function BillingSettings() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold mb-6">Billing & Subscription</h2>
      <div className="space-y-4">
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Current Plan</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">Starter</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">£49/month</p>
        </div>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Upgrade Plan
        </button>
      </div>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold mb-6">Security</h2>
      <div className="space-y-4">
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">Password</p>
          <button className="text-blue-600 hover:underline">Change Password</button>
        </div>
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">Two-Factor Authentication</p>
          <button className="text-blue-600 hover:underline">Enable 2FA</button>
        </div>
      </div>
    </div>
  );
}

function IntegrationSettings() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold mb-6">Integrations</h2>
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Connect external tools and services to PlanSureAI
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'Slack', icon: '💬' },
            { name: 'Microsoft Teams', icon: '👥' },
            { name: 'Google Drive', icon: '📁' },
            { name: 'Zapier', icon: '⚡' },
          ].map((integration) => (
            <button
              key={integration.name}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-600 transition-colors text-left"
            >
              <p className="text-lg font-medium mb-2">{integration.icon} {integration.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Connect</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
