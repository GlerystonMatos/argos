import type { ReactNode } from 'react';
import { listarStatusJira } from '../../api/jiraListasApi';
import { useNotificacao } from '../../hooks/useNotificacao';
import { useStatusFinalSprint } from '../sprint/useStatusFinalSprint';
import { Box, Alert, Stack, Divider, Typography } from '@mui/material';
import { SelectListaCacheada } from '../../components/SelectListaCacheada';
import { EsqueletoCarregando } from '../../components/EsqueletoCarregando';
import type { AbaConfiguracoesHandle, AbaConfiguracoesProps } from './abas';
import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { statusFinalCompleto, statusResponsavelCompleto } from './completude';
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

export const ConfiguracaoJiraStatusTab = forwardRef<AbaConfiguracoesHandle, AbaConfiguracoesProps>(
    function ConfiguracaoJiraStatusTab({ onAlterado, onValidoChange, salvando = false }, ref): ReactNode {
        const {
            carregar: carregarResponsabilidade,
            salvar: salvarResponsabilidade,
            carregando: carregandoResponsabilidade,
            carregado: responsabilidadeCarregada,
            salvando: salvandoResponsabilidade,
        } = useResponsabilidadeSprint();

        const {
            carregar: carregarStatusFinal,
            salvar: salvarStatusFinal,
            carregando: carregandoStatusFinal,
            carregado: statusFinalCarregado,
            salvando: salvandoStatusFinal,
        } = useStatusFinalSprint();

        const { notificarErro, notificarSucesso } = useNotificacao();

        const [statusDev, setStatusDev] = useState<string[]>([]);
        const [statusRev, setStatusRev] = useState<string[]>([]);
        const [statusQa, setStatusQa] = useState<string[]>([]);
        const [statusConcluido, setStatusConcluido] = useState<string[]>([]);
        const [statusIgnorado, setStatusIgnorado] = useState<string[]>([]);
        const [alterado, setAlterado] = useState(false);

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
            if (sucesso) notificarSucesso('Configuração de status do Jira, salva com sucesso.');
            return sucesso;
        }

        useImperativeHandle(ref, () => ({ salvar: salvarAba }));

        function alterando<T>(definir: (valor: T) => void): (valor: T) => void {
            return (valor) => {
                definir(valor);
                setAlterado(true);
                onAlterado?.();
            };
        }

        const bloqueado = carregandoResponsabilidade || carregandoStatusFinal || salvando || salvandoResponsabilidade || salvandoStatusFinal;
        const responsaveisCompletos = statusResponsavelCompleto({ statusDev, statusRev, statusQa });
        const finalCompleto = statusFinalCompleto({ statusConcluido, statusIgnorado });
        const statusValido = responsaveisCompletos && finalCompleto;

        useEffect(() => {
            onValidoChange?.(statusValido);
        }, [statusValido]);

        function propsObrigatorio(valor: string[]): { required: true; error: boolean; helperText: string | undefined } {
            const erro = alterado && valor.length === 0;
            return { required: true, error: erro, helperText: erro ? 'Selecione ao menos um status.' : undefined };
        }

        const statusResponsaveis = [
            { label: 'Status DEV', valor: statusDev, definir: setStatusDev },
            { label: 'Status REV', valor: statusRev, definir: setStatusRev },
            { label: 'Status QA', valor: statusQa, definir: setStatusQa },
        ];

        if (!responsabilidadeCarregada || !statusFinalCarregado) return <EsqueletoCarregando />;

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
                                disabled={bloqueado}
                                label={label}
                                {...propsObrigatorio(valor)}
                                obterOpcoes={obterOpcoesStatus()} />
                        </Box>
                    ))}
                </Stack>

                <Divider />

                <Stack spacing={0.5}>
                    <Typography variant="subtitle1">Status finais (para os totalizadores do Sprint)</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Define quais status do Jira contam como "Concluído" e quais são ignorados nos totalizadores do cabeçalho do
                        Sprint (as duas listas são obrigatórias). Um status marcado numa lista some das opções da outra até ser desmarcado.
                    </Typography>
                </Stack>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <SelectListaCacheada
                            value={statusConcluido}
                            onChange={alterando(setStatusConcluido)}
                            disabled={bloqueado}
                            label="Status Concluído"
                            {...propsObrigatorio(statusConcluido)}
                            excluir={statusIgnorado}
                            obterOpcoes={obterOpcoesStatus()} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <SelectListaCacheada
                            value={statusIgnorado}
                            onChange={alterando(setStatusIgnorado)}
                            disabled={bloqueado}
                            label="Status Ignorado"
                            {...propsObrigatorio(statusIgnorado)}
                            excluir={statusConcluido}
                            obterOpcoes={obterOpcoesStatus()} />
                    </Box>
                </Stack>

                {!statusValido ? (
                    <Alert severity="info">
                        Preencha os Status para identificar responsáveis (DEV / REV / QA), Status Concluído e Status Ignorado
                        para liberar Relatório, Gant, Sprint e Planejamento.
                    </Alert>
                ) : undefined}
            </Stack>
        );
    },
);