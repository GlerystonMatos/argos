using RelatorioToggl.Api.Dtos;
using RelatorioToggl.Configuracao;
using RelatorioToggl.Toggl;

namespace RelatorioToggl.Api.Endpoints;

public static class UsuariosTogglEndpoints
{
    public static void MapUsuariosTogglEndpoints(this WebApplication app, CaminhosDados caminhos)
    {
        RouteGroupBuilder grupo = app.MapGroup("/api/usuarios-toggl").WithTags("Usuários do Toggl");

        grupo.MapGet("/", () =>
        {
            List<UsuarioTogglResumoDto> resposta = CarregadorUsuariosTogglIni.Carregar(caminhos.Usuarios)
                .Select(u => new UsuarioTogglResumoDto(u.Chave, u.NomeExibicao, ServicoUsuariosToggl.MascararToken(u.TokenApi), u.Sigla, u.Cor, u.Selecionado, u.Administrador))
                .ToList();
            return Results.Ok(resposta);
        })
        .WithSummary("Lista os usuários do Toggl cadastrados (token mascarado)");

        grupo.MapPost("/validar-token", async (ValidarTokenRequest request) =>
        {
            if (string.IsNullOrWhiteSpace(request.TokenApi))
                return Results.Ok(new ValidarTokenResponse(false));

            ClienteApiToggl cliente = new(request.TokenApi);
            bool valido = await cliente.ValidarTokenAsync();
            return Results.Ok(new ValidarTokenResponse(valido));
        })
        .WithSummary("Valida um API Token de usuário do Toggl junto ao Toggl (GET /me), sem salvar");

        grupo.MapPost("/", async (CriarUsuarioTogglRequest request) =>
        {
            if (string.IsNullOrWhiteSpace(request.NomeExibicao))
                return Results.BadRequest("Nome de exibição é obrigatório.");

            List<ConfiguracaoUsuarioToggl> usuarios = CarregadorUsuariosTogglIni.Carregar(caminhos.Usuarios);

            if (ServicoUsuariosToggl.NomeEmUso(usuarios, request.NomeExibicao, ignorar: null))
                return Results.Conflict($"Já existe um usuário do Toggl chamado '{request.NomeExibicao}'.");

            if (ServicoUsuariosToggl.TokenEmUso(usuarios, request.TokenApi, ignorar: null))
                return Results.Conflict("Esse API Token já está cadastrado para outro usuário do Toggl.");

            if (!string.IsNullOrWhiteSpace(request.Sigla) && ServicoUsuariosToggl.SiglaEmUso(usuarios, request.Sigla, ignorar: null))
                return Results.Conflict($"A sigla '{request.Sigla}' já está em uso por outro usuário do Toggl.");

            if (!request.IgnorarValidacao)
            {
                ClienteApiToggl cliente = new(request.TokenApi);
                if (!await cliente.ValidarTokenAsync())
                    return Results.BadRequest("Não foi possível validar o token. Envie ignorarValidacao=true para salvar mesmo assim.");
            }

            string chave = ServicoUsuariosToggl.GerarChaveUnica(request.NomeExibicao, usuarios);
            ConfiguracaoUsuarioToggl usuario = new() { Chave = chave, NomeExibicao = request.NomeExibicao, TokenApi = request.TokenApi, Sigla = request.Sigla, Cor = request.Cor, Selecionado = request.Selecionado, Administrador = request.Administrador };
            usuarios.Add(usuario);

            if (usuario.Administrador)
                ServicoUsuariosToggl.DesmarcarOutrosAdministradores(usuarios, usuario);

            IResult? erroPersistencia = TratamentoIo.Executar(
                () => CarregadorUsuariosTogglIni.Salvar(caminhos.Usuarios, usuarios),
                "Não foi possível salvar a configuração.");
            if (erroPersistencia is not null)
                return erroPersistencia;

            return Results.Created($"/api/usuarios-toggl/{chave}",
                new UsuarioTogglResumoDto(chave, usuario.NomeExibicao, ServicoUsuariosToggl.MascararToken(usuario.TokenApi), usuario.Sigla, usuario.Cor, usuario.Selecionado, usuario.Administrador));
        })
        .WithSummary("Cadastra um usuário do Toggl (valida o token por padrão)");

        grupo.MapPut("/{chave}", async (string chave, EditarUsuarioTogglRequest request) =>
        {
            List<ConfiguracaoUsuarioToggl> usuarios = CarregadorUsuariosTogglIni.Carregar(caminhos.Usuarios);
            ConfiguracaoUsuarioToggl? usuario = usuarios.FirstOrDefault(u => u.Chave == chave);
            if (usuario is null)
                return Results.NotFound();

            if (!string.IsNullOrWhiteSpace(request.NomeExibicao))
            {
                if (ServicoUsuariosToggl.NomeEmUso(usuarios, request.NomeExibicao, ignorar: usuario))
                    return Results.Conflict($"Já existe um usuário do Toggl chamado '{request.NomeExibicao}'.");

                usuario.NomeExibicao = request.NomeExibicao;
            }

            if (!string.IsNullOrWhiteSpace(request.TokenApi))
            {
                if (ServicoUsuariosToggl.TokenEmUso(usuarios, request.TokenApi, ignorar: usuario))
                    return Results.Conflict("Esse API Token já está cadastrado para outro usuário do Toggl.");

                if (!request.IgnorarValidacao)
                {
                    ClienteApiToggl cliente = new(request.TokenApi);
                    if (!await cliente.ValidarTokenAsync())
                        return Results.BadRequest("Não foi possível validar o token. Envie ignorarValidacao=true para salvar mesmo assim.");
                }

                usuario.TokenApi = request.TokenApi;
            }

            if (!string.IsNullOrWhiteSpace(request.Sigla))
            {
                if (ServicoUsuariosToggl.SiglaEmUso(usuarios, request.Sigla, ignorar: usuario))
                    return Results.Conflict($"A sigla '{request.Sigla}' já está em uso por outro usuário do Toggl.");

                usuario.Sigla = request.Sigla;
            }

            if (!string.IsNullOrWhiteSpace(request.Cor))
                usuario.Cor = request.Cor;

            if (request.Selecionado is not null)
                usuario.Selecionado = request.Selecionado.Value;

            if (request.Administrador is not null)
            {
                usuario.Administrador = request.Administrador.Value;

                if (usuario.Administrador)
                    ServicoUsuariosToggl.DesmarcarOutrosAdministradores(usuarios, usuario);
            }

            IResult? erroPersistencia = TratamentoIo.Executar(
                () => CarregadorUsuariosTogglIni.Salvar(caminhos.Usuarios, usuarios),
                "Não foi possível salvar a configuração.");
            if (erroPersistencia is not null)
                return erroPersistencia;

            return Results.Ok(new UsuarioTogglResumoDto(usuario.Chave, usuario.NomeExibicao, ServicoUsuariosToggl.MascararToken(usuario.TokenApi), usuario.Sigla, usuario.Cor, usuario.Selecionado, usuario.Administrador));
        })
        .WithSummary("Edita nome de exibição e/ou token de um usuário do Toggl");

        grupo.MapDelete("/{chave}", (string chave) =>
        {
            List<ConfiguracaoUsuarioToggl> usuarios = CarregadorUsuariosTogglIni.Carregar(caminhos.Usuarios);
            ConfiguracaoUsuarioToggl? usuario = usuarios.FirstOrDefault(u => u.Chave == chave);
            if (usuario is null)
                return Results.NotFound();

            usuarios.Remove(usuario);

            IResult? erroPersistencia = TratamentoIo.Executar(
                () => CarregadorUsuariosTogglIni.Salvar(caminhos.Usuarios, usuarios),
                "Não foi possível salvar a configuração.");
            if (erroPersistencia is not null)
                return erroPersistencia;

            return Results.NoContent();
        })
        .WithSummary("Remove um usuário do Toggl cadastrado");
    }
}