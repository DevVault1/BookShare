'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

interface ImpactPoint {
  city: string
  count: number
}

const chartConfig = {
  count: {
    label: 'Books delivered',
    color: 'hsl(var(--chart-2))',
  },
}

export default function ImpactMap({ points }: { points: ImpactPoint[] }) {
  const chartData = (points || [])
    .slice(0, 8)
    .map((point) => ({ city: point.city, count: Number(point.count || 0) }))

  return (
    <Card className='border-border/60 bg-gradient-to-br from-background to-muted/20'>
      <CardHeader>
        <CardTitle className='text-base'>City impact map</CardTitle>
        <CardDescription>Where your completed deliveries are landing most often.</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className='flex h-[280px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground'>
            No completed deliveries with city data yet.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className='h-[280px] w-full'>
            <BarChart accessibilityLayer data={chartData} layout='vertical' margin={{ left: 10, right: 16 }}>
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey='city'
                type='category'
                tickLine={false}
                axisLine={false}
                width={84}
              />
              <XAxis dataKey='count' type='number' hide />
              <ChartTooltip cursor={false} content={<ChartTooltipContent labelFormatter={(_, payload) => payload?.[0]?.payload?.city || 'City'} />} />
              <Bar dataKey='count' fill='var(--color-count)' radius={8} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
