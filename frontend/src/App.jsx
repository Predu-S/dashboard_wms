import { useEffect, useMemo, useState } from 'react'
import { LayoutDashboard, Package, Warehouse, Settings } from 'lucide-react'
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

  const detalhadoFiltrado = useMemo(
    () => (depositoSelecionado === 'todos' ? detalhado : detalhado.filter((d) => d.deposito === depositoSelecionado)),
    [detalhado, depositoSelecionado]
  )

  const capacidadeTotal = resumoFiltrado.reduce((soma, d) => soma + d.capacidadeTotal, 0)
  const ocupadoTotal = resumoFiltrado.reduce((soma, d) => soma + d.quantidadeOcupada, 0)
  const ocupacaoGeral = capacidadeTotal > 0 ? Math.round((ocupadoTotal / capacidadeTotal) * 1000) / 10 : 0
  const enderecosCriticos = detalhadoFiltrado.filter((d) => d.percentualOcupacao >= 90).length

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar__logo">Depósito BI</div>
        <nav>
          <a className="ativo" href="#">
            <LayoutDashboard size={16} /> Dashboard
          </a>
          <a href="#">
            <Package size={16} /> Estoque &amp; SKUs
          </a>
          <a href="#">
            <Warehouse size={16} /> WMS / Locação
          </a>
          <a href="#">
            <Settings size={16} /> Configurações
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
                  subtitulo="≥ 90% de ocupação"
                  tom={enderecosCriticos > 0 ? 'alerta' : 'neutro'}
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
