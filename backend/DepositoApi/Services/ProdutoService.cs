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
        new() { Codigo = "005", Descricao = "Feijão Carioca 1kg", Ativo = "S", PrecoVenda = 8.90m, Estoque1 = 42, Estoque2 = 18, Minimo = 25, Maximo = 120, Categoria = "Alimentos", Grupo = "Mercearia", Tipo = "Revenda" },
        new() { Codigo = "006", Descricao = "Açúcar Cristal 5kg", Ativo = "S", PrecoVenda = 18.50m, Estoque1 = 8, Estoque2 = 4, Minimo = 20, Maximo = 100, Categoria = "Alimentos", Grupo = "Mercearia", Tipo = "Revenda" },
        new() { Codigo = "007", Descricao = "Café Torrado 500g", Ativo = "S", PrecoVenda = 16.80m, Estoque1 = 35, Estoque2 = 12, Minimo = 18, Maximo = 90, Categoria = "Alimentos", Grupo = "Bebidas", Tipo = "Revenda" },
        new() { Codigo = "008", Descricao = "Leite Integral 1L", Ativo = "S", PrecoVenda = 5.49m, Estoque1 = 64, Estoque2 = 22, Minimo = 30, Maximo = 150, Categoria = "Alimentos", Grupo = "Laticínios", Tipo = "Revenda" },
        new() { Codigo = "009", Descricao = "Macarrão Espaguete 500g", Ativo = "S", PrecoVenda = 4.79m, Estoque1 = 16, Estoque2 = 4, Minimo = 24, Maximo = 100, Categoria = "Alimentos", Grupo = "Mercearia", Tipo = "Revenda" },
        new() { Codigo = "010", Descricao = "Água Sanitária 1L", Ativo = "S", PrecoVenda = 3.99m, Estoque1 = 58, Estoque2 = 20, Minimo = 16, Maximo = 80, Categoria = "Limpeza", Grupo = "Higiene", Tipo = "Revenda" },
        new() { Codigo = "011", Descricao = "Sabão em Pó 1,6kg", Ativo = "S", PrecoVenda = 19.90m, Estoque1 = 11, Estoque2 = 3, Minimo = 18, Maximo = 75, Categoria = "Limpeza", Grupo = "Lavanderia", Tipo = "Revenda" },
        new() { Codigo = "012", Descricao = "Desinfetante 2L", Ativo = "S", PrecoVenda = 8.49m, Estoque1 = 46, Estoque2 = 16, Minimo = 20, Maximo = 90, Categoria = "Limpeza", Grupo = "Higiene", Tipo = "Revenda" },
        new() { Codigo = "013", Descricao = "Papel Higiênico 12un", Ativo = "S", PrecoVenda = 17.90m, Estoque1 = 5, Estoque2 = 3, Minimo = 15, Maximo = 70, Categoria = "Higiene", Grupo = "Papelaria", Tipo = "Revenda" },
        new() { Codigo = "014", Descricao = "Creme Dental 90g", Ativo = "S", PrecoVenda = 6.29m, Estoque1 = 38, Estoque2 = 12, Minimo = 20, Maximo = 100, Categoria = "Higiene", Grupo = "Cuidados pessoais", Tipo = "Revenda" },
        new() { Codigo = "015", Descricao = "Refrigerante Cola 2L", Ativo = "S", PrecoVenda = 9.99m, Estoque1 = 72, Estoque2 = 24, Minimo = 36, Maximo = 180, Categoria = "Bebidas", Grupo = "Refrigerantes", Tipo = "Revenda" },
        new() { Codigo = "016", Descricao = "Suco de Uva 1L", Ativo = "S", PrecoVenda = 12.50m, Estoque1 = 19, Estoque2 = 5, Minimo = 16, Maximo = 80, Categoria = "Bebidas", Grupo = "Sucos", Tipo = "Revenda" },
        new() { Codigo = "017", Descricao = "Biscoito Cream Cracker", Ativo = "S", PrecoVenda = 5.79m, Estoque1 = 44, Estoque2 = 13, Minimo = 22, Maximo = 110, Categoria = "Alimentos", Grupo = "Biscoitos", Tipo = "Revenda" },
        new() { Codigo = "018", Descricao = "Farinha de Trigo 1kg", Ativo = "S", PrecoVenda = 6.99m, Estoque1 = 7, Estoque2 = 2, Minimo = 18, Maximo = 90, Categoria = "Alimentos", Grupo = "Mercearia", Tipo = "Revenda" },
        new() { Codigo = "019", Descricao = "Amaciante 2L", Ativo = "S", PrecoVenda = 14.90m, Estoque1 = 31, Estoque2 = 10, Minimo = 15, Maximo = 75, Categoria = "Limpeza", Grupo = "Lavanderia", Tipo = "Revenda" },
        new() { Codigo = "020", Descricao = "Shampoo Uso Diário 350ml", Ativo = "S", PrecoVenda = 13.90m, Estoque1 = 23, Estoque2 = 8, Minimo = 14, Maximo = 65, Categoria = "Higiene", Grupo = "Cuidados pessoais", Tipo = "Revenda" },
        new() { Codigo = "021", Descricao = "Água Mineral 1,5L", Ativo = "S", PrecoVenda = 3.49m, Estoque1 = 90, Estoque2 = 30, Minimo = 40, Maximo = 200, Categoria = "Bebidas", Grupo = "Águas", Tipo = "Revenda" },
        new() { Codigo = "022", Descricao = "Papel Toalha 2un", Ativo = "S", PrecoVenda = 7.50m, Estoque1 = 0, Estoque2 = 0, Minimo = 12, Maximo = 60, Categoria = "Higiene", Grupo = "Papelaria", Tipo = "Revenda" },
        new() { Codigo = "023", Descricao = "Molho de Tomate 300g", Ativo = "S", PrecoVenda = 2.79m, Estoque1 = 51, Estoque2 = 17, Minimo = 24, Maximo = 120, Categoria = "Alimentos", Grupo = "Mercearia", Tipo = "Revenda" },
        new() { Codigo = "024", Descricao = "Esponja Multiuso 3un", Ativo = "S", PrecoVenda = 4.50m, Estoque1 = 13, Estoque2 = 2, Minimo = 18, Maximo = 90, Categoria = "Limpeza", Grupo = "Acessórios", Tipo = "Revenda" },
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
