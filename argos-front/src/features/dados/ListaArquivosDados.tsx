import type { ReactNode } from 'react';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Box, Chip, Stack, Divider, Typography } from '@mui/material';
import { ARQUIVOS_DADOS, GRUPOS_TIPO_ARQUIVO_DADOS } from './arquivosDados';

export function ListaArquivosDados(): ReactNode {
    return (
        <Stack spacing={1.5}>
            <Typography variant="subtitle2">Arquivos .json que a aplicação pode criar</Typography>

            <Typography variant="body2" color="text.secondary">
                A lista é informativa: são os nomes reais dos documentos (pasta <code>dados/</code> ou Firestore), criados sob demanda na
                primeira vez que a ação correspondente é executada. Importar um <code>.zip</code> substitui os arquivos
                de mesmo nome.
            </Typography>

            {GRUPOS_TIPO_ARQUIVO_DADOS.map((grupo) => {
                const arquivos = ARQUIVOS_DADOS.filter((arquivo) => arquivo.tipo === grupo.tipo);
                return (
                    <Stack key={grupo.tipo} spacing={0.5}>
                        <Typography variant="subtitle2">
                            {grupo.titulo} ({arquivos.length})
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {grupo.explicacao}
                        </Typography>

                        <Stack
                            spacing={1}
                            divider={<Divider flexItem />}
                            sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                            {arquivos.map((arquivo) => (
                                <Stack key={arquivo.nome} spacing={0.25}>
                                    <Stack direction="row" sx={{ flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
                                            <code>{arquivo.nome}</code>
                                        </Typography>
                                        {arquivo.contemSegredo ? (
                                            <Chip
                                                size="small"
                                                color="warning"
                                                variant="outlined"
                                                icon={<LockOutlinedIcon />}
                                                label="Contém token (enc:)" />
                                        ) : undefined}
                                    </Stack>
                                    <Typography variant="body2" color="text.secondary">
                                        {arquivo.conteudo}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        <Box component="span" sx={{ fontWeight: 600 }}>Gerado por:</Box>{' '}
                                        {arquivo.geradoPor}
                                    </Typography>
                                </Stack>
                            ))}
                        </Stack>
                    </Stack>
                );
            })}
        </Stack>
    );
}