import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Warehouse, Package, ShoppingCart, Wallet, Truck, FileText, Boxes, ArrowRight } from 'lucide-react'
import { api } from '../api'
import { usePeriodo } from '../context/PeriodoContext'

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
    ])
      .then(([produtosResp, ocupacaoResp, pendenciasResp, vendasResp, financeiroResp, comprasResp, fiscalResp]) => {
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
        <section className="visao-geral-grid">
          <Link to="/estoque" className="modulo-card">
            <div className="modulo-card__icone" style={{ background: '#3ecf8e22', color: '#3ecf8e' }}>
              <Boxes size={22} />
            </div>
            <div className="modulo-card__texto">
              <h3>Estoque</h3>
              <p className="modulo-card__valor">{estoque?.quantidadeProdutos} produtos</p>
            </div>
            <ArrowRight size={18} className="modulo-card__seta" />
          </Link>

          <Link to="/ocupacao" className="modulo-card">
            <div className="modulo-card__icone" style={{ background: '#4f8cff22', color: '#4f8cff' }}>
              <Warehouse size={22} />
            </div>
            <div className="modulo-card__texto">
              <h3>Ocupação</h3>
              <p className="modulo-card__valor">{ocupacao?.percentual}% ocupado</p>
            </div>
            <ArrowRight size={18} className="modulo-card__seta" />
          </Link>

          <Link to="/ocupacao/pendencias" className="modulo-card">
            <div className="modulo-card__icone" style={{ background: '#ff5c5c22', color: '#ff5c5c' }}>
              <Package size={22} />
            </div>
            <div className="modulo-card__texto">
              <h3>Pendências</h3>
              <p className="modulo-card__valor">{pendencias?.total} em aberto</p>
            </div>
            <ArrowRight size={18} className="modulo-card__seta" />
          </Link>

          <Link to="/vendas" className="modulo-card">
            <div className="modulo-card__icone" style={{ background: '#3ecf8e22', color: '#3ecf8e' }}>
              <ShoppingCart size={22} />
            </div>
            <div className="modulo-card__texto">
              <h3>Vendas</h3>
              <p className="modulo-card__valor">{vendas && formatarMoeda(vendas.totalVendido)}</p>
            </div>
            <ArrowRight size={18} className="modulo-card__seta" />
          </Link>

          <Link to="/financeiro" className="modulo-card">
            <div className="modulo-card__icone" style={{ background: '#f5a62322', color: '#f5a623' }}>
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
            <div className="modulo-card__icone" style={{ background: '#a970ff22', color: '#a970ff' }}>
              <Truck size={22} />
            </div>
            <div className="modulo-card__texto">
              <h3>Compras</h3>
              <p className="modulo-card__valor">{compras && formatarMoeda(compras.totalComprado)}</p>
            </div>
            <ArrowRight size={18} className="modulo-card__seta" />
          </Link>

          <Link to="/fiscal" className="modulo-card">
            <div className="modulo-card__icone" style={{ background: '#4f8cff22', color: '#4f8cff' }}>
              <FileText size={22} />
            </div>
            <div className="modulo-card__texto">
              <h3>Fiscal</h3>
              <p className="modulo-card__valor">{fiscal && formatarMoeda(fiscal.totalFaturado)}</p>
            </div>
            <ArrowRight size={18} className="modulo-card__seta" />
          </Link>
        </section>
      )}
    </>
  )
}
