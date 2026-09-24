import { tema } from '../theme';
import type { ReactNode } from 'react';
import { CreditoApp } from './CreditoApp';
import { useEffect, useState } from 'react';

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
    CircularProgress,
} from '@mui/material';

interface SobreDialogProps {
    aberto: boolean;
    onFechar: () => void;
}

const SRC_LOGO = '/argos.png';

// Carrega e decodifica a logo uma única vez; falha não trava o diálogo (mostra o alt).
let carregamentoLogo: Promise<void> | null = null;
let logoCarregada = false;

function carregarLogo(): Promise<void> {
    if (!carregamentoLogo) {
        const imagem = new Image();
        imagem.src = SRC_LOGO;
        carregamentoLogo = imagem
            .decode()
            .catch(() => undefined)
            .then(() => {
                logoCarregada = true;
            });
    }
    return carregamentoLogo;
}

export function SobreDialog({ aberto, onFechar }: SobreDialogProps): ReactNode {
    const telaPequena = useMediaQuery(tema.breakpoints.down('sm'));
    const [pronto, setPronto] = useState(logoCarregada);

    useEffect(() => {
        if (!aberto || pronto) return;
        let ativo = true;
        void carregarLogo().then(() => {
            if (ativo) setPronto(true);
        });
        return () => {
            ativo = false;
        };
    }, [aberto, pronto]);

    return (
        <Dialog
            open={aberto}
            onClose={onFechar}
            maxWidth={false}
            fullWidth
            fullScreen={telaPequena}
            slotProps={{ paper: { sx: { maxWidth: telaPequena ? undefined : 700 } } }}>
            <DialogTitle sx={{ py: 1 }}>Sobre</DialogTitle>
            <DialogContent dividers sx={{ pb: 1 }}>
                {!pronto ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240 }}>
                        <CircularProgress aria-label="carregando" />
                    </Box>
                ) : (
                    <Stack spacing={1}>
                        <Box
                            component="img"
                            src={SRC_LOGO}
                            alt="Argos — Visão geral | Lealdade absoluta"
                            sx={{ alignSelf: 'center', width: 220, maxWidth: '100%', height: 'auto', mb: '1rem !important' }} />
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
                        <Stack spacing={0.75}>
                            <Divider />
                            <Box sx={{ textAlign: 'center', lineHeight: 1 }}>
                                <CreditoApp sx={{ fontWeight: 700, lineHeight: 1.2 }} />
                            </Box>
                        </Stack>
                    </Stack>
                )}
            </DialogContent>
            <DialogActions sx={{ py: 0.5 }}>
                <Button size="small" onClick={onFechar} autoFocus>
                    Fechar
                </Button>
            </DialogActions>
        </Dialog>
    );
}