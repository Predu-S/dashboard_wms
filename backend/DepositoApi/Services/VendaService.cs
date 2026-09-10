using Dapper;
using DepositoApi.Models;
using FirebirdSql.Data.FirebirdClient;

namespace DepositoApi.Services;

public interface IVendaService
{
    Task<IEnumerable<Venda>> ObterVendasAsync(DateTime? dataInicio, DateTime? dataFim);
    Task<ResumoVendas> ObterResumoAsync(DateTime? dataInicio, DateTime? dataFim);
    Task<IEnumerable<VendasPorVendedor>> ObterPorVendedorAsync(DateTime? dataInicio, DateTime? dataFim);
    Task<IEnumerable<ProdutoMaisVendido>> ObterProdutosMaisVendidosAsync(DateTime? dataInicio, DateTime? dataFim, int limite = 10);
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
    private readonly ITenantContext _tenantContext;

    public VendaService(ITenantContext tenantContext)
    {
        _tenantContext = tenantContext;
    }

    private FbConnection CriarConexao() => new FbConnection(_tenantContext.ConnectionString);

    private const string BaseFrom = @"
        FROM BCOSAI S
        JOIN BCOCLI C ON C.CODIGO = S.CODCL
        JOIN BCOVEN V ON V.CODIGO = S.CODVE
        WHERE S.CANCELADO = 0";

    private static string AplicarFiltroData(DynamicParameters parametros, DateTime? dataInicio, DateTime? dataFim)
    {
        var filtro = "";
        if (dataInicio.HasValue)
        {
            filtro += " AND S.DATA >= @dataInicio";
            parametros.Add("dataInicio", dataInicio.Value.Date);
        }
        if (dataFim.HasValue)
        {
            filtro += " AND S.DATA < @dataFim";
            parametros.Add("dataFim", dataFim.Value.Date.AddDays(1));
        }
        return filtro;
    }

    public async Task<IEnumerable<Venda>> ObterVendasAsync(DateTime? dataInicio, DateTime? dataFim)
    {
        var parametros = new DynamicParameters();
        var filtroData = AplicarFiltroData(parametros, dataInicio, dataFim);

        var sql = $@"
            SELECT
                C.RAZAO     AS Cliente,
                V.NOME      AS Vendedor,
                S.VALOR     AS Valor,
                S.DATA      AS Data,
                S.NUMPEDIDO AS NumPedido
            {BaseFrom}{filtroData}
            ORDER BY S.DATA DESC";

        using var conexao = CriarConexao();
        return await conexao.QueryAsync<Venda>(sql, parametros);
    }

    public async Task<ResumoVendas> ObterResumoAsync(DateTime? dataInicio, DateTime? dataFim)
    {
        var parametros = new DynamicParameters();
        var filtroData = AplicarFiltroData(parametros, dataInicio, dataFim);

        var sql = $@"
            SELECT
                COALESCE(SUM(S.VALOR), 0)                              AS TotalVendido,
                COUNT(*)                                               AS QuantidadePedidos,
                CASE WHEN COUNT(*) = 0 THEN 0 ELSE SUM(S.VALOR) / COUNT(*) END AS TicketMedio
            {BaseFrom}{filtroData}";

        using var conexao = CriarConexao();
        return await conexao.QuerySingleAsync<ResumoVendas>(sql, parametros);
    }

    public async Task<IEnumerable<VendasPorVendedor>> ObterPorVendedorAsync(DateTime? dataInicio, DateTime? dataFim)
    {
        var parametros = new DynamicParameters();
        var filtroData = AplicarFiltroData(parametros, dataInicio, dataFim);

        var sql = $@"
            SELECT
                V.NOME AS Vendedor,
                SUM(S.VALOR) AS TotalVendido
            {BaseFrom}{filtroData}
            GROUP BY V.NOME
            ORDER BY SUM(S.VALOR) DESC";

        using var conexao = CriarConexao();
        return await conexao.QueryAsync<VendasPorVendedor>(sql, parametros);
    }

    public async Task<IEnumerable<ProdutoMaisVendido>> ObterProdutosMaisVendidosAsync(DateTime? dataInicio, DateTime? dataFim, int limite = 10)
    {
        var parametros = new DynamicParameters();
        var filtroData = "";
        if (dataInicio.HasValue)
        {
            filtroData += " AND S.DATA >= @dataInicio";
            parametros.Add("dataInicio", dataInicio.Value.Date);
        }
        if (dataFim.HasValue)
        {
            filtroData += " AND S.DATA < @dataFim";
            parametros.Add("dataFim", dataFim.Value.Date.AddDays(1));
        }
        parametros.Add("limite", limite);

        var sql = $@"
            SELECT FIRST @limite
                P.DESCRICAO AS Produto,
                SUM(DS.QUANTIDADE) AS QuantidadeVendida,
                SUM(DS.SUBTOTAL) AS TotalVendido
            FROM BCODTSAI DS
            JOIN BCOPR P ON P.CODIGO = DS.CODPR
            JOIN BCOSAI S ON S.NUMPEDIDO = DS.NUMPEDIDO
            WHERE S.CANCELADO = 0{filtroData}
            GROUP BY P.DESCRICAO
            ORDER BY SUM(DS.SUBTOTAL) DESC";

        using var conexao = CriarConexao();
        return await conexao.QueryAsync<ProdutoMaisVendido>(sql, parametros);
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

    private IEnumerable<Venda> Filtrar(DateTime? dataInicio, DateTime? dataFim) =>
        _vendas.Where(v =>
            (!dataInicio.HasValue || v.Data.Date >= dataInicio.Value.Date) &&
            (!dataFim.HasValue || v.Data.Date <= dataFim.Value.Date));

    public Task<IEnumerable<Venda>> ObterVendasAsync(DateTime? dataInicio, DateTime? dataFim) =>
        Task.FromResult(Filtrar(dataInicio, dataFim));

    public Task<ResumoVendas> ObterResumoAsync(DateTime? dataInicio, DateTime? dataFim)
    {
        var filtradas = Filtrar(dataInicio, dataFim).ToList();
        var total = filtradas.Sum(v => v.Valor);
        var qtd = filtradas.Count;
        return Task.FromResult(new ResumoVendas
        {
            TotalVendido = total,
            QuantidadePedidos = qtd,
            TicketMedio = qtd > 0 ? total / qtd : 0,
        });
    }

    public Task<IEnumerable<VendasPorVendedor>> ObterPorVendedorAsync(DateTime? dataInicio, DateTime? dataFim)
    {
        var agrupado = Filtrar(dataInicio, dataFim)
            .GroupBy(v => v.Vendedor)
            .Select(g => new VendasPorVendedor { Vendedor = g.Key, TotalVendido = g.Sum(v => v.Valor) })
            .OrderByDescending(v => v.TotalVendido);
        return Task.FromResult<IEnumerable<VendasPorVendedor>>(agrupado);
    }

    public Task<IEnumerable<ProdutoMaisVendido>> ObterProdutosMaisVendidosAsync(DateTime? dataInicio, DateTime? dataFim, int limite = 10)
    {
        var dados = new List<ProdutoMaisVendido>
        {
            new() { Produto = "Arroz 5kg", QuantidadeVendida = 320, TotalVendido = 6400m },
            new() { Produto = "Óleo de Soja 900ml", QuantidadeVendida = 280, TotalVendido = 2800m },
            new() { Produto = "Feijão Carioca 1kg", QuantidadeVendida = 210, TotalVendido = 1890m },
            new() { Produto = "Açúcar Cristal 5kg", QuantidadeVendida = 150, TotalVendido = 1200m },
            new() { Produto = "Café Torrado 500g", QuantidadeVendida = 140, TotalVendido = 1680m },
        };
        return Task.FromResult<IEnumerable<ProdutoMaisVendido>>(dados.Take(limite));
    }
}
