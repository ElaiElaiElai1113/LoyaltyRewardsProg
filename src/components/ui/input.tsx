import * as React from 'react'

import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-14 w-full rounded-md border-0 bg-surface-highest px-6 py-4 text-base font-medium text-primary outline-none transition-all placeholder:text-on-surface-variant/60 focus-visible:ring-2 focus-visible:ring-primary/15',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

export { Input }
