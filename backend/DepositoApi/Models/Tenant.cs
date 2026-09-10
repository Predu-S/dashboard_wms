namespace DepositoApi.Models;

/// <summary>
/// Representa um cliente (empresa) que usa o dashboard, com seu próprio
/// Firebird e usuário de acesso. Cadastrados hoje em appsettings.json
/// (seção "Tenants") — se a quantidade de clientes crescer, migre isso
/// para uma tabela num banco central (Postgres/SQL Server), mantendo a
/// mesma interface ITenantService.
/// </summary>
public class Tenant
{
    public string Id { get; set; } = string.Empty;
    public string Nome { get; set; } = string.Empty;
    public string ConnectionString { get; set; } = string.Empty;
    public string Usuario { get; set; } = string.Empty;
    public string SenhaHash { get; set; } = string.Empty;
}
