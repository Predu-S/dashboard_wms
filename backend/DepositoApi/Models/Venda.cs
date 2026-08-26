namespace DepositoApi.Models;

public class Venda
{
    public string Cliente { get; set; } = string.Empty;
    public string Vendedor { get; set; } = string.Empty;
    public decimal Valor { get; set; }
    public DateTime Data { get; set; }
    public string NumPedido { get; set; } = string.Empty;
}

public class ResumoVendas
{
    public decimal TotalVendido { get; set; }
    public int QuantidadePedidos { get; set; }
    public decimal TicketMedio { get; set; }
}

public class VendasPorVendedor
{
    public string Vendedor { get; set; } = string.Empty;
    public decimal TotalVendido { get; set; }
}
