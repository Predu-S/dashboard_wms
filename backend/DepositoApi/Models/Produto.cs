namespace DepositoApi.Models;

public class Produto
{
    public string Codigo { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public string Ativo { get; set; } = string.Empty;
    public decimal PrecoVenda { get; set; }
    public decimal Estoque1 { get; set; }
    public decimal Estoque2 { get; set; }
    public decimal Minimo { get; set; }
    public decimal Maximo { get; set; }
    public string Categoria { get; set; } = string.Empty;
    public string Grupo { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;

    public bool EstaAtivo => Ativo == "S" || Ativo == "1" || Ativo?.ToUpperInvariant() == "TRUE";
    public decimal EstoqueTotal => Estoque1 + Estoque2;
    public bool PrecisaReposicao => Minimo > 0 && EstoqueTotal < Minimo;
}

public class ResumoEstoque
{
    public int QuantidadeProdutos { get; set; }
    public int QuantidadeAtivos { get; set; }
    public decimal EstoqueTotal { get; set; }
    public decimal ValorTotalEstoque { get; set; }
    public int ProdutosParaReposicao { get; set; }
}

public class ProdutosPorCategoria
{
    public string Categoria { get; set; } = string.Empty;
    public int Quantidade { get; set; }
}
