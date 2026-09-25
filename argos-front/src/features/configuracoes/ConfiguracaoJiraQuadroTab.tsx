import type { ReactNode } from 'react';
import { Stack, Typography } from '@mui/material';
import type { TipoQuadroJira } from '../../api/tipos';
import { listarColunasJira } from '../../api/jiraListasApi';
import { useNotificacao } from '../../hooks/useNotificacao';
import { useQuadroPlanejamento } from './useQuadroPlanejamento';
import { SelectListaCacheada } from '../../components/SelectListaCacheada';
import { EsqueletoCarregando } from '../../components/EsqueletoCarregando';
import type { AbaConfiguracoesHandle, AbaConfiguracoesProps } from './abas';
import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import type { RespostaListaCacheada } from '../../components/SelectListaCacheada';

function obterOpcoesColunas(quadro: TipoQuadroJira): (forcarAtualizacao: boolean) => Promise<RespostaListaCacheada> {
    return async (forcarAtualizacao) => {
        const resposta = await listarColunasJira(quadro, forcarAtualizacao);
        return {
            itens: resposta.nomes,
            veioDoCache: resposta.veioDoCache,
            atualizadoEm: resposta.atualizadoEm,
        };
    };
}

const OPCOES_COLUNAS_DEV = obterOpcoesColunas('dev');
const OPCOES_COLUNAS_ANALISE = obterOpcoesColunas('analise');

export const ConfiguracaoJiraQuadroTab = forwardRef<AbaConfiguracoesHandle, AbaConfiguracoesProps>(
    function ConfiguracaoJiraQuadroTab({ onAlterado, salvando = false }, ref): ReactNode {
        const { carregar, salvar, carregando, carregado, salvando: salvandoQuadro } = useQuadroPlanejamento();
        const { notificarErro, notificarSucesso } = useNotificacao();

        const [colunasOcultasDev, setColunasOcultasDev] = useState<string[]>([]);
        const [colunasOcultasAnalise, setColunasOcultasAnalise] = useState<string[]>([]);

        useEffect(() => {
            let cancelado = false;

            carregar()
                .then((dados) => {
                    if (cancelado) return;
                    setColunasOcultasDev(dados.colunasOcultasDev);
                    setColunasOcultasAnalise(dados.colunasOcultasAnalise);
                })
                .catch((erro: unknown) => {
                    if (!cancelado) notificarErro(erro, 'Não foi possível carregar a configuração dos quadros do Jira');
                });

            return () => {
                cancelado = true;
            };
        }, [carregar, notificarErro]);

        async function salvarAba(): Promise<boolean> {
            try {
                const atualizado = await salvar({ colunasOcultasDev, colunasOcultasAnalise });
                setColunasOcultasDev(atualizado.colunasOcultasDev);
                setColunasOcultasAnalise(atualizado.colunasOcultasAnalise);
                notificarSucesso('Configuração dos quadros do Jira salva com sucesso.');
                return true;
            } catch (erro) {
                notificarErro(erro, 'Não foi possível salvar a configuração dos quadros do Jira');
                return false;
            }
        }

        useImperativeHandle(ref, () => ({ salvar: salvarAba }));

        if (!carregado) return <EsqueletoCarregando />;

        const desabilitado = carregando || salvando || salvandoQuadro;

        return (
            <Stack spacing={2}>
                <Stack spacing={0.5}>
                    <Typography variant="subtitle1">Colunas ocultas no Planejamento</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Colunas de cada quadro que não devem aparecer na tela de Planejamento (nem seus cartões nem
                        suas contagens de colaborador). Opcional — sem nada selecionado, todas as colunas aparecem.
                    </Typography>
                </Stack>

                <SelectListaCacheada
                    value={colunasOcultasDev}
                    onChange={(valor) => {
                        setColunasOcultasDev(valor);
                        onAlterado?.();
                    }}
                    disabled={desabilitado}
                    label="Colunas ocultas — quadro de DEV"
                    obterOpcoes={OPCOES_COLUNAS_DEV} />

                <SelectListaCacheada
                    value={colunasOcultasAnalise}
                    onChange={(valor) => {
                        setColunasOcultasAnalise(valor);
                        onAlterado?.();
                    }}
                    disabled={desabilitado}
                    label="Colunas ocultas — quadro de Análise"
                    obterOpcoes={OPCOES_COLUNAS_ANALISE} />
            </Stack>
        );
    },
);