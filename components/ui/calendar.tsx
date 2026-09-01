"use client"

import * as React from "react"
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
  type Locale,
} from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from "lucide-react"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  locale,
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "group/calendar w-full bg-transparent p-1 select-none",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString(locale?.code, { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-full", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-4 w-full",
          defaultClassNames.months
        ),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1 z-20 px-1",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-8 w-8 p-0 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-white/10 shadow-sm",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-8 w-8 p-0 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-white/10 shadow-sm",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex h-8 w-full items-center justify-center font-black text-sm text-white tracking-wide uppercase px-8",
          defaultClassNames.month_caption
        ),
        caption_label: cn(
          "font-black text-sm tracking-wide text-amber-400 select-none",
          defaultClassNames.caption_label
        ),
        month_grid: cn("w-full border-collapse mt-2", defaultClassNames.month_grid),
        weekdays: cn("grid grid-cols-7 mb-1 text-center", defaultClassNames.weekdays),
        weekday: cn(
          "text-[11px] font-black uppercase text-slate-400 select-none py-1",
          defaultClassNames.weekday
        ),
        week: cn("grid grid-cols-7 gap-1.5 my-0.5 w-full", defaultClassNames.week),
        day: cn(
          "group/day relative aspect-square h-auto w-full p-0 text-center select-none",
          defaultClassNames.day
        ),
        today: cn(
          "text-amber-400 font-extrabold",
          defaultClassNames.today
        ),
        outside: cn(
          "text-slate-600 opacity-40 aria-selected:text-slate-500",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-slate-600 opacity-30 cursor-not-allowed",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn("w-full", className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4 text-amber-400", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon className={cn("size-4 text-amber-400", className)} {...props} />
            )
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          )
        },
        DayButton: ({ ...props }) => (
          <CalendarDayButton locale={locale} {...props} />
        ),
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  const isAlmostFull = Boolean((modifiers as any).almostFull)
  const isFullyBooked = Boolean((modifiers as any).fullyBooked)
  const isAvailable = Boolean((modifiers as any).available)
  const isSelected = Boolean(modifiers.selected)
  const isDisabled = Boolean(modifiers.disabled)
  const isOutside = Boolean(modifiers.outside)
  const isToday = Boolean(modifiers.today)

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={isSelected}
      className={cn(
        "relative isolate z-10 flex aspect-square h-auto w-full min-w-0 flex-col items-center justify-center gap-0.5 border leading-none font-bold text-xs transition-all duration-200 rounded-xl",
        "hover:scale-[1.06] active:scale-95",
        // Default unselected state
        !isSelected && !isDisabled && !isOutside && "border-white/5 bg-[#14161b]/80 hover:bg-slate-800 text-slate-200 hover:border-white/20",
        // Almost Full (Filling Fast) Highlight
        isAlmostFull && !isSelected && !isDisabled && !isOutside && "bg-gradient-to-b from-amber-500/15 to-amber-950/20 border-amber-500/40 text-amber-200 hover:border-amber-400 hover:bg-amber-500/25 shadow-sm shadow-amber-500/10",
        // Fully Booked Highlight
        isFullyBooked && !isSelected && !isDisabled && !isOutside && "bg-red-950/30 border-red-500/30 text-red-300 hover:border-red-400 opacity-80",
        // Today ring
        isToday && !isSelected && "ring-1 ring-amber-400/70",
        // Selected Date
        isSelected && "bg-gradient-to-br from-red-600 via-red-500 to-amber-500 text-white font-black shadow-lg shadow-red-500/30 border-amber-400 scale-[1.06] z-20",
        // Disabled / Outside Date
        isDisabled && "opacity-25 cursor-not-allowed hover:scale-100 hover:bg-transparent text-slate-600 border-transparent",
        isOutside && "opacity-15 pointer-events-none text-slate-700 border-transparent",
        className
      )}
      {...props}
    >
      <span className={cn("text-xs font-black", isSelected ? "text-white font-black" : isAlmostFull ? "text-amber-300" : isFullyBooked ? "text-red-300" : "text-slate-200")}>
        {day.date.getDate()}
      </span>
      {!isDisabled && !isOutside && (
        <span className="flex items-center justify-center h-1.5 w-full">
          {isAlmostFull && (
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-pulse" />
          )}
          {isFullyBooked && (
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
          )}
          {isAvailable && (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80 shadow-[0_0_5px_#10b981]" />
          )}
        </span>
      )}
    </Button>
  )
}

export { Calendar, CalendarDayButton }
