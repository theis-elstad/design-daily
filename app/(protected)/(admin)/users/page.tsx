export const runtime = 'edge'

import { getAllUsers, getAllowedDomains } from '@/lib/actions/users'
import { UsersTable } from '@/components/admin/users-table'
import { AllowedDomainsManager } from '@/components/admin/allowed-domains-manager'

export default async function UsersPage() {
  const [users, allowedDomains] = await Promise.all([
    getAllUsers(),
    getAllowedDomains(),
  ])

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-1">
          Manage users and control who can access the application
        </p>
      </div>

      {/* Allowed Domains Section */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Allowed Email Domains
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Only users with email addresses from these domains can sign up.
        </p>
        <AllowedDomainsManager domains={allowedDomains} />
      </div>

      {/* Users Section */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          All Users ({users.length})
        </h2>
        <UsersTable users={users} />
      </div>
    </div>
  )
}
