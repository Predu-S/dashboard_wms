import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { api } from '../api'
import KpiCard from './KpiCard'
import TabelaDados from './TabelaDados'
import { usePeriodo } from '../context/PeriodoContext'

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(data) {
  return data ? new Date(data).toLocaleDateString('pt-BR') : '—'
}

const COLUNAS = [
  { chave: 'codigo', rotulo: 'Nota', render: (n) => `${n.codigo}/${n.serie}`, valorCsv: (n) => `${n.codigo}/${n.serie}` },
  { chave: 'cfop', rotulo: 'CFOP' },
  { chave: 'cliente', rotulo: 'Cliente' },
  { chave: 'vendedor', rotulo: 'Vendedor' },
  { chave: 'dtSaida', rotulo: 'Saída', render: (n) => formatarData(n.dtSaida), valorCsv: (n) => formatarData(n.dtSaida) },
  { chave: 'valorTotalNota', rotulo: 'Valor', render: (n) => formatarMoeda(n.valorTotalNota), valorCsv: (n) => n.valorTotalNota },
]

export default function FiscalPage() {
  const { periodo } = usePeriodo()
  const [notas, setNotas] = useState([])
  const [resumo, setResumo] = useState(null)
  const [porCfop, setPorCfop] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    setCarregando(true)
    Promise.all([api.fiscalNotas(periodo), api.fiscalResumo(periodo), api.fiscalPorCfop(periodo)])
      .then(([notasResp, resumoResp, cfopResp]) => {
        setNotas(notasResp)
        setResumo(resumoResp)
        setPorCfop(cfopResp)
      })
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false))
  }, [periodo.dataInicio, periodo.dataFim])

  return (
    <>
      <header className="conteudo__header">
        <h1>Fiscal</h1>
        <span className="conteudo__data">Notas fiscais de saída não canceladas</span>
      </header>

      {carregando && <p>Carregando dados...</p>}
      {erro && <p className="erro">Não foi possível carregar a API ({erro}).</p>}

      {!carregando && !erro && resumo && (
        <>
          <section className="kpis">
            <KpiCard titulo="Total Faturado" valor={formatarMoeda(resumo.totalFaturado)} />
            <KpiCard titulo="Notas Emitidas" valor={resumo.quantidadeNotas} />
            <KpiCard titulo="Valor Médio por Nota" valor={formatarMoeda(resumo.valorMedioPorNota)} />
          </section>

          <section className="chart-card">
            <h3>Notas por CFOP</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={porCfop} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3a" />
                <XAxis dataKey="cfop" stroke="#8b93a7" interval={0} tick={{ fontSize: 12 }} />
                <YAxis stroke="#8b93a7" />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.08)' }}
                  contentStyle={{ background: '#1b1f27', border: '1px solid #2a2f3a', borderRadius: 8 }}
                  labelStyle={{ color: '#e6e9f0' }}
                  formatter={(value, nome) => [nome === 'total' ? formatarMoeda(value) : value, nome === 'total' ? 'Total' : 'Notas']}
                />
                <Bar dataKey="total" fill="#a970ff" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>

          <TabelaDados
            titulo="Notas Fiscais"
            colunas={COLUNAS}
            dados={notas}
            nomeArquivoCsv="fiscal-notas"
            mensagemVazia="Nenhuma nota no período."
          />
        </>
      )}
    </>
  )
}
