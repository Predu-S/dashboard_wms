import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import KpiCard from './KpiCard'
import OcupacaoChart from './OcupacaoChart'
import OcupacaoTabela from './OcupacaoTabela'
import FiltroBarra from './FiltroBarra'

export default function DashboardPage() {
  const [resumo, setResumo] = useState([])
  const [detalhado, setDetalhado] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const [depositoSelecionado, setDepositoSelecionado] = useState('todos')
  const [situacaoFiltro, setSituacaoFiltro] = useState('todas')

  useEffect(() => {
    Promise.all([api.ocupacaoResumo(), api.ocupacaoDetalhada()])
      .then(([resumoResp, detalhadoResp]) => {
        setResumo(resumoResp)
        setDetalhado(detalhadoResp)
      })
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false))
  }, [])

  const depositosDisponiveis = useMemo(
    () => [...new Set(resumo.map((d) => d.deposito))],
    [resumo]
  )

  const resumoFiltrado = useMemo(
    () => (depositoSelecionado === 'todos' ? resumo : resumo.filter((d) => d.deposito === depositoSelecionado)),
    [resumo, depositoSelecionado]
  )

  const detalhadoPorDeposito = useMemo(
    () => (depositoSelecionado === 'todos' ? detalhado : detalhado.filter((d) => d.deposito === depositoSelecionado)),
    [detalhado, depositoSelecionado]
  )

  const detalhadoFiltrado = useMemo(() => {
    if (situacaoFiltro === 'critico') return detalhadoPorDeposito.filter((d) => d.percentualOcupacao >= 90)
    if (situacaoFiltro === 'normal') return detalhadoPorDeposito.filter((d) => d.percentualOcupacao < 90)
    return detalhadoPorDeposito
  }, [detalhadoPorDeposito, situacaoFiltro])

  const capacidadeTotal = resumoFiltrado.reduce((soma, d) => soma + d.capacidadeTotal, 0)
  const ocupadoTotal = resumoFiltrado.reduce((soma, d) => soma + d.quantidadeOcupada, 0)
  const ocupacaoGeral = capacidadeTotal > 0 ? Math.round((ocupadoTotal / capacidadeTotal) * 1000) / 10 : 0
  const enderecosCriticos = detalhadoPorDeposito.filter((d) => d.percentualOcupacao >= 90).length

  function alternarFiltroCriticos() {
    setSituacaoFiltro((atual) => (atual === 'critico' ? 'todas' : 'critico'))
  }

  return (
    <>
      <header className="conteudo__header">
        <h1>Dashboard de Ocupação — Armazém</h1>
        <span className="conteudo__data">
          {depositoSelecionado === 'todos' ? 'Consolidado • Todos os Depósitos' : `Depósito ${depositoSelecionado}`}
        </span>
      </header>

      {!carregando && !erro && (
        <FiltroBarra
          depositos={depositosDisponiveis}
          depositoSelecionado={depositoSelecionado}
          onSelecionarDeposito={setDepositoSelecionado}
          situacaoSelecionada={situacaoFiltro}
          onSelecionarSituacao={setSituacaoFiltro}
        />
      )}

      {carregando && <p>Carregando dados...</p>}
      {erro && <p className="erro">Não foi possível carregar a API ({erro}).</p>}

      {!carregando && !erro && (
        <>
          <section className="kpis">
            <KpiCard titulo="Ocupação Geral" valor={`${ocupacaoGeral}%`} subtitulo="No filtro atual" />
            <KpiCard titulo="Capacidade Total" valor={capacidadeTotal.toLocaleString('pt-BR')} subtitulo="posições" />
            <KpiCard titulo="Posições Ocupadas" valor={ocupadoTotal.toLocaleString('pt-BR')} />
            <KpiCard
              titulo="Endereços Críticos"
              valor={enderecosCriticos}
              subtitulo={situacaoFiltro === 'critico' ? 'Clique para ver todos' : '≥ 90% • clique para filtrar'}
              tom={enderecosCriticos > 0 ? 'alerta' : 'neutro'}
              ativo={situacaoFiltro === 'critico'}
              onClick={enderecosCriticos > 0 ? alternarFiltroCriticos : undefined}
            />
          </section>

          <section className="grid-principal">
            <OcupacaoChart dados={resumoFiltrado} />
            <OcupacaoTabela dados={detalhadoFiltrado} />
          </section>
        </>
      )}
    </>
  )
}
