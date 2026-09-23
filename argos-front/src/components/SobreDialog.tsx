import { tema } from '../theme';
import type { ReactNode } from 'react';
import { CreditoApp } from './CreditoApp';

import {
    Box,
    Stack,
    Button,
    Dialog,
    Divider,
    Typography,
    DialogTitle,
    DialogContent,
    DialogActions,
    useMediaQuery,
} from '@mui/material';

interface SobreDialogProps {
    aberto: boolean;
    onFechar: () => void;
}

export function SobreDialog({ aberto, onFechar }: SobreDialogProps): ReactNode {
    const telaPequena = useMediaQuery(tema.breakpoints.down('sm'));

    return (
        <Dialog open={aberto} onClose={onFechar} maxWidth="sm" fullWidth fullScreen={telaPequena}>
            <DialogTitle>Sobre</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2}>
                    <Box
                        component="img"
                        src="/argos.png"
                        alt="Argos — Visão geral | Lealdade absoluta"
                        sx={{ alignSelf: 'center', width: 220, maxWidth: '100%', height: 'auto' }} />
                    <Typography variant="body2">
                        O nome vem de duas figuras da mitologia grega que resumem o propósito da aplicação.
                    </Typography>
                    <Box>
                        <Typography variant="subtitle2">Argos Panoptes — a visão geral</Typography>
                        <Typography variant="body2" color="text.secondary">
                            O gigante de cem olhos, "aquele que tudo vê". Enquanto alguns olhos dormiam, os outros
                            seguiam atentos, e por isso nada lhe escapava. Hera o incumbiu de vigiar o que lhe era
                            precioso. Aqui ele representa a visão consolidada do tempo, das sprints e do planejamento
                            da equipe, reunindo o Toggl e o Jira num só lugar.
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="subtitle2">Argos, o cão de Odisseu — a lealdade absoluta</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Na Odisseia, o cão esperou vinte anos pelo retorno do dono. Foi o único a reconhecê-lo
                            sob o disfarce de mendigo e, só depois desse reencontro, descansou. Aqui ele representa a
                            fidelidade aos dados: mostrar o trabalho como ele realmente foi, sem distorção.
                        </Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ textAlign: 'center' }}>
                        <CreditoApp sx={{ fontWeight: 700 }} />
                    </Box>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onFechar} autoFocus>
                    Fechar
                </Button>
            </DialogActions>
        </Dialog>
    );
}