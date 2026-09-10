using Dapper;
using DepositoApi.Models;
using FirebirdSql.Data.FirebirdClient;

namespace DepositoApi.Services;

public interface IProdutoService
{
    Task<IEnumerable<Produto>> ObterProdutosAsync();
    Task<ResumoEstoque> ObterResumoAsync();
    Task<IEnumerable<ProdutosPorCategoria>> ObterPorCategoriaAsync();
}

/// <summary>
/// Consulta a BCOPR (produtos), trazendo categoria (CATEGORIAPRODUTO),
/// grupo (BCOGP) e tipo (BCOTP). Estoque1/Estoque2 são somados para o
/// total exibido; ajuste aqui se esses campos representarem coisas
/// diferentes no seu cadastro (ex.: depósitos distintos).
/// </summary>
public class ProdutoService : IProdutoService
{
    private readonly ITenantContext _tenantContext;

    public ProdutoService(ITenantContext tenantContext)
    {
        _tenantContext = tenantContext;
    }

    private FbConnection CriarConexao() => new FbConnection(_tenantContext.ConnectionString);

    private const string BaseFrom = @"
        FROM BCOPR P
        JOIN CATEGORIAPRODUTO CP ON CP.IDCATEGORIAPRODUTO = P.IDCATEGORIAPRODUT
        JOIN BCOGP G ON G.CODIGO = P.GRUPOPROD
        JOIN BCOTP T ON T.CODIGO = P.TIPOPROD";

    public async Task<IEnumerable<Produto>> ObterProdutosAsync()
    {
        var sql = $@"
            SELECT
                P.CODIGO       AS Codigo,
                P.DESCRICAO    AS Descricao,
                P.ATIVO        AS Ativo,
                P.PRECOVENDA1  AS PrecoVenda,
                P.ESTOQUE1     AS Estoque1,
                P.ESTOQUE2     AS Estoque2,
                P.MINIMO       AS Minimo,
                P.MAXIMO       AS Maximo,
                CP.DESCRICAO   AS Categoria,
                G.DESCRICAO    AS Grupo,
                T.DESCRICAO    AS Tipo
            {BaseFrom}
            ORDER BY P.DESCRICAO";

        using var conexao = CriarConexao();
        return await conexao.QueryAsync<Produto>(sql);
    }

    public async Task<ResumoEstoque> ObterResumoAsync()
    {
        var sql = $@"
            SELECT
                COUNT(*)                                              AS QuantidadeProdutos,
                SUM(CASE WHEN P.ATIVO = 'S' THEN 1 ELSE 0 END)        AS QuantidadeAtivos,
                COALESCE(SUM(P.ESTOQUE1 + P.ESTOQUE2), 0)             AS EstoqueTotal,
                COALESCE(SUM((P.ESTOQUE1 + P.ESTOQUE2) * P.PRECOVENDA1), 0) AS ValorTotalEstoque,
                SUM(CASE WHEN P.MINIMO > 0 AND (P.ESTOQUE1 + P.ESTOQUE2) < P.MINIMO THEN 1 ELSE 0 END) AS ProdutosParaReposicao
            {BaseFrom}";

        using var conexao = CriarConexao();
        return await conexao.QuerySingleAsync<ResumoEstoque>(sql);
    }

    public async Task<IEnumerable<ProdutosPorCategoria>> ObterPorCategoriaAsync()
    {
        var sql = $@"
            SELECT
                CP.DESCRICAO AS Categoria,
                COUNT(*) AS Quantidade
            {BaseFrom}
            GROUP BY CP.DESCRICAO
            ORDER BY COUNT(*) DESC";

        using var conexao = CriarConexao();
        return await conexao.QueryAsync<ProdutosPorCategoria>(sql);
    }
}

/// <summary>Dados fictícios, usados enquanto UsarDadosFicticios estiver true.</summary>
public class ProdutoServiceMock : IProdutoService
{
    private readonly List<Produto> _produtos = new()
    {
        new() { Codigo = "001", Descricao = "Arroz 5kg", Ativo = "S", PrecoVenda = 22.90m, Estoque1 = 120, Estoque2 = 30, Minimo = 20, Maximo = 200, Categoria = "Alimentos", Grupo = "Mercearia", Tipo = "Revenda" },
        new() { Codigo = "002", Descricao = "Óleo de Soja 900ml", Ativo = "S", PrecoVenda = 8.50m, Estoque1 = 5, Estoque2 = 0, Minimo = 30, Maximo = 150, Categoria = "Alimentos", Grupo = "Mercearia", Tipo = "Revenda" },
        new() { Codigo = "003", Descricao = "Detergente 500ml", Ativo = "S", PrecoVenda = 3.20m, Estoque1 = 200, Estoque2 = 0, Minimo = 0, Maximo = 0, Categoria = "Limpeza", Grupo = "Higiene", Tipo = "Revenda" },
        new() { Codigo = "004", Descricao = "Produto Descontinuado X", Ativo = "N", PrecoVenda = 15.00m, Estoque1 = 0, Estoque2 = 0, Minimo = 0, Maximo = 0, Categoria = "Diversos", Grupo = "Outros", Tipo = "Revenda" },
    };

    public Task<IEnumerable<Produto>> ObterProdutosAsync() => Task.FromResult<IEnumerable<Produto>>(_produtos);

    public Task<ResumoEstoque> ObterResumoAsync()
    {
        return Task.FromResult(new ResumoEstoque
        {
            QuantidadeProdutos = _produtos.Count,
            QuantidadeAtivos = _produtos.Count(p => p.EstaAtivo),
            EstoqueTotal = _produtos.Sum(p => p.EstoqueTotal),
            ValorTotalEstoque = _produtos.Sum(p => p.EstoqueTotal * p.PrecoVenda),
            ProdutosParaReposicao = _produtos.Count(p => p.PrecisaReposicao),
        });
    }

    public Task<IEnumerable<ProdutosPorCategoria>> ObterPorCategoriaAsync()
    {
        var agrupado = _produtos
            .GroupBy(p => p.Categoria)
            .Select(g => new ProdutosPorCategoria { Categoria = g.Key, Quantidade = g.Count() })
            .OrderByDescending(p => p.Quantidade);
        return Task.FromResult<IEnumerable<ProdutosPorCategoria>>(agrupado);
    }
}
