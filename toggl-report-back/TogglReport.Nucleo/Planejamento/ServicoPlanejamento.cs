using RelatorioToggl.Configuracao;
using RelatorioToggl.Jira;
using RelatorioToggl.Relatorios;

namespace RelatorioToggl.Planejamento;

public static class ServicoPlanejamento
{
    private const string ColunaSemColuna = "(sem coluna)";

    public static ResultadoPlanejamento Montar(
        CachePlanejamentoJira cache,
        ConfiguracaoMapeamentoJiraToggl mapeamento,
        List<ConfiguracaoUsuarioToggl> usuariosToggl)
    {
        Dictionary<string, int> indicePorStatusId = new();
        for (int i = 0; i < cache.Colunas.Count; i++)
        {
            foreach (string statusId in cache.Colunas[i].StatusIds)
                indicePorStatusId.TryAdd(statusId, i);
        }

        List<string> colunas = cache.Colunas.Select(c => c.Nome).ToList();
        int indiceSemColuna = colunas.Count;
        if (cache.Cartoes.Any(c => !indicePorStatusId.ContainsKey(c.StatusId)))
            colunas.Add(ColunaSemColuna);

        Dictionary<string, PessoaPlanejamento> pessoasPorNomeJira = new(StringComparer.OrdinalIgnoreCase);

        PessoaPlanejamento? ResolverPessoa(string? nomeJira)
        {
            if (string.IsNullOrWhiteSpace(nomeJira))
                return null;

            if (!pessoasPorNomeJira.TryGetValue(nomeJira, out PessoaPlanejamento? pessoa))
            {
                pessoa = CriarPessoa(nomeJira, mapeamento, usuariosToggl);
                pessoasPorNomeJira[nomeJira] = pessoa;
            }

            return pessoa;
        }

        List<(CartaoPlanejamento Cartao, int IndiceColuna)> cartoes = new();
        Dictionary<string, int[]> contagensPorPessoa = new(StringComparer.OrdinalIgnoreCase);
        int[] totaisPorColuna = new int[colunas.Count];

        foreach (CartaoQuadroJira cartao in cache.Cartoes)
        {
            int indiceColuna = indicePorStatusId.GetValueOrDefault(cartao.StatusId, indiceSemColuna);
            totaisPorColuna[indiceColuna]++;

            (string codigo, string descricao) = ServicoCodigoTel.SepararDeCartaoJira(cartao.Chave, cartao.Resumo);

            PessoaPlanejamento? responsavel = ResolverPessoa(cartao.Responsavel);
            PessoaPlanejamento? analisadoPor = ResolverPessoa(cartao.AnalisadoPor);
            PessoaPlanejamento? revisadoPor = ResolverPessoa(cartao.RevisadoPor);

            HashSet<string> contadas = new(StringComparer.OrdinalIgnoreCase);
            foreach (PessoaPlanejamento? pessoa in new[] { responsavel, revisadoPor })
            {
                if (pessoa is null || !contadas.Add(pessoa.NomeJira))
                    continue;

                if (!contagensPorPessoa.TryGetValue(pessoa.NomeJira, out int[]? contagens))
                {
                    contagens = new int[colunas.Count];
                    contagensPorPessoa[pessoa.NomeJira] = contagens;
                }

                contagens[indiceColuna]++;
            }

            cartoes.Add((new CartaoPlanejamento(
                cartao.Chave,
                codigo,
                descricao,
                cartao.UrlIssue,
                colunas[indiceColuna],
                cartao.Status,
                cartao.Prioridade,
                cartao.GrupoChave,
                cartao.GrupoResumo,
                responsavel,
                analisadoPor,
                revisadoPor), indiceColuna));
        }

        List<CartaoPlanejamento> cartoesOrdenados = cartoes
            .OrderBy(c => c.IndiceColuna)
            .ThenBy(c => ServicoCodigoTel.Numero(c.Cartao.Codigo))
            .ThenBy(c => c.Cartao.Chave, StringComparer.OrdinalIgnoreCase)
            .Select(c => c.Cartao)
            .ToList();

        List<ColaboradorPlanejamento> colaboradores = contagensPorPessoa
            .Select(par => new ColaboradorPlanejamento(pessoasPorNomeJira[par.Key], par.Value.ToList(), par.Value.Sum()))
            .OrderBy(c => c.Pessoa.Nome, ComparadorNomes.Instancia)
            .ThenBy(c => c.Pessoa.NomeJira, StringComparer.OrdinalIgnoreCase)
            .ToList();

        return new ResultadoPlanejamento(
            cache.QuadroNome,
            cache.SprintJira?.Nome,
            cache.SprintJira?.DataInicio,
            cache.SprintJira?.DataFim,
            cache.AtualizadoEm,
            colunas,
            totaisPorColuna.ToList(),
            cartoesOrdenados,
            colaboradores);
    }

    private static PessoaPlanejamento CriarPessoa(
        string nomeJira,
        ConfiguracaoMapeamentoJiraToggl mapeamento,
        List<ConfiguracaoUsuarioToggl> usuariosToggl)
    {
        if (mapeamento.Mapeamento.TryGetValue(nomeJira, out EntradaMapeamentoJiraToggl? entrada))
        {
            if (!string.IsNullOrWhiteSpace(entrada.ChaveToggl))
            {
                ConfiguracaoUsuarioToggl? usuario = usuariosToggl.FirstOrDefault(u => u.Chave == entrada.ChaveToggl);
                if (usuario is not null)
                    return new PessoaPlanejamento(nomeJira, usuario.NomeExibicao, usuario.Sigla, CorOuNula(usuario.Cor), true);
            }
            else if (!string.IsNullOrWhiteSpace(entrada.Sigla))
            {
                return new PessoaPlanejamento(nomeJira, nomeJira, entrada.Sigla, CorOuNula(entrada.Cor), true);
            }
        }

        return new PessoaPlanejamento(nomeJira, nomeJira, IniciaisDe(nomeJira), null, false);
    }

    private static string? CorOuNula(string? cor) => string.IsNullOrWhiteSpace(cor) ? null : cor;

    private static string IniciaisDe(string nome)
    {
        string iniciais = new(nome
            .Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries)
            .Select(palavra => palavra.FirstOrDefault(char.IsLetter))
            .Where(letra => letra != default)
            .Take(3)
            .Select(char.ToUpperInvariant)
            .ToArray());

        return iniciais.Length > 0 ? iniciais : "?";
    }
}