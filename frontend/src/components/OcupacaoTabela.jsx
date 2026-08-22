import { useMemo, useState } from 'react'
import { ArrowUp, ArrowDown, ArrowUpDown, Download } from 'lucide-react'

const COLUNAS = [
  { chave: 'deposito', rotulo: 'Depósito' },
  { chave: 'rua', rotulo: 'Rua' },
  { chave: 'predio', rotulo: 'Prédio' },
  { chave: 'andar', rotulo: 'Andar' },
  { chave: 'apartamento', rotulo: 'Apto' },
  { chave: 'percentualOcupacao', rotulo: 'Ocupação' },
]

function exportarCsv(dados) {
  const cabecalho = ['Depósito', 'Rua', 'Prédio', 'Andar', 'Apartamento', 'Ocupação (%)']
  const linhas = dados.map((d) => [
    d.deposito, d.rua, d.predio, d.andar, d.apartamento, d.percentualOcupacao,
  ])

  const conteudo = [cabecalho, ...linhas]
    .map((linha) => linha.map((valor) => `"${valor}"`).join(';'))
    .join('\n')

  const blob = new Blob(['\uFEFF' + conteudo], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `ocupacao-enderecos-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export default function OcupacaoTabela({ dados }) {
  const [ordenacao, setOrdenacao] = useState({ coluna: null, direcao: 'asc' })

  const dadosOrdenados = useMemo(() => {
    if (!ordenacao.coluna) return dados

    return [...dados].sort((a, b) => {
      const valorA = a[ordenacao.coluna]
      const valorB = b[ordenacao.coluna]

      const comparacao =
        typeof valorA === 'number'
          ? valorA - valorB
          : String(valorA).localeCompare(String(valorB), 'pt-BR')

      return ordenacao.direcao === 'asc' ? comparacao : -comparacao
    })
  }, [dados, ordenacao])

  function alternarOrdenacao(coluna) {
    setOrdenacao((atual) => {
      if (atual.coluna !== coluna) return { coluna, direcao: 'asc' }
      if (atual.direcao === 'asc') return { coluna, direcao: 'desc' }
      return { coluna: null, direcao: 'asc' }
    })
  }

  function IconeOrdenacao({ coluna }) {
    if (ordenacao.coluna !== coluna) return <ArrowUpDown size={12} className="th-icone th-icone--inativo" />
    return ordenacao.direcao === 'asc'
      ? <ArrowUp size={12} className="th-icone" />
      : <ArrowDown size={12} className="th-icone" />
  }

  return (
    <div className="tabela-card">
      <div className="tabela-card__header">
        <h3>Ocupação por Endereço</h3>
        <button className="botao-exportar" onClick={() => exportarCsv(dadosOrdenados)} title="Exportar CSV">
          <Download size={14} /> Exportar CSV
        </button>
      </div>

      <div className="tabela-card__scroll">
        <table>
          <thead>
            <tr>
              {COLUNAS.map((col) => (
                <th key={col.chave} onClick={() => alternarOrdenacao(col.chave)} className="th-ordenavel">
                  {col.rotulo} <IconeOrdenacao coluna={col.chave} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dadosOrdenados.map((item, i) => (
              <tr key={i}>
                <td>{item.deposito}</td>
                <td>{item.rua}</td>
                <td>{item.predio}</td>
                <td>{item.andar}</td>
                <td>{item.apartamento}</td>
                <td>
                  <div className="barra-ocupacao">
                    <div
                      className="barra-ocupacao__preenchida"
                      style={{
                        width: `${item.percentualOcupacao}%`,
                        background: item.percentualOcupacao >= 90 ? '#ff5c5c' : '#00FFBB',
                      }}
                    />
                  </div>
                  <span className="barra-ocupacao__label">{item.percentualOcupacao}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
