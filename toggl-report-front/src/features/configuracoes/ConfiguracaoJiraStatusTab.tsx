import type { ReactNode } from 'react';
import type { AbaConfiguracoesHandle } from './abas';
import { statusResponsavelCompleto } from './completude';
import { listarStatusJira } from '../../api/jiraListasApi';
import { useNotificacao } from '../../hooks/useNotificacao';
import { useStatusFinalSprint } from '../sprint/useStatusFinalSprint';
import { Box, Alert, Stack, Divider, Typography } from '@mui/material';
import { SelectListaCacheada } from '../../components/SelectListaCacheada';
import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { useResponsabilidadeSprint } from '../sprint/useResponsabilidadeSprint';
import type { RespostaListaCacheada } from '../../components/SelectListaCacheada';

function obterOpcoesStatus(): (forcarAtualizacao: boolean) => Promise<RespostaListaCacheada> {
    return async (forcarAtualizacao) => {
        const resposta = await listarStatusJira(forcarAtualizacao);
        return {
            itens: resposta.nomes,
            veioDoCache: resposta.veioDoCache,
            atualizadoEm: resposta.atualizadoEm,
        };
    };
}

interface ConfiguracaoJiraStatusTabProps {
    onAlterado: () => void;
}

export const ConfiguracaoJiraStatusTab = forwardRef<AbaConfiguracoesHandle, ConfiguracaoJiraStatusTabProps>(
    function ConfiguracaoJiraStatusTab({ onAlterado }, ref): ReactNode {
        const {
            carregar: carregarResponsabilidade,
            salvar: salvarResponsabilidade,
            carregando: carregandoResponsabilidade,
        } = useResponsabilidadeSprint();

        const {
            carregar: carregarStatusFinal,
            salvar: salvarStatusFinal,
            carregando: carregandoStatusFinal,
        } = useStatusFinalSprint();

        const { notificarErro, notificarSucesso } = useNotificacao();

        const [statusDev, setStatusDev] = useState<string[]>([]);
        const [statusRev, setStatusRev] = useState<string[]>([]);
        const [statusQa, setStatusQa] = useState<string[]>([]);
        const [statusConcluido, setStatusConcluido] = useState<string[]>([]);
        const [statusIgnorado, setStatusIgnorado] = useState<string[]>([]);

        useEffect(() => {
            let cancelado = false;

            carregarResponsabilidade()
                .then((dados) => {
                    if (cancelado) return;
                    setStatusDev(dados.statusDev);
                    setStatusRev(dados.statusRev);
                    setStatusQa(dados.statusQa);
                })
                .catch((erro: unknown) => {
                    if (!cancelado) notificarErro(erro, 'Não foi possível carregar o status por responsável');
                });

            carregarStatusFinal()
                .then((dados) => {
                    if (cancelado) return;
                    setStatusConcluido(dados.statusConcluido);
                    setStatusIgnorado(dados.statusIgnorado);
                })
                .catch((erro: unknown) => {
                    if (!cancelado) notificarErro(erro, 'Não foi possível carregar os status finais');
                });

            return () => {
                cancelado = true;
            };
        }, []);

        async function salvarStatusResponsaveis(): Promise<boolean> {
            try {
                await salvarResponsabilidade({ statusDev, statusRev, statusQa });
                return true;
            } catch (erro) {
                notificarErro(erro, 'Não foi possível salvar o status por responsável');
                return false;
            }
        }

        async function salvarStatusFinalConfigurado(): Promise<boolean> {
            try {
                await salvarStatusFinal({ statusConcluido, statusIgnorado });
                return true;
            } catch (erro) {
                notificarErro(erro, 'Não foi possível salvar os status finais');
                return false;
            }
        }

        async function salvarAba(): Promise<boolean> {
            const [statusOk, statusFinalOk] = await Promise.all([
                salvarStatusResponsaveis(),
                salvarStatusFinalConfigurado(),
            ]);
            const sucesso = statusOk && statusFinalOk;
            if (sucesso) notificarSucesso('Status do Jira salvos.');
            return sucesso;
        }

        useImperativeHandle(ref, () => ({ salvar: salvarAba }));

        function alterando<T>(definir: (valor: T) => void): (valor: T) => void {
            return (valor) => {
                definir(valor);
                onAlterado();
            };
        }

        const carregando = carregandoResponsabilidade || carregandoStatusFinal;

        const statusResponsaveis = [
            { label: 'Status DEV', valor: statusDev, definir: setStatusDev },
            { label: 'Status REV', valor: statusRev, definir: setStatusRev },
            { label: 'Status QA', valor: statusQa, definir: setStatusQa },
        ];

        return (
            <Stack spacing={2}>
                <Stack spacing={0.5}>
                    <Typography variant="subtitle1">Status para identificar responsáveis (DEV / REV / QA)</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Define, para cada tarefa integrada ao Jira, qual grupo é o responsável — esse grupo aparece
                        como "Pendente" e os demais como "Concluído" no acompanhamento do Sprint.
                    </Typography>
                </Stack>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    {statusResponsaveis.map(({ label, valor, definir }) => (
                        <Box key={label} sx={{ flex: 1, minWidth: 0 }}>
                            <SelectListaCacheada
                                value={valor}
                                onChange={alterando(definir)}
                                disabled={carregando}
                                label={label}
                                obterOpcoes={obterOpcoesStatus()} />
                        </Box>
                    ))}
                </Stack>

                <Divider />

                <Stack spacing={0.5}>
                    <Typography variant="subtitle1">Status finais (para os totalizadores do Sprint)</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Define quais status do Jira contam como "Concluído" e quais são ignorados nos totalizadores do cabeçalho do
                        Sprint. Um status marcado numa lista some das opções da outra até ser desmarcado.
                    </Typography>
                </Stack>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <SelectListaCacheada
                            value={statusConcluido}
                            onChange={alterando(setStatusConcluido)}
                            disabled={carregando}
                            label="Status Concluído"
                            excluir={statusIgnorado}
                            obterOpcoes={obterOpcoesStatus()} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <SelectListaCacheada
                            value={statusIgnorado}
                            onChange={alterando(setStatusIgnorado)}
                            disabled={carregando}
                            label="Status Ignorado"
                            excluir={statusConcluido}
                            obterOpcoes={obterOpcoesStatus()} />
                    </Box>
                </Stack>

                {!statusResponsavelCompleto({ statusDev, statusRev, statusQa }) ? (
                    <Alert severity="info">
                        Preencha os Status para identificar responsáveis (DEV / REV / QA) para liberar Relatório, Gant e Sprint.
                    </Alert>
                ) : undefined}
            </Stack>
        );
    },
);