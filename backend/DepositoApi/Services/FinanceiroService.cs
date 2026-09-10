using Dapper;
using DepositoApi.Models;
using FirebirdSql.Data.FirebirdClient;

namespace DepositoApi.Services;

public interface IFinanceiroService
{
    Task<IEnumerable<ContaReceber>> ObterContasReceberAsync(DateTime? dataInicio, DateTime? dataFim);
    Task<IEnumerable<ContaPagar>> ObterContasPagarAsync(DateTime? dataInicio, DateTime? dataFim);
    Task<ResumoFinanceiro> ObterResumoAsync();
}

/// <summary>
/// Consulta BCOCTAR (contas a receber) e BCOCTAP (contas a pagar),
/// considerando apenas títulos não cancelados (CAN = 0). O filtro de data
/// (quando informado) é aplicado sobre a data de emissão do título.
/// </summary>
public class FinanceiroService : IFinanceiroService
{
    private readonly ITenantContext _tenantContext;

    public FinanceiroService(ITenantContext tenantContext)
    {
        _tenantContext = tenantContext;
    }

    private FbConnection CriarConexao() => new FbConnection(_tenantContext.ConnectionString);

    private static string AplicarFiltroData(DynamicParameters parametros, string coluna, DateTime? dataInicio, DateTime? dataFim)
    {
        var filtro = "";
        if (dataInicio.HasValue)
        {
            filtro += $" AND {coluna} >= @dataInicio";
            parametros.Add("dataInicio", dataInicio.Value.Date);
        }
        if (dataFim.HasValue)
        {
            filtro += $" AND {coluna} < @dataFim";
            parametros.Add("dataFim", dataFim.Value.Date.AddDays(1));
        }
        return filtro;
    }

    public async Task<IEnumerable<ContaReceber>> ObterContasReceberAsync(DateTime? dataInicio, DateTime? dataFim)
    {
        var parametros = new DynamicParameters();
        var filtroData = AplicarFiltroData(parametros, "CT.DTEMISSAO", dataInicio, dataFim);

        var sql = $@"
            SELECT
                C.RAZAO       AS Cliente,
                CT.NUMTIT     AS NumTit,
                CT.DTEMISSAO  AS DtEmissao,
                CT.DTVENCTO   AS DtVencto,
                CT.DTPAGTO    AS DtPagto,
                CT.VALOR      AS Valor,
                CT.VALORPG    AS ValorPg,
                CT.JUROS      AS Juros,
                CT.DESCONTO   AS Desconto
            FROM BCOCTAR CT
            JOIN BCOCLI C ON C.CODIGO = CT.CL
            WHERE CT.CAN = 0{filtroData}
            ORDER BY CT.DTVENCTO";

        using var conexao = CriarConexao();
        return await conexao.QueryAsync<ContaReceber>(sql, parametros);
    }

    public async Task<IEnumerable<ContaPagar>> ObterContasPagarAsync(DateTime? dataInicio, DateTime? dataFim)
    {
        var parametros = new DynamicParameters();
        var filtroData = AplicarFiltroData(parametros, "CP.DTEMISSAO", dataInicio, dataFim);

        var sql = $@"
            SELECT
                F.RAZAO       AS Fornecedor,
                CP.NUMTIT     AS NumTit,
                CP.DTEMISSAO  AS DtEmissao,
                CP.DTVENC     AS DtVenc,
                CP.DTPAG      AS DtPag,
                CP.VRAPAGAR   AS VrAPagar,
                CP.VRPAGO     AS VrPago,
                CP.JUROS      AS Juros,
                CP.DESCONTO   AS Desconto
            FROM BCOCTAP CP
            JOIN BCOFOR F ON F.CODIGO = CP.CODFORN
            WHERE CP.CAN = 0{filtroData}
            ORDER BY CP.DTVENC";

        using var conexao = CriarConexao();
        return await conexao.QueryAsync<ContaPagar>(sql, parametros);
    }

    private class TotaisReceber
    {
        public decimal TotalReceber { get; set; }
        public decimal TotalReceberVencido { get; set; }
    }

    private class TotaisPagar
    {
        public decimal TotalPagar { get; set; }
        public decimal TotalPagarVencido { get; set; }
    }

    public async Task<ResumoFinanceiro> ObterResumoAsync()
    {
        const string sqlReceber = @"
            SELECT
                COALESCE(SUM(CT.VALOR - COALESCE(CT.VALORPG, 0)), 0) AS TotalReceber,
                COALESCE(SUM(CASE WHEN CT.DTPAGTO IS NULL AND CT.DTVENCTO < CURRENT_DATE
                                  THEN CT.VALOR - COALESCE(CT.VALORPG, 0) ELSE 0 END), 0) AS TotalReceberVencido
            FROM BCOCTAR CT
            WHERE CT.CAN = 0 AND CT.DTPAGTO IS NULL";

        const string sqlPagar = @"
            SELECT
                COALESCE(SUM(CP.VRAPAGAR - COALESCE(CP.VRPAGO, 0)), 0) AS TotalPagar,
                COALESCE(SUM(CASE WHEN CP.DTPAG IS NULL AND CP.DTVENC < CURRENT_DATE
                                  THEN CP.VRAPAGAR - COALESCE(CP.VRPAGO, 0) ELSE 0 END), 0) AS TotalPagarVencido
            FROM BCOCTAP CP
            WHERE CP.CAN = 0 AND CP.DTPAG IS NULL";

        using var conexao = CriarConexao();
        var receber = await conexao.QuerySingleAsync<TotaisReceber>(sqlReceber);
        var pagar = await conexao.QuerySingleAsync<TotaisPagar>(sqlPagar);

        return new ResumoFinanceiro
        {
            TotalReceber = receber.TotalReceber,
            TotalReceberVencido = receber.TotalReceberVencido,
            TotalPagar = pagar.TotalPagar,
            TotalPagarVencido = pagar.TotalPagarVencido,
        };
    }
}

/// <summary>Dados fictícios, usados enquanto UsarDadosFicticios estiver true.</summary>
public class FinanceiroServiceMock : IFinanceiroService
{
    private readonly List<ContaReceber> _receber = new()
    {
        new() { Cliente = "Mercado Bom Preço", NumTit = "R-001", DtEmissao = DateTime.Today.AddDays(-30), DtVencto = DateTime.Today.AddDays(5), Valor = 4200m, ValorPg = 0, Juros = 0, Desconto = 0 },
        new() { Cliente = "Distribuidora Sertão", NumTit = "R-002", DtEmissao = DateTime.Today.AddDays(-40), DtVencto = DateTime.Today.AddDays(-3), Valor = 8900m, ValorPg = 0, Juros = 0, Desconto = 0 },
        new() { Cliente = "Comercial Silva", NumTit = "R-003", DtEmissao = DateTime.Today.AddDays(-20), DtVencto = DateTime.Today.AddDays(10), Valor = 1500m, ValorPg = 1500m, DtPagto = DateTime.Today.AddDays(-1), Juros = 0, Desconto = 0 },
    };

    private readonly List<ContaPagar> _pagar = new()
    {
        new() { Fornecedor = "Distribuidora ABC", NumTit = "P-001", DtEmissao = DateTime.Today.AddDays(-25), DtVenc = DateTime.Today.AddDays(3), VrAPagar = 3200m, VrPago = 0, Juros = 0, Desconto = 0 },
        new() { Fornecedor = "Indústria XYZ", NumTit = "P-002", DtEmissao = DateTime.Today.AddDays(-35), DtVenc = DateTime.Today.AddDays(-5), VrAPagar = 6100m, VrPago = 0, Juros = 0, Desconto = 0 },
    };

    private static bool DentroDoPeriodo(DateTime data, DateTime? inicio, DateTime? fim) =>
        (!inicio.HasValue || data.Date >= inicio.Value.Date) && (!fim.HasValue || data.Date <= fim.Value.Date);

    public Task<IEnumerable<ContaReceber>> ObterContasReceberAsync(DateTime? dataInicio, DateTime? dataFim) =>
        Task.FromResult<IEnumerable<ContaReceber>>(_receber.Where(r => DentroDoPeriodo(r.DtEmissao, dataInicio, dataFim)));

    public Task<IEnumerable<ContaPagar>> ObterContasPagarAsync(DateTime? dataInicio, DateTime? dataFim) =>
        Task.FromResult<IEnumerable<ContaPagar>>(_pagar.Where(p => DentroDoPeriodo(p.DtEmissao, dataInicio, dataFim)));

    public Task<ResumoFinanceiro> ObterResumoAsync()
    {
        var pendentesReceber = _receber.Where(r => !r.EstaPago);
        var pendentesPagar = _pagar.Where(p => !p.EstaPago);

        return Task.FromResult(new ResumoFinanceiro
        {
            TotalReceber = pendentesReceber.Sum(r => r.Valor - r.ValorPg),
            TotalReceberVencido = pendentesReceber.Where(r => r.EstaVencido).Sum(r => r.Valor - r.ValorPg),
            TotalPagar = pendentesPagar.Sum(p => p.VrAPagar - p.VrPago),
            TotalPagarVencido = pendentesPagar.Where(p => p.EstaVencido).Sum(p => p.VrAPagar - p.VrPago),
        });
    }
}
