using DepositoApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DepositoApi.Controllers;

[ApiController]
[Route("api/fiscal")]
[Authorize]
public class FiscalController : ControllerBase
{
    private readonly IFiscalService _fiscalService;

    public FiscalController(IFiscalService fiscalService)
    {
        _fiscalService = fiscalService;
    }

    [HttpGet("notas")]
    public async Task<IActionResult> ObterNotas([FromQuery] DateTime? dataInicio, [FromQuery] DateTime? dataFim)
    {
        var dados = await _fiscalService.ObterNotasAsync(dataInicio, dataFim);
        return Ok(dados);
    }

    [HttpGet("resumo")]
    public async Task<IActionResult> ObterResumo([FromQuery] DateTime? dataInicio, [FromQuery] DateTime? dataFim)
    {
        var dados = await _fiscalService.ObterResumoAsync(dataInicio, dataFim);
        return Ok(dados);
    }

    [HttpGet("por-cfop")]
    public async Task<IActionResult> ObterPorCfop([FromQuery] DateTime? dataInicio, [FromQuery] DateTime? dataFim)
    {
        var dados = await _fiscalService.ObterPorCfopAsync(dataInicio, dataFim);
        return Ok(dados);
    }
}
