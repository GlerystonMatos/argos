import type { ReactNode } from 'react';
import { togglObrigatorioCompleto } from './completude';
import { listarTagsToggl } from '../../api/tagsTogglApi';
import { useNotificacao } from '../../hooks/useNotificacao';
import { MapaCoresLista } from '../../components/MapaCoresLista';
import { useCategoriasSprint } from '../sprint/useCategoriasSprint';
import type { Agrupamento, CategoriasSprint } from '../../api/tipos';
import { Box, Alert, Stack, Divider, Typography } from '@mui/material';
import { SelectAgrupamento } from '../../components/SelectAgrupamento';
import { SelectListaCacheada } from '../../components/SelectListaCacheada';
import { EsqueletoCarregando } from '../../components/EsqueletoCarregando';
import type { AbaConfiguracoesHandle, AbaConfiguracoesProps } from './abas';
import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import type { RespostaListaCacheada } from '../../components/SelectListaCacheada';

async function obterOpcoesTags(forcarAtualizacao: boolean): Promise<RespostaListaCacheada> {
    const resposta = await listarTagsToggl(forcarAtualizacao);
    return { itens: resposta.tags, veioDoCache: resposta.veioDoCache, atualizadoEm: resposta.atualizadoEm };
}

export const ConfiguracaoTogglTab = forwardRef<AbaConfiguracoesHandle, AbaConfiguracoesProps>(
    function ConfiguracaoTogglTab({ onAlterado, onValidoChange, salvando = false }, ref): ReactNode {
        const { carregar, salvar, carregando, carregado, salvando: salvandoCategorias } = useCategoriasSprint();
        const { notificarErro, notificarSucesso } = useNotificacao();

        const [agrupamento, setAgrupamento] = useState<Agrupamento>('ambos');
        const [tagsDetalhadas, setTagsDetalhadas] = useState<string[]>([]);
        const [dev, setDev] = useState<string[]>([]);
        const [rev, setRev] = useState<string[]>([]);
        const [qa, setQa] = useState<string[]>([]);
        const [corTag, setCorTag] = useState<string>('');
        const [alterado, setAlterado] = useState(false);

        useEffect(() => {
            let cancelado = false;

            carregar()
                .then((dados: CategoriasSprint) => {
                    if (cancelado) return;
                    setAgrupamento(dados.agrupamento);
                    setTagsDetalhadas(dados.tagsDetalhadas);
                    setDev(dados.dev);
                    setRev(dados.rev);
                    setQa(dados.qa);
                    setCorTag(dados.corTag);
                })
                .catch((erro: unknown) => {
                    if (!cancelado) notificarErro(erro, 'Não foi possível carregar as configurações');
                });

            return () => {
                cancelado = true;
            };
        }, []);

        async function salvarAba(): Promise<boolean> {
            try {
                await salvar({ dev, rev, qa, agrupamento, tagsDetalhadas, corTag });
                notificarSucesso('Configuração de agrupamento e de tags do Toggl, salvos com sucesso.');
                return true;
            } catch (erro) {
                notificarErro(erro, 'Não foi possível salvar agrupamento e tags');
                return false;
            }
        }

        useImperativeHandle(ref, () => ({ salvar: salvarAba }));

        function alterando<T>(definir: (valor: T) => void): (valor: T) => void {
            return (valor) => {
                definir(valor);
                setAlterado(true);
                onAlterado?.();
            };
        }

        const mostraTagsDetalhadas = agrupamento === 'tag' || agrupamento === 'ambos';
        const togglCompleto = togglObrigatorioCompleto({ agrupamento, tagsDetalhadas, dev, rev, qa });

        useEffect(() => {
            onValidoChange?.(togglCompleto);
        }, [togglCompleto]);

        const erroTagsDetalhadas = alterado && tagsDetalhadas.length === 0;

        const bloqueado = carregando || salvando || salvandoCategorias;

        const tagsResponsaveis = [
            { label: 'Tags DEV', valor: dev, definir: setDev },
            { label: 'Tags REV', valor: rev, definir: setRev },
            { label: 'Tags QA', valor: qa, definir: setQa },
        ];

        if (!carregado) return <EsqueletoCarregando />;

        return (
            <Stack spacing={2}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <SelectAgrupamento value={agrupamento} onChange={alterando(setAgrupamento)} disabled={bloqueado} required />
                    </Box>
                    {mostraTagsDetalhadas ? (
                        <Box sx={{ flex: 2, minWidth: 0 }}>
                            <SelectListaCacheada
                                value={tagsDetalhadas}
                                onChange={alterando(setTagsDetalhadas)}
                                disabled={bloqueado}
                                label="Tags para detalhar por descrição"
                                required
                                error={erroTagsDetalhadas}
                                helperText={
                                    erroTagsDetalhadas
                                        ? 'Selecione ao menos uma tag.'
                                        : 'Tags nesta lista aparecem detalhadas por descrição, as demais ficam agrupadas por tag'
                                }
                                obterOpcoes={obterOpcoesTags} />
                        </Box>
                    ) : undefined}
                </Stack>

                <Divider />

                <Stack spacing={0.5}>
                    <Typography variant="subtitle1">Tags para identificar responsáveis (DEV / REV / QA)</Typography>
                </Stack>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    {tagsResponsaveis.map(({ label, valor, definir }) => (
                        <Box key={label} sx={{ flex: 1, minWidth: 0 }}>
                            <SelectListaCacheada
                                value={valor}
                                onChange={alterando(definir)}
                                disabled={bloqueado}
                                label={label}
                                required
                                error={alterado && valor.length === 0}
                                helperText={alterado && valor.length === 0 ? 'Selecione ao menos uma tag.' : undefined}
                                obterOpcoes={obterOpcoesTags} />
                        </Box>
                    ))}
                </Stack>

                <Divider />

                <Stack spacing={0.5}>
                    <Typography variant="subtitle1">Cor da tag no Sprint</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Cor usada no badge e nas labels de tag do acompanhamento do Sprint (linhas agrupadas por tag).
                    </Typography>
                </Stack>

                <MapaCoresLista
                    titulo="Cor da tag:"
                    nomes={['Tag']}
                    cores={{ Tag: corTag }}
                    disabled={bloqueado}
                    onChange={(_, cor) => {
                        setCorTag(cor);
                        onAlterado?.();
                    }} />

                {!togglCompleto ? (
                    <Alert severity="info">
                        Preencha Agrupamento, Tags para detalhar por descrição (quando aplicável) e Tags DEV/REV/QA para
                        liberar Relatório, Gant, Sprint e Planejamento.
                    </Alert>
                ) : undefined}
            </Stack>
        );
    },
);