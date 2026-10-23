using Dapper;
using DepositoApi.Models;
using FirebirdSql.Data.FirebirdClient;

namespace DepositoApi.Services;

public interface IPendenciaService
{
    Task<IEnumerable<Pendencia>> ObterPendenciasAsync();
    Task<IEnumerable<ResumoPendencias>> ObterResumoPorTipoAsync();
}

/// <summary>
/// Consulta a WMS_PENDENCIA (entradas/saídas/transferências em aberto),
/// já trazendo o endereço legível via join com a VIEW_WMS_ENDERECO.
///
/// TODO: se sua WMS_PENDENCIA tiver campos adicionais úteis (data/hora do
/// lançamento, número do documento, usuário responsável), adicione-os aqui
/// e no modelo Pendencia — hoje a query usa só os campos que já eram
/// conhecidos (IDCOMPOSICAOENDERECO, TIPO, QUANTIDADE, STATUS).
/// </summary>
public class PendenciaService : IPendenciaService
{
    private readonly ITenantContext _tenantContext;

    public PendenciaService(ITenantContext tenantContext)
    {
        _tenantContext = tenantContext;
    }

    private FbConnection CriarConexao() => new FbConnection(_tenantContext.ConnectionString);

    public async Task<IEnumerable<Pendencia>> ObterPendenciasAsync()
    {
        const string sql = @"
            SELECT
                V.ENDERECO   AS Endereco,
                V.DEPOSITO   AS Deposito,
                P.TIPO       AS Tipo,
                P.QUANTIDADE AS Quantidade,
                P.STATUS     AS Status
            FROM WMS_PENDENCIA P
            LEFT JOIN VIEW_WMS_ENDERECO V ON V.IDCOMPOSICAOENDERECO = P.IDCOMPOSICAOENDERECO
            WHERE P.STATUS = 'A'
            ORDER BY V.DEPOSITO, P.TIPO";

        using var conexao = CriarConexao();
        return await conexao.QueryAsync<Pendencia>(sql);
    }

    public async Task<IEnumerable<ResumoPendencias>> ObterResumoPorTipoAsync()
    {
        const string sql = @"
            SELECT
                TIPO AS Tipo,
                COUNT(*) AS Quantidade
            FROM WMS_PENDENCIA
            WHERE STATUS = 'A'
            GROUP BY TIPO
            ORDER BY TIPO";

        using var conexao = CriarConexao();
        return await conexao.QueryAsync<ResumoPendencias>(sql);
    }
}

/// <summary>Dados fictícios, usados enquanto UsarDadosFicticios estiver true.</summary>
public class PendenciaServiceMock : IPendenciaService
{
    private static List<Pendencia> GerarPendencias()
    {
        return new List<Pendencia>
        {
            new() { Endereco = "01 - A - 01 - 01 - 01", Deposito = "01", Tipo = "ENTRADA", Quantidade = 40, Status = "A" },
            new() { Endereco = "01 - A - 01 - 02 - 01", Deposito = "01", Tipo = "SAIDA", Quantidade = 15, Status = "A" },
            new() { Endereco = "01 - B - 02 - 01 - 01", Deposito = "01", Tipo = "TRANSF_DESTINO", Quantidade = 8, Status = "A" },
            new() { Endereco = "02 - A - 01 - 01 - 01", Deposito = "02", Tipo = "TRANSF_ORIGEM", Quantidade = 8, Status = "A" },
            new() { Endereco = "01 - C - 03 - 02 - 02", Deposito = "01", Tipo = "ENTRADA", Quantidade = 24, Status = "A" },
            new() { Endereco = "02 - B - 02 - 03 - 01", Deposito = "02", Tipo = "SAIDA", Quantidade = 11, Status = "A" },
            new() { Endereco = "03 - A - 04 - 01 - 03", Deposito = "03", Tipo = "ENTRADA", Quantidade = 32, Status = "A" },
            new() { Endereco = "03 - C - 01 - 02 - 04", Deposito = "03", Tipo = "TRANSF_DESTINO", Quantidade = 16, Status = "A" },
            new() { Endereco = "01 - D - 05 - 01 - 02", Deposito = "01", Tipo = "SAIDA", Quantidade = 19, Status = "A" },
            new() { Endereco = "02 - C - 03 - 04 - 01", Deposito = "02", Tipo = "ENTRADA", Quantidade = 27, Status = "A" },
            new() { Endereco = "03 - B - 02 - 02 - 03", Deposito = "03", Tipo = "TRANSF_ORIGEM", Quantidade = 16, Status = "A" },
            new() { Endereco = "01 - A - 06 - 03 - 01", Deposito = "01", Tipo = "ENTRADA", Quantidade = 13, Status = "A" },
        };
    }

    public Task<IEnumerable<Pendencia>> ObterPendenciasAsync() =>
        Task.FromResult<IEnumerable<Pendencia>>(GerarPendencias());

    public Task<IEnumerable<ResumoPendencias>> ObterResumoPorTipoAsync()
    {
        var dados = GerarPendencias().GroupBy(pendencia => pendencia.Tipo)
            .Select(grupo => new ResumoPendencias { Tipo = grupo.Key, Quantidade = grupo.Count() })
            .OrderBy(resumo => resumo.Tipo).ToList();
        return Task.FromResult<IEnumerable<ResumoPendencias>>(dados);
    }
}
