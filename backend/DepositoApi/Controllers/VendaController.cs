using DepositoApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DepositoApi.Controllers;

[ApiController]
[Route("api/vendas")]
[Authorize]
public class VendaController : ControllerBase
{
    private readonly IVendaService _vendaService;

    public VendaController(IVendaService vendaService)
    {
        _vendaService = vendaService;
    }

    [HttpGet]
    public async Task<IActionResult> ObterVendas()
    {
        var dados = await _vendaService.ObterVendasAsync();
        return Ok(dados);
    }

    [HttpGet("resumo")]
    public async Task<IActionResult> ObterResumo()
    {
        var dados = await _vendaService.ObterResumoAsync();
        return Ok(dados);
    }

    [HttpGet("por-vendedor")]
    public async Task<IActionResult> ObterPorVendedor()
    {
        var dados = await _vendaService.ObterPorVendedorAsync();
        return Ok(dados);
    }
}
