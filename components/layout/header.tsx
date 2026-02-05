'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, Upload, Trophy, Gavel, LayoutDashboard, Users } from 'lucide-react'
import { logout } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Profile } from '@/lib/types/database'
import { cn } from '@/lib/utils'

interface HeaderProps {
  profile: Profile
}

const navItems = [
  { href: '/submit', label: 'Submit', icon: Upload },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
]

const adminNavItems = [
  { href: '/judge', label: 'Judge', icon: Gavel },
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/users', label: 'Users', icon: Users },
]

export function Header({ profile }: HeaderProps) {
  const pathname = usePathname()
  const isAdmin = profile.role === 'admin'
  const allNavItems = isAdmin ? [...navItems, ...adminNavItems] : navItems

  const initials = profile.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : profile.email[0].toUpperCase()

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/submit" className="text-xl font-bold">
              Design Daily
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {allNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gray-200">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-medium">{profile.full_name || 'User'}</p>
                <p className="text-xs text-gray-500">{profile.email}</p>
                <p className="text-xs text-gray-400 capitalize">{profile.role}</p>
              </div>
              <DropdownMenuSeparator />
              <div className="md:hidden">
                {allNavItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href} className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  )
                })}
                <DropdownMenuSeparator />
              </div>
              <DropdownMenuItem
                onClick={() => logout()}
                className="text-red-600 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
