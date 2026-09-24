using System.Text.Json.Nodes;

namespace Argos.Nucleo.Configuracao;

public static class CarregadorConfiguracaoCategoriasSprint
{
    private const string PropriedadeAgrupamento = "agrupamento";

    private const string PropriedadeCorTag = "corTag";

    private const string PropriedadeTags = "tags";

    internal const string CategoriaDev = "Dev";

    internal const string CategoriaRev = "Rev";

    internal const string CategoriaQa = "Qa";

    public static ConfiguracaoCategoriasSprint Padrao() => new()
    {
        Dev = new List<string>(),
        Rev = new List<string>(),
        Qa = new List<string>(),
        Agrupamento = "ambos",
        TagsDetalhadas = new List<string>(),
        CorTag = ""
    };

    public static ConfiguracaoCategoriasSprint Carregar(CaminhosDados caminhos)
    {
        ConfiguracaoCategoriasSprint configuracao = Padrao();

        JsonObject? geral = DocumentoJson.Ler(caminhos.TogglConfiguracao);
        if (geral is not null)
        {
            configuracao.Agrupamento = DocumentoJson.ObterTexto(geral, PropriedadeAgrupamento, configuracao.Agrupamento);
            configuracao.CorTag = DocumentoJson.ObterTexto(geral, PropriedadeCorTag, configuracao.CorTag);
        }

        JsonObject? tags = DocumentoJson.Ler(caminhos.TogglTags);
        if (tags is not null)
            CarregarTags(DocumentoJson.ObterLista<EntradaTag>(tags, PropriedadeTags), configuracao);

        return configuracao;
    }

    public static void Salvar(CaminhosDados caminhos, ConfiguracaoCategoriasSprint configuracao)
    {
        DocumentoJson.Gravar(caminhos.TogglConfiguracao, MontarDocumentoGeral(configuracao));
        DocumentoJson.Gravar(caminhos.TogglTags, MontarDocumentoTags(configuracao));
    }

    internal static JsonObject MontarDocumentoGeral(ConfiguracaoCategoriasSprint configuracao) => new()
    {
        [PropriedadeAgrupamento] = configuracao.Agrupamento,
        [PropriedadeCorTag] = configuracao.CorTag
    };

    internal static JsonObject MontarDocumentoTags(ConfiguracaoCategoriasSprint configuracao)
    {
        List<EntradaTag> tags = new();

        foreach (string tag in MesclaOrdenada.Unir(configuracao.Dev, configuracao.Rev, configuracao.Qa, configuracao.TagsDetalhadas))
        {
            List<string> categorias = new();
            if (MesclaOrdenada.Contem(configuracao.Dev, tag))
                categorias.Add(CategoriaDev);
            if (MesclaOrdenada.Contem(configuracao.Rev, tag))
                categorias.Add(CategoriaRev);
            if (MesclaOrdenada.Contem(configuracao.Qa, tag))
                categorias.Add(CategoriaQa);

            tags.Add(new EntradaTag(tag, categorias, MesclaOrdenada.Contem(configuracao.TagsDetalhadas, tag)));
        }

        return new JsonObject { [PropriedadeTags] = DocumentoJson.ParaNo(tags) };
    }

    private static void CarregarTags(List<EntradaTag> tags, ConfiguracaoCategoriasSprint configuracao)
    {
        foreach (EntradaTag entrada in tags)
        {
            string tag = entrada.Nome?.Trim() ?? "";
            if (tag.Length == 0)
                continue;

            List<string> categorias = entrada.Categorias ?? new List<string>();
            if (MesclaOrdenada.Contem(categorias, CategoriaDev))
                configuracao.Dev.Add(tag);
            if (MesclaOrdenada.Contem(categorias, CategoriaRev))
                configuracao.Rev.Add(tag);
            if (MesclaOrdenada.Contem(categorias, CategoriaQa))
                configuracao.Qa.Add(tag);

            if (entrada.Detalhar)
                configuracao.TagsDetalhadas.Add(tag);
        }
    }

    internal sealed record EntradaTag(string Nome, List<string> Categorias, bool Detalhar);
}