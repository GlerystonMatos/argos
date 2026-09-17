import type { ReactNode } from 'react';
import { Tooltip } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlined';

interface IconeAjudaProps {
    titulo: string;
}

export function IconeAjuda({ titulo }: IconeAjudaProps): ReactNode {
    return (
        <Tooltip title={titulo}>
            <HelpOutlineIcon fontSize="small" sx={{ color: 'text.secondary', cursor: 'help' }} />
        </Tooltip>
    );
}