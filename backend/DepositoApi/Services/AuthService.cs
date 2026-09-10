using System.Collections.Concurrent;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DepositoApi.Models;
using Microsoft.IdentityModel.Tokens;

namespace DepositoApi.Services;

public interface IAuthService
{
    LoginResponse? Autenticar(LoginRequest request, string ipOrigem);
}

/// <summary>
/// Autentica contra o cadastro de tenants (ITenantService) — cada tenant
/// tem seu próprio usuário/senha (hash bcrypt) e Firebird. Ao logar com
/// sucesso, o token JWT carrega um claim "tenantId", que o TenantContext
/// usa depois para saber qual Firebird cada requisição deve consultar.
///
/// Também aplica um limite simples de tentativas de login por IP, para
/// dificultar ataques de força bruta.
/// </summary>
public class AuthService : IAuthService
{
    private readonly IConfiguration _configuration;
    private readonly ITenantService _tenantService;

    // Controle de tentativas em memória: chave = IP, valor = (tentativas, bloqueadoAte)
    // Para múltiplas instâncias/produção em maior escala, isso deveria virar
    // um cache distribuído (Redis), mas para o volume esperado aqui, em
    // memória já resolve bem.
    private static readonly ConcurrentDictionary<string, (int Tentativas, DateTime? BloqueadoAte)> _tentativas = new();

    private const int MaxTentativas = 5;
    private static readonly TimeSpan TempoBloqueio = TimeSpan.FromMinutes(5);

    public AuthService(IConfiguration configuration, ITenantService tenantService)
    {
        _configuration = configuration;
        _tenantService = tenantService;
    }

    public LoginResponse? Autenticar(LoginRequest request, string ipOrigem)
    {
        if (EstaBloqueado(ipOrigem))
        {
            throw new InvalidOperationException(
                "Muitas tentativas de login. Tente novamente em alguns minutos.");
        }

        var tenant = _tenantService.ObterPorUsuario(request.Usuario);

        var credenciaisValidas =
            tenant is not null &&
            !string.IsNullOrEmpty(tenant.SenhaHash) &&
            BCrypt.Net.BCrypt.Verify(request.Senha, tenant.SenhaHash);

        if (!credenciaisValidas || tenant is null)
        {
            RegistrarTentativaFalha(ipOrigem);
            return null;
        }

        // Login OK: zera o contador de tentativas desse IP
        _tentativas.TryRemove(ipOrigem, out _);

        return GerarToken(tenant);
    }

    private bool EstaBloqueado(string ip)
    {
        if (_tentativas.TryGetValue(ip, out var info) && info.BloqueadoAte is DateTime bloqueadoAte)
        {
            if (DateTime.UtcNow < bloqueadoAte) return true;

            // Bloqueio expirou: reseta o contador
            _tentativas.TryRemove(ip, out _);
        }
        return false;
    }

    private void RegistrarTentativaFalha(string ip)
    {
        _tentativas.AddOrUpdate(
            ip,
            (1, null),
            (_, atual) =>
            {
                var novasTentativas = atual.Tentativas + 1;
                var bloqueadoAte = novasTentativas >= MaxTentativas
                    ? DateTime.UtcNow.Add(TempoBloqueio)
                    : (DateTime?)null;
                return (novasTentativas, bloqueadoAte);
            });
    }

    private LoginResponse GerarToken(Tenant tenant)
    {
        var chaveSecreta = _configuration["Jwt:SecretKey"]
            ?? throw new InvalidOperationException("Jwt:SecretKey não configurada.");
        var issuer = _configuration["Jwt:Issuer"];
        var audience = _configuration["Jwt:Audience"];
        var minutosExpiracao = _configuration.GetValue<int>("Jwt:ExpiracaoMinutos", 480);

        var expiraEm = DateTime.UtcNow.AddMinutes(minutosExpiracao);

        var claims = new[]
        {
            new Claim(ClaimTypes.Name, tenant.Usuario),
            new Claim("tenantId", tenant.Id),
        };

        var credenciais = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(chaveSecreta)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiraEm,
            signingCredentials: credenciais);

        return new LoginResponse
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            Usuario = tenant.Usuario,
            ExpiraEm = expiraEm,
        };
    }
}
