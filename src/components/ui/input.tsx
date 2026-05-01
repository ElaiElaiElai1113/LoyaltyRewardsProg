import * as React from 'react'

import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-11 w-full rounded-lg border border-input bg-card px-4 py-3 text-base font-medium text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

export { Input }
