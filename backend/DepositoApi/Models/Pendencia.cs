namespace DepositoApi.Models;

public class Pendencia
{
    public string Endereco { get; set; } = string.Empty;
    public string Deposito { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public decimal Quantidade { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class ResumoPendencias
{
    public string Tipo { get; set; } = string.Empty;
    public int Quantidade { get; set; }
}
