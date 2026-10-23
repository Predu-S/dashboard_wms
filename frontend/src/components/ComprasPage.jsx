import { useEffect, useState } from 'react'
import { api } from '../api'
import KpiCard from './KpiCard'
import TabelaDados from './TabelaDados'
import { usePeriodo } from '../context/PeriodoContext'
import GraficosAnaliticos from './GraficosAnaliticos'
import { agruparCampos, agruparPorMes } from './chartUtils'
import MiniTelas from './MiniTelas'

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
  const [miniTela, setMiniTela] = useState('recebimento')

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
            <KpiCard titulo="Fornecedores" valor={new Set(notas.map((n) => n.fornecedor)).size} subtitulo="com notas no período" />
          </section>

          <MiniTelas telas={[{ id: 'recebimento', label: 'Compras e recebimento' }, { id: 'fornecedores', label: 'Fornecedores e custos' }]} ativa={miniTela} onSelecionar={setMiniTela} />
          <section id={`painel-${miniTela}`} role="tabpanel" aria-labelledby={`aba-${miniTela}`}>
            {miniTela === 'recebimento' ? (
              <GraficosAnaliticos graficos={[
                { titulo: 'Evolução mensal das compras', dados: comprasPorMes, tipo: 'area', formato: 'moeda', series: [{ chave: 'totalComprado', nome: 'Compras' }] },
                { titulo: 'Notas e volumes registrados por mês', dados: notasPorMes, tipo: 'barra', empilhado: false, series: [{ chave: 'notas', nome: 'Notas' }, { chave: 'volumes', nome: 'Volumes' }] },
              ]} />
            ) : (
              <GraficosAnaliticos graficos={[
                { titulo: 'Compras por fornecedor', dados: porFornecedor.slice(0, 8).map((n) => ({ label: n.fornecedor, valor: n.totalComprado })), tipo: 'barra', horizontal: true, formato: 'moeda', series: [{ chave: 'valor', nome: 'Compras' }] },
                { titulo: 'Frete e descontos por fornecedor', dados: custosPorFornecedor, tipo: 'barra', horizontal: true, formato: 'moeda', series: [{ chave: 'frete', nome: 'Frete' }, { chave: 'desconto', nome: 'Desconto' }] },
              ]} />
            )}
          </section>

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
