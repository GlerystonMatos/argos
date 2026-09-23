import type { ReactNode } from 'react';
import { IconeAjuda } from './IconeAjuda';
import { ALTURA_CONTROLE } from '../theme';
import { useEffect, useState } from 'react';
import type { QuadroJira } from '../api/tipos';
import { rotularQuadroJira } from '../utils/rotulos';
import RefreshIcon from '@mui/icons-material/Refresh';
import { listarQuadrosJira } from '../api/jiraListasApi';
import { useNotificacao } from '../hooks/useNotificacao';

import {
    Box,
    Alert,
    Stack,
    Tooltip,
    TextField,
    IconButton,
    Autocomplete,
} from '@mui/material';

interface SelectQuadroJiraProps {
    value: QuadroJira | null;
    onChange: (valor: QuadroJira | null) => void;
    label: string;
    ajuda?: string;
    helperText?: string;
    disabled?: boolean;
    required?: boolean;
    error?: boolean;
}

export function SelectQuadroJira({ value, onChange, label, ajuda, helperText, disabled, required, error }: SelectQuadroJiraProps): ReactNode {
    const [quadros, setQuadros] = useState<QuadroJira[]>([]);
    const [carregando, setCarregando] = useState(false);
    const [erroListagem, setErroListagem] = useState<string | null>(null);
    const { notificarSucesso } = useNotificacao();

    async function carregar(forcarAtualizacao: boolean): Promise<void> {
        setCarregando(true);
        setErroListagem(null);
        try {
            const resposta = await listarQuadrosJira(forcarAtualizacao);
            setQuadros(resposta.quadros);
            if (forcarAtualizacao) {
                notificarSucesso('Lista atualizada com sucesso.');
            }
        } catch (erroRequisicao) {
            setErroListagem(erroRequisicao instanceof Error ? erroRequisicao.message : 'Não foi possível carregar os quadros.');
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        carregar(false).catch(() => { });
    }, []);

    const opcoes = value !== null && !quadros.some((quadro) => quadro.id === value.id) ? [value, ...quadros] : quadros;
    const selecionado = value !== null ? (opcoes.find((quadro) => quadro.id === value.id) ?? value) : null;

    function alterarIdManual(texto: string): void {
        const idTexto = texto.trim();
        if (idTexto === '') {
            onChange(null);
            return;
        }
        if (!/^\d+$/.test(idTexto)) return;
        const id = Number(idTexto);
        if (!Number.isSafeInteger(id) || id <= 0) return;
        onChange({ id, nome: '', projeto: null });
    }

    return (
        <Stack spacing={0.5} sx={{ mt: '0.5rem !important' }}>
            <Stack direction="row" spacing={0.25} sx={{ alignItems: 'flex-start' }}>
                {erroListagem === null ? (
                    <Autocomplete
                        sx={{ flexGrow: 1 }}
                        options={opcoes}
                        value={selecionado}
                        onChange={(_evento, novo) => onChange(novo)}
                        getOptionLabel={(quadro) => rotularQuadroJira(quadro.id, quadro.nome)}
                        isOptionEqualToValue={(a, b) => a.id === b.id}
                        disabled={disabled || carregando}
                        loading={carregando}
                        noOptionsText='Nenhum quadro Scrum encontrado. Clique em "Atualizar lista"'
                        renderInput={(parametros) => (
                            <TextField
                                {...parametros}
                                required={required}
                                error={error}
                                label={label}
                                placeholder="Selecione o quadro"
                                helperText={helperText} />
                        )} />
                ) : (
                    <TextField
                        sx={{ flexGrow: 1 }}
                        type="number"
                        required={required}
                        error={error}
                        label="ID do quadro"
                        value={value?.id ?? ''}
                        onChange={(evento) => alterarIdManual(evento.target.value)}
                        helperText={helperText}
                        slotProps={{ htmlInput: { min: 1 } }}
                        disabled={disabled} />
                )}
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
                {ajuda ? (
                    <Box sx={{ height: ALTURA_CONTROLE, display: 'flex', alignItems: 'center' }}>
                        <IconeAjuda titulo={ajuda} />
                    </Box>
                ) : undefined}
            </Stack>
            {erroListagem !== null ? (
                <Alert severity="warning">
                    {erroListagem} Informe o ID do quadro manualmente (o número na URL do quadro no Jira) ou tente atualizar a lista.
                </Alert>
            ) : undefined}
        </Stack>
    );
}