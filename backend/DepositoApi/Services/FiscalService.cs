using Dapper;
using DepositoApi.Models;
using FirebirdSql.Data.FirebirdClient;

namespace DepositoApi.Services;

public interface IFiscalService
{
    Task<IEnumerable<NotaFiscal>> ObterNotasAsync(DateTime? dataInicio, DateTime? dataFim);
    Task<ResumoFiscal> ObterResumoAsync(DateTime? dataInicio, DateTime? dataFim);
    Task<IEnumerable<NotasPorCfop>> ObterPorCfopAsync(DateTime? dataInicio, DateTime? dataFim);
}

/// <summary>
/// Consulta a TABNOTASF (notas fiscais de saída), trazendo cliente
/// (BCOCLI) e vendedor (BCOVEN). Considera apenas notas não canceladas
/// (CANCELADO = 0). O filtro de data (quando informado) é aplicado sobre
/// a data de saída.
/// </summary>
public class FiscalService : IFiscalService
{
    private readonly ITenantContext _tenantContext;

    public FiscalService(ITenantContext tenantContext)
    {
        _tenantContext = tenantContext;
    }

    private FbConnection CriarConexao() => new FbConnection(_tenantContext.ConnectionString);

    private const string BaseFrom = @"
        FROM TABNOTASF NS
        JOIN BCOCLI C ON C.CODIGO = NS.CODCL
        JOIN BCOVEN V ON V.CODIGO = NS.CODVE
        WHERE NS.CANCELADO = 0";

    private static string AplicarFiltroData(DynamicParameters parametros, DateTime? dataInicio, DateTime? dataFim)
    {
        var filtro = "";
        if (dataInicio.HasValue)
        {
            filtro += " AND NS.DTSAIDA >= @dataInicio";
            parametros.Add("dataInicio", dataInicio.Value.Date);
        }
        if (dataFim.HasValue)
        {
            filtro += " AND NS.DTSAIDA < @dataFim";
            parametros.Add("dataFim", dataFim.Value.Date.AddDays(1));
        }
        return filtro;
    }

    public async Task<IEnumerable<NotaFiscal>> ObterNotasAsync(DateTime? dataInicio, DateTime? dataFim)
    {
        var parametros = new DynamicParameters();
        var filtroData = AplicarFiltroData(parametros, dataInicio, dataFim);

        var sql = $@"
            SELECT
                NS.CODIGO             AS Codigo,
                NS.SERIE              AS Serie,
                NS.CFOP               AS Cfop,
                C.RAZAO               AS Cliente,
                V.NOME                AS Vendedor,
                NS.DTSAIDA            AS DtSaida,
                NS.VALORTOTALPRODUTOS AS ValorTotalProdutos,
                NS.VALORTOTALNOTA     AS ValorTotalNota
            {BaseFrom}{filtroData}
            ORDER BY NS.DTSAIDA DESC";

        using var conexao = CriarConexao();
        return await conexao.QueryAsync<NotaFiscal>(sql, parametros);
    }

    public async Task<ResumoFiscal> ObterResumoAsync(DateTime? dataInicio, DateTime? dataFim)
    {
        var parametros = new DynamicParameters();
        var filtroData = AplicarFiltroData(parametros, dataInicio, dataFim);

        var sql = $@"
            SELECT
                COALESCE(SUM(NS.VALORTOTALNOTA), 0) AS TotalFaturado,
                COUNT(*)                            AS QuantidadeNotas,
                CASE WHEN COUNT(*) = 0 THEN 0 ELSE SUM(NS.VALORTOTALNOTA) / COUNT(*) END AS ValorMedioPorNota
            {BaseFrom}{filtroData}";

        using var conexao = CriarConexao();
        return await conexao.QuerySingleAsync<ResumoFiscal>(sql, parametros);
    }

    public async Task<IEnumerable<NotasPorCfop>> ObterPorCfopAsync(DateTime? dataInicio, DateTime? dataFim)
    {
        var parametros = new DynamicParameters();
        var filtroData = AplicarFiltroData(parametros, dataInicio, dataFim);

        var sql = $@"
            SELECT
                NS.CFOP AS Cfop,
                COUNT(*) AS Quantidade,
                SUM(NS.VALORTOTALNOTA) AS Total
            {BaseFrom}{filtroData}
            GROUP BY NS.CFOP
            ORDER BY SUM(NS.VALORTOTALNOTA) DESC";

        using var conexao = CriarConexao();
        return await conexao.QueryAsync<NotasPorCfop>(sql, parametros);
    }
}

/// <summary>Dados fictícios, usados enquanto UsarDadosFicticios estiver true.</summary>
public class FiscalServiceMock : IFiscalService
{
    private readonly List<NotaFiscal> _notas = new()
    {
        new() { Codigo = "9001", Serie = "1", Cfop = "5102", Cliente = "Mercado Bom Preço", Vendedor = "Carlos Souza", DtSaida = DateTime.Today.AddDays(-2), ValorTotalProdutos = 4000m, ValorTotalNota = 4200m },
        new() { Codigo = "9002", Serie = "1", Cfop = "6108", Cliente = "Distribuidora Sertão", Vendedor = "Ana Lima", DtSaida = DateTime.Today.AddDays(-3), ValorTotalProdutos = 8500m, ValorTotalNota = 8900m },
        new() { Codigo = "9003", Serie = "1", Cfop = "5102", Cliente = "Comercial Silva", Vendedor = "Carlos Souza", DtSaida = DateTime.Today.AddDays(-5), ValorTotalProdutos = 1400m, ValorTotalNota = 1500m },
    };

    private IEnumerable<NotaFiscal> Filtrar(DateTime? dataInicio, DateTime? dataFim) =>
        _notas.Where(n =>
            (!dataInicio.HasValue || n.DtSaida.Date >= dataInicio.Value.Date) &&
            (!dataFim.HasValue || n.DtSaida.Date <= dataFim.Value.Date));

    public Task<IEnumerable<NotaFiscal>> ObterNotasAsync(DateTime? dataInicio, DateTime? dataFim) =>
        Task.FromResult(Filtrar(dataInicio, dataFim));

    public Task<ResumoFiscal> ObterResumoAsync(DateTime? dataInicio, DateTime? dataFim)
    {
        var filtradas = Filtrar(dataInicio, dataFim).ToList();
        var total = filtradas.Sum(n => n.ValorTotalNota);
        var qtd = filtradas.Count;
        return Task.FromResult(new ResumoFiscal
        {
            TotalFaturado = total,
            QuantidadeNotas = qtd,
            ValorMedioPorNota = qtd > 0 ? total / qtd : 0,
        });
    }

    public Task<IEnumerable<NotasPorCfop>> ObterPorCfopAsync(DateTime? dataInicio, DateTime? dataFim)
    {
        var agrupado = Filtrar(dataInicio, dataFim)
            .GroupBy(n => n.Cfop)
            .Select(g => new NotasPorCfop { Cfop = g.Key, Quantidade = g.Count(), Total = g.Sum(n => n.ValorTotalNota) })
            .OrderByDescending(n => n.Total);
        return Task.FromResult<IEnumerable<NotasPorCfop>>(agrupado);
    }
}
