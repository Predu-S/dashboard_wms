using DepositoApi.Models;
using DepositoApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace DepositoApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>POST /api/auth/login — recebe usuário/senha e devolve o token JWT.</summary>
    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "desconhecido";

        try
        {
            var resultado = _authService.Autenticar(request, ip);

            if (resultado is null)
            {
                return Unauthorized(new { mensagem = "Usuário ou senha inválidos." });
            }

            return Ok(resultado);
        }
        catch (InvalidOperationException ex)
        {
            // Lançado pelo AuthService quando o IP está temporariamente bloqueado
            return StatusCode(429, new { mensagem = ex.Message });
        }
    }
}
