const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

async function get(path) {
  const resposta = await fetch(`${API_BASE_URL}${path}`)
  if (!resposta.ok) {
    throw new Error(`Erro ao chamar ${path}: ${resposta.status}`)
  }
  return resposta.json()
}

export const api = {
  ocupacaoDetalhada: () => get('/api/estoque/ocupacao'),
  ocupacaoResumo: () => get('/api/estoque/ocupacao/resumo'),
}
