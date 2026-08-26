import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { api } from '../api'
import KpiCard from './KpiCard'

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(data) {
  return data ? new Date(data).toLocaleDateString('pt-BR') : '—'
}

export default function ComprasPage() {
  const [notas, setNotas] = useState([])
  const [resumo, setResumo] = useState(null)
  const [porFornecedor, setPorFornecedor] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    Promise.all([api.compras(), api.comprasResumo(), api.comprasPorFornecedor()])
      .then(([notasResp, resumoResp, fornecedorResp]) => {
        setNotas(notasResp)
        setResumo(resumoResp)
        setPorFornecedor(fornecedorResp)
      })
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false))
  }, [])

  return (
    <>
      <header className="conteudo__header">
        <h1>Compras / Fornecedores</h1>
        <span className="conteudo__data">Notas fiscais de entrada não canceladas</span>
      </header>

      {carregando && <p>Carregando dados...</p>}
      {erro && <p className="erro">Não foi possível carregar a API ({erro}).</p>}

      {!carregando && !erro && resumo && (
        <>
          <section className="kpis">
            <KpiCard titulo="Total Comprado" valor={formatarMoeda(resumo.totalComprado)} />
            <KpiCard titulo="Notas de Entrada" valor={resumo.quantidadeNotas} />
            <KpiCard titulo="Valor Médio por Nota" valor={formatarMoeda(resumo.valorMedioPorNota)} />
          </section>

          <section className="grid-principal">
            <div className="chart-card">
              <h3>Compras por Fornecedor</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={porFornecedor} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3a" />
                  <XAxis dataKey="fornecedor" stroke="#8b93a7" interval={0} tick={{ fontSize: 12 }} angle={-30} textAnchor="end" height={50} />
                  <YAxis stroke="#8b93a7" />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.08)' }}
                    contentStyle={{ background: '#1b1f27', border: '1px solid #2a2f3a', borderRadius: 8 }}
                    labelStyle={{ color: '#e6e9f0' }}
                    formatter={(value) => [formatarMoeda(value), 'Total']}
                  />
                  <Bar dataKey="totalComprado" fill="#f5a623" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="tabela-card" style={{ maxHeight: 420 }}>
              <div className="tabela-card__header">
                <h3>Últimas Notas de Entrada</h3>
              </div>
              <div className="tabela-card__scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Nota</th>
                      <th>Fornecedor</th>
                      <th>Emissão</th>
                      <th>Entrada</th>
                      <th>Volumes</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notas.map((n, i) => (
                      <tr key={i}>
                        <td>{n.numNota}/{n.serie}</td>
                        <td>{n.fornecedor}</td>
                        <td>{formatarData(n.dataEmissao)}</td>
                        <td>{formatarData(n.dataEntradaLoja)}</td>
                        <td>{n.volumes}</td>
                        <td>{formatarMoeda(n.valorTotalNota)}</td>
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
