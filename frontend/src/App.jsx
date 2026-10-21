import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { api, obterToken, limparToken, salvarToken, salvarUsuario } from './api'
import LoginPage from './components/LoginPage'
import Layout from './components/Layout'
import VisaoGeralPage from './components/VisaoGeralPage'
import EstoquePage from './components/EstoquePage'
import OcupacaoPage from './components/OcupacaoPage'
import PendenciasPage from './components/PendenciasPage'
import VendasPage from './components/VendasPage'
import FinanceiroPage from './components/FinanceiroPage'
import ComprasPage from './components/ComprasPage'
import FiscalPage from './components/FiscalPage'
import EmBreve from './components/EmBreve'
import './index.css'

const DEMO_AUTO_LOGIN = import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true'

export default function App() {
  const [autenticado, setAutenticado] = useState(!!obterToken())
  const [statusDemo, setStatusDemo] = useState('')
  const [tentativaDemo, setTentativaDemo] = useState(0)

  useEffect(() => {
    function handleSessaoExpirada() {
      setAutenticado(false)
    }
    window.addEventListener('sessao-expirada', handleSessaoExpirada)
    return () => window.removeEventListener('sessao-expirada', handleSessaoExpirada)
  }, [])

  useEffect(() => {
    if (!DEMO_AUTO_LOGIN || autenticado || obterToken()) return undefined

    let ativo = true
    setStatusDemo('carregando')
    api.login(
      import.meta.env.VITE_DEMO_USERNAME || 'demo',
      import.meta.env.VITE_DEMO_PASSWORD || 'demo'
    ).then((resposta) => {
      if (!ativo) return
      salvarToken(resposta.token)
      salvarUsuario(resposta.usuario)
      setAutenticado(true)
      setStatusDemo('')
    }).catch((erro) => {
      if (ativo) setStatusDemo(erro.message || 'Não foi possível abrir a demonstração.')
    })

    return () => { ativo = false }
  }, [autenticado, tentativaDemo])

  function handleLogout() {
    limparToken()
    setAutenticado(false)
  }

  if (!autenticado) {
    if (DEMO_AUTO_LOGIN) {
      return (
        <div className="login-pagina">
          <section className="demo-abertura" role="status" aria-live="polite">
            <span className="demo-abertura__icone">D</span>
            <h1>Depósito BI</h1>
            <p>{statusDemo === 'carregando' ? 'Preparando a demonstração…' : statusDemo || 'Conectando ao ambiente de demonstração…'}</p>
            {statusDemo && statusDemo !== 'carregando' && (
              <button type="button" className="login-botao" onClick={() => setTentativaDemo((valor) => valor + 1)}>
                Tentar novamente
              </button>
            )}
          </section>
        </div>
      )
    }
    return <LoginPage onLoginSucesso={() => setAutenticado(true)} />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout onLogout={handleLogout} />}>
          <Route index element={<VisaoGeralPage />} />
          <Route path="estoque" element={<EstoquePage />} />
          <Route path="ocupacao" element={<OcupacaoPage />} />
          <Route path="ocupacao/pendencias" element={<PendenciasPage />} />
          <Route path="vendas" element={<VendasPage />} />
          <Route path="financeiro" element={<FinanceiroPage />} />
          <Route path="compras" element={<ComprasPage />} />
          <Route path="fiscal" element={<FiscalPage />} />
          <Route path="configuracoes" element={<EmBreve titulo="Configurações" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

