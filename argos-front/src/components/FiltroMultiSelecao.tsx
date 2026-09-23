import type { ReactNode } from 'react';
import { TextField } from '@mui/material';
import { AutocompleteMultiCompacto } from './AutocompleteMultiCompacto';

interface FiltroMultiSelecaoProps {
    label: string;
    placeholder?: string;
    helperText?: ReactNode;
    opcoes: string[];
    valor: string[];
    onChange: (valor: string[]) => void;
    getRotuloOpcao?: (opcao: string) => string;
}

export function FiltroMultiSelecao({ label, placeholder, helperText, opcoes, valor, onChange, getRotuloOpcao }: FiltroMultiSelecaoProps): ReactNode {
    return (
        <AutocompleteMultiCompacto
            options={opcoes}
            value={valor}
            getOptionKey={(opcao) => opcao}
            getOptionLabel={getRotuloOpcao}
            onChange={(_evento, novoValor) => onChange(novoValor)}
            sx={{ minWidth: { xs: 0, sm: 200 }, flex: 1 }}
            renderInput={(parametros) => (
                <TextField {...parametros} label={label} placeholder={valor.length === 0 ? placeholder : undefined} helperText={helperText} />
            )} />
    );
}