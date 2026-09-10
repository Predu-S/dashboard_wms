using DepositoApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DepositoApi.Controllers;

[ApiController]
[Route("api/compras")]
[Authorize]
public class CompraController : ControllerBase
{
    private readonly ICompraService _compraService;

    public CompraController(ICompraService compraService)
    {
        _compraService = compraService;
    }

    [HttpGet]
    public async Task<IActionResult> ObterNotas([FromQuery] DateTime? dataInicio, [FromQuery] DateTime? dataFim)
    {
        var dados = await _compraService.ObterNotasAsync(dataInicio, dataFim);
        return Ok(dados);
    }

    [HttpGet("resumo")]
    public async Task<IActionResult> ObterResumo([FromQuery] DateTime? dataInicio, [FromQuery] DateTime? dataFim)
    {
        var dados = await _compraService.ObterResumoAsync(dataInicio, dataFim);
        return Ok(dados);
    }

    [HttpGet("por-fornecedor")]
    public async Task<IActionResult> ObterPorFornecedor([FromQuery] DateTime? dataInicio, [FromQuery] DateTime? dataFim)
    {
        var dados = await _compraService.ObterPorFornecedorAsync(dataInicio, dataFim);
        return Ok(dados);
    }
}
