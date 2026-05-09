import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Children, type CSSProperties, type ReactNode, useId, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

interface LuxeCarouselProps {
  title: string
  eyebrow?: string
  description?: string
  children: ReactNode
  className?: string
}

export function LuxeCarousel({ title, eyebrow, description, children, className }: LuxeCarouselProps) {
  const carouselId = useId()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const items = Children.toArray(children).filter(Boolean)

  const scrollTo = (index: number) => {
    const nextIndex = Math.max(0, Math.min(index, items.length - 1))
    const scroller = scrollerRef.current

    if (!scroller) return

    const target = scroller.children.item(nextIndex) as HTMLElement | null
    target?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
    setActiveIndex(nextIndex)
  }

  const handleScroll = () => {
    const scroller = scrollerRef.current
    if (!scroller) return

    const nextIndex = Math.round(scroller.scrollLeft / Math.max(scroller.clientWidth * 0.84, 1))
    setActiveIndex(Math.max(0, Math.min(nextIndex, items.length - 1)))
  }

  if (items.length === 0) return null

  return (
    <section className={cn('animate-soft-reveal space-y-5', className)} aria-labelledby={carouselId}>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl space-y-2">
          {eyebrow ? (
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
              {eyebrow}
            </p>
          ) : null}
          <h2 id={carouselId} className="font-serif text-4xl font-semibold leading-none text-primary-container md:text-5xl">
            {title}
          </h2>
          {description ? (
            <p className="text-sm font-medium leading-6 text-on-surface-variant/85">{description}</p>
          ) : null}
        </div>

        {items.length > 1 ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-full border border-primary/20 bg-card text-primary shadow-soft transition hover:-translate-y-0.5 hover:bg-muted"
              aria-label="Previous carousel item"
              onClick={() => scrollTo(activeIndex - 1)}
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-full border border-primary/20 bg-card text-primary shadow-soft transition hover:-translate-y-0.5 hover:bg-muted"
              aria-label="Next carousel item"
              onClick={() => scrollTo(activeIndex + 1)}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        ) : null}
      </div>

      <div
        ref={scrollerRef}
        className="-mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={handleScroll}
      >
        {items.map((item, index) => (
          <div
            key={index}
            className="animate-carousel-enter min-w-[84%] snap-start sm:min-w-[62%] lg:min-w-[34%]"
            style={{ '--stagger': index } as CSSProperties}
          >
            {item}
          </div>
        ))}
      </div>

      {items.length > 1 ? (
        <div className="flex justify-center gap-2">
          {items.map((_, index) => (
            <button
              key={index}
              type="button"
              className={cn(
                'h-2 rounded-full transition-all',
                activeIndex === index ? 'w-8 bg-primary' : 'w-2 bg-primary/25 hover:bg-primary/45',
              )}
              aria-label={`Go to carousel item ${index + 1}`}
              onClick={() => scrollTo(index)}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
