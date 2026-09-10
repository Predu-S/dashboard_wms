import { useMemo, useState } from 'react'
import { ArrowUp, ArrowDown, ArrowUpDown, Download, ChevronLeft, ChevronRight } from 'lucide-react'

function exportarCsv(nomeArquivo, colunas, dados) {
  const cabecalho = colunas.map((c) => c.rotulo)
  const linhas = dados.map((item) =>
    colunas.map((c) => {
      const valor = c.valorCsv ? c.valorCsv(item) : item[c.chave]
      return valor ?? ''
    })
  )

  const conteudo = [cabecalho, ...linhas]
    .map((linha) => linha.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';'))
    .join('\n')

  const blob = new Blob(['\uFEFF' + conteudo], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${nomeArquivo}-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Tabela genérica com cabeçalho ordenável, exportação CSV e paginação.
 *
 * colunas: [{ chave, rotulo, ordenavel?, render?(item), valorCsv?(item) }]
 * dados: array de objetos
 */
export default function TabelaDados({
  titulo,
  colunas,
  dados,
  nomeArquivoCsv = 'dados',
  linhasPorPagina = 10,
  mensagemVazia = 'Nenhum registro encontrado.',
}) {
  const [ordenacao, setOrdenacao] = useState({ coluna: null, direcao: 'asc' })
  const [pagina, setPagina] = useState(1)

  const dadosOrdenados = useMemo(() => {
    if (!ordenacao.coluna) return dados
    return [...dados].sort((a, b) => {
      const valorA = a[ordenacao.coluna]
      const valorB = b[ordenacao.coluna]
      const comparacao =
        typeof valorA === 'number' && typeof valorB === 'number'
          ? valorA - valorB
          : String(valorA ?? '').localeCompare(String(valorB ?? ''), 'pt-BR')
      return ordenacao.direcao === 'asc' ? comparacao : -comparacao
    })
  }, [dados, ordenacao])

  const totalPaginas = Math.max(1, Math.ceil(dadosOrdenados.length / linhasPorPagina))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const inicio = (paginaAtual - 1) * linhasPorPagina
  const dadosPagina = dadosOrdenados.slice(inicio, inicio + linhasPorPagina)

  function alternarOrdenacao(coluna) {
    setPagina(1)
    setOrdenacao((atual) => {
      if (atual.coluna !== coluna) return { coluna, direcao: 'asc' }
      if (atual.direcao === 'asc') return { coluna, direcao: 'desc' }
      return { coluna: null, direcao: 'asc' }
    })
  }

  function IconeOrdenacao({ coluna }) {
    if (ordenacao.coluna !== coluna) return <ArrowUpDown size={12} className="th-icone th-icone--inativo" />
    return ordenacao.direcao === 'asc' ? (
      <ArrowUp size={12} className="th-icone" />
    ) : (
      <ArrowDown size={12} className="th-icone" />
    )
  }

  return (
    <div className="tabela-card">
      <div className="tabela-card__header">
        <h3>{titulo}</h3>
        <button className="botao-exportar" onClick={() => exportarCsv(nomeArquivoCsv, colunas, dadosOrdenados)} title="Exportar CSV">
          <Download size={14} /> Exportar CSV
        </button>
      </div>

      <div className="tabela-card__scroll">
        <table>
          <thead>
            <tr>
              {colunas.map((col) => (
                <th
                  key={col.chave}
                  onClick={col.ordenavel === false ? undefined : () => alternarOrdenacao(col.chave)}
                  className={col.ordenavel === false ? '' : 'th-ordenavel'}
                >
                  {col.rotulo} {col.ordenavel !== false && <IconeOrdenacao coluna={col.chave} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dadosPagina.map((item, i) => (
              <tr key={i}>
                {colunas.map((col) => (
                  <td key={col.chave}>{col.render ? col.render(item) : item[col.chave]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {dados.length === 0 && <p style={{ color: 'var(--text-muted)', padding: '12px 0' }}>{mensagemVazia}</p>}
      </div>

      {dados.length > 0 && (
        <div className="paginacao">
          <span>
            {dadosOrdenados.length} registro(s) — página {paginaAtual} de {totalPaginas}
          </span>
          <div className="paginacao__botoes">
            <button
              className="paginacao__botao"
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={paginaAtual === 1}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              className="paginacao__botao"
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaAtual === totalPaginas}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
