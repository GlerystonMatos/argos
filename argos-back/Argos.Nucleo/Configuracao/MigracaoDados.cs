using Argos.Nucleo.Jira;
using System.Text.Json.Nodes;

namespace Argos.Nucleo.Configuracao;

public static class MigracaoDados
{
    private const string NomeLegadoJiraColunas = "JiraColunas";

    private const string NomeLegadoJiraColunasCache = "JiraColunasCache";

    private const string PrefixoLegadoCacheJiraPlanejamento = "JiraPlanejamentoData_";

    private const string PropriedadeLegadaQuadroId = "quadroId";

    private const string PropriedadeLegadaQuadroNome = "quadroNome";

    private const string PropriedadeLegadaColunasOcultas = "colunasOcultas";

    private const string PropriedadeSprints = "sprints";

    private const string PropriedadeMargemPercentual = "margemPercentual";

    private const decimal MargemPercentualLegada = 30m;

    public static List<string> Executar(CaminhosDados caminhos)
    {
        List<string> acoes = new();

        MigrarQuadroConexao(caminhos, acoes);
        MigrarColunasOcultas(caminhos, acoes);
        MigrarDocumento(caminhos.Documento(NomeLegadoJiraColunas), caminhos.JiraColunas(TipoQuadroJira.Dev), acoes);
        ApagarSeExistir(caminhos.Documento(NomeLegadoJiraColunasCache), acoes);
        MigrarCachesPlanejamento(caminhos, acoes);
        MigrarMargemSprints(caminhos, acoes);

        return acoes;
    }

    private static void MigrarQuadroConexao(CaminhosDados caminhos, List<string> acoes)
    {
        JsonObject? conexao = DocumentoJson.Ler(caminhos.JiraConexao);
        if (conexao is null)
            return;

        bool temLegado = conexao.ContainsKey(PropriedadeLegadaQuadroId) || conexao.ContainsKey(PropriedadeLegadaQuadroNome);
        if (!temLegado)
            return;

        if (!conexao.ContainsKey(CarregadorConfiguracaoJira.PropriedadeQuadroDevId)
            && conexao.TryGetPropertyValue(PropriedadeLegadaQuadroId, out JsonNode? quadroId)
            && quadroId is not null)
            conexao[CarregadorConfiguracaoJira.PropriedadeQuadroDevId] = quadroId.DeepClone();

        if (!conexao.ContainsKey(CarregadorConfiguracaoJira.PropriedadeQuadroDevNome)
            && conexao.TryGetPropertyValue(PropriedadeLegadaQuadroNome, out JsonNode? quadroNome)
            && quadroNome is not null)
            conexao[CarregadorConfiguracaoJira.PropriedadeQuadroDevNome] = quadroNome.DeepClone();

        conexao.Remove(PropriedadeLegadaQuadroId);
        conexao.Remove(PropriedadeLegadaQuadroNome);
        DocumentoJson.Gravar(caminhos.JiraConexao, conexao);
        acoes.Add($"{caminhos.JiraConexao.Nome}: quadroId/quadroNome → quadroDevId/quadroDevNome");
    }

    private static void MigrarColunasOcultas(CaminhosDados caminhos, List<string> acoes)
    {
        JsonObject? quadro = DocumentoJson.Ler(caminhos.JiraQuadro);
        if (quadro is null || !quadro.TryGetPropertyValue(PropriedadeLegadaColunasOcultas, out JsonNode? colunasOcultas))
            return;

        if (!quadro.ContainsKey(CarregadorConfiguracaoQuadroPlanejamento.PropriedadeColunasOcultasDev) && colunasOcultas is not null)
            quadro[CarregadorConfiguracaoQuadroPlanejamento.PropriedadeColunasOcultasDev] = colunasOcultas.DeepClone();

        quadro.Remove(PropriedadeLegadaColunasOcultas);
        DocumentoJson.Gravar(caminhos.JiraQuadro, quadro);
        acoes.Add($"{caminhos.JiraQuadro.Nome}: colunasOcultas → colunasOcultasDev");
    }

    private static void MigrarDocumento(DocumentoDados origem, DocumentoDados destino, List<string> acoes)
    {
        string? conteudo = origem.Ler();
        if (conteudo is null)
            return;

        destino.Gravar(conteudo);
        origem.Apagar();
        acoes.Add($"{origem.Nome} → {destino.Nome}");
    }

    private static void ApagarSeExistir(DocumentoDados documento, List<string> acoes)
    {
        if (!documento.Existe())
            return;

        documento.Apagar();
        acoes.Add($"{documento.Nome}: apagado");
    }

    private static void MigrarCachesPlanejamento(CaminhosDados caminhos, List<string> acoes)
    {
        List<DocumentoDados> legados = caminhos.Armazenamento.Listar()
            .Where(nome => nome.StartsWith(PrefixoLegadoCacheJiraPlanejamento, StringComparison.OrdinalIgnoreCase))
            .Select(caminhos.Documento)
            .ToList();
        if (legados.Count == 0)
            return;

        DocumentoDados destino = caminhos.CacheJiraPlanejamento(TipoQuadroJira.Dev);
        if (!destino.Existe())
        {
            long? quadroDevId = CarregadorConfiguracaoJira.Carregar(caminhos).QuadroDevId;
            CachePlanejamentoJira? maisRecente = legados
                .Select(CarregadorCachePlanejamentoJira.Ler)
                .OfType<CachePlanejamentoJira>()
                .Where(cache => cache.QuadroId == quadroDevId && cache.SprintJira is not null)
                .OrderByDescending(cache => cache.AtualizadoEm, StringComparer.Ordinal)
                .FirstOrDefault();

            if (maisRecente is not null)
            {
                CarregadorCachePlanejamentoJira.Salvar(destino, maisRecente);
                acoes.Add($"{PrefixoLegadoCacheJiraPlanejamento}* (mais recente) → {destino.Nome}");
            }
        }

        foreach (DocumentoDados legado in legados)
        {
            legado.Apagar();
            acoes.Add($"{legado.Nome}: apagado");
        }
    }

    private static void MigrarMargemSprints(CaminhosDados caminhos, List<string> acoes)
    {
        JsonObject? documento = DocumentoJson.Ler(caminhos.Sprints);
        if (documento is null)
            return;

        int migrados = 0;
        foreach (JsonObject sprint in DocumentoJson.Objetos(documento, PropriedadeSprints))
        {
            if (sprint.ContainsKey(PropriedadeMargemPercentual))
                continue;

            sprint[PropriedadeMargemPercentual] = MargemPercentualLegada;
            migrados++;
        }

        if (migrados == 0)
            return;

        DocumentoJson.Gravar(caminhos.Sprints, documento);
        acoes.Add($"{caminhos.Sprints.Nome}: margemPercentual = {MargemPercentualLegada} em {migrados} sprint(s) sem o campo");
    }
}