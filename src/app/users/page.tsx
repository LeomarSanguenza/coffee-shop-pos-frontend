'use client';

import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function UsersPage() {
  return (
    <ProtectedRoute permission="users.view">
      <Layout>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="mt-2 text-gray-600">
            Manage system users and roles (Coming Soon)
          </p>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}