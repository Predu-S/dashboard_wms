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
    private readonly string _connectionString;

    public OcupacaoService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("FirebirdDefault")
            ?? throw new InvalidOperationException("Connection string 'FirebirdDefault' não configurada.");
    }

    private FbConnection CriarConexao() => new FbConnection(_connectionString);

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
    public Task<IEnumerable<OcupacaoDeposito>> ObterOcupacaoDetalhadaAsync()
    {
        var dados = new List<OcupacaoDeposito>
        {
            new() { Deposito = "01", Rua = "A", Predio = "01", Andar = "01", Apartamento = "01", CapacidadeTotal = 100, QuantidadeOcupada = 82 },
            new() { Deposito = "01", Rua = "A", Predio = "01", Andar = "02", Apartamento = "01", CapacidadeTotal = 100, QuantidadeOcupada = 65 },
            new() { Deposito = "01", Rua = "B", Predio = "02", Andar = "01", Apartamento = "01", CapacidadeTotal = 120, QuantidadeOcupada = 118 },
            new() { Deposito = "02", Rua = "A", Predio = "01", Andar = "01", Apartamento = "01", CapacidadeTotal = 80,  QuantidadeOcupada = 40 },
        };
        return Task.FromResult<IEnumerable<OcupacaoDeposito>>(dados);
    }

    public Task<IEnumerable<ResumoOcupacaoDeposito>> ObterResumoPorDepositoAsync()
    {
        var dados = new List<ResumoOcupacaoDeposito>
        {
            new() { Deposito = "01", CapacidadeTotal = 320, QuantidadeOcupada = 265 },
            new() { Deposito = "02", CapacidadeTotal = 80,  QuantidadeOcupada = 40 },
        };
        return Task.FromResult<IEnumerable<ResumoOcupacaoDeposito>>(dados);
    }
}
