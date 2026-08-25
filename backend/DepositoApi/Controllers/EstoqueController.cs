using DepositoApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DepositoApi.Controllers;

[ApiController]
[Route("api/estoque")]
[Authorize]
public class EstoqueController : ControllerBase
{
    private readonly IOcupacaoService _ocupacaoService;

    public EstoqueController(IOcupacaoService ocupacaoService)
    {
        _ocupacaoService = ocupacaoService;
    }

    /// <summary>GET /api/estoque/ocupacao — lista detalhada por endereço.</summary>
    [HttpGet("ocupacao")]
    public async Task<IActionResult> ObterOcupacao()
    {
        var dados = await _ocupacaoService.ObterOcupacaoDetalhadaAsync();
        return Ok(dados);
    }

    /// <summary>GET /api/estoque/ocupacao/resumo — agregado por Depósito, para os cards de KPI.</summary>
    [HttpGet("ocupacao/resumo")]
    public async Task<IActionResult> ObterResumo()
    {
        var dados = await _ocupacaoService.ObterResumoPorDepositoAsync();
        return Ok(dados);
    }
}
