import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

export default function OcupacaoChart({ dados }) {
  const dadosFormatados = dados.map((d) => ({
    deposito: `Depósito ${d.deposito}`,
    ocupacao: d.percentualOcupacao,
  }))

  return (
    <div className="chart-card">
      <h3>Ocupação por Depósito (%)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={dadosFormatados} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis
            dataKey="deposito"
            stroke="var(--chart-axis)"
            interval={0}
            tick={{ fontSize: 12 }}
            angle={-30}
            textAnchor="end"
            height={50}
          />
          <YAxis stroke="var(--chart-axis)" domain={[0, 100]} />
          <Tooltip
            cursor={{ fill: 'rgba(255, 255, 255, 0.08)' }}
            contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 5px 18px rgba(23,43,58,.12)', color: 'var(--text)' }}
            labelStyle={{ color: 'var(--text)' }}
            formatter={(value) => [`${value}%`, 'Ocupação']}
          />
          <Bar dataKey="ocupacao" fill="var(--chart-green)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
