import { useState } from 'react'
import { Lock, User, LogIn } from 'lucide-react'
import { api, salvarToken, salvarUsuario } from '../api'

export default function LoginPage({ onLoginSucesso }) {
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState(null)
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)
    setCarregando(true)

    try {
      const resposta = await api.login(usuario, senha)
      salvarToken(resposta.token)
      salvarUsuario(resposta.usuario)
      onLoginSucesso()
    } catch (e) {
      setErro(e.message || 'Usuário ou senha inválidos.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="login-pagina">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1 className="login-card__titulo">Depósito BI</h1>
        <p className="login-card__subtitulo">Entre com suas credenciais para continuar</p>

        <label className="login-campo">
          <User size={16} />
          <input
            type="text"
            placeholder="Usuário"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            autoFocus
            required
          />
        </label>

        <label className="login-campo">
          <Lock size={16} />
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </label>

        {erro && <p className="login-erro">{erro}</p>}

        <button type="submit" className="login-botao" disabled={carregando}>
          <LogIn size={16} /> {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
