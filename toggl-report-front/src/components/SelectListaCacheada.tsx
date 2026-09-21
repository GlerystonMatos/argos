import type { ReactNode } from 'react';
import { ALTURA_CONTROLE } from '../theme';
import { useEffect, useState } from 'react';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNotificacao } from '../hooks/useNotificacao';
import { AutocompleteMultiCompacto } from './AutocompleteMultiCompacto';
import { Alert, IconButton, Stack, TextField, Tooltip } from '@mui/material';

export interface RespostaListaCacheada {
    itens: string[];
    veioDoCache: boolean;
    atualizadoEm: string;
}

interface SelectListaCacheadaProps {
    value: string[];
    onChange: (valor: string[]) => void;
    label: string;
    helperText?: string;
    excluir?: string[];
    disabled?: boolean;
    required?: boolean;
    error?: boolean;
    obterOpcoes: (forcarAtualizacao: boolean) => Promise<RespostaListaCacheada>;
}

export function SelectListaCacheada({ value, onChange, label, helperText, excluir = [], disabled, required, error, obterOpcoes }: SelectListaCacheadaProps): ReactNode {
    const [opcoes, setOpcoes] = useState<string[]>([]);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const { notificarSucesso } = useNotificacao();

    async function carregar(forcarAtualizacao: boolean): Promise<void> {
        setCarregando(true);
        setErro(null);
        try {
            const resposta = await obterOpcoes(forcarAtualizacao);
            setOpcoes(resposta.itens);
            if (forcarAtualizacao) {
                notificarSucesso('Lista atualizada com sucesso.');
            }
        } catch (erroRequisicao) {
            setErro(erroRequisicao instanceof Error ? erroRequisicao.message : 'Não foi possível carregar a lista.');
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        carregar(false).catch(() => { });
    }, []);

    const opcoesLivres = opcoes.filter((opcao) => !excluir.includes(opcao));
    const opcoesDisponiveis = [...opcoesLivres, ...value.filter((selecionado) => !opcoesLivres.includes(selecionado))];

    return (
        <Stack spacing={0.5}>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'flex-start' }}>
                <AutocompleteMultiCompacto
                    sx={{ flexGrow: 1, minWidth: 0 }}
                    options={opcoesDisponiveis}
                    value={value}
                    onChange={(_evento, novoValor) => onChange(novoValor)}
                    disabled={disabled || carregando}
                    loading={carregando}
                    renderInput={(parametros) => (
                        <TextField
                            {...parametros}
                            required={required}
                            error={error}
                            label={label}
                            placeholder={value.length === 0 ? 'Selecione' : undefined}
                            helperText={helperText} />
                    )} />
                <Tooltip title="Atualizar lista">
                    <span>
                        <IconButton
                            onClick={() => void carregar(true)}
                            disabled={disabled || carregando}
                            sx={{ width: ALTURA_CONTROLE, height: ALTURA_CONTROLE }}
                            aria-label="Atualizar lista">
                            <RefreshIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
            </Stack>
            {erro ? <Alert severity="warning">{erro}</Alert> : undefined}
        </Stack>
    );
}