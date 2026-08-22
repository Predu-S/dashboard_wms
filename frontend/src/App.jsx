import { useEffect, useMemo, useState } from 'react'
import { LayoutDashboard, Package, Warehouse, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from './api'
import KpiCard from './components/KpiCard'
import OcupacaoChart from './components/OcupacaoChart'
import OcupacaoTabela from './components/OcupacaoTabela'
import Topbar from './components/Topbar'
import FiltroBarra from './components/FiltroBarra'
import './index.css'

export default function App() {
  const [resumo, setResumo] = useState([])
  const [detalhado, setDetalhado] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const [depositoSelecionado, setDepositoSelecionado] = useState('todos')
  const [somenteCriticos, setSomenteCriticos] = useState(false)
  const [sidebarRecolhida, setSidebarRecolhida] = useState(false)

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

  const detalhadoFiltrado = useMemo(
    () => (somenteCriticos ? detalhadoPorDeposito.filter((d) => d.percentualOcupacao >= 90) : detalhadoPorDeposito),
    [detalhadoPorDeposito, somenteCriticos]
  )

  const capacidadeTotal = resumoFiltrado.reduce((soma, d) => soma + d.capacidadeTotal, 0)
  const ocupadoTotal = resumoFiltrado.reduce((soma, d) => soma + d.quantidadeOcupada, 0)
  const ocupacaoGeral = capacidadeTotal > 0 ? Math.round((ocupadoTotal / capacidadeTotal) * 1000) / 10 : 0
  const enderecosCriticos = detalhadoPorDeposito.filter((d) => d.percentualOcupacao >= 90).length

  function alternarSomenteCriticos() {
    setSomenteCriticos((atual) => !atual)
  }

  return (
    <div className="app">
      <aside className={`sidebar ${sidebarRecolhida ? 'sidebar--recolhida' : ''}`}>
        <div className="sidebar__topo">
          {!sidebarRecolhida && <div className="sidebar__logo">Depósito BI</div>}
          <button
            className="sidebar__toggle"
            onClick={() => setSidebarRecolhida((atual) => !atual)}
            title={sidebarRecolhida ? 'Expandir menu' : 'Recolher menu'}
          >
            {sidebarRecolhida ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
        <nav>
          <a className="ativo" href="#" title="Dashboard">
            <LayoutDashboard size={16} /> {!sidebarRecolhida && 'Dashboard'}
          </a>
          <a href="#" title="Estoque & SKUs">
            <Package size={16} /> {!sidebarRecolhida && 'Estoque & SKUs'}
          </a>
          <a href="#" title="WMS / Locação">
            <Warehouse size={16} /> {!sidebarRecolhida && 'WMS / Locação'}
          </a>
          <a href="#" title="Configurações">
            <Settings size={16} /> {!sidebarRecolhida && 'Configurações'}
          </a>
        </nav>
      </aside>

      <div className="area-principal">
        <Topbar />

        <main className="conteudo">
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
            />
          )}

          {carregando && <p>Carregando dados...</p>}
          {erro && (
            <p className="erro">
              Não foi possível carregar a API ({erro}). Verifique se o backend está rodando em
              http://localhost:5000.
            </p>
          )}

          {!carregando && !erro && (
            <>
              <section className="kpis">
                <KpiCard titulo="Ocupação Geral" valor={`${ocupacaoGeral}%`} subtitulo="No filtro atual" />
                <KpiCard titulo="Capacidade Total" valor={capacidadeTotal.toLocaleString('pt-BR')} subtitulo="posições" />
                <KpiCard titulo="Posições Ocupadas" valor={ocupadoTotal.toLocaleString('pt-BR')} />
                <KpiCard
                  titulo="Endereços Críticos"
                  valor={enderecosCriticos}
                  subtitulo={somenteCriticos ? 'Clique para ver todos' : '≥ 90% • clique para filtrar'}
                  tom={enderecosCriticos > 0 ? 'alerta' : 'neutro'}
                  ativo={somenteCriticos}
                  onClick={enderecosCriticos > 0 ? alternarSomenteCriticos : undefined}
                />
              </section>

              <section className="grid-principal">
                <OcupacaoChart dados={resumoFiltrado} />
                <OcupacaoTabela dados={detalhadoFiltrado} />
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
