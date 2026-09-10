import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Bell,
  UserCircle,
  LogOut,
  Home,
  Boxes,
  Warehouse,
  Package,
  ShoppingCart,
  Wallet,
  Truck,
  FileText,
  Settings,
  BarChart3,
} from 'lucide-react'
import { obterUsuario } from '../api'

const ITENS_BUSCA = [
  { rotulo: 'Visão Geral', rota: '/', tipo: 'Painel', icone: Home },
  { rotulo: 'Estoque', rota: '/estoque', tipo: 'Painel', icone: Boxes },
  { rotulo: 'Ocupação', rota: '/ocupacao', tipo: 'Painel', icone: Warehouse },
  { rotulo: 'Pendências', rota: '/ocupacao/pendencias', tipo: 'Painel', icone: Package },
  { rotulo: 'Vendas', rota: '/vendas', tipo: 'Painel', icone: ShoppingCart },
  { rotulo: 'Financeiro', rota: '/financeiro', tipo: 'Painel', icone: Wallet },
  { rotulo: 'Compras / Fornecedores', rota: '/compras', tipo: 'Painel', icone: Truck },
  { rotulo: 'Fiscal', rota: '/fiscal', tipo: 'Painel', icone: FileText },
  { rotulo: 'Configurações', rota: '/configuracoes', tipo: 'Painel', icone: Settings },

  { rotulo: 'Ocupação por Depósito', rota: '/ocupacao', tipo: 'Gráfico', icone: BarChart3 },
  { rotulo: 'Ocupação por Endereço', rota: '/ocupacao', tipo: 'Gráfico', icone: BarChart3 },
  { rotulo: 'Vendas por Vendedor', rota: '/vendas', tipo: 'Gráfico', icone: BarChart3 },
  { rotulo: 'Produtos Mais Vendidos', rota: '/vendas', tipo: 'Gráfico', icone: BarChart3 },
  { rotulo: 'Compras por Fornecedor', rota: '/compras', tipo: 'Gráfico', icone: BarChart3 },
  { rotulo: 'Notas por CFOP', rota: '/fiscal', tipo: 'Gráfico', icone: BarChart3 },
  { rotulo: 'Produtos por Categoria', rota: '/estoque', tipo: 'Gráfico', icone: BarChart3 },
  { rotulo: 'Contas a Receber', rota: '/financeiro', tipo: 'Gráfico', icone: BarChart3 },
  { rotulo: 'Contas a Pagar', rota: '/financeiro', tipo: 'Gráfico', icone: BarChart3 },
]

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export default function Topbar({ onLogout }) {
  const usuario = obterUsuario() || 'Usuário'
  const navigate = useNavigate()
  const containerRef = useRef(null)

  const [consulta, setConsulta] = useState('')
  const [aberto, setAberto] = useState(false)

  const resultados = useMemo(() => {
    const termo = normalizar(consulta.trim())
    if (!termo) return ITENS_BUSCA
    return ITENS_BUSCA.filter((item) => normalizar(item.rotulo).includes(termo))
  }, [consulta])

  useEffect(() => {
    function aoClicarFora(evento) {
      if (containerRef.current && !containerRef.current.contains(evento.target)) {
        setAberto(false)
      }
    }
    function aoPressionarTecla(evento) {
      if (evento.key === 'Escape') setAberto(false)
    }
    document.addEventListener('mousedown', aoClicarFora)
    document.addEventListener('keydown', aoPressionarTecla)
    return () => {
      document.removeEventListener('mousedown', aoClicarFora)
      document.removeEventListener('keydown', aoPressionarTecla)
    }
  }, [])

  function irPara(rota) {
    navigate(rota)
    setAberto(false)
    setConsulta('')
  }

  return (
    <header className="topbar">
      <div className="topbar__busca-wrapper" ref={containerRef}>
        <div className="topbar__busca">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar painel ou gráfico..."
            value={consulta}
            onFocus={() => setAberto(true)}
            onChange={(e) => {
              setConsulta(e.target.value)
              setAberto(true)
            }}
          />
        </div>

        {aberto && (
          <div className="busca-painel">
            {resultados.length === 0 && <p className="busca-painel__vazio">Nada encontrado.</p>}
            {resultados.map((item, i) => (
              <button key={i} className="busca-painel__item" onClick={() => irPara(item.rota)}>
                <item.icone size={16} />
                <span className="busca-painel__rotulo">{item.rotulo}</span>
                <span className="busca-painel__tipo">{item.tipo}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="topbar__acoes">
        <button className="topbar__icone-btn" title="Notificações">
          <Bell size={18} />
        </button>
        <div className="topbar__usuario">
          <UserCircle size={22} />
          <span>{usuario}</span>
        </div>
        <button className="topbar__icone-btn" title="Sair" onClick={onLogout}>
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
