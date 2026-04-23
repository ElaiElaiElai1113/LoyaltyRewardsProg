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
        'inline-flex h-16 items-center rounded-xl border border-outline-variant/25 bg-surface-low p-2 text-on-surface-variant/80 shadow-sm',
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
        'inline-flex min-w-32 items-center justify-center rounded-lg px-8 py-2.5 text-sm font-bold uppercase tracking-widest text-on-surface-variant transition-all hover:text-primary-container data-[state=active]:bg-primary-container data-[state=active]:text-on-primary data-[state=active]:shadow-[0_0_18px_rgba(244,168,79,0.18)]',
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
