import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'

import { cn } from '@/lib/utils'

const Tabs = TabsPrimitive.Root

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex h-16 items-center rounded-xl bg-surface-low p-2 text-on-surface-variant/80 shadow-sm border border-outline-variant/10',
        className,
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex min-w-32 items-center justify-center rounded-xl px-8 py-2.5 text-sm font-bold tracking-widest uppercase text-on-surface transition-all data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-card hover:text-primary',
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn('mt-5 outline-none', className)} {...props} />
}

export { Tabs, TabsContent, TabsList, TabsTrigger }
