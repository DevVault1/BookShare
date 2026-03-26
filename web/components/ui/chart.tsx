'use client'

import * as React from 'react'
import * as RechartsPrimitive from 'recharts'

import { cn } from '@/lib/utils'

type ChartConfig = {
  [k: string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
    color?: string
  }
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />')
  }
  return context
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    config: ChartConfig
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children']
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          'flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke="#ccc"]]:stroke-border/50 [&_.recharts-layer]:outline-none [&_.recharts-legend-item-text]:text-foreground [&_.recharts-polar-grid_[stroke="#ccc"]]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-reference-line_[stroke="#ccc"]]:stroke-border [&_.recharts-sector[stroke="#fff"]]:stroke-transparent [&_.recharts-tooltip-cursor]:stroke-border [&_.recharts-tooltip-wrapper]:outline-none',
          className
        )}
        style={Object.entries(config).reduce((acc, [key, value], index) => {
          const color = value.color || `hsl(var(--chart-${index + 1}))`
          acc[`--color-${key}` as any] = color
          return acc
        }, {} as React.CSSProperties)}
        {...props}
      >
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = 'ChartContainer'

const ChartTooltip = RechartsPrimitive.Tooltip

function ChartTooltipContent({
  active,
  payload,
  className,
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  formatter,
}: React.ComponentProps<typeof RechartsPrimitive.Tooltip> & {
  hideLabel?: boolean
  hideIndicator?: boolean
}) {
  const { config } = useChart()

  if (!active || !payload?.length) {
    return null
  }

  const displayLabel = hideLabel
    ? null
    : labelFormatter
      ? labelFormatter(label, payload)
      : label

  return (
    <div className={cn('grid min-w-[8rem] gap-1.5 rounded-lg border bg-background px-3 py-2 text-xs shadow-xl', className)}>
      {displayLabel ? <div className='font-medium text-foreground'>{displayLabel}</div> : null}
      <div className='grid gap-1'>
        {payload.map((item, index) => {
          const key = `${item.dataKey || item.name || 'value'}`
          const itemConfig = config[key] || config[item.name as string] || {}
          const indicatorColor = item.color || item.payload?.fill || `var(--color-${key})`

          return (
            <div key={index} className='flex items-center justify-between gap-2'>
              <div className='flex items-center gap-2'>
                {!hideIndicator ? (
                  <span className='h-2.5 w-2.5 shrink-0 rounded-[2px]' style={{ backgroundColor: indicatorColor }} />
                ) : null}
                <span className='text-muted-foreground'>{itemConfig.label || item.name}</span>
              </div>
              <span className='font-medium text-foreground'>
                {formatter ? formatter(item.value, item.name, item, index, payload) : item.value}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const ChartLegend = RechartsPrimitive.Legend

function ChartLegendContent({ payload }: React.ComponentProps<typeof RechartsPrimitive.Legend>) {
  const { config } = useChart()

  if (!payload?.length) {
    return null
  }

  return (
    <div className='flex flex-wrap items-center justify-center gap-4 pt-3'>
      {payload.map((item) => {
        const key = `${item.dataKey || item.value || 'value'}`
        const itemConfig = config[key] || {}
        return (
          <div key={key} className='flex items-center gap-2'>
            <span className='h-2.5 w-2.5 rounded-[2px]' style={{ backgroundColor: item.color }} />
            <span className='text-xs text-muted-foreground'>{itemConfig.label || item.value}</span>
          </div>
        )
      })}
    </div>
  )
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
}
