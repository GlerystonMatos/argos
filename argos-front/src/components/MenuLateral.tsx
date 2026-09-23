import type { ReactNode } from 'react';
import SpeedIcon from '@mui/icons-material/Speed';
import StorageIcon from '@mui/icons-material/Storage';
import SettingsIcon from '@mui/icons-material/Settings';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ViewTimelineIcon from '@mui/icons-material/ViewTimeline';

import {
    Box,
    List,
    Drawer,
    Tooltip,
    ListItemIcon,
    ListItemText,
    ListItemButton,
} from '@mui/material';

export type Secao = 'resumo' | 'toggl' | 'jira' | 'configuracoes' | 'relatorio' | 'gant' | 'sprint' | 'dados';

interface ItemMenu {
    secao: Exclude<Secao, 'resumo'>;
    rotulo: string;
    icone: ReactNode;
    exigeConfiguracaoCompleta?: boolean;
}

const ITENS_MENU: readonly ItemMenu[] = [
    { secao: 'toggl', rotulo: 'Toggl', icone: <AccessTimeIcon /> },
    { secao: 'jira', rotulo: 'Jira', icone: <ViewKanbanIcon /> },
    { secao: 'configuracoes', rotulo: 'Configurações', icone: <SettingsIcon /> },
    { secao: 'relatorio', rotulo: 'Relatório', icone: <AssessmentIcon />, exigeConfiguracaoCompleta: true },
    { secao: 'gant', rotulo: 'Gant', icone: <ViewTimelineIcon />, exigeConfiguracaoCompleta: true },
    { secao: 'sprint', rotulo: 'Sprint', icone: <SpeedIcon />, exigeConfiguracaoCompleta: true },
    { secao: 'dados', rotulo: 'Dados', icone: <StorageIcon /> },
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
        <List component="nav" aria-label="Navegação principal" sx={{ py: 1 }}>
            {ITENS_MENU.map((item) => {
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
                                onClick={() => onSelecionar(item.secao)}>
                                <ListItemIcon sx={{ minWidth: 40 }}>{item.icone}</ListItemIcon>
                                <ListItemText primary={item.rotulo} />
                            </ListItemButton>
                        </Box>
                    </Tooltip>
                );
            })}
        </List>
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