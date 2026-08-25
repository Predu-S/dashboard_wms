const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const CHAVE_TOKEN = 'deposito_bi_token'
const CHAVE_USUARIO = 'deposito_bi_usuario'

export function salvarToken(token) {
  localStorage.setItem(CHAVE_TOKEN, token)
}

export function obterToken() {
  return localStorage.getItem(CHAVE_TOKEN)
}

export function limparToken() {
  localStorage.removeItem(CHAVE_TOKEN)
  localStorage.removeItem(CHAVE_USUARIO)
}

export function salvarUsuario(usuario) {
  localStorage.setItem(CHAVE_USUARIO, usuario)
}

export function obterUsuario() {
  return localStorage.getItem(CHAVE_USUARIO)
}

async function chamarApi(path, options = {}) {
  const token = obterToken()
  const ehLogin = path === '/api/auth/login'

  const resposta = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (resposta.status === 401 && !ehLogin) {
    limparToken()
    // Força a tela de login a reaparecer (App.jsx escuta esse evento)
    window.dispatchEvent(new Event('sessao-expirada'))
    throw new Error('Sessão expirada. Faça login novamente.')
  }

  if (!resposta.ok) {
    let mensagem = `Erro ao chamar ${path}: ${resposta.status}`
    try {
      const corpo = await resposta.json()
      if (corpo?.mensagem) mensagem = corpo.mensagem
    } catch {
      // corpo não era JSON, mantém a mensagem genérica
    }
    throw new Error(mensagem)
  }

  return resposta.json()
}

export const api = {
  login: (usuario, senha) =>
    chamarApi('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ usuario, senha }),
    }),
  ocupacaoDetalhada: () => chamarApi('/api/estoque/ocupacao'),
  ocupacaoResumo: () => chamarApi('/api/estoque/ocupacao/resumo'),
  pendencias: () => chamarApi('/api/pendencias'),
  pendenciasResumo: () => chamarApi('/api/pendencias/resumo'),
}
