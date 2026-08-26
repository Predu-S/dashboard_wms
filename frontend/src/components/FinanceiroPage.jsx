import { useEffect, useState } from 'react'
import { api } from '../api'
import KpiCard from './KpiCard'

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(data) {
  return data ? new Date(data).toLocaleDateString('pt-BR') : '—'
}

export default function FinanceiroPage() {
  const [aba, setAba] = useState('receber')
  const [resumo, setResumo] = useState(null)
  const [contasReceber, setContasReceber] = useState([])
  const [contasPagar, setContasPagar] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    Promise.all([api.financeiroResumo(), api.financeiroContasReceber(), api.financeiroContasPagar()])
      .then(([resumoResp, receberResp, pagarResp]) => {
        setResumo(resumoResp)
        setContasReceber(receberResp)
        setContasPagar(pagarResp)
      })
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false))
  }, [])

  const contas = aba === 'receber' ? contasReceber : contasPagar

  return (
    <>
      <header className="conteudo__header">
        <h1>Financeiro</h1>
        <span className="conteudo__data">Contas a receber e a pagar — títulos não cancelados</span>
      </header>

      {carregando && <p>Carregando dados...</p>}
      {erro && <p className="erro">Não foi possível carregar a API ({erro}).</p>}

      {!carregando && !erro && resumo && (
        <>
          <section className="kpis">
            <KpiCard titulo="A Receber (em aberto)" valor={formatarMoeda(resumo.totalReceber)} />
            <KpiCard
              titulo="A Receber Vencido"
              valor={formatarMoeda(resumo.totalReceberVencido)}
              tom={resumo.totalReceberVencido > 0 ? 'alerta' : 'neutro'}
            />
            <KpiCard titulo="A Pagar (em aberto)" valor={formatarMoeda(resumo.totalPagar)} />
            <KpiCard
              titulo="A Pagar Vencido"
              valor={formatarMoeda(resumo.totalPagarVencido)}
              tom={resumo.totalPagarVencido > 0 ? 'alerta' : 'neutro'}
            />
          </section>

          <div className="abas">
            <button className={aba === 'receber' ? 'aba ativa' : 'aba'} onClick={() => setAba('receber')}>
              Contas a Receber
            </button>
            <button className={aba === 'pagar' ? 'aba ativa' : 'aba'} onClick={() => setAba('pagar')}>
              Contas a Pagar
            </button>
          </div>

          <section className="tabela-card" style={{ maxHeight: 460 }}>
            <div className="tabela-card__header">
              <h3>{aba === 'receber' ? 'Títulos a Receber' : 'Títulos a Pagar'}</h3>
            </div>
            <div className="tabela-card__scroll">
              <table>
                <thead>
                  <tr>
                    <th>{aba === 'receber' ? 'Cliente' : 'Fornecedor'}</th>
                    <th>Título</th>
                    <th>Emissão</th>
                    <th>Vencimento</th>
                    <th>Pagamento</th>
                    <th>Valor</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {contas.map((c, i) => {
                    const nome = aba === 'receber' ? c.cliente : c.fornecedor
                    const vencimento = aba === 'receber' ? c.dtVencto : c.dtVenc
                    const pagamento = aba === 'receber' ? c.dtPagto : c.dtPag
                    const valor = aba === 'receber' ? c.valor : c.vrAPagar
                    const pago = !!pagamento
                    const vencido = !pago && new Date(vencimento) < new Date().setHours(0, 0, 0, 0)

                    return (
                      <tr key={i}>
                        <td>{nome}</td>
                        <td>{c.numTit}</td>
                        <td>{formatarData(c.dtEmissao)}</td>
                        <td>{formatarData(vencimento)}</td>
                        <td>{formatarData(pagamento)}</td>
                        <td>{formatarMoeda(valor)}</td>
                        <td>
                          <span
                            className="status-pill"
                            style={{
                              color: pago ? '#3ecf8e' : vencido ? '#ff5c5c' : '#8b93a7',
                              borderColor: pago ? '#3ecf8e' : vencido ? '#ff5c5c' : '#2a2f3a',
                            }}
                          >
                            {pago ? 'Pago' : vencido ? 'Vencido' : 'Em aberto'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  )
}
