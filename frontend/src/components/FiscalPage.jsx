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

  const faturamentoMensal = agruparPorMes(notas, (n) => n.dtSaida, [{ chave: 'total', obterValor: (n) => n.valorTotalNota }])
  const notasPorVendedor = agruparSoma(notas, (n) => n.vendedor, () => 1, 'label', 'notas')
  const faturamentoPorVendedor = agruparSoma(notas, (n) => n.vendedor, (n) => n.valorTotalNota, 'label', 'valor').slice(0, 8)

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
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={porCfop} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="cfop" stroke="var(--chart-axis)" interval={0} tick={{ fontSize: 12 }} />
                <YAxis stroke="var(--chart-axis)" />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.08)' }}
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 5px 18px rgba(23,43,58,.12)', color: 'var(--text)' }}
                  labelStyle={{ color: 'var(--text)' }}
                  formatter={(value, nome) => [nome === 'total' ? formatarMoeda(value) : value, nome === 'total' ? 'Total' : 'Notas']}
                />
                <Bar dataKey="total" fill="var(--chart-green-muted)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>

          <GraficosAnaliticos graficos={[
            { titulo: 'Evolução mensal das notas fiscais', dados: faturamentoMensal, tipo: 'area', formato: 'moeda', series: [{ chave: 'total', nome: 'Faturamento' }] },
            { titulo: 'Notas emitidas por vendedor', dados: notasPorVendedor, tipo: 'barra', horizontal: true, series: [{ chave: 'notas', nome: 'Notas' }] },
            { titulo: 'Faturamento por vendedor', dados: faturamentoPorVendedor, tipo: 'barra', horizontal: true, formato: 'moeda', series: [{ chave: 'valor', nome: 'Faturamento' }] },
          ]} />

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
