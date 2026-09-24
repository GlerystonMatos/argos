using Argos.Nucleo.Configuracao;
using Google.Cloud.Firestore;
using System.Globalization;
using System.Text;
using System.Text.Json;

namespace Argos.Armazenamento;

public sealed class ArmazenamentoFirestore : IArmazenamentoDados
{
    private const string ColecaoRaiz = "dados";

    private const string SubcolecaoUsuarios = "usuarios";

    private const string SubcolecaoBlocos = "blocos";

    private const string CampoUsuarios = "usuarios";

    private const string CampoRegistros = "registros";

    private const string CampoChave = "chave";

    private const string CampoQuantidadeBlocos = "quantidadeBlocos";

    private const int RegistrosPorBloco = 1000;

    private const string VariavelEmulador = "FIRESTORE_EMULATOR_HOST";

    private readonly FirestoreDb _banco;

    private readonly string _projeto;

    public ArmazenamentoFirestore(string projeto)
    {
        _projeto = projeto;
        _banco = new FirestoreDbBuilder
        {
            ProjectId = projeto,
            EmulatorDetection = Google.Api.Gax.EmulatorDetection.EmulatorOrProduction
        }.Build();
    }

    public string Descricao
    {
        get
        {
            string? emulador = Environment.GetEnvironmentVariable(VariavelEmulador);
            string destino = string.IsNullOrWhiteSpace(emulador) ? "produção" : $"emulador em {emulador}";
            return $"Firestore (projeto {_projeto}, banco (default), coleção \"{ColecaoRaiz}\", {destino})";
        }
    }

    public string? Ler(string nome) => Executar(() => LerAsync(nome));

    public void Gravar(string nome, string json) => Executar(() => GravarAsync(nome, json));

    public bool Existe(string nome) => Executar(async () => (await Documento(nome).GetSnapshotAsync()).Exists);

    public void Apagar(string nome) => Executar(() => ApagarRecursivoAsync(Documento(nome)));

    public IReadOnlyList<string> Listar() => Executar<IReadOnlyList<string>>(async () =>
    {
        List<string> nomes = new();
        await foreach (DocumentReference referencia in _banco.Collection(ColecaoRaiz).ListDocumentsAsync())
            nomes.Add(referencia.Id);

        return nomes.OrderBy(nome => nome, StringComparer.OrdinalIgnoreCase).ToList();
    });

    private DocumentReference Documento(string nome) => _banco.Collection(ColecaoRaiz).Document(nome);

    private async Task<string?> LerAsync(string nome)
    {
        DocumentReference referencia = Documento(nome);
        DocumentSnapshot instantaneo = await referencia.GetSnapshotAsync();
        if (!instantaneo.Exists)
            return null;

        Dictionary<string, object?> campos = new(instantaneo.ToDictionary()!);
        if (CaminhosDados.EhCacheToggl(nome))
            campos[CampoUsuarios] = await RemontarUsuariosAsync(referencia, campos.GetValueOrDefault(CampoUsuarios));

        return ConversorValoresFirestore.ParaJson(campos);
    }

    private async Task GravarAsync(string nome, string json)
    {
        DocumentReference referencia = Documento(nome);
        Dictionary<string, object?> campos = ConversorValoresFirestore.DeJson(json);

        if (CaminhosDados.EhCacheToggl(nome))
        {
            await ApagarSubcolecoesAsync(referencia);
            if (campos.GetValueOrDefault(CampoUsuarios) is List<object?> usuarios)
                campos[CampoUsuarios] = await GravarUsuariosAsync(referencia, usuarios);
        }

        await referencia.SetAsync(campos);
    }

    private static async Task<List<object?>> GravarUsuariosAsync(DocumentReference referencia, List<object?> usuarios)
    {
        List<object?> ids = new();

        for (int indice = 0; indice < usuarios.Count; indice++)
        {
            if (usuarios[indice] is not Dictionary<string, object?> usuario)
                continue;

            string id = IdUsuario(usuario.GetValueOrDefault(CampoChave) as string, indice);
            List<object?> registros = usuario.GetValueOrDefault(CampoRegistros) as List<object?> ?? new List<object?>();
            DocumentReference referenciaUsuario = referencia.Collection(SubcolecaoUsuarios).Document(id);

            int quantidadeBlocos = 0;
            for (int inicio = 0; inicio < registros.Count; inicio += RegistrosPorBloco)
            {
                List<object?> bloco = registros.GetRange(inicio, Math.Min(RegistrosPorBloco, registros.Count - inicio));
                await referenciaUsuario.Collection(SubcolecaoBlocos).Document(IdBloco(quantidadeBlocos))
                    .SetAsync(new Dictionary<string, object?> { [CampoRegistros] = bloco });
                quantidadeBlocos++;
            }

            Dictionary<string, object?> dadosUsuario = usuario
                .Where(par => par.Key != CampoRegistros)
                .ToDictionary(par => par.Key, par => par.Value);
            dadosUsuario[CampoQuantidadeBlocos] = (long)quantidadeBlocos;
            await referenciaUsuario.SetAsync(dadosUsuario);

            ids.Add(id);
        }

        return ids;
    }

    private static async Task<List<object?>> RemontarUsuariosAsync(DocumentReference referencia, object? ids)
    {
        List<object?> usuarios = new();
        if (ids is not IEnumerable<object> listaIds)
            return usuarios;

        foreach (string id in listaIds.OfType<string>())
        {
            DocumentReference referenciaUsuario = referencia.Collection(SubcolecaoUsuarios).Document(id);
            DocumentSnapshot instantaneo = await referenciaUsuario.GetSnapshotAsync();
            if (!instantaneo.Exists)
                continue;

            Dictionary<string, object?> usuario = new(instantaneo.ToDictionary()!);
            long quantidadeBlocos = usuario.GetValueOrDefault(CampoQuantidadeBlocos) is long quantidade ? quantidade : 0;
            usuario.Remove(CampoQuantidadeBlocos);

            List<object?> registros = new();
            for (int bloco = 0; bloco < quantidadeBlocos; bloco++)
            {
                DocumentSnapshot instantaneoBloco = await referenciaUsuario.Collection(SubcolecaoBlocos).Document(IdBloco(bloco)).GetSnapshotAsync();
                if (instantaneoBloco.Exists && instantaneoBloco.ToDictionary().GetValueOrDefault(CampoRegistros) is IEnumerable<object> itens)
                    registros.AddRange(itens);
            }

            usuario[CampoRegistros] = registros;
            usuarios.Add(usuario);
        }

        return usuarios;
    }

    private static async Task ApagarRecursivoAsync(DocumentReference referencia)
    {
        await ApagarSubcolecoesAsync(referencia);
        await referencia.DeleteAsync();
    }

    private static async Task ApagarSubcolecoesAsync(DocumentReference referencia)
    {
        await foreach (CollectionReference colecao in referencia.ListCollectionsAsync())
        {
            await foreach (DocumentReference filho in colecao.ListDocumentsAsync())
                await ApagarRecursivoAsync(filho);
        }
    }

    private static string IdUsuario(string? chave, int indice)
    {
        bool valido = !string.IsNullOrEmpty(chave)
            && Encoding.UTF8.GetByteCount(chave) <= 1500
            && !chave.Contains('/')
            && chave is not ("." or "..")
            && !(chave.StartsWith("__") && chave.EndsWith("__"));

        return valido ? chave! : $"usuario{indice.ToString(CultureInfo.InvariantCulture)}";
    }

    private static string IdBloco(int indice) => indice.ToString("D4", CultureInfo.InvariantCulture);

    private static void Executar(Func<Task> acao) => Executar(async () =>
    {
        await acao();
        return true;
    });

    private static T Executar<T>(Func<Task<T>> acao)
    {
        try
        {
            return acao().GetAwaiter().GetResult();
        }
        catch (Exception ex) when (ex is not IOException)
        {
            throw new IOException($"Falha ao acessar o Firestore: {ex.Message}", ex);
        }
    }
}