import { useEffect, useState } from 'react'
import { api } from '../api'
import KpiCard from './KpiCard'
import { usePeriodo } from '../context/PeriodoContext'
import GraficosAnaliticos from './GraficosAnaliticos'
import MiniTelas from './MiniTelas'
import { agruparSoma } from './chartUtils'

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(data) {
  return data ? new Date(data).toLocaleDateString('pt-BR') : '—'
}

export default function FinanceiroPage() {
  const { periodo } = usePeriodo()
  const [aba, setAba] = useState('receber')
  const [miniTela, setMiniTela] = useState('risco-financeiro')
  const [resumo, setResumo] = useState(null)
  const [contasReceber, setContasReceber] = useState([])
  const [contasPagar, setContasPagar] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    setCarregando(true)
    Promise.all([
      api.financeiroResumo(),
      api.financeiroContasReceber(periodo),
      api.financeiroContasPagar(periodo),
    ])
      .then(([resumoResp, receberResp, pagarResp]) => {
        setResumo(resumoResp)
        setContasReceber(receberResp)
        setContasPagar(pagarResp)
      })
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false))
  }, [periodo.dataInicio, periodo.dataFim])

  // Normaliza os dois formatos de contas para alimentar as análises financeiras.
  const contasNormalizadas = (() => {
    const origem = aba === 'receber' ? contasReceber : contasPagar
    return origem.map((c) => {
      const vencimento = aba === 'receber' ? c.dtVencto : c.dtVenc
      const pagamento = aba === 'receber' ? c.dtPagto : c.dtPag
      const pago = !!pagamento
      const vencido = !pago && new Date(vencimento) < new Date().setHours(0, 0, 0, 0)
      return {
        nome: aba === 'receber' ? c.cliente : c.fornecedor,
        numTit: c.numTit,
        dtEmissao: c.dtEmissao,
        vencimento,
        pagamento,
        valor: aba === 'receber' ? c.valor : c.vrAPagar,
        valorPago: aba === 'receber' ? (c.valorPg || 0) : (c.vrPago || 0),
        pago,
        vencido,
      }
    })
  })()
  const contasEmAberto = contasNormalizadas.filter((conta) => !conta.pago)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const saldoPorVencimento = agruparSoma(contasEmAberto, (c) => formatarData(c.vencimento), (c) => c.valor, 'label', 'valor').sort((a, b) => {
    const [diaA, mesA, anoA] = a.label.split('/').map(Number)
    const [diaB, mesB, anoB] = b.label.split('/').map(Number)
    return new Date(anoA, mesA - 1, diaA) - new Date(anoB, mesB - 1, diaB)
  })
  const maioresContrapartes = agruparSoma(contasEmAberto, (c) => c.nome, (c) => c.valor, 'label', 'valor').slice(0, 8)
  const saldoTotalAberto = contasEmAberto.reduce((total, conta) => total + conta.valor, 0)
  const saldoVencido = contasEmAberto.filter((conta) => conta.vencido).reduce((total, conta) => total + conta.valor, 0)
  const percentualVencido = saldoTotalAberto > 0 ? (saldoVencido / saldoTotalAberto) * 100 : 0
  const saldoPagarAberto = contasPagar.reduce((total, conta) => total + (conta.vrAPagar || 0), 0)
  const saldoPagarVencido = contasPagar.reduce((total, conta) => {
    const vencimento = new Date(conta.dtVenc)
    vencimento.setHours(0, 0, 0, 0)
    return !conta.dtPag && vencimento < hoje ? total + (conta.vrAPagar || 0) : total
  }, 0)
  const percentualPagarVencido = saldoPagarAberto > 0 ? (saldoPagarVencido / saldoPagarAberto) * 100 : 0
  const maiorAtraso = contasEmAberto.reduce((maior, conta) => {
    if (!conta.vencido) return maior
    const vencimento = new Date(conta.vencimento)
    vencimento.setHours(0, 0, 0, 0)
    return Math.max(maior, Math.floor((hoje - vencimento) / 86400000))
  }, 0)
  const situacaoContas = [
    { label: 'Em aberto', valor: contasNormalizadas.filter((c) => !c.pago && !c.vencido).length, cor: 'var(--chart-warning)' },
    { label: 'Vencidas', valor: contasNormalizadas.filter((c) => c.vencido).length, cor: 'var(--chart-danger)' },
    { label: aba === 'receber' ? 'Recebidas' : 'Pagas', valor: contasNormalizadas.filter((c) => c.pago).length, cor: 'var(--chart-green)' },
  ].filter((item) => item.valor > 0)
  const faixasAtraso = [
    { id: 'a-vencer', label: 'A vencer', valor: 0, cor: 'var(--chart-green)' },
    { id: '1-30', label: 'Vencido · 1–30 dias', valor: 0, cor: 'var(--chart-warning)' },
    { id: '31-60', label: 'Vencido · 31–60 dias', valor: 0, cor: 'var(--chart-danger)' },
    { id: '61+', label: 'Vencido · mais de 60 dias', valor: 0, cor: '#a33d3d' },
  ]
  contasEmAberto.forEach((conta) => {
    const vencimento = new Date(conta.vencimento)
    vencimento.setHours(0, 0, 0, 0)
    const diasAtraso = Math.floor((hoje - vencimento) / 86400000)
    const faixa = diasAtraso <= 0 ? faixasAtraso[0] : diasAtraso <= 30 ? faixasAtraso[1] : diasAtraso <= 60 ? faixasAtraso[2] : faixasAtraso[3]
    faixa.valor += conta.valor
  })
  const agingEmAberto = faixasAtraso.filter((faixa) => faixa.valor > 0)
  const proximosTitulos = contasEmAberto
    .filter((conta) => {
      const vencimento = new Date(conta.vencimento)
      vencimento.setHours(0, 0, 0, 0)
      return vencimento >= hoje
    })
    .sort((a, b) => new Date(a.vencimento) - new Date(b.vencimento))
    .slice(0, 5)
  const vencimentosProximos = agruparSoma(
    contasEmAberto.filter((conta) => {
      const vencimento = new Date(conta.vencimento)
      vencimento.setHours(0, 0, 0, 0)
      return vencimento >= hoje
    }),
    (conta) => formatarData(conta.vencimento),
    (conta) => conta.valor,
    'label',
    'valor'
  ).sort((a, b) => {
    const [diaA, mesA, anoA] = a.label.split('/').map(Number)
    const [diaB, mesB, anoB] = b.label.split('/').map(Number)
    return new Date(anoA, mesA - 1, diaA) - new Date(anoB, mesB - 1, diaB)
  }).slice(0, 8)
  const concentracaoContrapartes = maioresContrapartes.slice(0, 3)
  const saldoTop3 = concentracaoContrapartes.reduce((total, item) => total + item.valor, 0)
  const dadosConcentracao = [
    ...concentracaoContrapartes.map((item, indice) => ({ ...item, cor: ['var(--chart-green)', 'var(--chart-blue)', 'var(--chart-warning)'][indice] })),
    ...(saldoTotalAberto > saldoTop3 ? [{ label: 'Demais', valor: saldoTotalAberto - saldoTop3, cor: 'var(--chart-neutral)' }] : []),
  ]
  const totalBaixado = contasNormalizadas
    .filter((conta) => conta.pago)
    .reduce((total, conta) => total + (conta.valorPago || conta.valor), 0)
  const formasPagamentoDemo = [
    { label: 'PIX', valor: totalBaixado * 0.42, cor: 'var(--chart-green)' },
    { label: 'Boleto', valor: totalBaixado * 0.31, cor: 'var(--chart-blue)' },
    { label: 'Transferência', valor: totalBaixado * 0.18, cor: 'var(--chart-warning)' },
    { label: 'Cartão', valor: totalBaixado * 0.09, cor: 'var(--chart-neutral)' },
  ]

  return (
    <>
      <header className="conteudo__header">
        <h1>Financeiro</h1>
        <span className="conteudo__data">Contas a receber e a pagar — títulos não cancelados</span>
      </header>

      {carregando && <p>Carregando dados...</p>}
      {erro && <p className="erro">Não foi possível carregar a API ({erro}).</p>}

      {!carregando && !erro && resumo && (
        <>
          <section className="kpis">
            <KpiCard titulo="A Receber (em aberto)" valor={formatarMoeda(resumo.totalReceber)} />
            <KpiCard
              titulo="A Receber Vencido"
              valor={formatarMoeda(resumo.totalReceberVencido)}
              subtitulo={`${percentualVencido.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% do saldo em aberto`}
              tom={resumo.totalReceberVencido > 0 ? 'alerta' : 'neutro'}
            />
            <KpiCard titulo="A Pagar (em aberto)" valor={formatarMoeda(resumo.totalPagar)} />
            <KpiCard
              titulo="A Pagar Vencido"
              valor={formatarMoeda(resumo.totalPagarVencido)}
              subtitulo={`${percentualPagarVencido.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% do saldo em aberto`}
              tom={resumo.totalPagarVencido > 0 ? 'alerta' : 'neutro'}
            />
          </section>

          <div className="abas">
            <button className={aba === 'receber' ? 'aba ativa' : 'aba'} onClick={() => { setAba('receber'); setMiniTela('risco-financeiro') }}>
              Contas a Receber
            </button>
            <button className={aba === 'pagar' ? 'aba ativa' : 'aba'} onClick={() => { setAba('pagar'); setMiniTela('risco-financeiro') }}>
              Contas a Pagar
            </button>
          </div>

          <MiniTelas
            telas={[{ id: 'risco-financeiro', label: 'Situação e atrasos' }, { id: 'vencimentos-financeiros', label: 'Vencimentos' }, { id: 'exposicao-financeira', label: 'Exposição' }]}
            ativa={miniTela}
            onSelecionar={setMiniTela}
            rotulo="Análises financeiras"
          />
          <section id={`painel-${miniTela}`} role="tabpanel" aria-labelledby={`aba-${miniTela}`}>
            {miniTela === 'risco-financeiro' ? (
              <>
                <section className="kpis financeiro-insights" aria-label="Indicador de atraso">
                  <KpiCard titulo="Maior atraso" valor={`${maiorAtraso} dias`} subtitulo={maiorAtraso > 0 ? 'Título mais antigo ainda em aberto' : 'Nenhum título em atraso'} tom={maiorAtraso > 0 ? 'alerta' : 'neutro'} />
                </section>
                <GraficosAnaliticos graficos={[
                  { titulo: `Situação das contas a ${aba === 'receber' ? 'receber' : 'pagar'}`, dados: situacaoContas, tipo: 'pizza', series: [{ chave: 'valor', nome: 'Títulos' }] },
                  { titulo: 'Saldo em aberto por faixa de vencimento', dados: agingEmAberto, tipo: 'barra', horizontal: true, formato: 'moeda', series: [{ chave: 'valor', nome: 'Saldo' }] },
                  { titulo: 'Formas de pagamento', dados: formasPagamentoDemo, tipo: 'pizza', formato: 'moeda', series: [{ chave: 'valor', nome: 'Valor pago' }] },
                ]} />
              </>
            ) : miniTela === 'vencimentos-financeiros' ? (
              <>
                <section className="chart-card financeiro-agenda" aria-label="Agenda dos próximos vencimentos">
                  <h3>Agenda dos próximos vencimentos</h3>
                  {proximosTitulos.length ? (
                    <ul className="financeiro-agenda__lista">
                      {proximosTitulos.map((conta, indice) => (
                        <li className="financeiro-agenda__item" key={`${conta.numTit}-${indice}`}>
                          <span className="financeiro-agenda__entidade">{conta.nome}</span>
                          <span className="financeiro-agenda__data">{formatarData(conta.vencimento)}</span>
                          <strong>{formatarMoeda(conta.valor)}</strong>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="financeiro-agenda__vazio">Nenhum vencimento futuro em aberto neste período.</p>}
                </section>
                <GraficosAnaliticos graficos={[
                  { titulo: 'Saldo em aberto por vencimento', dados: saldoPorVencimento, tipo: 'barra', horizontal: true, formato: 'moeda', series: [{ chave: 'valor', nome: 'Em aberto' }] },
                  { titulo: 'Próximos vencimentos', dados: vencimentosProximos, tipo: 'barra', horizontal: true, altura: 150, formato: 'moeda', series: [{ chave: 'valor', nome: 'A vencer', cor: 'var(--chart-green)' }] },
                ]} />
              </>
            ) : (
              <GraficosAnaliticos graficos={[
                { titulo: `${aba === 'receber' ? 'Clientes' : 'Fornecedores'} com maior saldo em aberto`, dados: maioresContrapartes, tipo: 'barra', horizontal: true, altura: 220, formato: 'moeda', series: [{ chave: 'valor', nome: 'Em aberto' }] },
                { titulo: 'Concentração do saldo em aberto', dados: dadosConcentracao, tipo: 'pizza', series: [{ chave: 'valor', nome: 'Saldo' }] },
              ]} />
            )}
          </section>
        </>
      )}
    </>
  )
}
