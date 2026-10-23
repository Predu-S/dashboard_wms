import { useEffect, useState } from 'react'
import { api } from '../api'
import KpiCard from './KpiCard'
import TabelaDados from './TabelaDados'
import { usePeriodo } from '../context/PeriodoContext'
import GraficosAnaliticos from './GraficosAnaliticos'
import { agruparPorMes, agruparSoma } from './chartUtils'
import MiniTelas from './MiniTelas'

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const COLUNAS_PEDIDOS = [
  { chave: 'numPedido', rotulo: 'Pedido' },
  { chave: 'cliente', rotulo: 'Cliente' },
  { chave: 'vendedor', rotulo: 'Vendedor' },
  {
    chave: 'data',
    rotulo: 'Data',
    render: (item) => new Date(item.data).toLocaleDateString('pt-BR'),
    valorCsv: (item) => new Date(item.data).toLocaleDateString('pt-BR'),
  },
  { chave: 'valor', rotulo: 'Valor', render: (item) => formatarMoeda(item.valor), valorCsv: (item) => item.valor },
]

export default function VendasPage() {
  const { periodo } = usePeriodo()

  const [vendas, setVendas] = useState([])
  const [resumo, setResumo] = useState(null)
  const [porVendedor, setPorVendedor] = useState([])
  const [produtosMaisVendidos, setProdutosMaisVendidos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [miniTela, setMiniTela] = useState('desempenho')

  const vendasPorMes = agruparPorMes(vendas, (v) => v.data, [{ chave: 'totalVendido', obterValor: (v) => v.valor }])
  const pedidosPorMes = agruparPorMes(vendas, (v) => v.data, [{ chave: 'pedidos', obterValor: () => 1 }])
  const vendasPorCliente = agruparSoma(vendas, (v) => v.cliente, (v) => v.valor, 'label', 'valor').slice(0, 8)
  const vendasPorDia = agruparSoma(vendas, (v) => new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(new Date(v.data)), (v) => v.valor, 'label', 'valor')
  const pedidosPorDia = agruparSoma(vendas, (v) => new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(new Date(v.data)), () => 1, 'label', 'valor')
  const vendasPorVendedor = agruparSoma(vendas, (v) => v.vendedor, (v) => v.valor, 'label', 'valor').slice(0, 8)

  useEffect(() => {
    setCarregando(true)
    Promise.all([
      api.vendas(periodo),
      api.vendasResumo(periodo),
      api.vendasPorVendedor(periodo),
      api.vendasProdutosMaisVendidos(periodo),
    ])
      .then(([vendasResp, resumoResp, vendedorResp, produtosResp]) => {
        setVendas(vendasResp)
        setResumo(resumoResp)
        setPorVendedor(vendedorResp)
        setProdutosMaisVendidos(produtosResp)
      })
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false))
  }, [periodo.dataInicio, periodo.dataFim])

  return (
    <>
      <header className="conteudo__header">
        <h1>Vendas / Faturamento</h1>
        <span className="conteudo__data">Pedidos não cancelados</span>
      </header>

      {carregando && <p>Carregando dados...</p>}
      {erro && <p className="erro">Não foi possível carregar a API ({erro}).</p>}

      {!carregando && !erro && resumo && (
        <>
          <section className="kpis">
            <KpiCard titulo="Total Vendido" valor={formatarMoeda(resumo.totalVendido)} />
            <KpiCard titulo="Pedidos" valor={resumo.quantidadePedidos} />
            <KpiCard titulo="Ticket Médio" valor={formatarMoeda(resumo.ticketMedio)} />
            <KpiCard titulo="Clientes Atendidos" valor={new Set(vendas.map((v) => v.cliente)).size} subtitulo="no período selecionado" />
          </section>

          <MiniTelas telas={[{ id: 'desempenho', label: 'Desempenho' }, { id: 'pedidos', label: 'Pedidos e mix' }]} ativa={miniTela} onSelecionar={setMiniTela} />
          <section id={`painel-${miniTela}`} role="tabpanel" aria-labelledby={`aba-${miniTela}`}>
            {miniTela === 'desempenho' ? (
              <GraficosAnaliticos graficos={[
                { titulo: 'Evolução mensal do faturamento', dados: vendasPorMes, tipo: 'area', formato: 'moeda', series: [{ chave: 'totalVendido', nome: 'Faturamento' }] },
                { titulo: 'Vendas por vendedor', dados: vendasPorVendedor, tipo: 'barra', horizontal: true, formato: 'moeda', series: [{ chave: 'valor', nome: 'Vendas' }] },
                { titulo: 'Evolução mensal de pedidos', dados: pedidosPorMes, tipo: 'barra', series: [{ chave: 'pedidos', nome: 'Pedidos', cor: 'var(--chart-blue)' }] },
                { titulo: 'Pedidos por dia da semana', dados: pedidosPorDia, tipo: 'barra', series: [{ chave: 'valor', nome: 'Pedidos', cor: 'var(--chart-green)' }] },
              ]} />
            ) : (
              <>
                <GraficosAnaliticos graficos={[
                  { titulo: 'Produtos com maior faturamento', dados: produtosMaisVendidos.slice(0, 8).map((p) => ({ label: p.produto, valor: p.totalVendido })), tipo: 'barra', horizontal: true, formato: 'moeda', series: [{ chave: 'valor', nome: 'Vendido' }] },
                  { titulo: 'Clientes com maior volume de compras', dados: vendasPorCliente, tipo: 'barra', horizontal: true, formato: 'moeda', series: [{ chave: 'valor', nome: 'Vendido' }] },
                  { titulo: 'Faturamento por dia da semana', dados: vendasPorDia, tipo: 'barra', formato: 'moeda', series: [{ chave: 'valor', nome: 'Faturamento' }] },
                  { titulo: 'Unidades vendidas por produto', dados: produtosMaisVendidos.slice(0, 8).map((p) => ({ label: p.produto, unidades: p.quantidadeVendida })), tipo: 'barra', horizontal: true, series: [{ chave: 'unidades', nome: 'Unidades' }] },
                ]} />
                <TabelaDados titulo="Pedidos" colunas={COLUNAS_PEDIDOS} dados={vendas} nomeArquivoCsv="vendas-pedidos" mensagemVazia="Nenhuma venda no período." />
              </>
            )}
          </section>
        </>
      )}
    </>
  )
}
