import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { obterToken, limparToken } from './api'
import LoginPage from './components/LoginPage'
import Layout from './components/Layout'
import VisaoGeralPage from './components/VisaoGeralPage'
import DashboardPage from './components/DashboardPage'
import PendenciasPage from './components/PendenciasPage'
import VendasPage from './components/VendasPage'
import FinanceiroPage from './components/FinanceiroPage'
import ComprasPage from './components/ComprasPage'
import EmBreve from './components/EmBreve'
import './index.css'

export default function App() {
  const [autenticado, setAutenticado] = useState(!!obterToken())

  useEffect(() => {
    function handleSessaoExpirada() {
      setAutenticado(false)
    }
    window.addEventListener('sessao-expirada', handleSessaoExpirada)
    return () => window.removeEventListener('sessao-expirada', handleSessaoExpirada)
  }, [])

  function handleLogout() {
    limparToken()
    setAutenticado(false)
  }

  if (!autenticado) {
    return <LoginPage onLoginSucesso={() => setAutenticado(true)} />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout onLogout={handleLogout} />}>
          <Route index element={<VisaoGeralPage />} />
          <Route path="estoque" element={<DashboardPage />} />
          <Route path="pendencias" element={<PendenciasPage />} />
          <Route path="vendas" element={<VendasPage />} />
          <Route path="financeiro" element={<FinanceiroPage />} />
          <Route path="compras" element={<ComprasPage />} />
          <Route path="configuracoes" element={<EmBreve titulo="Configurações" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
