using System.Text.RegularExpressions;

namespace RelatorioToggl.Relatorios;

public static class ServicoCodigoTel
{
    private static readonly Regex PadraoCodigo = new(@"^(TEL - \d+)(?: - (.+))?$", RegexOptions.Compiled);

    public static (string Codigo, string Descricao) Separar(string chave)
    {
        Match correspondencia = PadraoCodigo.Match(chave);
        if (!correspondencia.Success)
            return ("", chave);

        return (correspondencia.Groups[1].Value, correspondencia.Groups[2].Success ? correspondencia.Groups[2].Value : "");
    }

    public static int Numero(string codigo)
    {
        string digitos = new(codigo.Where(char.IsDigit).ToArray());
        return int.TryParse(digitos, out int numero) ? numero : int.MaxValue;
    }

    public static string? ExtrairChaveJira(string descricaoNormalizada)
    {
        (string codigo, _) = Separar(descricaoNormalizada);
        return codigo.Length > 0 ? codigo.Replace(" ", "") : null;
    }

    public static (string Codigo, string Descricao) SepararDeCartaoJira(string chave, string resumo)
    {
        string resumoLimpo = resumo.Trim();
        (string codigoResumo, string descricaoResumo) = Separar(ServicoAgrupamento.NormalizarDescricaoTel(resumoLimpo));

        (string codigoChave, string descricaoChave) = Separar(ServicoAgrupamento.NormalizarDescricaoTel(chave.Trim()));
        bool chaveEhTel = codigoChave.Length > 0 && descricaoChave.Length == 0;

        if (!chaveEhTel)
            return (chave, resumoLimpo);

        bool resumoTemMesmoCodigo = codigoResumo.Length > 0 && Numero(codigoResumo) == Numero(codigoChave);
        return (codigoChave, resumoTemMesmoCodigo ? descricaoResumo : resumoLimpo);
    }
}