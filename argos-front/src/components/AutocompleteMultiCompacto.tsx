import type { ReactNode } from 'react';
import type { AutocompleteProps } from '@mui/material';
import { autocompleteClasses } from '@mui/material/Autocomplete';
import { Autocomplete, Box, Checkbox, Chip, Tooltip } from '@mui/material';

type AutocompleteMultiCompactoProps = Omit<
    AutocompleteProps<string, true, false, false>,
    'multiple' | 'renderValue' | 'renderOption' | 'renderTags' | 'limitTags' | 'filterSelectedOptions'
>;

export function AutocompleteMultiCompacto({ getOptionLabel, sx, options, value, ...outrasProps }: AutocompleteMultiCompactoProps): ReactNode {
    const selecionados = value ?? [];
    const rotular = (opcao: string): string => (getOptionLabel ? getOptionLabel(opcao) : opcao);

    return (
        <Autocomplete
            {...outrasProps}
            multiple
            disableCloseOnSelect
            options={options}
            value={selecionados}
            getOptionLabel={rotular}
            sx={[
                {
                    [`& .${autocompleteClasses.inputRoot}`]: { flexWrap: 'nowrap', overflow: 'hidden' },
                },
                ...(Array.isArray(sx) ? sx : [sx]),
            ]}
            renderOption={(propsOpcao, opcao, { selected }) => {
                const { key, ...restoPropsOpcao } = propsOpcao as typeof propsOpcao & { key: string };
                return (
                    <li key={key} {...restoPropsOpcao}>
                        <Checkbox size="small" checked={selected} tabIndex={-1} disableRipple sx={{ mr: 1, p: 0.25 }} />
                        {rotular(opcao)}
                    </li>
                );
            }}
            renderValue={(itens, obterPropsItem) => {
                const ocultos = itens.slice(1);
                const { key: chavePrimeiro, ...propsPrimeiro } = obterPropsItem({ index: 0 });
                return (
                    <>
                        <Chip
                            key={chavePrimeiro}
                            {...propsPrimeiro}
                            size="small"
                            label={rotular(itens[0])}
                            sx={{ minWidth: 0 }} />
                        {ocultos.length > 0 ? (
                            <Tooltip
                                title={
                                    <Box sx={{ whiteSpace: 'pre-line' }}>
                                        {itens.map(rotular).join('\n')}
                                    </Box>
                                }>
                                <Chip
                                    className={autocompleteClasses.tag}
                                    size="small"
                                    variant="outlined"
                                    label={`+${ocultos.length}`}
                                    aria-label={`Mais ${ocultos.length} selecionados: ${ocultos.map(rotular).join(', ')}`}
                                    sx={{ flexShrink: 0 }} />
                            </Tooltip>
                        ) : undefined}
                    </>
                );
            }} />
    );
}