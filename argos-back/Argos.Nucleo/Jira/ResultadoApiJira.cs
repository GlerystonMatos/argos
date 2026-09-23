namespace Argos.Nucleo.Jira;

public class ResultadoApiJira<T>
{
    public bool Sucesso { get; private init; }

    public T? Dados { get; private init; }

    public string? MensagemErro { get; private init; }

    public static ResultadoApiJira<T> Ok(T dados) => new() { Sucesso = true, Dados = dados };

    public static ResultadoApiJira<T> Falha(string mensagem) => new() { Sucesso = false, MensagemErro = mensagem };
}