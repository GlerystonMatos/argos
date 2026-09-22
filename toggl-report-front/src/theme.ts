import { createTheme } from '@mui/material/styles';

export const CORES = {
    navbarFundo: '#1A1A32',
    fundoClaro: '#F8F9FA',
    textoEscuro: '#121216',
    bordaCinza: '#d4d2d2',
    accentAzul: '#5B82F6',
    accentAzulEscuro: '#4B65F6',
    accentMoonGold: '#F5DFA0',
    accentRoxo: '#9A669F',
    creme: '#F8F9FA',
    corPendente: '#EA4335',
    corConcluido: '#34A853',
    corPrazoProximo: '#F57C00',
    corPrioridadeMuitoAlta: '#B71C1C',
    corPrioridadeAlta: '#EA4335',
    corPrioridadeMedia: '#F57C00',
    corPrioridadeBaixa: '#5B82F6',
    corPrioridadeMuitoBaixa: '#A9C4FB',
    corIndisponivel: '#9E9E9E',
    corTagBadge: '#CD7FC2',
} as const;

export const ALTURA_CONTROLE = 40;

export const tema = createTheme({
    palette: {
        mode: 'light',
        primary: { main: CORES.accentAzul, dark: CORES.accentAzulEscuro, contrastText: CORES.creme },
        secondary: { main: CORES.accentRoxo },
        success: { main: CORES.accentMoonGold, contrastText: CORES.textoEscuro },
        warning: { main: CORES.accentRoxo },
        info: { main: CORES.accentAzul },
        background: { default: CORES.fundoClaro, paper: '#FFFFFF' },
        text: { primary: CORES.textoEscuro },
    },
    shape: { borderRadius: 8 },
    components: {
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: CORES.navbarFundo,
                    color: CORES.creme,
                },
            },
        },
        MuiToolbar: {
            styleOverrides: {
                root: {
                    paddingLeft: 8,
                    paddingRight: 8,
                    '@media (min-width:600px)': {
                        paddingLeft: 12,
                        paddingRight: 12,
                    },
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    padding: '6px 8px',
                },
            },
        },
        MuiTextField: { defaultProps: { size: 'small' } },
        MuiSelect: { defaultProps: { size: 'small' } },
        MuiAutocomplete: { defaultProps: { size: 'small' } },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    '&:hover:not(.Mui-disabled):not(.Mui-focused) .MuiOutlinedInput-notchedOutline': {
                        borderColor: CORES.accentAzul,
                    },
                },
            },
        },
        MuiFormControl: {
            defaultProps: { size: 'small' },
            styleOverrides: {
                root: {
                    '&:hover .MuiInputLabel-root:not(.Mui-disabled):not(.Mui-error)': {
                        color: CORES.accentAzul,
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    border: `1px solid ${CORES.bordaCinza}`,
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                sizeMedium: {
                    minHeight: ALTURA_CONTROLE,
                },
                outlined: {
                    borderColor: CORES.accentAzul,
                    backgroundColor: 'transparent',
                    color: CORES.accentAzul,
                },
            },
        },
        MuiToggleButton: {
            styleOverrides: {
                sizeSmall: {
                    height: ALTURA_CONTROLE,
                    paddingTop: 0,
                    paddingBottom: 0,
                },
            },
        },
    },
});