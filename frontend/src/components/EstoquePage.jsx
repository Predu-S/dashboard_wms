import { useEffect, useMemo, useState } from 'react'
import { Treemap, Tooltip, ResponsiveContainer } from 'recharts'
import { api } from '../api'
import KpiCard from './KpiCard'
import TabelaDados from './TabelaDados'

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const CORES_CATEGORIA = ['#4f8cff', '#3ecf8e', '#f5a623', '#a970ff', '#ff5c5c', '#22d3ee', '#f472b6', '#facc15']

function CelulaTreemap({ x, y, width, height, name, index, value }) {
  const cor = CORES_CATEGORIA[index % CORES_CATEGORIA.length]
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} style={{ fill: cor, stroke: '#11141a', strokeWidth: 2 }} />
      {width > 60 && height > 28 && (
        <text x={x + 8} y={y + 20} fill="#0d0f14" fontSize={12} fontWeight={700}>
          {name}
        </text>
      )}
      {width > 60 && height > 46 && (
        <text x={x + 8} y={y + 38} fill="#0d0f14" fontSize={11} opacity={0.8}>
          {value} produtos
        </text>
      )}
    </g>
  )
}

const COLUNAS = [
  { chave: 'codigo', rotulo: 'Código' },
  { chave: 'descricao', rotulo: 'Descrição' },
  { chave: 'categoria', rotulo: 'Categoria' },
  { chave: 'grupo', rotulo: 'Grupo' },
  { chave: 'tipo', rotulo: 'Tipo' },
  { chave: 'estoqueTotal', rotulo: 'Estoque', render: (p) => p.estoqueTotal, valorCsv: (p) => p.estoqueTotal },
  { chave: 'minimo', rotulo: 'Mínimo' },
  { chave: 'maximo', rotulo: 'Máximo' },
  {
    chave: 'precisaReposicao',
    rotulo: 'Situação',
    render: (p) => (
      <span
        className="status-pill"
        style={{ color: p.precisaReposicao ? '#ff5c5c' : '#8b93a7', borderColor: p.precisaReposicao ? '#ff5c5c' : '#2a2f3a' }}
      >
        {p.precisaReposicao ? 'Repor' : 'OK'}
      </span>
    ),
    valorCsv: (p) => (p.precisaReposicao ? 'Repor' : 'OK'),
  },
  { chave: 'precoVenda', rotulo: 'Preço', render: (p) => formatarMoeda(p.precoVenda), valorCsv: (p) => p.precoVenda },
  {
    chave: 'ativo',
    rotulo: 'Status',
    render: (p) => (
      <span
        className="status-pill"
        style={{ color: p.estaAtivo ? '#3ecf8e' : '#8b93a7', borderColor: p.estaAtivo ? '#3ecf8e' : '#2a2f3a' }}
      >
        {p.estaAtivo ? 'Ativo' : 'Inativo'}
      </span>
    ),
    valorCsv: (p) => (p.estaAtivo ? 'Ativo' : 'Inativo'),
  },
]

export default function EstoquePage() {
  const [produtos, setProdutos] = useState([])
  const [resumo, setResumo] = useState(null)
  const [porCategoria, setPorCategoria] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [somenteReposicao, setSomenteReposicao] = useState(false)

  useEffect(() => {
    Promise.all([api.produtos(), api.produtosResumo(), api.produtosPorCategoria()])
      .then(([produtosResp, resumoResp, categoriaResp]) => {
        setProdutos(produtosResp)
        setResumo(resumoResp)
        setPorCategoria(categoriaResp)
      })
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false))
  }, [])

  const produtosFiltrados = useMemo(
    () => (somenteReposicao ? produtos.filter((p) => p.precisaReposicao) : produtos),
    [produtos, somenteReposicao]
  )

  return (
    <>
      <header className="conteudo__header">
        <h1>Estoque</h1>
        <span className="conteudo__data">Saldo de produtos (SKUs)</span>
      </header>

      {carregando && <p>Carregando dados...</p>}
      {erro && <p className="erro">Não foi possível carregar a API ({erro}).</p>}

      {!carregando && !erro && resumo && (
        <>
          <section className="kpis">
            <KpiCard titulo="Produtos Cadastrados" valor={resumo.quantidadeProdutos} />
            <KpiCard titulo="Produtos Ativos" valor={resumo.quantidadeAtivos} />
            <KpiCard titulo="Estoque Total" valor={resumo.estoqueTotal.toLocaleString('pt-BR')} subtitulo="unidades" />
            <KpiCard titulo="Valor em Estoque" valor={formatarMoeda(resumo.valorTotalEstoque)} />
            <KpiCard
              titulo="Necessitam Reposição"
              valor={resumo.produtosParaReposicao}
              subtitulo={somenteReposicao ? 'Clique para ver todos' : 'Abaixo do mínimo • clique para filtrar'}
              tom={resumo.produtosParaReposicao > 0 ? 'alerta' : 'neutro'}
              ativo={somenteReposicao}
              onClick={resumo.produtosParaReposicao > 0 ? () => setSomenteReposicao((atual) => !atual) : undefined}
            />
          </section>

          <section className="chart-card">
            <h3>Produtos por Categoria</h3>
            <ResponsiveContainer width="100%" height={300}>
              <Treemap
                data={porCategoria.map((c) => ({ name: c.categoria, value: c.quantidade }))}
                dataKey="value"
                stroke="#11141a"
                content={<CelulaTreemap />}
              >
                <Tooltip
                  contentStyle={{ background: '#1b1f27', border: '1px solid #2a2f3a', borderRadius: 8 }}
                  labelStyle={{ color: '#e6e9f0' }}
                  formatter={(value) => [value, 'Produtos']}
                />
              </Treemap>
            </ResponsiveContainer>
          </section>

          <TabelaDados
            titulo="Produtos"
            colunas={COLUNAS}
            dados={produtosFiltrados}
            nomeArquivoCsv="estoque-produtos"
            mensagemVazia="Nenhum produto encontrado."
          />
        </>
      )}
    </>
  )
}
