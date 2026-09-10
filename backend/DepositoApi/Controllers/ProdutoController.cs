using DepositoApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DepositoApi.Controllers;

[ApiController]
[Route("api/produtos")]
[Authorize]
public class ProdutoController : ControllerBase
{
    private readonly IProdutoService _produtoService;

    public ProdutoController(IProdutoService produtoService)
    {
        _produtoService = produtoService;
    }

    [HttpGet]
    public async Task<IActionResult> ObterProdutos()
    {
        var dados = await _produtoService.ObterProdutosAsync();
        return Ok(dados);
    }

    [HttpGet("resumo")]
    public async Task<IActionResult> ObterResumo()
    {
        var dados = await _produtoService.ObterResumoAsync();
        return Ok(dados);
    }

    [HttpGet("por-categoria")]
    public async Task<IActionResult> ObterPorCategoria()
    {
        var dados = await _produtoService.ObterPorCategoriaAsync();
        return Ok(dados);
    }
}
