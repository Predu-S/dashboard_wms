import { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Home, Boxes, Warehouse, Package, ShoppingCart, Wallet, Truck, FileText, Settings, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import Topbar from './Topbar'
import FiltroData from './FiltroData'
import { PeriodoProvider, usePeriodo } from '../context/PeriodoContext'

const ITENS_MENU = [
  { rota: '/', rotulo: 'Visão Geral', icone: Home, fim: true },
  { rota: '/estoque', rotulo: 'Estoque', icone: Boxes },
  {
    rota: '/ocupacao',
    rotulo: 'Ocupação',
    icone: Warehouse,
    filhos: [
      { rota: '/ocupacao/pendencias', rotulo: 'Pendências', icone: Package },
    ],
  },
  { rota: '/vendas', rotulo: 'Vendas', icone: ShoppingCart },
  { rota: '/financeiro', rotulo: 'Financeiro', icone: Wallet },
  { rota: '/compras', rotulo: 'Compras / Fornecedores', icone: Truck },
  { rota: '/fiscal', rotulo: 'Fiscal', icone: FileText },
  { rota: '/configuracoes', rotulo: 'Configurações', icone: Settings },
]

function FiltroDataGlobal() {
  const { atalho, setAtalho, dataInicioCustom, setDataInicioCustom, dataFimCustom, setDataFimCustom } = usePeriodo()

  return (
    <FiltroData
      atalho={atalho}
      onSelecionarAtalho={setAtalho}
      dataInicio={dataInicioCustom}
      dataFim={dataFimCustom}
      onSelecionarDataInicio={setDataInicioCustom}
      onSelecionarDataFim={setDataFimCustom}
    />
  )
}

function ItemMenu({ item, sidebarRecolhida }) {
  const location = useLocation()
  const temFilhoAtivo = item.filhos?.some((f) => location.pathname === f.rota)
  const [aberto, setAberto] = useState(temFilhoAtivo)

  if (!item.filhos) {
    return (
      <NavLink to={item.rota} end={item.fim} title={item.rotulo} className={({ isActive }) => (isActive ? 'ativo' : '')}>
        <item.icone size={16} /> {!sidebarRecolhida && item.rotulo}
      </NavLink>
    )
  }

  return (
    <div className="sidebar__grupo">
      <div className="sidebar__grupo-cabecalho">
        <NavLink to={item.rota} title={item.rotulo} className={({ isActive }) => (isActive ? 'ativo' : '')}>
          <item.icone size={16} /> {!sidebarRecolhida && item.rotulo}
        </NavLink>
        {!sidebarRecolhida && (
          <button
            className="sidebar__grupo-toggle"
            onClick={() => setAberto((atual) => !atual)}
            title={aberto ? 'Recolher' : 'Expandir'}
          >
            <ChevronDown size={14} style={{ transform: aberto ? 'rotate(180deg)' : 'none' }} />
          </button>
        )}
      </div>

      {!sidebarRecolhida && aberto && (
        <div className="sidebar__submenu">
          {item.filhos.map((filho) => (
            <NavLink key={filho.rota} to={filho.rota} title={filho.rotulo} className={({ isActive }) => (isActive ? 'ativo' : '')}>
              <filho.icone size={14} /> {filho.rotulo}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Layout({ onLogout }) {
  const [sidebarRecolhida, setSidebarRecolhida] = useState(false)

  return (
    <PeriodoProvider>
      <div className="app">
        <aside className={`sidebar ${sidebarRecolhida ? 'sidebar--recolhida' : ''}`}>
          <div className="sidebar__topo">
            {!sidebarRecolhida && <div className="sidebar__logo">Dashboard Siserp</div>}
            <button
              className="sidebar__toggle"
              onClick={() => setSidebarRecolhida((atual) => !atual)}
              title={sidebarRecolhida ? 'Expandir menu' : 'Recolher menu'}
            >
              {sidebarRecolhida ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
          <nav>
            {ITENS_MENU.map((item) => (
              <ItemMenu key={item.rota} item={item} sidebarRecolhida={sidebarRecolhida} />
            ))}
          </nav>
        </aside>

        <div className="area-principal">
          <Topbar onLogout={onLogout} />
          <main className="conteudo">
            <FiltroDataGlobal />
            <Outlet />
          </main>
        </div>
      </div>
    </PeriodoProvider>
  )
}
