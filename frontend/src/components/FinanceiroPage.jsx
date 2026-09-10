import { useEffect, useMemo, useState } from 'react'
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

function StatusPill({ pago, vencido }) {
  return (
    <span
      className="status-pill"
      style={{
        color: pago ? '#3ecf8e' : vencido ? '#ff5c5c' : '#8b93a7',
        borderColor: pago ? '#3ecf8e' : vencido ? '#ff5c5c' : '#2a2f3a',
      }}
    >
      {pago ? 'Pago' : vencido ? 'Vencido' : 'Em aberto'}
    </span>
  )
}

export default function FinanceiroPage() {
  const { periodo } = usePeriodo()
  const [aba, setAba] = useState('receber')
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

  // Normaliza os dois formatos (receber/pagar) em um só, pra alimentar a tabela genérica
  const contasNormalizadas = useMemo(() => {
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
        pago,
        vencido,
      }
    })
  }, [aba, contasReceber, contasPagar])

  const colunas = useMemo(
    () => [
      { chave: 'nome', rotulo: aba === 'receber' ? 'Cliente' : 'Fornecedor' },
      { chave: 'numTit', rotulo: 'Título' },
      { chave: 'dtEmissao', rotulo: 'Emissão', render: (i) => formatarData(i.dtEmissao), valorCsv: (i) => formatarData(i.dtEmissao) },
      { chave: 'vencimento', rotulo: 'Vencimento', render: (i) => formatarData(i.vencimento), valorCsv: (i) => formatarData(i.vencimento) },
      { chave: 'pagamento', rotulo: 'Pagamento', render: (i) => formatarData(i.pagamento), valorCsv: (i) => formatarData(i.pagamento) },
      { chave: 'valor', rotulo: 'Valor', render: (i) => formatarMoeda(i.valor), valorCsv: (i) => i.valor },
      {
        chave: 'pago',
        rotulo: 'Status',
        render: (i) => <StatusPill pago={i.pago} vencido={i.vencido} />,
        valorCsv: (i) => (i.pago ? 'Pago' : i.vencido ? 'Vencido' : 'Em aberto'),
      },
    ],
    [aba]
  )

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
              tom={resumo.totalReceberVencido > 0 ? 'alerta' : 'neutro'}
            />
            <KpiCard titulo="A Pagar (em aberto)" valor={formatarMoeda(resumo.totalPagar)} />
            <KpiCard
              titulo="A Pagar Vencido"
              valor={formatarMoeda(resumo.totalPagarVencido)}
              tom={resumo.totalPagarVencido > 0 ? 'alerta' : 'neutro'}
            />
          </section>

          <div className="abas">
            <button className={aba === 'receber' ? 'aba ativa' : 'aba'} onClick={() => setAba('receber')}>
              Contas a Receber
            </button>
            <button className={aba === 'pagar' ? 'aba ativa' : 'aba'} onClick={() => setAba('pagar')}>
              Contas a Pagar
            </button>
          </div>

          <TabelaDados
            titulo={aba === 'receber' ? 'Títulos a Receber' : 'Títulos a Pagar'}
            colunas={colunas}
            dados={contasNormalizadas}
            nomeArquivoCsv={aba === 'receber' ? 'contas-a-receber' : 'contas-a-pagar'}
            mensagemVazia="Nenhum título no período."
          />
        </>
      )}
    </>
  )
}
