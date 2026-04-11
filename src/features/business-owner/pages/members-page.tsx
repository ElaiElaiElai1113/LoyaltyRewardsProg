import { Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useBusinessOwnerData } from '@/hooks/use-business-owner-data'

export function MembersPage() {
  const { metrics } = useBusinessOwnerData()

  return (
    <div className="space-y-16">
      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <h1 className="font-serif text-5xl tracking-tight text-primary">Customers</h1>
          <p className="text-lg text-on-surface-variant/85">
            View and manage your customer base.
          </p>
        </div>
        <Button variant="outline" className="rounded-full h-14 px-8">
          <Users className="size-5 mr-2" />
          Export List
        </Button>
      </div>

      {/* Members List */}
      <div className="rounded-3xl bg-white border border-outline-variant/5 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-outline-variant/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-2xl text-primary">All Customers</h2>
              <p className="text-sm text-on-surface-variant/70 mt-1">
                {metrics?.totalMembers ?? 0} total members
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="rounded-full px-4 py-2">All Time</Badge>
              <Badge variant="accent" className="bg-primary/5 text-primary rounded-full px-4 py-2">
                This Month
              </Badge>
            </div>
          </div>
        </div>

        {/* Placeholder for members data */}
        <div className="p-16 text-center">
          <Users className="size-16 text-on-surface-variant/20 mx-auto mb-6" />
          <h3 className="font-serif text-2xl text-primary mb-2">Customer Analytics Coming Soon</h3>
          <p className="text-on-surface-variant/70 max-w-md mx-auto">
            View detailed customer profiles, purchase history, and engagement metrics. Connect to Supabase to enable
            this feature.
          </p>
        </div>
      </div>
    </div>
  )
}
