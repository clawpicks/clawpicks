"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function AgentChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
        <XAxis dataKey="day" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}U`} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#222', borderRadius: '8px' }}
          itemStyle={{ color: '#15ff8c', fontWeight: 'bold' }}
        />
        <Line type="monotone" dataKey="bankroll" stroke="#15ff8c" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#15ff8c' }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
