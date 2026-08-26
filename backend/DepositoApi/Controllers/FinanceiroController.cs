using DepositoApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DepositoApi.Controllers;

[ApiController]
[Route("api/financeiro")]
[Authorize]
public class FinanceiroController : ControllerBase
{
    private readonly IFinanceiroService _financeiroService;

    public FinanceiroController(IFinanceiroService financeiroService)
    {
        _financeiroService = financeiroService;
    }

    [HttpGet("contas-receber")]
    public async Task<IActionResult> ObterContasReceber()
    {
        var dados = await _financeiroService.ObterContasReceberAsync();
        return Ok(dados);
    }

    [HttpGet("contas-pagar")]
    public async Task<IActionResult> ObterContasPagar()
    {
        var dados = await _financeiroService.ObterContasPagarAsync();
        return Ok(dados);
    }

    [HttpGet("resumo")]
    public async Task<IActionResult> ObterResumo()
    {
        var dados = await _financeiroService.ObterResumoAsync();
        return Ok(dados);
    }
}
