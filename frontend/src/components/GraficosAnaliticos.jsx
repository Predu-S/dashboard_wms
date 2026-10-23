import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'

const CORES = ['var(--chart-green)', 'var(--chart-green-soft)', 'var(--chart-neutral)', '#65b69b', 'var(--chart-green-muted)', 'var(--chart-warning)']
const MOEDA = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const NUMERO = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

function formatar(valor, formato) {
  if (formato === 'moeda') return MOEDA.format(Number(valor) || 0)
  if (formato === 'percentual') return `${NUMERO.format(Number(valor) || 0)}%`
  return NUMERO.format(Number(valor) || 0)
}

function TooltipDashboard({ active, payload, label, formato }) {
  if (!active || !payload?.length) return null
  return (
    <div className="grafico-tooltip">
      {label && <p className="grafico-tooltip__titulo">{label}</p>}
      {payload.map((item) => (
        <div className="grafico-tooltip__linha" key={item.dataKey}>
          <span><i style={{ background: item.color || item.payload?.fill || CORES[0] }} />{item.name}</span>
          <strong>{formatar(item.value, formato)}</strong>
        </div>
      ))}
    </div>
  )
}

function Grafico({ titulo, dados = [], tipo = 'barra', categoria = 'label', series = [], formato = 'numero', horizontal = false, altura = 195, empilhado = false, larguraCompleta = false }) {
  const dadosValidos = dados.filter((item) => series.some((serie) => Number.isFinite(Number(item[serie.chave]))))
  const estiloEixo = { stroke: 'var(--chart-axis)', tick: { fontSize: 11, fill: 'var(--chart-axis)' }, tickLine: false }
  const eixoCategoria = horizontal
    ? <YAxis dataKey={categoria} type="category" width={112} {...estiloEixo} axisLine={false} />
    : <XAxis dataKey={categoria} type="category" {...estiloEixo} axisLine={{ stroke: 'var(--chart-grid)' }} interval="preserveStartEnd" />
  const eixoValor = horizontal
    ? <XAxis type="number" domain={[0, 'auto']} {...estiloEixo} axisLine={{ stroke: 'var(--chart-grid)' }} />
    : <YAxis type="number" width={42} {...estiloEixo} axisLine={false} />

  return (
    <article className={`chart-card grafico-analitico ${larguraCompleta ? 'grafico-analitico--largura-completa' : ''}`}>
      <div className="grafico-analitico__cabecalho">
        <h3>{titulo}</h3>
        <span>{dadosValidos.length} {dadosValidos.length === 1 ? 'categoria' : 'categorias'}</span>
      </div>
      {dadosValidos.length === 0 ? (
        <div className="grafico-vazio">Sem dados para exibir neste período.</div>
      ) : (
        <ResponsiveContainer width="100%" height={altura}>
          {tipo === 'pizza' ? (
            <PieChart>
              <Tooltip content={<TooltipDashboard formato={formato} />} />
              <Legend verticalAlign="bottom" height={26} iconType="circle" wrapperStyle={{ fontSize: 10, color: 'var(--chart-axis)' }} />
              <Pie data={dadosValidos} dataKey={series[0]?.chave || 'valor'} nameKey={categoria} innerRadius="55%" outerRadius="78%" paddingAngle={3} stroke="var(--bg-card)" strokeWidth={3}>
                {dadosValidos.map((item, index) => <Cell key={`${item[categoria]}-${index}`} fill={item.cor || CORES[index % CORES.length]} />)}
              </Pie>
            </PieChart>
          ) : (
            tipo === 'area' ? (
                <AreaChart data={dadosValidos} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
                  <CartesianGrid vertical={horizontal} horizontal={!horizontal} strokeDasharray="3 3" stroke="var(--chart-grid)" />
                  {eixoCategoria}{eixoValor}
                  <Tooltip content={<TooltipDashboard formato={formato} />} />
                  {series.map((serie, index) => <Area key={serie.chave} type="monotone" dataKey={serie.chave} name={serie.nome} stroke={serie.cor || CORES[index % CORES.length]} fill={serie.cor || CORES[index % CORES.length]} fillOpacity={0.13} strokeWidth={2.5} activeDot={{ r: 4 }} />)}
                </AreaChart>
              ) : (
                <BarChart data={dadosValidos} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 8, right: 12, left: 4, bottom: horizontal ? 4 : 8 }}>
                  <CartesianGrid vertical={horizontal} horizontal={!horizontal} strokeDasharray="3 3" stroke="var(--chart-grid)" />
                  {eixoCategoria}{eixoValor}
                  <Tooltip content={<TooltipDashboard formato={formato} />} cursor={{ fill: 'var(--chart-grid)' }} />
                  {series.length > 1 && <Legend verticalAlign="top" height={24} iconType="circle" wrapperStyle={{ fontSize: 10, color: 'var(--chart-axis)' }} />}
                  {series.map((serie, index) => (
                    <Bar key={serie.chave} dataKey={serie.chave} name={serie.nome} fill={serie.cor || CORES[index % CORES.length]} radius={horizontal ? [0, 5, 5, 0] : [5, 5, 0, 0]} maxBarSize={32} stackId={empilhado ? 'total' : undefined}>
                      {(serie.corCondicional || dadosValidos.some((item) => item.cor)) && dadosValidos.map((item, itemIndex) => {
                        const { campo, limite, acima, abaixo } = serie.corCondicional || {}
                        const cor = campo ? (Number(item[campo]) >= limite ? acima : abaixo) : item.cor
                        return <Cell key={`${item[categoria]}-${itemIndex}`} fill={cor || serie.cor || CORES[index % CORES.length]} />
                      })}
                    </Bar>
                  ))}
                </BarChart>
            )
          )}
        </ResponsiveContainer>
      )}
    </article>
  )
}

export default function GraficosAnaliticos({ graficos }) {
  return <section className="graficos-analiticos">{graficos.map((grafico) => <Grafico key={grafico.titulo} {...grafico} />)}</section>
}
