import type { ReactNode } from 'react';
import { useConfiguracaoJira } from './useConfiguracaoJira';
import { useNotificacao } from '../../hooks/useNotificacao';
import type { CampoJira, ConfiguracaoJira } from '../../api/tipos';
import { BotaoComCarregamento } from '../../components/BotaoComCarregamento';
import { Alert, Stack, TextField, Typography, Autocomplete } from '@mui/material';
import { useEffect, useMemo, useState, forwardRef, useImperativeHandle } from 'react';

type ChaveCampo = 'desenvolvimento' | 'revisao' | 'testes' | 'revisadoPor';

type SelecaoCampos = Record<ChaveCampo, CampoJira | null>;

const SELECAO_VAZIA: SelecaoCampos = { desenvolvimento: null, revisao: null, testes: null, revisadoPor: null };

function campoSalvo(id: string, nome: string): CampoJira | null {
    return id ? { id, nome } : null;
}

function selecaoDaConfiguracao(dados: ConfiguracaoJira): SelecaoCampos {
    return {
        desenvolvimento: campoSalvo(dados.campoEstimativaDesenvolvimentoId, dados.campoEstimativaDesenvolvimentoNome),
        revisao: campoSalvo(dados.campoEstimativaRevisaoId, dados.campoEstimativaRevisaoNome),
        testes: campoSalvo(dados.campoEstimativaTestesId, dados.campoEstimativaTestesNome),
        revisadoPor: campoSalvo(dados.campoRevisadoPorId, dados.campoRevisadoPorNome),
    };
}

function conexaoPreenchida(dados: ConfiguracaoJira): boolean {
    return dados.urlDominio.trim() !== '' && dados.email.trim() !== '';
}

interface SelectCampoJiraProps {
    label: string;
    valor: CampoJira | null;
    opcoes: CampoJira[];
    disabled: boolean;
    onChange: (valor: CampoJira | null) => void;
}

function SelectCampoJira({ label, valor, opcoes, disabled, onChange }: SelectCampoJiraProps): ReactNode {
    return (
        <Autocomplete
            sx={{ flexGrow: 1 }}
            options={opcoes}
            value={valor}
            onChange={(_, novo) => onChange(novo)}
            getOptionLabel={(campo) => campo.nome}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            disabled={disabled}
            noOptionsText='Clique em "Buscar campos" para listar os campos customizados do Jira'
            renderInput={(params) => (
                <TextField {...params} label={label} placeholder="Selecione o campo customizado" />
            )} />
    );
}

interface JiraCamposPanelProps {
    onAlterado?: () => void;
}

export interface JiraCamposPanelHandle {
    salvar: () => Promise<boolean>;
}

export const JiraCamposPanel = forwardRef<JiraCamposPanelHandle, JiraCamposPanelProps>(
    function JiraCamposPanel({ onAlterado }, ref): ReactNode {
        const { carregando, carregar, salvarParcial, listarCampos } = useConfiguracaoJira();
        const { notificarErro, notificarSucesso } = useNotificacao();

        const [selecao, setSelecao] = useState<SelecaoCampos>(SELECAO_VAZIA);
        const [campos, setCampos] = useState<CampoJira[]>([]);
        const [buscandoCampos, setBuscandoCampos] = useState(false);
        const [conexaoSalva, setConexaoSalva] = useState<boolean | null>(null);

        useEffect(() => {
            carregar()
                .then((dados) => {
                    setSelecao(selecaoDaConfiguracao(dados));
                    setConexaoSalva(conexaoPreenchida(dados));
                })
                .catch((erro: unknown) => notificarErro(erro, 'Não foi possível carregar a configuração do Jira'));
        }, []);

        const opcoes = useMemo(() => {
            const selecionados = Object.values(selecao).filter(
                (campo): campo is CampoJira => campo !== null && !campos.some((existente) => existente.id === campo.id),
            );
            return [...campos, ...selecionados];
        }, [campos, selecao]);

        function alterarCampo(chave: ChaveCampo, valor: CampoJira | null): void {
            setSelecao((atual) => ({ ...atual, [chave]: valor }));
            onAlterado?.();
        }

        async function buscarCampos(): Promise<void> {
            setBuscandoCampos(true);
            try {
                const lista = await listarCampos();
                setCampos(lista);
                if (lista.length === 0) {
                    notificarErro(new Error('Nenhum campo customizado foi encontrado no Jira.'));
                }
            } catch (erro) {
                notificarErro(erro, 'Não foi possível buscar os campos do Jira');
            } finally {
                setBuscandoCampos(false);
            }
        }

        async function salvar(): Promise<boolean> {
            try {
                const atualizado = await salvarParcial({
                    campoEstimativaDesenvolvimentoId: selecao.desenvolvimento?.id ?? '',
                    campoEstimativaDesenvolvimentoNome: selecao.desenvolvimento?.nome ?? '',
                    campoEstimativaRevisaoId: selecao.revisao?.id ?? '',
                    campoEstimativaRevisaoNome: selecao.revisao?.nome ?? '',
                    campoEstimativaTestesId: selecao.testes?.id ?? '',
                    campoEstimativaTestesNome: selecao.testes?.nome ?? '',
                    campoRevisadoPorId: selecao.revisadoPor?.id ?? '',
                    campoRevisadoPorNome: selecao.revisadoPor?.nome ?? '',
                });
                setConexaoSalva(conexaoPreenchida(atualizado));
                notificarSucesso('Campos personalizados do Jira salvos.');
                return true;
            } catch (erro) {
                notificarErro(erro, 'Não foi possível salvar os campos personalizados do Jira');
                return false;
            }
        }

        useImperativeHandle(ref, () => ({ salvar }));

        return (
            <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                    Campos customizados do Jira usados pelo Sprint: cada estimativa alimenta o PRE do
                    grupo correspondente (Desenvolvimento/Revisão/Testes). <br />"Revisado por" alimenta o
                    fallback automático de colaborador. Todos são opcionais e configuráveis
                    independentemente.
                </Typography>

                {conexaoSalva === false ? (
                    <Alert severity="info">
                        Salve a conexão com o Jira (URL do domínio, e-mail e API Token) na seção Jira antes de buscar os campos.
                    </Alert>
                ) : undefined}

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <SelectCampoJira
                        label="Estimativa do desenvolvimento"
                        valor={selecao.desenvolvimento}
                        opcoes={opcoes}
                        disabled={carregando}
                        onChange={(valor) => alterarCampo('desenvolvimento', valor)} />
                    <SelectCampoJira
                        label="Estimativa da revisão"
                        valor={selecao.revisao}
                        opcoes={opcoes}
                        disabled={carregando}
                        onChange={(valor) => alterarCampo('revisao', valor)} />
                    <SelectCampoJira
                        label="Estimativa dos testes"
                        valor={selecao.testes}
                        opcoes={opcoes}
                        disabled={carregando}
                        onChange={(valor) => alterarCampo('testes', valor)} />
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
                    <SelectCampoJira
                        label="Revisado por"
                        valor={selecao.revisadoPor}
                        opcoes={opcoes}
                        disabled={carregando}
                        onChange={(valor) => alterarCampo('revisadoPor', valor)} />
                    <BotaoComCarregamento
                        variant="outlined"
                        carregando={buscandoCampos}
                        disabled={conexaoSalva !== true || carregando}
                        onClick={() => void buscarCampos()}>
                        Buscar campos
                    </BotaoComCarregamento>
                </Stack>
            </Stack>
        );
    },
);