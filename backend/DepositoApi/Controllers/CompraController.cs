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
    public async Task<IActionResult> ObterNotas()
    {
        var dados = await _compraService.ObterNotasAsync();
        return Ok(dados);
    }

    [HttpGet("resumo")]
    public async Task<IActionResult> ObterResumo()
    {
        var dados = await _compraService.ObterResumoAsync();
        return Ok(dados);
    }

    [HttpGet("por-fornecedor")]
    public async Task<IActionResult> ObterPorFornecedor()
    {
        var dados = await _compraService.ObterPorFornecedorAsync();
        return Ok(dados);
    }
}
