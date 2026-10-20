import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { api } from '../api'
import KpiCard from './KpiCard'
import TabelaDados from './TabelaDados'
import GraficosAnaliticos from './GraficosAnaliticos'
import { agruparSoma } from './chartUtils'

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
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
                style={{ color: p.precisaReposicao ? 'var(--chart-danger)' : 'var(--text-muted)', borderColor: p.precisaReposicao ? 'var(--chart-danger)' : 'var(--border)' }}
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
                style={{ color: p.estaAtivo ? 'var(--accent)' : 'var(--text-muted)', borderColor: p.estaAtivo ? 'var(--accent)' : 'var(--border)' }}
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
  const [modalReposicaoAberto, setModalReposicaoAberto] = useState(false)

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

  const produtosParaReposicao = useMemo(() => produtos.filter((p) => p.precisaReposicao), [produtos])

  useEffect(() => {
    if (!modalReposicaoAberto) return undefined
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function fecharComEscape(evento) {
      if (evento.key === 'Escape') setModalReposicaoAberto(false)
    }
    document.addEventListener('keydown', fecharComEscape)
    return () => {
      document.body.style.overflow = overflowAnterior
      document.removeEventListener('keydown', fecharComEscape)
    }
  }, [modalReposicaoAberto])
  const estoquePorGrupo = agruparSoma(produtos, (p) => p.grupo, (p) => p.estoqueTotal, 'label', 'unidades').slice(0, 8)
  const valorPorCategoria = agruparSoma(produtos, (p) => p.categoria, (p) => p.estoqueTotal * p.precoVenda, 'label', 'valor').slice(0, 8)
  const situacaoProdutos = [
    { label: 'Estoque adequado', valor: produtos.filter((p) => p.estaAtivo && !p.precisaReposicao).length, cor: 'var(--chart-green)' },
    { label: 'Precisam de reposição', valor: produtos.filter((p) => p.estaAtivo && p.precisaReposicao).length, cor: 'var(--chart-danger)' },
    { label: 'Inativos', valor: produtos.filter((p) => !p.estaAtivo).length, cor: 'var(--chart-neutral)' },
  ].filter((item) => item.valor > 0)

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
              subtitulo="Abaixo do mínimo • clique para ver os produtos"
              tom={resumo.produtosParaReposicao > 0 ? 'alerta' : 'neutro'}
              onClick={resumo.produtosParaReposicao > 0 ? () => setModalReposicaoAberto(true) : undefined}
            />
          </section>

          <GraficosAnaliticos graficos={[
            { titulo: 'Produtos por categoria', dados: porCategoria.map((c) => ({ label: c.categoria, quantidade: c.quantidade })), tipo: 'barra', horizontal: true, altura: 180, series: [{ chave: 'quantidade', nome: 'Produtos' }] },
          ]} />

          <GraficosAnaliticos graficos={[
            { titulo: 'Unidades em estoque por grupo', dados: estoquePorGrupo, tipo: 'barra', horizontal: true, series: [{ chave: 'unidades', nome: 'Unidades' }] },
            { titulo: 'Valor em estoque por categoria', dados: valorPorCategoria, tipo: 'barra', horizontal: true, formato: 'moeda', series: [{ chave: 'valor', nome: 'Valor' }] },
            { titulo: 'Situação do cadastro', dados: situacaoProdutos, tipo: 'pizza', categoria: 'label', series: [{ chave: 'valor', nome: 'Produtos' }] },
          ]} />

          <TabelaDados
            titulo="Produtos"
            colunas={COLUNAS}
            dados={produtos}
            nomeArquivoCsv="estoque-produtos"
            mensagemVazia="Nenhum produto encontrado."
          />
        </>
      )}

      {modalReposicaoAberto && (
        <div className="modal-backdrop" onClick={() => setModalReposicaoAberto(false)}>
          <section
            className="modal-reposicao"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-reposicao-titulo"
            onClick={(evento) => evento.stopPropagation()}
          >
            <header className="modal-reposicao__cabecalho">
              <div className="modal-reposicao__titulo-grupo">
                <span className="modal-reposicao__icone"><AlertTriangle size={19} /></span>
                <div>
                  <h2 id="modal-reposicao-titulo">Produtos que precisam de reposição</h2>
                  <p>{produtosParaReposicao.length} {produtosParaReposicao.length === 1 ? 'produto abaixo' : 'produtos abaixo'} do estoque mínimo</p>
                </div>
              </div>
              <button className="modal-reposicao__fechar" type="button" onClick={() => setModalReposicaoAberto(false)} aria-label="Fechar modal">
                <X size={19} />
              </button>
            </header>

            <div className="modal-reposicao__conteudo">
              <table>
                <thead>
                  <tr><th>Código</th><th>Produto</th><th>Categoria</th><th>Estoque atual</th><th>Mínimo</th><th>Repor ao menos</th></tr>
                </thead>
                <tbody>
                  {produtosParaReposicao.map((produto) => (
                    <tr key={produto.codigo}>
                      <td>{produto.codigo}</td>
                      <td className="modal-reposicao__produto">{produto.descricao}</td>
                      <td>{produto.categoria}</td>
                      <td>{Number(produto.estoqueTotal).toLocaleString('pt-BR')}</td>
                      <td>{Number(produto.minimo).toLocaleString('pt-BR')}</td>
                      <td><strong>{Math.max(0, Number(produto.minimo) - Number(produto.estoqueTotal)).toLocaleString('pt-BR')} un.</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="modal-reposicao__rodape">
              <span>Quantidade sugerida para atingir o mínimo cadastrado.</span>
              <button type="button" className="modal-reposicao__botao" onClick={() => setModalReposicaoAberto(false)}>Entendi</button>
            </footer>
          </section>
        </div>
      )}
    </>
  )
}
