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
    public async Task<IActionResult> ObterVendas([FromQuery] DateTime? dataInicio, [FromQuery] DateTime? dataFim)
    {
        var dados = await _vendaService.ObterVendasAsync(dataInicio, dataFim);
        return Ok(dados);
    }

    [HttpGet("resumo")]
    public async Task<IActionResult> ObterResumo([FromQuery] DateTime? dataInicio, [FromQuery] DateTime? dataFim)
    {
        var dados = await _vendaService.ObterResumoAsync(dataInicio, dataFim);
        return Ok(dados);
    }

    [HttpGet("por-vendedor")]
    public async Task<IActionResult> ObterPorVendedor([FromQuery] DateTime? dataInicio, [FromQuery] DateTime? dataFim)
    {
        var dados = await _vendaService.ObterPorVendedorAsync(dataInicio, dataFim);
        return Ok(dados);
    }

    [HttpGet("produtos-mais-vendidos")]
    public async Task<IActionResult> ObterProdutosMaisVendidos([FromQuery] DateTime? dataInicio, [FromQuery] DateTime? dataFim, [FromQuery] int limite = 10)
    {
        var dados = await _vendaService.ObterProdutosMaisVendidosAsync(dataInicio, dataFim, limite);
        return Ok(dados);
    }
}
