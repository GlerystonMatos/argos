namespace Argos.Nucleo.Configuracao;

public sealed class DocumentoDados
{
    public DocumentoDados(IArmazenamentoDados armazenamento, string nome)
    {
        Armazenamento = armazenamento;
        Nome = nome;
    }

    public IArmazenamentoDados Armazenamento { get; }

    public string Nome { get; }

    public string? Ler() => Armazenamento.Ler(Nome);

    public void Gravar(string json) => Armazenamento.Gravar(Nome, json);

    public bool Existe() => Armazenamento.Existe(Nome);

    public void Apagar() => Armazenamento.Apagar(Nome);
}