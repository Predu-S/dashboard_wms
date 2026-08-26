namespace DepositoApi.Models;

public class NotaCompra
{
    public string Fornecedor { get; set; } = string.Empty;
    public string NumNota { get; set; } = string.Empty;
    public string Serie { get; set; } = string.Empty;
    public DateTime DataEmissao { get; set; }
    public DateTime? DataEntradaLoja { get; set; }
    public decimal ValorTotalNota { get; set; }
    public decimal ValorFrete { get; set; }
    public decimal Desconto { get; set; }
    public int Volumes { get; set; }
}

public class ResumoCompras
{
    public decimal TotalComprado { get; set; }
    public int QuantidadeNotas { get; set; }
    public decimal ValorMedioPorNota { get; set; }
}

public class ComprasPorFornecedor
{
    public string Fornecedor { get; set; } = string.Empty;
    public decimal TotalComprado { get; set; }
}
