"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
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
        "p-3",
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "flex gap-4 flex-col md:flex-row relative",
          defaultClassNames.months
        ),
        month: cn("flex flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex items-center justify-center h-7 w-full",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "w-full flex items-center text-sm font-medium justify-center h-7 gap-1.5",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "relative has-focus:border-ring border border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] rounded-md",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "absolute bg-popover inset-0 opacity-0",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "select-none font-medium",
          captionLayout === "label"
            ? "text-sm"
            : "rounded-md pl-2 pr-1 flex items-center gap-1 text-sm h-8 [&>svg]:text-muted-foreground [&>svg]:size-3.5",
          defaultClassNames.caption_label
        ),
        table: "w-full border-collapse space-y-1",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          defaultClassNames.weekday
        ),
        week: cn("flex w-full mt-2", defaultClassNames.week),
        week_number_header: cn(
          "text-muted-foreground w-9 font-normal text-[0.8rem]",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "w-9 h-9 p-0 text-[0.8rem] font-normal text-muted-foreground flex items-center justify-center",
          defaultClassNames.week_number
        ),
        day: cn(
          "relative h-9 w-9 p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md",
          defaultClassNames.day
        ),
        range_start: defaultClassNames.range_start,
        range_middle: defaultClassNames.range_middle,
        range_end: defaultClassNames.range_end,
        today: defaultClassNames.today,
        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-muted-foreground opacity-50",
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
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", className)}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          )
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex h-9 w-9 items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
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
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={format(day.date, "yyyy-MM-dd")}
      data-selected={modifiers.selected}
      data-today={modifiers.today}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
        "data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground data-[selected=true]:hover:bg-primary data-[selected=true]:hover:text-primary-foreground",
        "data-[today=true]:bg-accent data-[today=true]:text-accent-foreground",
        "data-[selected=true][data-today=true]:bg-primary data-[selected=true][data-today=true]:text-primary-foreground",
        "data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-middle=true]:rounded-none",
        "data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-start=true]:rounded-l-md data-[range-start=true]:rounded-r-none",
        "data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-end=true]:rounded-l-none data-[range-end=true]:rounded-r-md",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
