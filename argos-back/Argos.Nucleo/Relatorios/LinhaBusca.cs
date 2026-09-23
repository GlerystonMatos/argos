namespace Argos.Nucleo.Relatorios;

public record LinhaBusca(string Descricao, Dictionary<string, long> SegundosPorUsuario, long TotalSegundosLinha);