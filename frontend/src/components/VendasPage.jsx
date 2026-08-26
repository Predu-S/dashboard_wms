import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { api } from '../api'
import KpiCard from './KpiCard'

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function VendasPage() {
  const [vendas, setVendas] = useState([])
  const [resumo, setResumo] = useState(null)
  const [porVendedor, setPorVendedor] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    Promise.all([api.vendas(), api.vendasResumo(), api.vendasPorVendedor()])
      .then(([vendasResp, resumoResp, vendedorResp]) => {
        setVendas(vendasResp)
        setResumo(resumoResp)
        setPorVendedor(vendedorResp)
      })
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false))
  }, [])

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

            <div className="tabela-card" style={{ maxHeight: 420 }}>
              <div className="tabela-card__header">
                <h3>Últimos Pedidos</h3>
              </div>
              <div className="tabela-card__scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Pedido</th>
                      <th>Cliente</th>
                      <th>Vendedor</th>
                      <th>Data</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendas.map((v, i) => (
                      <tr key={i}>
                        <td>{v.numPedido}</td>
                        <td>{v.cliente}</td>
                        <td>{v.vendedor}</td>
                        <td>{new Date(v.data).toLocaleDateString('pt-BR')}</td>
                        <td>{formatarMoeda(v.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </>
      )}
    </>
  )
}
