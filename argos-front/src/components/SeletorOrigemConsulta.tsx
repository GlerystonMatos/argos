import type { ReactNode } from 'react';
import { ROTULO_OPCAO } from './origemConsulta';
import type { OrigemConsulta } from './origemConsulta';
import { Stack, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';

interface SeletorOrigemConsultaProps<T extends OrigemConsulta> {
    opcoes: readonly T[];
    valor: T;
    disabled?: boolean;
    descricao: ReactNode;
    onChange: (valor: T) => void;
}

export function SeletorOrigemConsulta<T extends OrigemConsulta>({
    opcoes,
    valor,
    disabled,
    descricao,
    onChange,
}: SeletorOrigemConsultaProps<T>): ReactNode {
    return (
        <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary">Forçar nova consulta em:</Typography>
            <ToggleButtonGroup
                size="small"
                exclusive
                value={valor}
                disabled={disabled}
                onChange={(_evento, novo: T | null) => {
                    if (novo) onChange(novo);
                }}>
                {opcoes.map((opcao) => (
                    <ToggleButton key={opcao} value={opcao}>{ROTULO_OPCAO[opcao]}</ToggleButton>
                ))}
            </ToggleButtonGroup>
            <Typography variant="caption" color="text.secondary">
                {descricao}
            </Typography>
        </Stack>
    );
}