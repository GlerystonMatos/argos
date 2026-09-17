import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNotificacao } from '../hooks/useNotificacao';
import { Alert, Autocomplete, IconButton, Stack, TextField, Tooltip } from '@mui/material';

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
    disabled?: boolean;
    obterOpcoes: (forcarAtualizacao: boolean) => Promise<RespostaListaCacheada>;
}

export function SelectListaCacheada({ value, onChange, label, helperText, disabled, obterOpcoes }: SelectListaCacheadaProps): ReactNode {
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
                notificarSucesso('Lista atualizada.');
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

    return (
        <Stack spacing={0.5}>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'flex-start' }}>
                <Autocomplete
                    sx={{ flexGrow: 1 }}
                    multiple
                    options={opcoes.filter((opcao) => !value.includes(opcao))}
                    value={value}
                    onChange={(_evento, novoValor) => onChange(novoValor)}
                    disabled={disabled || carregando}
                    loading={carregando}
                    renderInput={(parametros) => (
                        <TextField {...parametros} label={label} placeholder="Selecione" helperText={helperText} />
                    )} />
                <Tooltip title="Atualizar lista">
                    <span>
                        <IconButton
                            onClick={() => void carregar(true)}
                            disabled={disabled || carregando}
                            sx={{ mt: 1 }}
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