namespace DepositoApi.Models;

/// <summary>
/// Representa a ocupação de um endereço de armazenagem
/// (Depósito / Rua / Prédio / Andar / Apartamento).
/// </summary>
public class OcupacaoDeposito
{
    public string Deposito { get; set; } = string.Empty;
    public string Rua { get; set; } = string.Empty;
    public string Predio { get; set; } = string.Empty;
    public string Andar { get; set; } = string.Empty;
    public string Apartamento { get; set; } = string.Empty;

    public int CapacidadeTotal { get; set; }
    public int QuantidadeOcupada { get; set; }

    /// <summary>Percentual de ocupação (0 a 100), já calculado para facilitar o consumo no frontend.</summary>
    public double PercentualOcupacao =>
        CapacidadeTotal <= 0 ? 0 : Math.Round((double)QuantidadeOcupada / CapacidadeTotal * 100, 1);
}

/// <summary>
/// Resumo agregado por Depósito, usado nos cards de KPI do dashboard.
/// </summary>
public class ResumoOcupacaoDeposito
{
    public string Deposito { get; set; } = string.Empty;
    public int CapacidadeTotal { get; set; }
    public int QuantidadeOcupada { get; set; }
    public double PercentualOcupacao =>
        CapacidadeTotal <= 0 ? 0 : Math.Round((double)QuantidadeOcupada / CapacidadeTotal * 100, 1);
}
