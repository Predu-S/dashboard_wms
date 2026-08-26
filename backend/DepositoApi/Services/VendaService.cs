using Dapper;
using DepositoApi.Models;
using FirebirdSql.Data.FirebirdClient;

namespace DepositoApi.Services;

public interface IVendaService
{
    Task<IEnumerable<Venda>> ObterVendasAsync();
    Task<ResumoVendas> ObterResumoAsync();
    Task<IEnumerable<VendasPorVendedor>> ObterPorVendedorAsync();
}

/// <summary>
/// Consulta a BCOSAI (vendas), já trazendo nome do cliente (BCOCLI) e do
/// vendedor (BCOVEN). Considera apenas vendas não canceladas
/// (CANCELADO = 0).
///
/// TODO: se quiser filtrar por período (mês atual, últimos 30 dias etc.),
/// adicione um WHERE por S.DATA aqui — hoje traz o histórico completo.
/// </summary>
public class VendaService : IVendaService
{
    private readonly string _connectionString;

    public VendaService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("FirebirdDefault")
            ?? throw new InvalidOperationException("Connection string 'FirebirdDefault' não configurada.");
    }

    private FbConnection CriarConexao() => new FbConnection(_connectionString);

    private const string BaseFrom = @"
        FROM BCOSAI S
        JOIN BCOCLI C ON C.CODIGO = S.CODCL
        JOIN BCOVEN V ON V.CODIGO = S.CODVE
        WHERE S.CANCELADO = 0";

    public async Task<IEnumerable<Venda>> ObterVendasAsync()
    {
        var sql = $@"
            SELECT
                C.RAZAO     AS Cliente,
                V.NOME      AS Vendedor,
                S.VALOR     AS Valor,
                S.DATA      AS Data,
                S.NUMPEDIDO AS NumPedido
            {BaseFrom}
            ORDER BY S.DATA DESC";

        using var conexao = CriarConexao();
        return await conexao.QueryAsync<Venda>(sql);
    }

    public async Task<ResumoVendas> ObterResumoAsync()
    {
        var sql = $@"
            SELECT
                COALESCE(SUM(S.VALOR), 0)                              AS TotalVendido,
                COUNT(*)                                               AS QuantidadePedidos,
                CASE WHEN COUNT(*) = 0 THEN 0 ELSE SUM(S.VALOR) / COUNT(*) END AS TicketMedio
            {BaseFrom}";

        using var conexao = CriarConexao();
        return await conexao.QuerySingleAsync<ResumoVendas>(sql);
    }

    public async Task<IEnumerable<VendasPorVendedor>> ObterPorVendedorAsync()
    {
        var sql = $@"
            SELECT
                V.NOME AS Vendedor,
                SUM(S.VALOR) AS TotalVendido
            {BaseFrom}
            GROUP BY V.NOME
            ORDER BY SUM(S.VALOR) DESC";

        using var conexao = CriarConexao();
        return await conexao.QueryAsync<VendasPorVendedor>(sql);
    }
}

/// <summary>Dados fictícios, usados enquanto UsarDadosFicticios estiver true.</summary>
public class VendaServiceMock : IVendaService
{
    private readonly List<Venda> _vendas = new()
    {
        new() { Cliente = "Mercado Bom Preço", Vendedor = "Carlos Souza", Valor = 4200m, Data = DateTime.Today.AddDays(-2), NumPedido = "1001" },
        new() { Cliente = "Distribuidora Sertão", Vendedor = "Ana Lima", Valor = 8900m, Data = DateTime.Today.AddDays(-3), NumPedido = "1002" },
        new() { Cliente = "Comercial Silva", Vendedor = "Carlos Souza", Valor = 1500m, Data = DateTime.Today.AddDays(-5), NumPedido = "1003" },
        new() { Cliente = "Atacadão Norte", Vendedor = "Ana Lima", Valor = 12300m, Data = DateTime.Today.AddDays(-7), NumPedido = "1004" },
    };

    public Task<IEnumerable<Venda>> ObterVendasAsync() => Task.FromResult<IEnumerable<Venda>>(_vendas);

    public Task<ResumoVendas> ObterResumoAsync()
    {
        var total = _vendas.Sum(v => v.Valor);
        var qtd = _vendas.Count;
        return Task.FromResult(new ResumoVendas
        {
            TotalVendido = total,
            QuantidadePedidos = qtd,
            TicketMedio = qtd > 0 ? total / qtd : 0,
        });
    }

    public Task<IEnumerable<VendasPorVendedor>> ObterPorVendedorAsync()
    {
        var agrupado = _vendas
            .GroupBy(v => v.Vendedor)
            .Select(g => new VendasPorVendedor { Vendedor = g.Key, TotalVendido = g.Sum(v => v.Valor) })
            .OrderByDescending(v => v.TotalVendido);
        return Task.FromResult<IEnumerable<VendasPorVendedor>>(agrupado);
    }
}
