import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { api } from '../api'
import KpiCard from './KpiCard'
import TabelaDados from './TabelaDados'
import { usePeriodo } from '../context/PeriodoContext'

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
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={porVendedor} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3a" />
                  <XAxis dataKey="vendedor" stroke="#8b93a7" interval={0} tick={{ fontSize: 12 }} angle={-30} textAnchor="end" height={50} />
                  <YAxis stroke="#8b93a7" />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.08)' }}
                    contentStyle={{ background: '#1b1f27', border: '1px solid #2a2f3a', borderRadius: 8 }}
                    labelStyle={{ color: '#e6e9f0' }}
                    formatter={(value) => [formatarMoeda(value), 'Total']}
                  />
                  <Bar dataKey="totalVendido" fill="#4f8cff" radius={[6, 6, 0, 0]} />
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
            <ResponsiveContainer width="100%" height={Math.max(220, produtosMaisVendidos.length * 42)}>
              <BarChart
                data={produtosMaisVendidos}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3a" />
                <XAxis type="number" stroke="#8b93a7" />
                <YAxis type="category" dataKey="produto" stroke="#8b93a7" width={160} tick={{ fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.08)' }}
                  contentStyle={{ background: '#1b1f27', border: '1px solid #2a2f3a', borderRadius: 8 }}
                  labelStyle={{ color: '#e6e9f0' }}
                  formatter={(value, nome) => [
                    nome === 'totalVendido' ? formatarMoeda(value) : value,
                    nome === 'totalVendido' ? 'Total Vendido' : 'Quantidade',
                  ]}
                />
                <Bar dataKey="totalVendido" fill="#3ecf8e" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>
        </>
      )}
    </>
  )
}
