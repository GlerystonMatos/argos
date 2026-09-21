import type { ReactNode } from 'react';
import type { Agrupamento } from '../api/tipos';
import { MenuItem, TextField } from '@mui/material';
import { OPCOES_AGRUPAMENTO } from '../utils/rotulos';

interface SelectAgrupamentoProps {
    value: Agrupamento;
    onChange: (valor: Agrupamento) => void;
    disabled?: boolean;
    required?: boolean;
}

export function SelectAgrupamento({ value, onChange, disabled, required }: SelectAgrupamentoProps): ReactNode {
    return (
        <TextField
            select
            required={required}
            label="Agrupamento"
            value={value}
            onChange={(evento) => onChange(evento.target.value as Agrupamento)}
            disabled={disabled}
            fullWidth>
            {OPCOES_AGRUPAMENTO.map((opcao) => (
                <MenuItem key={opcao.valor} value={opcao.valor}>
                    {opcao.rotulo}
                </MenuItem>
            ))}
        </TextField>
    );
}