"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const config = { questions: { label: "Questions", color: "var(--lagoon)" } } satisfies ChartConfig;

export function HoursChart({ data }: { data: { hour: string; questions: number }[] }) {
  return (
    <ChartContainer config={config} className="h-[220px] w-full">
      <BarChart data={data} margin={{ left: 0, right: 0, top: 8 }}>
        <defs>
          <linearGradient id="fill-hours" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--lagoon)" />
            <stop offset="100%" stopColor="var(--iris)" stopOpacity={0.75} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 6" stroke="var(--border)" />
        <XAxis dataKey="hour" tickLine={false} axisLine={false} interval={2} fontSize={11} tickMargin={8} />
        <ChartTooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent hideIndicator />} />
        <Bar dataKey="questions" fill="url(#fill-hours)" radius={[6, 6, 2, 2]} />
      </BarChart>
    </ChartContainer>
  );
}
