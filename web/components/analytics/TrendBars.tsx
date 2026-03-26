'use client'

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

interface TrendPoint {
  label: string
  count: number
}

const chartConfig = {
  count: {
    label: 'Count',
    color: 'hsl(var(--chart-1))',
  },
}

export default function TrendBars({
  title,
  subtitle,
  data,
}: {
  title: string
  subtitle?: string
  data: TrendPoint[]
}) {
  const chartData = (data || []).map((item) => ({ ...item, count: Number(item.count || 0) }))

  return (
    <Card className='border-border/60'>
      <CardHeader className='space-y-1'>
        <CardTitle className='text-base'>{title}</CardTitle>
        {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className='flex h-[220px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground'>
            No data yet.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className='h-[240px] w-full'>
            <BarChart accessibilityLayer data={chartData} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey='label'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval={0}
                minTickGap={16}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey='count' fill='var(--color-count)' radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
