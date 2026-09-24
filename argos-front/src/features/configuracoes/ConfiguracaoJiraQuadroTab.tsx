import type { ReactNode } from 'react';
import { Stack, Typography } from '@mui/material';
import { listarColunasJira } from '../../api/jiraListasApi';
import { useNotificacao } from '../../hooks/useNotificacao';
import { useQuadroPlanejamento } from './useQuadroPlanejamento';
import { SelectListaCacheada } from '../../components/SelectListaCacheada';
import { EsqueletoCarregando } from '../../components/EsqueletoCarregando';
import type { AbaConfiguracoesHandle, AbaConfiguracoesProps } from './abas';
import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import type { RespostaListaCacheada } from '../../components/SelectListaCacheada';

function obterOpcoesColunas(): (forcarAtualizacao: boolean) => Promise<RespostaListaCacheada> {
    return async (forcarAtualizacao) => {
        const resposta = await listarColunasJira(forcarAtualizacao);
        return {
            itens: resposta.nomes,
            veioDoCache: resposta.veioDoCache,
            atualizadoEm: resposta.atualizadoEm,
        };
    };
}

export const ConfiguracaoJiraQuadroTab = forwardRef<AbaConfiguracoesHandle, AbaConfiguracoesProps>(
    function ConfiguracaoJiraQuadroTab({ onAlterado, salvando = false }, ref): ReactNode {
        const { carregar, salvar, carregando, carregado, salvando: salvandoQuadro } = useQuadroPlanejamento();
        const { notificarErro, notificarSucesso } = useNotificacao();

        const [colunasOcultas, setColunasOcultas] = useState<string[]>([]);

        useEffect(() => {
            let cancelado = false;

            carregar()
                .then((dados) => {
                    if (!cancelado) setColunasOcultas(dados.colunasOcultas);
                })
                .catch((erro: unknown) => {
                    if (!cancelado) notificarErro(erro, 'Não foi possível carregar a configuração do quadro do Jira');
                });

            return () => {
                cancelado = true;
            };
        }, []);

        async function salvarAba(): Promise<boolean> {
            try {
                const atualizado = await salvar({ colunasOcultas });
                setColunasOcultas(atualizado.colunasOcultas);
                notificarSucesso('Configuração do quadro do Jira, salva com sucesso.');
                return true;
            } catch (erro) {
                notificarErro(erro, 'Não foi possível salvar a configuração do quadro do Jira');
                return false;
            }
        }

        useImperativeHandle(ref, () => ({ salvar: salvarAba }));

        if (!carregado) return <EsqueletoCarregando />;

        return (
            <Stack spacing={2}>
                <Stack spacing={0.5}>
                    <Typography variant="subtitle1">Colunas ocultas no Planejamento</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Colunas do quadro de DEV que não devem aparecer na tela de Planejamento (nem seus cartões nem
                        suas contagens de colaborador). Opcional — sem nada selecionado, todas as colunas aparecem.
                    </Typography>
                </Stack>

                <SelectListaCacheada
                    value={colunasOcultas}
                    onChange={(valor) => {
                        setColunasOcultas(valor);
                        onAlterado?.();
                    }}
                    disabled={carregando || salvando || salvandoQuadro}
                    label="Colunas ocultas"
                    obterOpcoes={obterOpcoesColunas()} />
            </Stack>
        );
    },
);
