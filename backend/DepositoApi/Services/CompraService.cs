using Dapper;
using DepositoApi.Models;
using FirebirdSql.Data.FirebirdClient;

namespace DepositoApi.Services;

public interface ICompraService
{
    Task<IEnumerable<NotaCompra>> ObterNotasAsync(DateTime? dataInicio, DateTime? dataFim);
    Task<ResumoCompras> ObterResumoAsync(DateTime? dataInicio, DateTime? dataFim);
    Task<IEnumerable<ComprasPorFornecedor>> ObterPorFornecedorAsync(DateTime? dataInicio, DateTime? dataFim);
}

/// <summary>
/// Consulta a BCOENTNOTAFISCAL (notas fiscais de entrada/compra), trazendo
/// o nome do fornecedor via join com BCOFOR. Considera apenas notas não
/// canceladas (CANCELADO = 0). O filtro de data (quando informado) é
/// aplicado sobre a data de emissão da nota.
/// </summary>
public class CompraService : ICompraService
{
    private readonly ITenantContext _tenantContext;

    public CompraService(ITenantContext tenantContext)
    {
        _tenantContext = tenantContext;
    }

    private FbConnection CriarConexao() => new FbConnection(_tenantContext.ConnectionString);

    private const string BaseFrom = @"
        FROM BCOENTNOTAFISCAL N
        JOIN BCOFOR F ON F.CODIGO = N.CODFORNECEDOR
        WHERE N.CANCELADO = 0";

    private static string AplicarFiltroData(DynamicParameters parametros, DateTime? dataInicio, DateTime? dataFim)
    {
        var filtro = "";
        if (dataInicio.HasValue)
        {
            filtro += " AND N.DATAEMISSAO >= @dataInicio";
            parametros.Add("dataInicio", dataInicio.Value.Date);
        }
        if (dataFim.HasValue)
        {
            filtro += " AND N.DATAEMISSAO < @dataFim";
            parametros.Add("dataFim", dataFim.Value.Date.AddDays(1));
        }
        return filtro;
    }

    public async Task<IEnumerable<NotaCompra>> ObterNotasAsync(DateTime? dataInicio, DateTime? dataFim)
    {
        var parametros = new DynamicParameters();
        var filtroData = AplicarFiltroData(parametros, dataInicio, dataFim);

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
            {BaseFrom}{filtroData}
            ORDER BY N.DATAEMISSAO DESC";

        using var conexao = CriarConexao();
        return await conexao.QueryAsync<NotaCompra>(sql, parametros);
    }

    public async Task<ResumoCompras> ObterResumoAsync(DateTime? dataInicio, DateTime? dataFim)
    {
        var parametros = new DynamicParameters();
        var filtroData = AplicarFiltroData(parametros, dataInicio, dataFim);

        var sql = $@"
            SELECT
                COALESCE(SUM(N.VALORTOTALNOTA), 0) AS TotalComprado,
                COUNT(*)                           AS QuantidadeNotas,
                CASE WHEN COUNT(*) = 0 THEN 0 ELSE SUM(N.VALORTOTALNOTA) / COUNT(*) END AS ValorMedioPorNota
            {BaseFrom}{filtroData}";

        using var conexao = CriarConexao();
        return await conexao.QuerySingleAsync<ResumoCompras>(sql, parametros);
    }

    public async Task<IEnumerable<ComprasPorFornecedor>> ObterPorFornecedorAsync(DateTime? dataInicio, DateTime? dataFim)
    {
        var parametros = new DynamicParameters();
        var filtroData = AplicarFiltroData(parametros, dataInicio, dataFim);

        var sql = $@"
            SELECT
                F.RAZAO AS Fornecedor,
                SUM(N.VALORTOTALNOTA) AS TotalComprado
            {BaseFrom}{filtroData}
            GROUP BY F.RAZAO
            ORDER BY SUM(N.VALORTOTALNOTA) DESC";

        using var conexao = CriarConexao();
        return await conexao.QueryAsync<ComprasPorFornecedor>(sql, parametros);
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

    private IEnumerable<NotaCompra> Filtrar(DateTime? dataInicio, DateTime? dataFim) =>
        _notas.Where(n =>
            (!dataInicio.HasValue || n.DataEmissao.Date >= dataInicio.Value.Date) &&
            (!dataFim.HasValue || n.DataEmissao.Date <= dataFim.Value.Date));

    public Task<IEnumerable<NotaCompra>> ObterNotasAsync(DateTime? dataInicio, DateTime? dataFim) =>
        Task.FromResult(Filtrar(dataInicio, dataFim));

    public Task<ResumoCompras> ObterResumoAsync(DateTime? dataInicio, DateTime? dataFim)
    {
        var filtradas = Filtrar(dataInicio, dataFim).ToList();
        var total = filtradas.Sum(n => n.ValorTotalNota);
        var qtd = filtradas.Count;
        return Task.FromResult(new ResumoCompras
        {
            TotalComprado = total,
            QuantidadeNotas = qtd,
            ValorMedioPorNota = qtd > 0 ? total / qtd : 0,
        });
    }

    public Task<IEnumerable<ComprasPorFornecedor>> ObterPorFornecedorAsync(DateTime? dataInicio, DateTime? dataFim)
    {
        var agrupado = Filtrar(dataInicio, dataFim)
            .GroupBy(n => n.Fornecedor)
            .Select(g => new ComprasPorFornecedor { Fornecedor = g.Key, TotalComprado = g.Sum(n => n.ValorTotalNota) })
            .OrderByDescending(n => n.TotalComprado);
        return Task.FromResult<IEnumerable<ComprasPorFornecedor>>(agrupado);
    }
}
