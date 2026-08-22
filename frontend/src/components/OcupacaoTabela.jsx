export default function OcupacaoTabela({ dados }) {
  return (
    <div className="tabela-card">
      <h3>Ocupação por Endereço</h3>
      <div className="tabela-card__scroll">
        <table>
          <thead>
            <tr>
              <th>Depósito</th>
              <th>Rua</th>
              <th>Prédio</th>
              <th>Andar</th>
              <th>Apto</th>
              <th>Ocupação</th>
            </tr>
          </thead>
          <tbody>
            {dados.map((item, i) => (
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
