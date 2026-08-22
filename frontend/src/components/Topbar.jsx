import { Search, Bell, UserCircle } from 'lucide-react'

export default function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar__busca">
        <Search size={16} />
        <input type="text" placeholder="Buscar endereço, SKU, depósito..." />
      </div>

      <div className="topbar__acoes">
        <button className="topbar__icone-btn" title="Notificações">
          <Bell size={18} />
        </button>
        <div className="topbar__usuario">
          <UserCircle size={22} />
          <span>Admin</span>
        </div>
      </div>
    </header>
  )
}
