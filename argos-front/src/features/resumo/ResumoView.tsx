import { useState } from 'react';
import type { ReactNode } from 'react';
import { ListaCoresResumo } from './ListaCoresResumo';
import { rotularAgrupamento } from '../../utils/rotulos';
import type { Secao } from '../../components/MenuLateral';
import type { AbaConfiguracoes } from '../configuracoes/abas';
import { TOTAL_CAMPOS_JIRA } from '../configuracoes/completude';
import { ListaMapeamentoResumo } from './ListaMapeamentoResumo';
import type { ResumoConfiguracao } from './useResumoConfiguracao';
import { IconeStatus, BlocoResumo } from '../configuracoes/BlocoResumo';
import { EsqueletoCarregando } from '../../components/EsqueletoCarregando';
import { BotaoComCarregamento } from '../../components/BotaoComCarregamento';

import {
    Box,
    Card,
    Stack,
    Alert,
    Typography,
    CardContent,
} from '@mui/material';

const BLOCOS_RESUMO = [
    'usuarios-toggl', 'toggl-config', 'jira-conexao', 'jira-campos',
    'jira-status', 'jira-cores', 'jira-quadro', 'jira-mapeamento',
] as const;

interface ResumoViewProps {
    resumo: ResumoConfiguracao;
    onNavegar: (secao: Secao, aba?: AbaConfiguracoes) => void;
}

interface BotaoConfigurarProps {
    titulo: string;
    onClick: () => void;
}

function BotaoConfigurar({ titulo, onClick }: BotaoConfigurarProps): ReactNode {
    return (
        <BotaoComCarregamento size="small" variant="outlined" aria-label={`Configurar ${titulo}`} onClick={onClick}>
            Configurar
        </BotaoComCarregamento>
    );
}

function listarPendencias(pendencias: string[]): string {
    if (pendencias.length < 2) return pendencias.join('');
    return `${pendencias.slice(0, -1).join(', ')} e ${pendencias[pendencias.length - 1]}`;
}

export function ResumoView({ resumo, onNavegar }: ResumoViewProps): ReactNode {
    const {
        carregado,
        categorias,
        togglCompleto,
        responsabilidade,
        jiraConfigurado,
        statusFinal,
        jiraUrlDominio,
        jiraEmail,
        jiraQuadro,
        nomeAdministrador,
        quantidadeUsuarios,
        coresStatus,
        coresPrioridade,
        coresColuna,
        coresTime,
        coresEpico,
        configuracaoCompleta,
        quantidadeCoresStatus,
        quantidadeMapeamentosJira,
        quantidadeCamposJiraDefinidos,
        previsaoLiberacaoConfigurada,
        janelaAlertaPrevisaoLiberacaoDias,
        quantidadeCoresPrioridade,
        quantidadeCoresColuna,
        quantidadeCoresTime,
        quantidadeCoresEpico,
        colunasOcultasPlanejamento,
        mapeamentoJira,
        usuariosToggl,
        usuariosTogglSemMapeamento,
        entradasMapeamentoInvalidas,
        mapeamentoCompleto,
        jiraCamposCompleto,
        statusFinalCompleto,
        statusResponsavelCompleto,
        existeUsuarioAdministrador,
    } = resumo;

    const statusCompleto = statusResponsavelCompleto && statusFinalCompleto;

    const [colapsados, setColapsados] = useState<ReadonlySet<string>>(new Set(BLOCOS_RESUMO));

    function expandido(chave: string): boolean {
        return !colapsados.has(chave);
    }

    function alternar(chave: string): void {
        setColapsados((atual) => {
            const novo = new Set(atual);
            if (novo.has(chave)) {
                novo.delete(chave);
            } else {
                novo.add(chave);
            }
            return novo;
        });
    }

    function expandirTodos(): void {
        setColapsados(new Set());
    }

    function colapsarTodos(): void {
        setColapsados(new Set(BLOCOS_RESUMO));
    }

    const pendenciasObrigatorias = [
        ...(togglCompleto ? [] : ['Toggl: Configurações']),
        ...(jiraCamposCompleto ? [] : ['Jira: Campos']),
        ...(statusCompleto ? [] : ['Jira: Status']),
        ...(mapeamentoCompleto ? [] : ['Jira ↔ Toggl: Mapeamento']),
    ];

    return (
        <Card variant="outlined">
            <CardContent>
                <Stack spacing={2}>
                    <Stack direction="row" spacing={1}>
                        <Typography variant="h6" >Resumo da aplicação</Typography>
                        {configuracaoCompleta ? (
                            <Alert severity="success" sx={{ py: 0 }}>Relatório, Gant e Sprint estão liberados.</Alert>
                        ) : (
                            <Alert severity="warning" sx={{ py: 0 }}>
                                Complete as configurações obrigatórias para liberar Relatório, Gant e Sprint.
                                {pendenciasObrigatorias.length > 0 ? ` Pendente: ${listarPendencias(pendenciasObrigatorias)}.` : ''}
                            </Alert>
                        )}
                    </Stack>

                    {!carregado ? (
                        <EsqueletoCarregando />
                    ) : (
                        <>
                            <Stack direction="row" spacing={1} sx={{ mt: '0.25rem !important' }}>
                                <BotaoComCarregamento size="small" variant="outlined" onClick={expandirTodos}>
                                    Expandir tudo
                                </BotaoComCarregamento>
                                <BotaoComCarregamento size="small" variant="outlined" onClick={colapsarTodos}>
                                    Colapsar tudo
                                </BotaoComCarregamento>
                            </Stack>

                            <BlocoResumo
                                icone={<IconeStatus completo={existeUsuarioAdministrador} />}
                                titulo="Usuários do Toggl"
                                expandido={expandido('usuarios-toggl')}
                                onAlternarExpandido={() => alternar('usuarios-toggl')}
                                acao={<BotaoConfigurar titulo="Usuários do Toggl" onClick={() => onNavegar('toggl')} />}>
                                <Typography variant="body2" color="text.secondary">
                                    {quantidadeUsuarios} {quantidadeUsuarios === 1 ? 'Usuário cadastrado' : 'Usuários cadastrados'}
                                    {nomeAdministrador !== null ? ` — Administrador: ${nomeAdministrador}` : ''}
                                </Typography>
                                {!existeUsuarioAdministrador ? (
                                    <Alert severity="warning" sx={{ py: 0 }}>Nenhum usuário administrador definido.</Alert>
                                ) : undefined}
                            </BlocoResumo>

                            <BlocoResumo
                                icone={<IconeStatus completo={togglCompleto} />}
                                titulo="Toggl: Configurações"
                                expandido={expandido('toggl-config')}
                                onAlternarExpandido={() => alternar('toggl-config')}
                                acao={<BotaoConfigurar titulo="Toggl: Configurações" onClick={() => onNavegar('configuracoes', 'toggl')} />}>
                                <Typography variant="body2" color="text.secondary">
                                    Agrupamento: {rotularAgrupamento(categorias.agrupamento)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Tags para detalhar por descrição: {categorias.tagsDetalhadas.length > 0 ? categorias.tagsDetalhadas.join(', ') : '(nenhuma)'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Tags para identificar responsáveis (DEV / REV / QA): {categorias.dev.length}/{categorias.rev.length}/{categorias.qa.length}
                                </Typography>
                                {categorias.corTag ? (
                                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Cor da tag no Sprint:
                                        </Typography>
                                        <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: categorias.corTag, border: 1, borderColor: 'divider' }} />
                                    </Stack>
                                ) : undefined}
                                {!togglCompleto ? (
                                    <Alert severity="warning" sx={{ py: 0 }}>
                                        Faltam campos obrigatórios (Tags para detalhar por descrição e Tags para identificar responsáveis (DEV / REV / QA)).
                                    </Alert>
                                ) : undefined}
                            </BlocoResumo>

                            <BlocoResumo
                                icone={<IconeStatus completo={jiraConfigurado} />}
                                titulo="Jira: Conexão"
                                expandido={expandido('jira-conexao')}
                                onAlternarExpandido={() => alternar('jira-conexao')}
                                acao={<BotaoConfigurar titulo="Jira: Conexão" onClick={() => onNavegar('jira')} />}>
                                {jiraConfigurado ? (
                                    <>
                                        <Typography variant="body2" color="text.secondary">
                                            Domínio configurado: {jiraUrlDominio}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            E-mail: {jiraEmail}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {jiraQuadro !== null ? `Quadro de DEV: ${jiraQuadro}` : 'Quadro de DEV não configurado.'}
                                        </Typography>
                                    </>
                                ) : (
                                    <Alert severity="warning" sx={{ py: 0 }}>Jira não configurado.</Alert>
                                )}
                            </BlocoResumo>

                            <BlocoResumo
                                icone={<IconeStatus completo={jiraCamposCompleto} />}
                                titulo="Jira: Campos"
                                expandido={expandido('jira-campos')}
                                onAlternarExpandido={() => alternar('jira-campos')}
                                acao={<BotaoConfigurar titulo="Jira: Campos" onClick={() => onNavegar('configuracoes', 'jira-campos')} />}>
                                <Typography variant="body2" color="text.secondary">
                                    {quantidadeCamposJiraDefinidos} de {TOTAL_CAMPOS_JIRA} campos definidos — Estimativas de desenvolvimento, revisão e testes, "Revisado por", "Analisado por", "Time" e "Previsão de liberação"
                                </Typography>
                                {previsaoLiberacaoConfigurada ? (
                                    <Typography variant="body2" color="text.secondary">
                                        Alerta de prazo: laranja {janelaAlertaPrevisaoLiberacaoDias} dias antes do prazo, verde além disso
                                    </Typography>
                                ) : undefined}
                                {!jiraCamposCompleto ? (
                                    <Alert severity="warning" sx={{ py: 0 }}>
                                        Faltam campos obrigatórios (Estimativas de desenvolvimento, revisão e testes, "Revisado por", "Analisado por", "Time" e "Previsão de liberação").
                                    </Alert>
                                ) : undefined}
                            </BlocoResumo>

                            <BlocoResumo
                                icone={<IconeStatus completo={statusCompleto} />}
                                titulo="Jira: Status"
                                expandido={expandido('jira-status')}
                                onAlternarExpandido={() => alternar('jira-status')}
                                acao={<BotaoConfigurar titulo="Jira: Status" onClick={() => onNavegar('configuracoes', 'jira-status')} />}>
                                <Typography variant="body2" color="text.secondary">
                                    Status para identificar responsáveis (DEV / REV / QA): {responsabilidade.statusDev.length}/{responsabilidade.statusRev.length}/{responsabilidade.statusQa.length}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Status Concluído: {statusFinal.statusConcluido.length > 0 ? statusFinal.statusConcluido.join(', ') : '(nenhum)'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Status Ignorado: {statusFinal.statusIgnorado.length > 0 ? statusFinal.statusIgnorado.join(', ') : '(nenhum)'}
                                </Typography>
                                {!statusCompleto ? (
                                    <Alert severity="warning" sx={{ py: 0 }}>
                                        Faltam campos obrigatórios (Status para identificar responsáveis (DEV / REV / QA), Status Concluído e Status Ignorado).
                                    </Alert>
                                ) : undefined}
                            </BlocoResumo>

                            <BlocoResumo
                                icone={<IconeStatus completo />}
                                titulo="Jira: Cores"
                                expandido={expandido('jira-cores')}
                                onAlternarExpandido={() => alternar('jira-cores')}
                                acao={<BotaoConfigurar titulo="Jira: Cores" onClick={() => onNavegar('configuracoes', 'jira-cores')} />}>
                                <ListaCoresResumo
                                    quantidadeCoresStatus={quantidadeCoresStatus}
                                    quantidadeCoresPrioridade={quantidadeCoresPrioridade}
                                    quantidadeCoresColuna={quantidadeCoresColuna}
                                    quantidadeCoresTime={quantidadeCoresTime}
                                    quantidadeCoresEpico={quantidadeCoresEpico}
                                    coresStatus={coresStatus}
                                    coresPrioridade={coresPrioridade}
                                    coresColuna={coresColuna}
                                    coresTime={coresTime}
                                    coresEpico={coresEpico} />
                            </BlocoResumo>

                            <BlocoResumo
                                icone={<IconeStatus completo />}
                                titulo="Jira: Quadro"
                                expandido={expandido('jira-quadro')}
                                onAlternarExpandido={() => alternar('jira-quadro')}
                                acao={<BotaoConfigurar titulo="Jira: Quadro" onClick={() => onNavegar('configuracoes', 'jira-quadro')} />}>
                                <Typography variant="body2" color="text.secondary">
                                    {colunasOcultasPlanejamento.length === 0
                                        ? 'Nenhuma coluna oculta no Planejamento (opcional)'
                                        : `Colunas ocultas no Planejamento: ${colunasOcultasPlanejamento.join(', ')}`}
                                </Typography>
                            </BlocoResumo>

                            <BlocoResumo
                                icone={<IconeStatus completo={mapeamentoCompleto} />}
                                titulo="Jira ↔ Toggl: Mapeamento"
                                expandido={expandido('jira-mapeamento')}
                                onAlternarExpandido={() => alternar('jira-mapeamento')}
                                acao={<BotaoConfigurar titulo="Jira ↔ Toggl: Mapeamento" onClick={() => onNavegar('configuracoes', 'jira-toggl')} />}>
                                <Typography variant="body2" color="text.secondary">
                                    {quantidadeMapeamentosJira} {quantidadeMapeamentosJira === 1 ? 'usuário do Jira mapeado' : 'usuários do Jira mapeados'}
                                </Typography>
                                <ListaMapeamentoResumo mapeamento={mapeamentoJira} usuariosToggl={usuariosToggl} />
                                {!mapeamentoCompleto ? (
                                    <Alert severity="warning" sx={{ py: 0 }}>
                                        Faltam campos obrigatórios (todo usuário do Toggl precisa estar associado a um usuário do Jira
                                        {usuariosTogglSemMapeamento.length > 0
                                            ? `; sem par: ${usuariosTogglSemMapeamento.map((usuario) => usuario.nomeExibicao).join(', ')}`
                                            : ''}
                                        {entradasMapeamentoInvalidas.length > 0
                                            ? `; mapeamentos inválidos: ${entradasMapeamentoInvalidas.join(', ')}`
                                            : ''}).
                                    </Alert>
                                ) : undefined}
                            </BlocoResumo>
                        </>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
}