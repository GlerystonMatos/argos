import type { ReactNode } from 'react';
import SettingsIcon from '@mui/icons-material/Settings';
import { BotaoComCarregamento } from '../../components/BotaoComCarregamento';

interface BotaoVoltarResumoProps {
    onClick: () => void;
    carregando?: boolean;
}

export function BotaoVoltarResumo({ onClick, carregando }: BotaoVoltarResumoProps): ReactNode {
    return (
        <BotaoComCarregamento variant="outlined" startIcon={<SettingsIcon />} carregando={carregando} onClick={onClick}>
            Configurações
        </BotaoComCarregamento>
    );
}