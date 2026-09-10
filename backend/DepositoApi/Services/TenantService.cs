using DepositoApi.Models;

namespace DepositoApi.Services;

public interface ITenantService
{
    Tenant? ObterPorUsuario(string usuario);
    Tenant? ObterPorId(string id);
}

/// <summary>
/// Lê a lista de tenants (clientes) da seção "Tenants" do appsettings.json.
/// Cada tenant tem seu próprio usuário/senha e connection string do
/// Firebird — é isso que permite um mesmo backend atender vários clientes.
/// </summary>
public class TenantService : ITenantService
{
    private readonly List<Tenant> _tenants;

    public TenantService(IConfiguration configuration)
    {
        _tenants = configuration.GetSection("Tenants").Get<List<Tenant>>() ?? new List<Tenant>();
    }

    public Tenant? ObterPorUsuario(string usuario) =>
        _tenants.FirstOrDefault(t => t.Usuario.Equals(usuario, StringComparison.OrdinalIgnoreCase));

    public Tenant? ObterPorId(string id) =>
        _tenants.FirstOrDefault(t => t.Id == id);
}
