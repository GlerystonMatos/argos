import type { ReactNode } from 'react';
import { Box, Stack } from '@mui/material';
import { BadgeSigla } from '../../components/BadgeSigla';
import type { EntradaMapeamentoJiraToggl, UsuarioTogglResumo } from '../../api/tipos';

interface ListaMapeamentoResumoProps {
    mapeamento: Record<string, EntradaMapeamentoJiraToggl>;
    usuariosToggl: UsuarioTogglResumo[];
}

interface BadgeMapeado {
    chave: string;
    ordem: string;
    sigla: string;
    cor: string | undefined;
    nome: string;
}

function montarBadges(
    mapeamento: Record<string, EntradaMapeamentoJiraToggl>,
    usuariosToggl: UsuarioTogglResumo[],
): BadgeMapeado[] {
    const badges: BadgeMapeado[] = [];

    for (const [nomeJira, entrada] of Object.entries(mapeamento)) {
        if (entrada.chaveToggl) {
            const usuario = usuariosToggl.find((candidato) => candidato.chave === entrada.chaveToggl);
            if (!usuario) continue;
            badges.push({
                chave: nomeJira,
                ordem: usuario.nomeExibicao,
                sigla: usuario.sigla,
                cor: usuario.cor,
                nome: `${usuario.nomeExibicao} (Jira: ${nomeJira})`,
            });
        } else if (entrada.sigla?.trim()) {
            badges.push({
                chave: nomeJira,
                ordem: nomeJira,
                sigla: entrada.sigla,
                cor: entrada.cor ?? undefined,
                nome: `${nomeJira} (somente no Jira)`,
            });
        }
    }

    return badges.sort((a, b) => a.ordem.localeCompare(b.ordem, 'pt-BR'));
}

export function ListaMapeamentoResumo({ mapeamento, usuariosToggl }: ListaMapeamentoResumoProps): ReactNode {
    const badges = montarBadges(mapeamento, usuariosToggl);
    if (badges.length === 0) return null;

    return (
        <Box sx={{ maxHeight: 200, overflowY: 'auto', overflowX: 'hidden', mt: '0.25rem !important' }}>
            <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                {badges.map((badge) => (
                    <BadgeSigla key={badge.chave} sigla={badge.sigla} cor={badge.cor} nome={badge.nome} sx={{ borderRadius: 1 }} />
                ))}
            </Stack>
        </Box>
    );
}