import type { ReactNode } from 'react';
import { ALTURA_CONTROLE } from '../theme';
import TuneIcon from '@mui/icons-material/TuneOutlined';
import TimerIcon from '@mui/icons-material/TimerOutlined';
import SpeedIcon from '@mui/icons-material/SpeedOutlined';
import BackupIcon from '@mui/icons-material/BackupOutlined';
import AssignmentIcon from '@mui/icons-material/AssignmentOutlined';
import AssessmentIcon from '@mui/icons-material/AssessmentOutlined';
import ViewKanbanIcon from '@mui/icons-material/ViewKanbanOutlined';
import ViewTimelineIcon from '@mui/icons-material/ViewTimelineOutlined';

import {
    Box,
    List,
    Drawer,
    Tooltip,
    ListItemIcon,
    ListItemText,
    ListSubheader,
    ListItemButton,
} from '@mui/material';

export type Secao = 'resumo' | 'toggl' | 'jira' | 'configuracoes' | 'relatorio' | 'gant' | 'sprint' | 'planejamento' | 'dados';

interface ItemMenu {
    secao: Exclude<Secao, 'resumo'>;
    rotulo: string;
    icone: ReactNode;
    exigeConfiguracaoCompleta?: boolean;
}

interface GrupoMenu {
    titulo: string;
    itens: readonly ItemMenu[];
}

const GRUPOS_MENU: readonly GrupoMenu[] = [
    {
        titulo: 'Visualizações',
        itens: [
            { secao: 'relatorio', rotulo: 'Relatório', icone: <AssessmentIcon />, exigeConfiguracaoCompleta: true },
            { secao: 'gant', rotulo: 'Gant', icone: <ViewTimelineIcon />, exigeConfiguracaoCompleta: true },
        ],
    },
    {
        titulo: 'Sprint',
        itens: [
            { secao: 'sprint', rotulo: 'Acompanhamento', icone: <SpeedIcon />, exigeConfiguracaoCompleta: true },
            { secao: 'planejamento', rotulo: 'Planejamento', icone: <ViewKanbanIcon />, exigeConfiguracaoCompleta: true },
        ],
    },
    {
        titulo: 'Configuração',
        itens: [
            { secao: 'toggl', rotulo: 'Toggl', icone: <TimerIcon /> },
            { secao: 'jira', rotulo: 'Jira', icone: <AssignmentIcon /> },
            { secao: 'configuracoes', rotulo: 'Configurações', icone: <TuneIcon /> },
            { secao: 'dados', rotulo: 'Dados', icone: <BackupIcon /> },
        ],
    },
];

const LARGURA_MENU = 200;
const AVISO_CONFIGURACAO_INCOMPLETA = 'Complete as configurações obrigatórias para liberar esta seção.';

interface MenuLateralProps {
    secaoAtiva: Secao;
    configuracaoCompleta: boolean;
    mobileAberto: boolean;
    visivelDesktop: boolean;
    onSelecionar: (secao: Secao) => void;
    onFecharMobile: () => void;
}

export function MenuLateral({
    secaoAtiva,
    configuracaoCompleta,
    mobileAberto,
    visivelDesktop,
    onSelecionar,
    onFecharMobile,
}: MenuLateralProps): ReactNode {
    const lista = (
        <Box component="nav" aria-label="Navegação principal" sx={{ py: 0.5 }}>
            {GRUPOS_MENU.map((grupo) => (
                <List
                    key={grupo.titulo}
                    dense
                    aria-label={grupo.titulo}
                    subheader={
                        <ListSubheader
                            disableSticky
                            sx={{ lineHeight: 2.5, mt: 0.5, fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.secondary', bgcolor: 'transparent' }}>
                            {grupo.titulo}
                        </ListSubheader>
                    }
                    sx={{ py: 0 }}>
                    {grupo.itens.map((item) => {
                        const bloqueado = item.exigeConfiguracaoCompleta === true && !configuracaoCompleta;
                        return (
                            <Tooltip
                                key={item.secao}
                                title={bloqueado ? AVISO_CONFIGURACAO_INCOMPLETA : ''}
                                placement="right">
                                <Box component="span" sx={{ display: 'block' }}>
                                    <ListItemButton
                                        selected={secaoAtiva === item.secao}
                                        disabled={bloqueado}
                                        onClick={() => onSelecionar(item.secao)}
                                        sx={{ minHeight: ALTURA_CONTROLE }}>
                                        <ListItemIcon sx={{ minWidth: 32 }}>{item.icone}</ListItemIcon>
                                        <ListItemText primary={item.rotulo} slotProps={{ primary: { variant: 'body1' } }} />
                                    </ListItemButton>
                                </Box>
                            </Tooltip>
                        );
                    })}
                </List>
            ))}
        </Box>
    );

    return (
        <>
            <Drawer
                variant="permanent"
                sx={(tema) => ({
                    display: { xs: 'none', md: 'block' },
                    width: visivelDesktop ? LARGURA_MENU : 0,
                    flexShrink: 0,
                    overflow: 'clip',
                    visibility: visivelDesktop ? 'visible' : 'hidden',
                    bgcolor: 'background.paper',
                    borderRight: visivelDesktop ? 1 : 0,
                    borderColor: 'divider',
                    transition: tema.transitions.create(['width', 'border-right-width', 'visibility'], {
                        easing: tema.transitions.easing.sharp,
                        duration: visivelDesktop
                            ? tema.transitions.duration.enteringScreen
                            : tema.transitions.duration.leavingScreen,
                    }),
                    '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                    '& .MuiDrawer-paper': {
                        position: 'sticky',
                        top: 0,
                        height: 'auto',
                        maxHeight: '100vh',
                        width: LARGURA_MENU,
                        boxSizing: 'border-box',
                        border: 0,
                    },
                })}>
                {lista}
            </Drawer>
            <Drawer
                variant="temporary"
                open={mobileAberto}
                onClose={onFecharMobile}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': { width: LARGURA_MENU, boxSizing: 'border-box' },
                }}>
                {lista}
            </Drawer>
        </>
    );
}