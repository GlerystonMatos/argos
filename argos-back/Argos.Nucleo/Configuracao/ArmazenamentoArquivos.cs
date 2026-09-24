using System.Text;

namespace Argos.Nucleo.Configuracao;

public sealed class ArmazenamentoArquivos : IArmazenamentoDados
{
    private const string Extensao = ".json";

    private static readonly UTF8Encoding Codificacao = new(encoderShouldEmitUTF8Identifier: false);

    private readonly string _pasta;

    public ArmazenamentoArquivos(string pasta)
    {
        _pasta = pasta;
    }

    public string Descricao => $"arquivos JSON em {_pasta}";

    public string? Ler(string nome)
    {
        string caminho = Caminho(nome);
        return File.Exists(caminho) ? File.ReadAllText(caminho, Codificacao) : null;
    }

    public void Gravar(string nome, string json)
    {
        Directory.CreateDirectory(_pasta);
        File.WriteAllText(Caminho(nome), json, Codificacao);
    }

    public bool Existe(string nome) => File.Exists(Caminho(nome));

    public void Apagar(string nome)
    {
        string caminho = Caminho(nome);
        if (File.Exists(caminho))
            File.Delete(caminho);
    }

    public IReadOnlyList<string> Listar()
    {
        if (!Directory.Exists(_pasta))
            return new List<string>();

        return Directory.GetFiles(_pasta, $"*{Extensao}")
            .Select(caminho => Path.GetFileNameWithoutExtension(caminho))
            .OrderBy(nome => nome, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private string Caminho(string nome)
    {
        if (nome.Length == 0 || Path.GetFileName(nome) != nome || nome.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0)
            throw new IOException($"Nome de documento inválido: \"{nome}\".");

        return Path.Combine(_pasta, nome + Extensao);
    }
}