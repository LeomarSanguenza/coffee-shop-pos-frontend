'use client';

import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ReportsPage() {
  return (
    <ProtectedRoute permission="reports.view">
      <Layout>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="mt-2 text-gray-600">
            Sales reports and analytics (Coming Soon)
          </p>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}