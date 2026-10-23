import { useEffect, useState } from 'react'
import { api } from '../api'
import KpiCard from './KpiCard'
import TabelaDados from './TabelaDados'
import { usePeriodo } from '../context/PeriodoContext'
import GraficosAnaliticos from './GraficosAnaliticos'
import { agruparPorMes, agruparSoma } from './chartUtils'
import MiniTelas from './MiniTelas'

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
  const [miniTela, setMiniTela] = useState('faturamento')

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
            <KpiCard titulo="Clientes Faturados" valor={new Set(notas.map((n) => n.cliente)).size} subtitulo="no período selecionado" />
          </section>

          <MiniTelas telas={[{ id: 'faturamento', label: 'Faturamento' }, { id: 'documentos', label: 'Notas e CFOP' }]} ativa={miniTela} onSelecionar={setMiniTela} />
          <section id={`painel-${miniTela}`} role="tabpanel" aria-labelledby={`aba-${miniTela}`}>
            {miniTela === 'faturamento' ? (
              <GraficosAnaliticos graficos={[
                { titulo: 'Evolução mensal das notas fiscais', dados: faturamentoMensal, tipo: 'area', formato: 'moeda', series: [{ chave: 'total', nome: 'Faturamento' }] },
                { titulo: 'Faturamento por vendedor', dados: faturamentoPorVendedor, tipo: 'barra', horizontal: true, formato: 'moeda', series: [{ chave: 'valor', nome: 'Faturamento' }] },
              ]} />
            ) : (
              <GraficosAnaliticos graficos={[
                { titulo: 'Faturamento por CFOP', dados: porCfop.map((item) => ({ label: item.cfop, valor: item.total })), tipo: 'barra', horizontal: true, formato: 'moeda', series: [{ chave: 'valor', nome: 'Faturamento' }] },
                { titulo: 'Notas emitidas por vendedor', dados: notasPorVendedor, tipo: 'barra', horizontal: true, series: [{ chave: 'notas', nome: 'Notas' }] },
              ]} />
            )}
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
