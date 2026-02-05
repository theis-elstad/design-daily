'use client'

import { useState } from 'react'
import { Shield, ShieldOff, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { updateUserRole } from '@/lib/actions/users'

interface User {
  id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
}

interface UsersTableProps {
  users: User[]
}

export function UsersTable({ users }: UsersTableProps) {
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRoleChange = async (userId: string, currentRole: string) => {
    setLoadingUserId(userId)
    setError(null)

    const newRole = currentRole === 'admin' ? 'designer' : 'admin'
    const result = await updateUserRole(userId, newRole)

    if (!result.success) {
      setError(result.error || 'Failed to update role')
    }

    setLoadingUserId(null)
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No users found.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                {user.full_name || 'No name'}
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge
                  variant={user.role === 'admin' ? 'default' : 'secondary'}
                >
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell>
                {format(new Date(user.created_at), 'MMM d, yyyy')}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRoleChange(user.id, user.role)}
                  disabled={loadingUserId === user.id}
                >
                  {loadingUserId === user.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : user.role === 'admin' ? (
                    <>
                      <ShieldOff className="h-4 w-4 mr-2" />
                      Demote
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Promote
                    </>
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
