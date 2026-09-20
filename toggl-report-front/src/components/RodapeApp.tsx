import { Box } from '@mui/material';
import type { ReactNode } from 'react';
import { CreditoApp } from './CreditoApp';

export function RodapeApp(): ReactNode {
    return (
        <Box component="footer" sx={{ mt: 'auto', px: { xs: 1, sm: 2 }, pb: 1 }}>
            <Box sx={{ mt: 2, pt: 0.5, borderTop: 1, borderColor: 'divider' }}>
                <CreditoApp sx={{ fontWeight: 700 }} />
            </Box>
        </Box>
    );
}