import { useEffect, useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Home, Boxes, Warehouse, Package, ShoppingCart, Wallet, Truck, FileText, Settings, ChevronLeft, ChevronRight, ChevronDown, Menu, X } from 'lucide-react'
import Topbar from './Topbar'
import { PeriodoProvider } from '../context/PeriodoContext'

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

function ItemMenu({ item, sidebarRecolhida }) {
  const location = useLocation()
  const temFilhoAtivo = item.filhos?.some((f) => location.pathname === f.rota)
  const [aberto, setAberto] = useState(temFilhoAtivo)

  if (!item.filhos) {
    return (
      <NavLink to={item.rota} end={item.fim} title={item.rotulo} viewTransition className={({ isActive }) => (isActive ? 'ativo' : '')}>
        <item.icone size={16} /> {!sidebarRecolhida && item.rotulo}
      </NavLink>
    )
  }

  return (
    <div className="sidebar__grupo">
      <div className="sidebar__grupo-cabecalho">
        <NavLink to={item.rota} title={item.rotulo} viewTransition className={({ isActive }) => (isActive ? 'ativo' : '')}>
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
            <NavLink key={filho.rota} to={filho.rota} title={filho.rotulo} viewTransition className={({ isActive }) => (isActive ? 'ativo' : '')}>
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
  const [menuMobileAberto, setMenuMobileAberto] = useState(false)
  const [tema, setTema] = useState(() => {
    try {
      return localStorage.getItem('dashboard-tema') === 'escuro' ? 'escuro' : 'claro'
    } catch {
      return 'claro'
    }
  })
  const location = useLocation()

  useEffect(() => {
    document.documentElement.dataset.theme = tema
    document.body.dataset.theme = tema
    return () => {
      delete document.documentElement.dataset.theme
      delete document.body.dataset.theme
    }
  }, [tema])

  useEffect(() => {
    setMenuMobileAberto(false)
  }, [location.pathname])

  useEffect(() => {
    const breakpointMobile = window.matchMedia('(max-width: 700px)')
    const ajustarSidebar = () => {
      if (breakpointMobile.matches) {
        setSidebarRecolhida(false)
        setMenuMobileAberto(false)
      }
    }
    ajustarSidebar()
    breakpointMobile.addEventListener('change', ajustarSidebar)
    return () => breakpointMobile.removeEventListener('change', ajustarSidebar)
  }, [])

  function alternarTema() {
    setTema((atual) => {
      const proximo = atual === 'claro' ? 'escuro' : 'claro'
      try {
        localStorage.setItem('dashboard-tema', proximo)
      } catch {
        // O tema continua funcionando durante a sessão se o armazenamento estiver indisponível.
      }
      return proximo
    })
  }

  return (
    <PeriodoProvider>
      <div className="app" data-theme={tema}>
        {menuMobileAberto && (
          <button
            className="sidebar__backdrop"
            type="button"
            aria-label="Fechar menu de navegação"
            onClick={() => setMenuMobileAberto(false)}
          />
        )}
        <aside className={`sidebar ${sidebarRecolhida ? 'sidebar--recolhida' : ''} ${menuMobileAberto ? 'sidebar--mobile-aberta' : ''}`}>
          <div className="sidebar__topo">
            {!sidebarRecolhida && <div className="sidebar__logo">Dashboard Demo</div>}
            <button
              className="sidebar__toggle"
              onClick={() => {
                if (window.matchMedia('(max-width: 700px)').matches) setMenuMobileAberto((aberto) => !aberto)
                else setSidebarRecolhida((atual) => !atual)
              }}
              title={menuMobileAberto ? 'Fechar menu' : sidebarRecolhida ? 'Expandir menu' : 'Recolher menu'}
              aria-label={menuMobileAberto ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={menuMobileAberto}
            >
              <span className="sidebar__toggle-desktop">
                {sidebarRecolhida ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </span>
              <Menu className="sidebar__toggle-mobile" size={20} />
              <X className="sidebar__toggle-mobile sidebar__toggle-mobile--fechar" size={20} />
            </button>
          </div>
          <nav>
            {ITENS_MENU.map((item) => (
              <ItemMenu key={item.rota} item={item} sidebarRecolhida={sidebarRecolhida} />
            ))}
          </nav>
        </aside>

        <div className="area-principal">
          <Topbar onLogout={onLogout} tema={tema} onAlternarTema={alternarTema} />
          <main className="conteudo" key={location.pathname}>
            <Outlet />
          </main>
        </div>
      </div>
    </PeriodoProvider>
  )
}

