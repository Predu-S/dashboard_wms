using Dapper;
using DepositoApi.Models;
using FirebirdSql.Data.FirebirdClient;

namespace DepositoApi.Services;

public interface ICompraService
{
    Task<IEnumerable<NotaCompra>> ObterNotasAsync();
    Task<ResumoCompras> ObterResumoAsync();
    Task<IEnumerable<ComprasPorFornecedor>> ObterPorFornecedorAsync();
}

/// <summary>
/// Consulta a BCOENTNOTAFISCAL (notas fiscais de entrada/compra), trazendo
/// o nome do fornecedor via join com BCOFOR. Considera apenas notas não
/// canceladas (CANCELADO = 0), seguindo o mesmo padrão dos outros módulos.
/// </summary>
public class CompraService : ICompraService
{
    private readonly string _connectionString;

    public CompraService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("FirebirdDefault")
            ?? throw new InvalidOperationException("Connection string 'FirebirdDefault' não configurada.");
    }

    private FbConnection CriarConexao() => new FbConnection(_connectionString);

    private const string BaseFrom = @"
        FROM BCOENTNOTAFISCAL N
        JOIN BCOFOR F ON F.CODIGO = N.CODFORNECEDOR
        WHERE N.CANCELADO = 0";

    public async Task<IEnumerable<NotaCompra>> ObterNotasAsync()
    {
        var sql = $@"
            SELECT
                F.RAZAO             AS Fornecedor,
                N.NUMNOTA           AS NumNota,
                N.SERIE             AS Serie,
                N.DATAEMISSAO       AS DataEmissao,
                N.DATAENTRADALOJA   AS DataEntradaLoja,
                N.VALORTOTALNOTA    AS ValorTotalNota,
                N.VALORFRETE        AS ValorFrete,
                N.DESCONTO          AS Desconto,
                N.VOLUMES           AS Volumes
            {BaseFrom}
            ORDER BY N.DATAEMISSAO DESC";

        using var conexao = CriarConexao();
        return await conexao.QueryAsync<NotaCompra>(sql);
    }

    public async Task<ResumoCompras> ObterResumoAsync()
    {
        var sql = $@"
            SELECT
                COALESCE(SUM(N.VALORTOTALNOTA), 0) AS TotalComprado,
                COUNT(*)                           AS QuantidadeNotas,
                CASE WHEN COUNT(*) = 0 THEN 0 ELSE SUM(N.VALORTOTALNOTA) / COUNT(*) END AS ValorMedioPorNota
            {BaseFrom}";

        using var conexao = CriarConexao();
        return await conexao.QuerySingleAsync<ResumoCompras>(sql);
    }

    public async Task<IEnumerable<ComprasPorFornecedor>> ObterPorFornecedorAsync()
    {
        var sql = $@"
            SELECT
                F.RAZAO AS Fornecedor,
                SUM(N.VALORTOTALNOTA) AS TotalComprado
            {BaseFrom}
            GROUP BY F.RAZAO
            ORDER BY SUM(N.VALORTOTALNOTA) DESC";

        using var conexao = CriarConexao();
        return await conexao.QueryAsync<ComprasPorFornecedor>(sql);
    }
}

/// <summary>Dados fictícios, usados enquanto UsarDadosFicticios estiver true.</summary>
public class CompraServiceMock : ICompraService
{
    private readonly List<NotaCompra> _notas = new()
    {
        new() { Fornecedor = "Distribuidora ABC", NumNota = "5001", Serie = "1", DataEmissao = DateTime.Today.AddDays(-4), DataEntradaLoja = DateTime.Today.AddDays(-3), ValorTotalNota = 6200m, ValorFrete = 150m, Desconto = 0, Volumes = 12 },
        new() { Fornecedor = "Indústria XYZ", NumNota = "5002", Serie = "1", DataEmissao = DateTime.Today.AddDays(-6), DataEntradaLoja = DateTime.Today.AddDays(-5), ValorTotalNota = 9800m, ValorFrete = 300m, Desconto = 200m, Volumes = 20 },
        new() { Fornecedor = "Distribuidora ABC", NumNota = "5003", Serie = "1", DataEmissao = DateTime.Today.AddDays(-10), DataEntradaLoja = DateTime.Today.AddDays(-9), ValorTotalNota = 3100m, ValorFrete = 0, Desconto = 0, Volumes = 6 },
    };

    public Task<IEnumerable<NotaCompra>> ObterNotasAsync() => Task.FromResult<IEnumerable<NotaCompra>>(_notas);

    public Task<ResumoCompras> ObterResumoAsync()
    {
        var total = _notas.Sum(n => n.ValorTotalNota);
        var qtd = _notas.Count;
        return Task.FromResult(new ResumoCompras
        {
            TotalComprado = total,
            QuantidadeNotas = qtd,
            ValorMedioPorNota = qtd > 0 ? total / qtd : 0,
        });
    }

    public Task<IEnumerable<ComprasPorFornecedor>> ObterPorFornecedorAsync()
    {
        var agrupado = _notas
            .GroupBy(n => n.Fornecedor)
            .Select(g => new ComprasPorFornecedor { Fornecedor = g.Key, TotalComprado = g.Sum(n => n.ValorTotalNota) })
            .OrderByDescending(n => n.TotalComprado);
        return Task.FromResult<IEnumerable<ComprasPorFornecedor>>(agrupado);
    }
}
