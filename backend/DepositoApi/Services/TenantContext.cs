using System.Security.Claims;

namespace DepositoApi.Services;

public interface ITenantContext
{
    string TenantId { get; }
    string ConnectionString { get; }
}

/// <summary>
/// Serviço "Scoped" (uma instância por requisição HTTP). Lê o claim
/// "tenantId" do token JWT do usuário autenticado, busca o tenant
/// correspondente e expõe a connection string certa para os *Service
/// (OcupacaoService, VendaService etc.) usarem — sem que cada um precise
/// saber como isso é resolvido.
///
/// Se não houver tenant no token (ex.: token antigo, emitido antes dessa
/// mudança), cai de volta na connection string "FirebirdDefault" do
/// appsettings.json, para não quebrar sessões já ativas.
/// </summary>
public class TenantContext : ITenantContext
{
    private readonly Lazy<Models.Tenant?> _tenant;
    private readonly IConfiguration _configuration;

    public TenantContext(IHttpContextAccessor httpContextAccessor, ITenantService tenantService, IConfiguration configuration)
    {
        _configuration = configuration;
        _tenant = new Lazy<Models.Tenant?>(() =>
        {
            var tenantId = httpContextAccessor.HttpContext?.User?.FindFirst("tenantId")?.Value;
            return string.IsNullOrEmpty(tenantId) ? null : tenantService.ObterPorId(tenantId);
        });
    }

    public string TenantId => _tenant.Value?.Id ?? "default";

    public string ConnectionString =>
        _tenant.Value?.ConnectionString
        ?? _configuration.GetConnectionString("FirebirdDefault")
        ?? throw new InvalidOperationException("Nenhuma connection string disponível para o tenant atual.");
}
