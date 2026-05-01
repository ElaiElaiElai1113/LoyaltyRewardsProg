import * as React from 'react'

import { cn } from '@/lib/utils'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        'min-h-24 w-full rounded-lg border border-input bg-card px-4 py-3 text-sm text-foreground shadow-card outline-none transition-colors duration-200 placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/60',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
)
Textarea.displayName = 'Textarea'

export { Textarea }
