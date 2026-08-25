import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { obterToken, limparToken } from './api'
import LoginPage from './components/LoginPage'
import Layout from './components/Layout'
import DashboardPage from './components/DashboardPage'
import PendenciasPage from './components/PendenciasPage'
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
          <Route index element={<DashboardPage />} />
          <Route path="pendencias" element={<PendenciasPage />} />
          <Route path="wms" element={<EmBreve titulo="WMS / Locação" />} />
          <Route path="configuracoes" element={<EmBreve titulo="Configurações" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
