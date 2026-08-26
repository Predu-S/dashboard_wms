import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { Home, LayoutDashboard, Package, ShoppingCart, Wallet, Truck, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import Topbar from './Topbar'

const ITENS_MENU = [
  { rota: '/', rotulo: 'Visão Geral', icone: Home, fim: true },
  { rota: '/estoque', rotulo: 'Estoque / Ocupação', icone: LayoutDashboard },
  { rota: '/pendencias', rotulo: 'Pendências', icone: Package },
  { rota: '/vendas', rotulo: 'Vendas', icone: ShoppingCart },
  { rota: '/financeiro', rotulo: 'Financeiro', icone: Wallet },
  { rota: '/compras', rotulo: 'Compras / Fornecedores', icone: Truck },
  { rota: '/configuracoes', rotulo: 'Configurações', icone: Settings },
]

export default function Layout({ onLogout }) {
  const [sidebarRecolhida, setSidebarRecolhida] = useState(false)

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
          {ITENS_MENU.map(({ rota, rotulo, icone: Icone, fim }) => (
            <NavLink
              key={rota}
              to={rota}
              end={fim}
              title={rotulo}
              className={({ isActive }) => (isActive ? 'ativo' : '')}
            >
              <Icone size={16} /> {!sidebarRecolhida && rotulo}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="area-principal">
        <Topbar onLogout={onLogout} />
        <main className="conteudo">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
