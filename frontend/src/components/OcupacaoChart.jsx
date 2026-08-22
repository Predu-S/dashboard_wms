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
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={dadosFormatados} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3a" />
          <XAxis
            dataKey="deposito"
            stroke="#8b93a7"
            interval={0}
            tick={{ fontSize: 12 }}
            angle={-30}
            textAnchor="end"
            height={50}
          />
          <YAxis stroke="#8b93a7" domain={[0, 100]} />
          <Tooltip
            cursor={{ fill: 'rgba(255, 255, 255, 0.08)' }}
            contentStyle={{ background: '#1b1f27', border: '1px solid #2a2f3a', borderRadius: 8 }}
            labelStyle={{ color: '#e6e9f0' }}
            formatter={(value) => [`${value}%`, 'Ocupação']}
          />
          <Bar dataKey="ocupacao" fill="#4f8cff" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
