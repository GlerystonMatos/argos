import { CORES } from '../theme';
import { Box } from '@mui/material';
import type { ReactNode } from 'react';
import { montarUrlIssueJira, separarCodigoTel } from '../utils/codigoTel';

interface LinkJiraProps {
    url: string | null | undefined;
    children: ReactNode;
    destacado?: boolean;
}

export function LinkJira({ url, children, destacado = false }: LinkJiraProps): ReactNode {
    if (!url) return children;

    return (
        <Box
            component="a"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(evento) => evento.stopPropagation()}
            onDoubleClick={(evento) => evento.stopPropagation()}
            sx={{
                color: destacado ? CORES.corPendente : 'primary.main',
                textDecoration: 'underline',
                fontWeight: destacado ? 700 : undefined,
            }}>
            {children}
        </Box>
    );
}

interface DescricaoComLinkJiraProps {
    descricao: string;
    urlDominioJira: string | null | undefined;
}

export function DescricaoComLinkJira({ descricao, urlDominioJira }: DescricaoComLinkJiraProps): ReactNode {
    const codigo = separarCodigoTel(descricao);
    const url = codigo ? montarUrlIssueJira(urlDominioJira, codigo.chaveJira) : null;
    if (!codigo || !url) return descricao;

    return (
        <>
            <LinkJira url={url}>{codigo.textoCodigo}</LinkJira>
            {codigo.restante}
        </>
    );
}