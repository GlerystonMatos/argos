using RelatorioToggl.Api.Dtos;
using RelatorioToggl.Configuracao;
using RelatorioToggl.Toggl;

namespace RelatorioToggl.Api.Endpoints;

public static class TagsTogglEndpoints
{
    public static void MapTagsTogglEndpoints(this WebApplication app, string caminhoConfiguracao, string caminhoUsuarios, string caminhoCacheTagsToggl)
    {
        RouteGroupBuilder grupo = app.MapGroup("/api/usuarios-toggl").WithTags("Usuários do Toggl");

        grupo.MapGet("/tags", async (bool forcarAtualizacao) =>
        {
            if (!forcarAtualizacao)
            {
                CacheTagsToggl? cacheExistente = CarregadorCacheTagsTogglIni.Carregar(caminhoCacheTagsToggl);
                if (cacheExistente is not null)
                    return Results.Ok(new TagsTogglResponse(cacheExistente.Tags, true, cacheExistente.AtualizadoEm));
            }

            ConfiguracaoApp configuracao = CarregadorConfiguracaoIni.Carregar(caminhoConfiguracao, caminhoUsuarios) ?? new ConfiguracaoApp();
            ConfiguracaoUsuarioToggl? administrador = configuracao.Usuarios.FirstOrDefault(u => u.Administrador);
            if (administrador is null)
                return Results.BadRequest("Nenhum usuário do Toggl está marcado como Administrador. Marque um usuário como Administrador para listar as tags.");

            ClienteApiToggl cliente = new(administrador.TokenApi);
            ResultadoApiToggl<List<string>> resultado = await cliente.ObterTagsAsync();
            if (!resultado.Sucesso)
                return Results.Problem(resultado.MensagemErro, statusCode: StatusCodes.Status502BadGateway);

            string atualizadoEm = DateTime.UtcNow.ToString("O");
            CacheTagsToggl cache = new() { Tags = resultado.Dados!, AtualizadoEm = atualizadoEm };

            IResult? erroPersistencia = TratamentoIo.Executar(
                () => CarregadorCacheTagsTogglIni.Salvar(caminhoCacheTagsToggl, cache),
                "Não foi possível salvar o cache de tags do Toggl.");
            if (erroPersistencia is not null)
                return erroPersistencia;

            return Results.Ok(new TagsTogglResponse(cache.Tags, false, atualizadoEm));
        })
        .WithSummary("Lista as tags do Toggl (via usuário Administrador), cacheadas até atualização manual");
    }
}