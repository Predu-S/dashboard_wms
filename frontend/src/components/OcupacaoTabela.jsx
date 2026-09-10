import TabelaDados from './TabelaDados'

const COLUNAS = [
  { chave: 'deposito', rotulo: 'Depósito' },
  { chave: 'rua', rotulo: 'Rua' },
  { chave: 'predio', rotulo: 'Prédio' },
  { chave: 'andar', rotulo: 'Andar' },
  { chave: 'apartamento', rotulo: 'Apto' },
  {
    chave: 'percentualOcupacao',
    rotulo: 'Ocupação',
    valorCsv: (item) => `${item.percentualOcupacao}%`,
    render: (item) => (
      <>
        <div className="barra-ocupacao">
          <div
            className="barra-ocupacao__preenchida"
            style={{
              width: `${item.percentualOcupacao}%`,
              background: item.percentualOcupacao >= 90 ? '#ff5c5c' : '#4f8cff',
            }}
          />
        </div>
        <span className="barra-ocupacao__label">{item.percentualOcupacao}%</span>
      </>
    ),
  },
]

export default function OcupacaoTabela({ dados }) {
  return (
    <TabelaDados
      titulo="Ocupação por Endereço"
      colunas={COLUNAS}
      dados={dados}
      nomeArquivoCsv="ocupacao-enderecos"
      mensagemVazia="Nenhum endereço encontrado."
    />
  )
}
