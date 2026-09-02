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
          "relative flex flex-col gap-5 w-full",
          defaultClassNames.months
        ),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1 z-20 px-2",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-9 w-9 p-0 text-slate-200 hover:text-white hover:bg-white/10 rounded-2xl transition-all border border-white/15 shadow-md bg-slate-900/80",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-9 w-9 p-0 text-slate-200 hover:text-white hover:bg-white/10 rounded-2xl transition-all border border-white/15 shadow-md bg-slate-900/80",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex h-9 w-full items-center justify-center font-black text-base md:text-lg text-white tracking-wide uppercase px-12",
          defaultClassNames.month_caption
        ),
        caption_label: cn(
          "font-black text-base md:text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-[#d4ff00] select-none",
          defaultClassNames.caption_label
        ),
        month_grid: cn("w-full border-collapse mt-3", defaultClassNames.month_grid),
        weekdays: cn("grid grid-cols-7 mb-2 text-center border-b border-white/5 pb-2", defaultClassNames.weekdays),
        weekday: cn(
          "text-xs md:text-sm font-black uppercase text-slate-400 select-none py-1.5 tracking-wider",
          defaultClassNames.weekday
        ),
        week: cn("grid grid-cols-7 gap-2 md:gap-2.5 my-1 w-full", defaultClassNames.week),
        day: cn(
          "group/day relative aspect-square h-auto w-full p-0 text-center select-none min-h-[48px] md:min-h-[56px]",
          defaultClassNames.day
        ),
        today: cn(
          "text-amber-400 font-extrabold",
          defaultClassNames.today
        ),
        outside: cn(
          "text-slate-600 opacity-30 aria-selected:text-slate-500",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-slate-600 opacity-25 cursor-not-allowed",
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
        "relative isolate z-10 flex aspect-square h-full w-full min-w-0 flex-col items-center justify-center gap-1 border leading-none font-bold text-sm md:text-base transition-all duration-200 rounded-2xl p-1",
        "hover:scale-[1.08] active:scale-95 cursor-pointer",
        // Default unselected state
        !isSelected && !isDisabled && !isOutside && "border-white/10 bg-[#14161b]/90 hover:bg-slate-800 text-slate-100 hover:border-[#d4ff00]/40 shadow-sm",
        // Almost Full (Filling Fast) Highlight
        isAlmostFull && !isSelected && !isDisabled && !isOutside && "bg-gradient-to-b from-amber-500/20 to-amber-950/40 border-amber-500/50 text-amber-200 hover:border-amber-400 hover:bg-amber-500/30 shadow-md shadow-amber-500/10",
        // Fully Booked Highlight
        isFullyBooked && !isSelected && !isDisabled && !isOutside && "bg-red-950/40 border-red-500/40 text-red-300 hover:border-red-400 opacity-70",
        // Today ring
        isToday && !isSelected && "ring-2 ring-amber-400/80 shadow-[0_0_10px_rgba(251,191,36,0.3)]",
        // Selected Date
        isSelected && "bg-gradient-to-br from-red-600 via-red-500 to-amber-500 text-white font-black shadow-xl shadow-red-500/40 border-amber-300 scale-[1.08] z-20 ring-2 ring-amber-400/50",
        // Disabled / Outside Date
        isDisabled && "opacity-20 cursor-not-allowed hover:scale-100 hover:bg-transparent text-slate-600 border-transparent",
        isOutside && "opacity-15 pointer-events-none text-slate-700 border-transparent",
        className
      )}
      {...props}
    >
      <span className={cn("text-xs sm:text-sm md:text-base font-black tracking-tight", isSelected ? "text-white font-black" : isAlmostFull ? "text-amber-300" : isFullyBooked ? "text-red-300" : "text-slate-100")}>
        {day.date.getDate()}
      </span>
      {!isDisabled && !isOutside && (
        <span className="flex items-center justify-center h-2 w-full gap-0.5">
          {isAlmostFull && (
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-pulse" />
          )}
          {isFullyBooked && (
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
          )}
          {isAvailable && (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
          )}
        </span>
      )}
    </Button>
  )
}

export { Calendar, CalendarDayButton }
