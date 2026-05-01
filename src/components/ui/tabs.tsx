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
        'inline-flex h-14 items-center rounded-2xl border border-border bg-muted p-1.5 text-muted-foreground shadow-card',
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
        'inline-flex min-w-32 cursor-pointer items-center justify-center rounded-xl px-7 py-2.5 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground transition-colors duration-200 hover:text-foreground data-[state=active]:bg-card data-[state=active]:font-display data-[state=active]:text-foreground data-[state=active]:shadow-card',
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
