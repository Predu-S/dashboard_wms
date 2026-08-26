using Dapper;
using DepositoApi.Models;
using FirebirdSql.Data.FirebirdClient;

namespace DepositoApi.Services;

public interface IFinanceiroService
{
    Task<IEnumerable<ContaReceber>> ObterContasReceberAsync();
    Task<IEnumerable<ContaPagar>> ObterContasPagarAsync();
    Task<ResumoFinanceiro> ObterResumoAsync();
}

/// <summary>
/// Consulta BCOCTAR (contas a receber) e BCOCTAP (contas a pagar),
/// considerando apenas títulos não cancelados (CAN = 0). "Vencido" é
/// calculado no C#/SQL comparando a data de vencimento com hoje, para
/// títulos ainda não pagos.
/// </summary>
public class FinanceiroService : IFinanceiroService
{
    private readonly string _connectionString;

    public FinanceiroService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("FirebirdDefault")
            ?? throw new InvalidOperationException("Connection string 'FirebirdDefault' não configurada.");
    }

    private FbConnection CriarConexao() => new FbConnection(_connectionString);

    public async Task<IEnumerable<ContaReceber>> ObterContasReceberAsync()
    {
        const string sql = @"
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
            WHERE CT.CAN = 0
            ORDER BY CT.DTVENCTO";

        using var conexao = CriarConexao();
        return await conexao.QueryAsync<ContaReceber>(sql);
    }

    public async Task<IEnumerable<ContaPagar>> ObterContasPagarAsync()
    {
        const string sql = @"
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
            WHERE CP.CAN = 0
            ORDER BY CP.DTVENC";

        using var conexao = CriarConexao();
        return await conexao.QueryAsync<ContaPagar>(sql);
    }

    public async Task<ResumoFinanceiro> ObterResumoAsync()
    {
        const string sqlReceber = @"
            SELECT
                COALESCE(SUM(CT.VALOR - CT.VALORPG), 0) AS TotalReceber,
                COALESCE(SUM(CASE WHEN CT.DTPAGTO IS NULL AND CT.DTVENCTO < CURRENT_DATE
                                  THEN CT.VALOR - CT.VALORPG ELSE 0 END), 0) AS TotalReceberVencido
            FROM BCOCTAR CT
            WHERE CT.CAN = 0 AND CT.DTPAGTO IS NULL";

        const string sqlPagar = @"
            SELECT
                COALESCE(SUM(CP.VRAPAGAR - CP.VRPAGO), 0) AS TotalPagar,
                COALESCE(SUM(CASE WHEN CP.DTPAG IS NULL AND CP.DTVENC < CURRENT_DATE
                                  THEN CP.VRAPAGAR - CP.VRPAGO ELSE 0 END), 0) AS TotalPagarVencido
            FROM BCOCTAP CP
            WHERE CP.CAN = 0 AND CP.DTPAG IS NULL";

        using var conexao = CriarConexao();
        var receber = await conexao.QuerySingleAsync<(decimal TotalReceber, decimal TotalReceberVencido)>(sqlReceber);
        var pagar = await conexao.QuerySingleAsync<(decimal TotalPagar, decimal TotalPagarVencido)>(sqlPagar);

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

    public Task<IEnumerable<ContaReceber>> ObterContasReceberAsync() => Task.FromResult<IEnumerable<ContaReceber>>(_receber);
    public Task<IEnumerable<ContaPagar>> ObterContasPagarAsync() => Task.FromResult<IEnumerable<ContaPagar>>(_pagar);

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
