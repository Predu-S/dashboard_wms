namespace DepositoApi.Models;

public class ContaReceber
{
    public string Cliente { get; set; } = string.Empty;
    public string NumTit { get; set; } = string.Empty;
    public DateTime DtEmissao { get; set; }
    public DateTime DtVencto { get; set; }
    public DateTime? DtPagto { get; set; }
    public decimal Valor { get; set; }
    public decimal ValorPg { get; set; }
    public decimal Juros { get; set; }
    public decimal Desconto { get; set; }

    public bool EstaPago => DtPagto.HasValue;
    public bool EstaVencido => !EstaPago && DtVencto.Date < DateTime.Today;
}

public class ContaPagar
{
    public string Fornecedor { get; set; } = string.Empty;
    public string NumTit { get; set; } = string.Empty;
    public DateTime DtEmissao { get; set; }
    public DateTime DtVenc { get; set; }
    public DateTime? DtPag { get; set; }
    public decimal VrAPagar { get; set; }
    public decimal VrPago { get; set; }
    public decimal Juros { get; set; }
    public decimal Desconto { get; set; }

    public bool EstaPago => DtPag.HasValue;
    public bool EstaVencido => !EstaPago && DtVenc.Date < DateTime.Today;
}

public class ResumoFinanceiro
{
    public decimal TotalReceber { get; set; }
    public decimal TotalReceberVencido { get; set; }
    public decimal TotalPagar { get; set; }
    public decimal TotalPagarVencido { get; set; }
}
