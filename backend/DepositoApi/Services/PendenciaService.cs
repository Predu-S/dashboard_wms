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
    private readonly string _connectionString;

    public PendenciaService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("FirebirdDefault")
            ?? throw new InvalidOperationException("Connection string 'FirebirdDefault' não configurada.");
    }

    private FbConnection CriarConexao() => new FbConnection(_connectionString);

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
    public Task<IEnumerable<Pendencia>> ObterPendenciasAsync()
    {
        var dados = new List<Pendencia>
        {
            new() { Endereco = "01 - A - 01 - 01 - 01", Deposito = "01", Tipo = "ENTRADA", Quantidade = 40, Status = "A" },
            new() { Endereco = "01 - A - 01 - 02 - 01", Deposito = "01", Tipo = "SAIDA", Quantidade = 15, Status = "A" },
            new() { Endereco = "01 - B - 02 - 01 - 01", Deposito = "01", Tipo = "TRANSF_DESTINO", Quantidade = 8, Status = "A" },
            new() { Endereco = "02 - A - 01 - 01 - 01", Deposito = "02", Tipo = "TRANSF_ORIGEM", Quantidade = 8, Status = "A" },
        };
        return Task.FromResult<IEnumerable<Pendencia>>(dados);
    }

    public Task<IEnumerable<ResumoPendencias>> ObterResumoPorTipoAsync()
    {
        var dados = new List<ResumoPendencias>
        {
            new() { Tipo = "ENTRADA", Quantidade = 12 },
            new() { Tipo = "SAIDA", Quantidade = 7 },
            new() { Tipo = "TRANSF_DESTINO", Quantidade = 3 },
            new() { Tipo = "TRANSF_ORIGEM", Quantidade = 3 },
        };
        return Task.FromResult<IEnumerable<ResumoPendencias>>(dados);
    }
}
