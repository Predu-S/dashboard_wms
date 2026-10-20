import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Warehouse, Package, ShoppingCart, Wallet, Truck, FileText, Boxes, ArrowRight } from 'lucide-react'
import { api } from '../api'
import { usePeriodo } from '../context/PeriodoContext'
import GraficosAnaliticos from './GraficosAnaliticos'

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function VisaoGeralPage() {
  const { periodo } = usePeriodo()
  const [estoque, setEstoque] = useState(null)
  const [ocupacao, setOcupacao] = useState(null)
  const [pendencias, setPendencias] = useState(null)
  const [vendas, setVendas] = useState(null)
  const [financeiro, setFinanceiro] = useState(null)
  const [compras, setCompras] = useState(null)
  const [fiscal, setFiscal] = useState(null)
  const [vendasPorVendedor, setVendasPorVendedor] = useState([])
  const [comprasPorFornecedor, setComprasPorFornecedor] = useState([])
  const [produtosPorCategoria, setProdutosPorCategoria] = useState([])
  const [ocupacaoPorDeposito, setOcupacaoPorDeposito] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    setCarregando(true)
    Promise.all([
      api.produtosResumo(),
      api.ocupacaoResumo(),
      api.pendenciasResumo(),
      api.vendasResumo(periodo),
      api.financeiroResumo(),
      api.comprasResumo(periodo),
      api.fiscalResumo(periodo),
      api.vendasPorVendedor(periodo),
      api.comprasPorFornecedor(periodo),
      api.produtosPorCategoria(),
    ])
      .then(([produtosResp, ocupacaoResp, pendenciasResp, vendasResp, financeiroResp, comprasResp, fiscalResp, vendedorResp, fornecedorResp, categoriaResp]) => {
        const capacidadeTotal = ocupacaoResp.reduce((s, d) => s + d.capacidadeTotal, 0)
        const ocupadoTotal = ocupacaoResp.reduce((s, d) => s + d.quantidadeOcupada, 0)
        const percentual = capacidadeTotal > 0 ? Math.round((ocupadoTotal / capacidadeTotal) * 1000) / 10 : 0

        setEstoque(produtosResp)
        setOcupacao({ percentual })
        setPendencias({ total: pendenciasResp.reduce((s, p) => s + p.quantidade, 0) })
        setVendas(vendasResp)
        setFinanceiro(financeiroResp)
        setCompras(comprasResp)
        setFiscal(fiscalResp)
        setVendasPorVendedor(vendedorResp)
        setComprasPorFornecedor(fornecedorResp)
        setProdutosPorCategoria(categoriaResp)
        setOcupacaoPorDeposito(ocupacaoResp.map((item) => ({
          label: `Depósito ${item.deposito}`,
          percentual: item.capacidadeTotal > 0 ? Math.round((item.quantidadeOcupada / item.capacidadeTotal) * 1000) / 10 : 0,
        })))
      })
      .finally(() => setCarregando(false))
  }, [periodo.dataInicio, periodo.dataFim])

  return (
    <>
      <header className="conteudo__header">
        <h1>Visão Geral</h1>
        <span className="conteudo__data">Resumo consolidado de todas as áreas</span>
      </header>

      {carregando && <p>Carregando dados...</p>}

      {!carregando && (
        <>
        <section className="visao-geral-grid">
          <Link to="/estoque" className="modulo-card">
            <div className="modulo-card__icone" style={{ background: '#e7f3ee', color: '#4c9678' }}>
              <Boxes size={22} />
            </div>
            <div className="modulo-card__texto">
              <h3>Estoque</h3>
              <p className="modulo-card__valor">{estoque?.quantidadeProdutos} produtos</p>
            </div>
            <ArrowRight size={18} className="modulo-card__seta" />
          </Link>

          <Link to="/ocupacao" className="modulo-card">
            <div className="modulo-card__icone" style={{ background: '#e9f1f8', color: '#5c8db7' }}>
              <Warehouse size={22} />
            </div>
            <div className="modulo-card__texto">
              <h3>Ocupação</h3>
              <p className="modulo-card__valor">{ocupacao?.percentual}% ocupado</p>
            </div>
            <ArrowRight size={18} className="modulo-card__seta" />
          </Link>

          <Link to="/ocupacao/pendencias" className="modulo-card">
            <div className="modulo-card__icone" style={{ background: '#f8eae8', color: '#bc6a61' }}>
              <Package size={22} />
            </div>
            <div className="modulo-card__texto">
              <h3>Pendências</h3>
              <p className="modulo-card__valor">{pendencias?.total} em aberto</p>
            </div>
            <ArrowRight size={18} className="modulo-card__seta" />
          </Link>

          <Link to="/vendas" className="modulo-card">
            <div className="modulo-card__icone" style={{ background: '#e7f3ee', color: '#4c9678' }}>
              <ShoppingCart size={22} />
            </div>
            <div className="modulo-card__texto">
              <h3>Vendas</h3>
              <p className="modulo-card__valor">{vendas && formatarMoeda(vendas.totalVendido)}</p>
            </div>
            <ArrowRight size={18} className="modulo-card__seta" />
          </Link>

          <Link to="/financeiro" className="modulo-card">
            <div className="modulo-card__icone" style={{ background: '#f7f0e3', color: '#b2894c' }}>
              <Wallet size={22} />
            </div>
            <div className="modulo-card__texto">
              <h3>Financeiro</h3>
              <p className="modulo-card__valor">
                {financeiro && `${formatarMoeda(financeiro.totalReceber)} a receber`}
              </p>
            </div>
            <ArrowRight size={18} className="modulo-card__seta" />
          </Link>

          <Link to="/compras" className="modulo-card">
            <div className="modulo-card__icone" style={{ background: '#efebf6', color: '#8874ac' }}>
              <Truck size={22} />
            </div>
            <div className="modulo-card__texto">
              <h3>Compras</h3>
              <p className="modulo-card__valor">{compras && formatarMoeda(compras.totalComprado)}</p>
            </div>
            <ArrowRight size={18} className="modulo-card__seta" />
          </Link>

          <Link to="/fiscal" className="modulo-card">
            <div className="modulo-card__icone" style={{ background: '#e9f1f8', color: '#5c8db7' }}>
              <FileText size={22} />
            </div>
            <div className="modulo-card__texto">
              <h3>Fiscal</h3>
              <p className="modulo-card__valor">{fiscal && formatarMoeda(fiscal.totalFaturado)}</p>
            </div>
            <ArrowRight size={18} className="modulo-card__seta" />
          </Link>
        </section>
        <GraficosAnaliticos graficos={[
          { titulo: 'Vendas por vendedor', dados: vendasPorVendedor.slice(0, 8).map((item) => ({ label: item.vendedor, valor: item.totalVendido })), tipo: 'barra', horizontal: true, formato: 'moeda', series: [{ chave: 'valor', nome: 'Vendas' }] },
          { titulo: 'Compras por fornecedor', dados: comprasPorFornecedor.slice(0, 8).map((item) => ({ label: item.fornecedor, valor: item.totalComprado })), tipo: 'barra', horizontal: true, formato: 'moeda', series: [{ chave: 'valor', nome: 'Compras' }] },
          { titulo: 'Produtos por categoria', dados: produtosPorCategoria.map((item) => ({ label: item.categoria, valor: item.quantidade })), tipo: 'pizza', series: [{ chave: 'valor', nome: 'Produtos' }] },
          { titulo: 'Ocupação por depósito', dados: ocupacaoPorDeposito, tipo: 'barra', formato: 'percentual', series: [{ chave: 'percentual', nome: 'Ocupação', corCondicional: { campo: 'percentual', limite: 90, acima: 'var(--chart-danger)', abaixo: 'var(--chart-green)' } }] },
        ]} />
        </>
      )}
    </>
  )
}
