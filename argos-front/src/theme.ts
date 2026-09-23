import { createTheme } from '@mui/material/styles';

export const CORES = {
    baseBranco: '#FFFFFF',
    navbarFundo: '#2B2B68',
    fundoClaro: '#FCFCFF',
    textoEscuro: '#050510',
    bordaCinza: '#E2E8F0',
    creme: '#FCFCFF',
    accentAzul: '#0056D2',
    accentRoxo: '#6F1EEB',
    accentMoonGold: '#F7EAB2',
    corPendente: '#DC4848',
    corConcluido: '#46A046',
    corPrazoProximo: '#F08C20',
    corIndisponivel: '#9E9E9E',
    corPrioridadeMuitoAlta: '#B01C20',
    corPrioridadeAlta: '#DC4848',
    corPrioridadeMedia: '#F08C20',
    corPrioridadeBaixa: '#0056D2',
    corPrioridadeMuitoBaixa: '#88D5FC',
} as const;

export const ALTURA_CONTROLE = 40;

export const tema = createTheme({
    palette: {
        mode: 'light',
        primary: { main: CORES.navbarFundo, contrastText: CORES.creme },
        secondary: { main: CORES.accentRoxo },
        success: { main: CORES.accentMoonGold, contrastText: CORES.textoEscuro },
        warning: { main: CORES.accentRoxo },
        info: { main: CORES.accentAzul },
        background: { default: CORES.fundoClaro, paper: CORES.baseBranco },
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
                        borderColor: CORES.navbarFundo,
                    },
                },
            },
        },
        MuiFormControl: {
            defaultProps: { size: 'small' },
            styleOverrides: {
                root: {
                    '&:hover .MuiInputLabel-root:not(.Mui-disabled):not(.Mui-error)': {
                        color: CORES.navbarFundo,
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
                    borderColor: CORES.navbarFundo,
                    backgroundColor: 'transparent',
                    color: CORES.navbarFundo,
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