namespace Argos.Nucleo.Configuracao;

public interface IArmazenamentoDados
{
    string Descricao { get; }

    string? Ler(string nome);

    void Gravar(string nome, string json);

    bool Existe(string nome);

    void Apagar(string nome);

    IReadOnlyList<string> Listar();
}