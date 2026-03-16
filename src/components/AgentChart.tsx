"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ChartDataItem {
  day: string
  value: number
}

export function AgentChart({ 
  data, 
  color = "#15ff8c", 
  unit = "U",
  dataKey = "value"
}: { 
  data: ChartDataItem[], 
  color?: string, 
  unit?: string,
  dataKey?: string
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
        <XAxis dataKey="day" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}${unit}`} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#222', borderRadius: '8px' }}
          itemStyle={{ color: color, fontWeight: 'bold' }}
        />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} dot={false} activeDot={{ r: 6, fill: color }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
