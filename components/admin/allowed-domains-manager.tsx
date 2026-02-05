'use client'

import { useState } from 'react'
import { Plus, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { addAllowedDomain, removeAllowedDomain } from '@/lib/actions/users'

interface Domain {
  id: string
  domain: string
  created_at: string
}

interface AllowedDomainsManagerProps {
  domains: Domain[]
}

export function AllowedDomainsManager({ domains: initialDomains }: AllowedDomainsManagerProps) {
  const [domains, setDomains] = useState<Domain[]>(initialDomains)
  const [newDomain, setNewDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDomain.trim()) return

    setLoading(true)
    setError(null)

    const result = await addAllowedDomain(newDomain)

    if (result.success) {
      // Optimistically add to the list
      setDomains([
        ...domains,
        {
          id: Date.now().toString(), // Temporary ID
          domain: newDomain.toLowerCase().trim(),
          created_at: new Date().toISOString(),
        },
      ].sort((a, b) => a.domain.localeCompare(b.domain)))
      setNewDomain('')
    } else {
      setError(result.error || 'Failed to add domain')
    }

    setLoading(false)
  }

  const handleRemoveDomain = async (domainId: string) => {
    setRemovingId(domainId)
    setError(null)

    const result = await removeAllowedDomain(domainId)

    if (result.success) {
      setDomains(domains.filter((d) => d.id !== domainId))
    } else {
      setError(result.error || 'Failed to remove domain')
    }

    setRemovingId(null)
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Add new domain form */}
      <form onSubmit={handleAddDomain} className="flex gap-2">
        <Input
          type="text"
          placeholder="example.com"
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          className="max-w-xs"
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !newDomain.trim()}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add Domain
            </>
          )}
        </Button>
      </form>

      {/* List of domains */}
      <div className="flex flex-wrap gap-2">
        {domains.length === 0 ? (
          <p className="text-sm text-gray-500">
            No domains configured. Add a domain to restrict signups.
          </p>
        ) : (
          domains.map((domain) => (
            <Badge
              key={domain.id}
              variant="secondary"
              className="text-sm py-1.5 px-3 flex items-center gap-2"
            >
              @{domain.domain}
              <button
                onClick={() => handleRemoveDomain(domain.id)}
                disabled={removingId === domain.id}
                className="hover:text-red-600 transition-colors"
              >
                {removingId === domain.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <X className="h-3 w-3" />
                )}
              </button>
            </Badge>
          ))
        )}
      </div>
    </div>
  )
}
