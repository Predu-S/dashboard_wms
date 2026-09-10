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

function paraQueryString(params) {
  if (!params) return ''
  const entradas = Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== '')
  if (entradas.length === 0) return ''
  const busca = new URLSearchParams(entradas)
  return `?${busca.toString()}`
}

async function chamarApi(path, options = {}) {
  const token = obterToken()
  const ehLogin = path.startsWith('/api/auth/login')

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

  vendas: (periodo) => chamarApi(`/api/vendas${paraQueryString(periodo)}`),
  vendasResumo: (periodo) => chamarApi(`/api/vendas/resumo${paraQueryString(periodo)}`),
  vendasPorVendedor: (periodo) => chamarApi(`/api/vendas/por-vendedor${paraQueryString(periodo)}`),
  vendasProdutosMaisVendidos: (periodo) => chamarApi(`/api/vendas/produtos-mais-vendidos${paraQueryString(periodo)}`),

  financeiroContasReceber: (periodo) => chamarApi(`/api/financeiro/contas-receber${paraQueryString(periodo)}`),
  financeiroContasPagar: (periodo) => chamarApi(`/api/financeiro/contas-pagar${paraQueryString(periodo)}`),
  financeiroResumo: () => chamarApi('/api/financeiro/resumo'),

  compras: (periodo) => chamarApi(`/api/compras${paraQueryString(periodo)}`),
  comprasResumo: (periodo) => chamarApi(`/api/compras/resumo${paraQueryString(periodo)}`),
  comprasPorFornecedor: (periodo) => chamarApi(`/api/compras/por-fornecedor${paraQueryString(periodo)}`),

  fiscalNotas: (periodo) => chamarApi(`/api/fiscal/notas${paraQueryString(periodo)}`),
  fiscalResumo: (periodo) => chamarApi(`/api/fiscal/resumo${paraQueryString(periodo)}`),
  fiscalPorCfop: (periodo) => chamarApi(`/api/fiscal/por-cfop${paraQueryString(periodo)}`),
  produtos: () => chamarApi('/api/produtos'),
  produtosResumo: () => chamarApi('/api/produtos/resumo'),
  produtosPorCategoria: () => chamarApi('/api/produtos/por-categoria'),
}
