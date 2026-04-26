"use client";

import { ResponsiveContainer, XAxis, YAxis, Tooltip, Area, AreaChart, Bar, BarChart } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartProps {
  leadData: Array<{ name: string; leads: number }>;
  botPerformanceData: Array<{ name: string; leads: number }>;
}

export function OverviewCharts({ leadData, botPerformanceData }: ChartProps) {
  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Leads Overview</CardTitle>
          <CardDescription>Number of leads captured over the last 7 days.</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={leadData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area type="monotone" dataKey="leads" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agent Performance</CardTitle>
          <CardDescription>Leads captured per agent.</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={botPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
              <Tooltip
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="leads" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

