'use client';

import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function SettingsPage() {
  return (
    <ProtectedRoute permission="settings.view">
      <Layout>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">
            System settings and configuration (Coming Soon)
          </p>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}