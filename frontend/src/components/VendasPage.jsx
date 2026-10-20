import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { api } from '../api'
import KpiCard from './KpiCard'
import TabelaDados from './TabelaDados'
import { usePeriodo } from '../context/PeriodoContext'
import GraficosAnaliticos from './GraficosAnaliticos'
import { agruparPorMes, agruparSoma } from './chartUtils'

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const COLUNAS_PEDIDOS = [
  { chave: 'numPedido', rotulo: 'Pedido' },
  { chave: 'cliente', rotulo: 'Cliente' },
  { chave: 'vendedor', rotulo: 'Vendedor' },
  {
    chave: 'data',
    rotulo: 'Data',
    render: (item) => new Date(item.data).toLocaleDateString('pt-BR'),
    valorCsv: (item) => new Date(item.data).toLocaleDateString('pt-BR'),
  },
  { chave: 'valor', rotulo: 'Valor', render: (item) => formatarMoeda(item.valor), valorCsv: (item) => item.valor },
]

export default function VendasPage() {
  const { periodo } = usePeriodo()

  const [vendas, setVendas] = useState([])
  const [resumo, setResumo] = useState(null)
  const [porVendedor, setPorVendedor] = useState([])
  const [produtosMaisVendidos, setProdutosMaisVendidos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const vendasPorMes = agruparPorMes(vendas, (v) => v.data, [{ chave: 'totalVendido', obterValor: (v) => v.valor }])
  const vendasPorCliente = agruparSoma(vendas, (v) => v.cliente, (v) => v.valor, 'label', 'valor').slice(0, 8)
  const vendasPorDia = agruparSoma(vendas, (v) => new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(new Date(v.data)), (v) => v.valor, 'label', 'valor')

  useEffect(() => {
    setCarregando(true)
    Promise.all([
      api.vendas(periodo),
      api.vendasResumo(periodo),
      api.vendasPorVendedor(periodo),
      api.vendasProdutosMaisVendidos(periodo),
    ])
      .then(([vendasResp, resumoResp, vendedorResp, produtosResp]) => {
        setVendas(vendasResp)
        setResumo(resumoResp)
        setPorVendedor(vendedorResp)
        setProdutosMaisVendidos(produtosResp)
      })
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false))
  }, [periodo.dataInicio, periodo.dataFim])

  return (
    <>
      <header className="conteudo__header">
        <h1>Vendas / Faturamento</h1>
        <span className="conteudo__data">Pedidos não cancelados</span>
      </header>

      {carregando && <p>Carregando dados...</p>}
      {erro && <p className="erro">Não foi possível carregar a API ({erro}).</p>}

      {!carregando && !erro && resumo && (
        <>
          <section className="kpis">
            <KpiCard titulo="Total Vendido" valor={formatarMoeda(resumo.totalVendido)} />
            <KpiCard titulo="Pedidos" valor={resumo.quantidadePedidos} />
            <KpiCard titulo="Ticket Médio" valor={formatarMoeda(resumo.ticketMedio)} />
          </section>

          <section className="grid-principal">
            <div className="chart-card">
              <h3>Vendas por Vendedor</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={porVendedor} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                  <XAxis dataKey="vendedor" stroke="var(--chart-axis)" interval={0} tick={{ fontSize: 12 }} angle={-30} textAnchor="end" height={50} />
                  <YAxis stroke="var(--chart-axis)" />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.08)' }}
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 5px 18px rgba(23,43,58,.12)', color: 'var(--text)' }}
                    labelStyle={{ color: 'var(--text)' }}
                    formatter={(value) => [formatarMoeda(value), 'Total']}
                  />
                  <Bar dataKey="totalVendido" fill="var(--chart-green)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <TabelaDados
              titulo="Pedidos"
              colunas={COLUNAS_PEDIDOS}
              dados={vendas}
              nomeArquivoCsv="vendas-pedidos"
              mensagemVazia="Nenhuma venda no período."
            />
          </section>

          <section className="chart-card" style={{ marginTop: 20 }}>
            <h3>Produtos Mais Vendidos</h3>
            <ResponsiveContainer width="100%" height={Math.min(245, Math.max(180, produtosMaisVendidos.length * 30))}>
              <BarChart
                data={produtosMaisVendidos}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis type="number" stroke="var(--chart-axis)" />
                <YAxis type="category" dataKey="produto" stroke="var(--chart-axis)" width={160} tick={{ fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.08)' }}
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 5px 18px rgba(23,43,58,.12)', color: 'var(--text)' }}
                  labelStyle={{ color: 'var(--text)' }}
                  formatter={(value, nome) => [
                    nome === 'totalVendido' ? formatarMoeda(value) : value,
                    nome === 'totalVendido' ? 'Total Vendido' : 'Quantidade',
                  ]}
                />
                <Bar dataKey="totalVendido" fill="var(--chart-green-soft)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>

          <GraficosAnaliticos graficos={[
            { titulo: 'Evolução mensal do faturamento', dados: vendasPorMes, tipo: 'area', formato: 'moeda', series: [{ chave: 'totalVendido', nome: 'Faturamento' }] },
            { titulo: 'Clientes com maior volume de compras', dados: vendasPorCliente, tipo: 'barra', horizontal: true, formato: 'moeda', series: [{ chave: 'valor', nome: 'Vendido' }] },
            { titulo: 'Faturamento por dia da semana', dados: vendasPorDia, tipo: 'barra', formato: 'moeda', series: [{ chave: 'valor', nome: 'Faturamento' }] },
          ]} />
        </>
      )}
    </>
  )
}
