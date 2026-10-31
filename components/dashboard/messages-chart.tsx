"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { DailyPoint } from "@/lib/analytics";

const config = {
  visitor: { label: "Visitor messages", color: "var(--iris)" },
  conversations: { label: "Conversations", color: "var(--rose)" },
} satisfies ChartConfig;

export function MessagesChart({ data, height = 280 }: { data: DailyPoint[]; height?: number }) {
  return (
    <ChartContainer config={config} className="w-full" style={{ height }}>
      <AreaChart data={data} margin={{ left: -18, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="fill-visitor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-visitor)" stopOpacity={0.32} />
            <stop offset="100%" stopColor="var(--color-visitor)" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="fill-conversations" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-conversations)" stopOpacity={0.16} />
            <stop offset="100%" stopColor="var(--color-conversations)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 6" stroke="var(--border)" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} minTickGap={28} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} width={44} allowDecimals={false} fontSize={12} />
        <ChartTooltip cursor={{ stroke: "var(--border)" }} content={<ChartTooltipContent indicator="dot" />} />
        <Area dataKey="visitor" type="monotone" stroke="var(--color-visitor)" strokeWidth={2.5} fill="url(#fill-visitor)" />
        <Area dataKey="conversations" type="monotone" stroke="var(--color-conversations)" strokeWidth={2} fill="url(#fill-conversations)" strokeDasharray="5 4" />
        <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
    </ChartContainer>
  );
}
