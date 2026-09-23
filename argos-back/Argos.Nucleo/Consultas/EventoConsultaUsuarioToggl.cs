namespace Argos.Nucleo.Consultas;

public record EventoConsultaUsuarioToggl(string NomeUsuario, StatusConsultaUsuarioToggl Status, string? Mensagem, int? QuantidadeRegistros);