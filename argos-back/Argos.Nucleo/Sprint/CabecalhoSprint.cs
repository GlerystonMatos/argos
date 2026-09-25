namespace Argos.Nucleo.Sprint;

public record CabecalhoSprint(string Nome, decimal HorasPorDia, int DiasUteis, int DiasNaoUteis, int Margem, string DataInicio, string DataFim, int Ct, int Td, int TarefasPendentes, int TarefasConcluidas);