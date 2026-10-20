import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { api } from '../api'
import KpiCard from './KpiCard'
import TabelaDados from './TabelaDados'
import { usePeriodo } from '../context/PeriodoContext'
import GraficosAnaliticos from './GraficosAnaliticos'
import { agruparCampos, agruparPorMes } from './chartUtils'

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(data) {
  return data ? new Date(data).toLocaleDateString('pt-BR') : '—'
}

const COLUNAS = [
  { chave: 'numNota', rotulo: 'Nota', render: (n) => `${n.numNota}/${n.serie}`, valorCsv: (n) => `${n.numNota}/${n.serie}` },
  { chave: 'fornecedor', rotulo: 'Fornecedor' },
  { chave: 'dataEmissao', rotulo: 'Emissão', render: (n) => formatarData(n.dataEmissao), valorCsv: (n) => formatarData(n.dataEmissao) },
  { chave: 'dataEntradaLoja', rotulo: 'Entrada', render: (n) => formatarData(n.dataEntradaLoja), valorCsv: (n) => formatarData(n.dataEntradaLoja) },
  { chave: 'volumes', rotulo: 'Volumes' },
  { chave: 'valorTotalNota', rotulo: 'Valor', render: (n) => formatarMoeda(n.valorTotalNota), valorCsv: (n) => n.valorTotalNota },
]

export default function ComprasPage() {
  const { periodo } = usePeriodo()
  const [notas, setNotas] = useState([])
  const [resumo, setResumo] = useState(null)
  const [porFornecedor, setPorFornecedor] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const comprasPorMes = agruparPorMes(notas, (n) => n.dataEmissao, [{ chave: 'totalComprado', obterValor: (n) => n.valorTotalNota }])
  const notasPorMes = agruparPorMes(notas, (n) => n.dataEmissao, [{ chave: 'notas', obterValor: () => 1 }, { chave: 'volumes', obterValor: (n) => n.volumes }])
  const custosPorFornecedor = agruparCampos(notas, (n) => n.fornecedor, (n) => ({ frete: n.valorFrete, desconto: n.desconto })).sort((a, b) => (b.frete + b.desconto) - (a.frete + a.desconto)).slice(0, 8)

  useEffect(() => {
    setCarregando(true)
    Promise.all([api.compras(periodo), api.comprasResumo(periodo), api.comprasPorFornecedor(periodo)])
      .then(([notasResp, resumoResp, fornecedorResp]) => {
        setNotas(notasResp)
        setResumo(resumoResp)
        setPorFornecedor(fornecedorResp)
      })
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false))
  }, [periodo.dataInicio, periodo.dataFim])

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

          <section className="chart-card">
            <h3>Compras por Fornecedor</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={porFornecedor} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="fornecedor" stroke="var(--chart-axis)" interval={0} tick={{ fontSize: 12 }} angle={-30} textAnchor="end" height={50} />
                <YAxis stroke="var(--chart-axis)" />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.08)' }}
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 5px 18px rgba(23,43,58,.12)', color: 'var(--text)' }}
                  labelStyle={{ color: 'var(--text)' }}
                  formatter={(value) => [formatarMoeda(value), 'Total']}
                />
                <Bar dataKey="totalComprado" fill="var(--chart-green-muted)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>

          <GraficosAnaliticos graficos={[
            { titulo: 'Evolução mensal das compras', dados: comprasPorMes, tipo: 'area', formato: 'moeda', series: [{ chave: 'totalComprado', nome: 'Compras' }] },
            { titulo: 'Notas e volumes recebidos por mês', dados: notasPorMes, tipo: 'barra', empilhado: false, series: [{ chave: 'notas', nome: 'Notas' }, { chave: 'volumes', nome: 'Volumes' }] },
            { titulo: 'Frete e descontos por fornecedor', dados: custosPorFornecedor, tipo: 'barra', horizontal: true, formato: 'moeda', series: [{ chave: 'frete', nome: 'Frete' }, { chave: 'desconto', nome: 'Desconto' }] },
          ]} />

          <TabelaDados
            titulo="Notas de Entrada"
            colunas={COLUNAS}
            dados={notas}
            nomeArquivoCsv="compras-notas"
            mensagemVazia="Nenhuma nota no período."
          />
        </>
      )}
    </>
  )
}
