namespace DepositoApi.Models;

public class NotaFiscal
{
    public string Codigo { get; set; } = string.Empty;
    public string Serie { get; set; } = string.Empty;
    public string Cfop { get; set; } = string.Empty;
    public string Cliente { get; set; } = string.Empty;
    public string Vendedor { get; set; } = string.Empty;
    public DateTime DtSaida { get; set; }
    public decimal ValorTotalProdutos { get; set; }
    public decimal ValorTotalNota { get; set; }
}

public class ResumoFiscal
{
    public decimal TotalFaturado { get; set; }
    public int QuantidadeNotas { get; set; }
    public decimal ValorMedioPorNota { get; set; }
}

public class NotasPorCfop
{
    public string Cfop { get; set; } = string.Empty;
    public int Quantidade { get; set; }
    public decimal Total { get; set; }
}
