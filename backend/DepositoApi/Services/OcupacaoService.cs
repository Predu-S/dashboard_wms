using Dapper;
using DepositoApi.Models;
using FirebirdSql.Data.FirebirdClient;

namespace DepositoApi.Services;

public interface IOcupacaoService
{
    Task<IEnumerable<OcupacaoDeposito>> ObterOcupacaoDetalhadaAsync();
    Task<IEnumerable<ResumoOcupacaoDeposito>> ObterResumoPorDepositoAsync();
}

/// <summary>
/// Acessa o Firebird para trazer dados de ocupação do armazém, consultando
/// a VIEW_WMS_ENDERECO (que já resolve os joins com WMS_DEPOSITO, WMS_RUA,
/// WMS_PREDIO, WMS_ANDAR, WMS_APARTAMENTO e as pendências de WMS_PENDENCIA).
/// </summary>
public class OcupacaoService : IOcupacaoService
{
    private readonly ITenantContext _tenantContext;

    public OcupacaoService(ITenantContext tenantContext)
    {
        _tenantContext = tenantContext;
    }

    private FbConnection CriarConexao() => new FbConnection(_tenantContext.ConnectionString);

    public async Task<IEnumerable<OcupacaoDeposito>> ObterOcupacaoDetalhadaAsync()
    {
        // Usa a VIEW_WMS_ENDERECO, que já traz a quantidade líquida (estoque
        // atual +/- pendências de entrada/saída/transferência) e a
        // capacidade máxima cadastrada para cada endereço.
        const string sql = @"
            SELECT
                DEPOSITO           AS Deposito,
                RUA                AS Rua,
                PREDIO             AS Predio,
                ANDAR              AS Andar,
                APARTAMENTO        AS Apartamento,
                QUANTIDADEMAXIMA   AS CapacidadeTotal,
                QUANTIDADE         AS QuantidadeOcupada
            FROM VIEW_WMS_ENDERECO
            WHERE ATIVO_ENDERECO = 'S'
            ORDER BY DEPOSITO, RUA, PREDIO, ANDAR, APARTAMENTO";

        using var conexao = CriarConexao();
        var resultado = await conexao.QueryAsync<OcupacaoDeposito>(sql);
        return resultado;
    }

    public async Task<IEnumerable<ResumoOcupacaoDeposito>> ObterResumoPorDepositoAsync()
    {
        const string sql = @"
            SELECT
                DEPOSITO AS Deposito,
                SUM(QUANTIDADEMAXIMA) AS CapacidadeTotal,
                SUM(QUANTIDADE)       AS QuantidadeOcupada
            FROM VIEW_WMS_ENDERECO
            WHERE ATIVO_ENDERECO = 'S'
            GROUP BY DEPOSITO
            ORDER BY DEPOSITO";

        using var conexao = CriarConexao();
        var resultado = await conexao.QueryAsync<ResumoOcupacaoDeposito>(sql);
        return resultado;
    }
}

/// <summary>
/// Implementação com dados fictícios, útil para rodar o frontend/protótipo
/// antes de conectar no Firebird real (ou caso a conexão falhe em dev).
/// </summary>
public class OcupacaoServiceMock : IOcupacaoService
{
    private static List<OcupacaoDeposito> GerarEnderecos()
    {
        return Enumerable.Range(0, 36).Select(indice =>
        {
            var capacidade = 60 + indice % 9 * 10;
            var ocupacao = indice % 7 == 0 ? capacidade - 2
                : indice % 5 == 0 ? 0
                : (int)(capacidade * (25 + (indice * 17) % 66) / 100.0);
            return new OcupacaoDeposito
            {
                Deposito = (indice % 3 + 1).ToString("00"),
                Rua = ((char)('A' + indice / 9 % 4)).ToString(),
                Predio = (indice / 3 % 6 + 1).ToString("00"),
                Andar = (indice % 4 + 1).ToString("00"),
                Apartamento = (indice / 2 % 5 + 1).ToString("00"),
                CapacidadeTotal = capacidade,
                QuantidadeOcupada = ocupacao,
            };
        }).ToList();
    }

    public Task<IEnumerable<OcupacaoDeposito>> ObterOcupacaoDetalhadaAsync() =>
        Task.FromResult<IEnumerable<OcupacaoDeposito>>(GerarEnderecos());

    public Task<IEnumerable<ResumoOcupacaoDeposito>> ObterResumoPorDepositoAsync()
    {
        var dados = GerarEnderecos().GroupBy(endereco => endereco.Deposito)
            .Select(grupo => new ResumoOcupacaoDeposito
            {
                Deposito = grupo.Key,
                CapacidadeTotal = grupo.Sum(endereco => endereco.CapacidadeTotal),
                QuantidadeOcupada = grupo.Sum(endereco => endereco.QuantidadeOcupada),
            }).OrderBy(resumo => resumo.Deposito).ToList();
        return Task.FromResult<IEnumerable<ResumoOcupacaoDeposito>>(dados);
    }
}
