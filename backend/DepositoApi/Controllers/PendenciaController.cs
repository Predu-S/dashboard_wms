using DepositoApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DepositoApi.Controllers;

[ApiController]
[Route("api/pendencias")]
[Authorize]
public class PendenciaController : ControllerBase
{
    private readonly IPendenciaService _pendenciaService;

    public PendenciaController(IPendenciaService pendenciaService)
    {
        _pendenciaService = pendenciaService;
    }

    [HttpGet]
    public async Task<IActionResult> ObterPendencias()
    {
        var dados = await _pendenciaService.ObterPendenciasAsync();
        return Ok(dados);
    }

    [HttpGet("resumo")]
    public async Task<IActionResult> ObterResumo()
    {
        var dados = await _pendenciaService.ObterResumoPorTipoAsync();
        return Ok(dados);
    }
}
