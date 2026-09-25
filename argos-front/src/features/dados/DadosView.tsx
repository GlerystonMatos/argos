import { useState } from 'react';
import type { ReactNode } from 'react';
import { baixarDados } from '../../api/dadosApi';
import DownloadIcon from '@mui/icons-material/Download';
import { ListaArquivosDados } from './ListaArquivosDados';
import { ImportarDadosDialog } from './ImportarDadosDialog';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useNotificacao } from '../../hooks/useNotificacao';
import { CabecalhoView } from '../../components/CabecalhoView';
import { BotaoComCarregamento } from '../../components/BotaoComCarregamento';
import { Card, Stack, Divider, CardContent, Typography } from '@mui/material';

const DESCRICAO_REIMPORTACAO: ReactNode = (
    <>
        Envie um <code>.zip</code> com o conteúdo da pasta <code>dados/</code> (baixe primeiro, ajuste os{' '}
        <code>.json</code> à mão e reenvie).
        Os arquivos presentes no <code>.zip</code> substituem os atuais de
        mesmo nome; os demais permanecem intactos. Inclua os arquivos de cache de consulta somente se quiser
        substituí-los — caso contrário, deixe-os de fora do <code>.zip</code>. A página é recarregada ao final.
    </>
);

export function DadosView(): ReactNode {
    const { notificarErro } = useNotificacao();
    const [baixando, setBaixando] = useState(false);
    const [dialogoImportarAberto, setDialogoImportarAberto] = useState(false);

    async function baixar(): Promise<void> {
        setBaixando(true);
        try {
            await baixarDados();
        } catch (erro) {
            notificarErro(erro, 'Não foi possível baixar os dados');
        } finally {
            setBaixando(false);
        }
    }

    return (
        <Card variant="outlined">
            <CardContent>
                <Stack spacing={2}>
                    <CabecalhoView titulo="Dados">
                        <BotaoComCarregamento
                            startIcon={<DownloadIcon />}
                            carregando={baixando}
                            onClick={() => void baixar()}>
                            Baixar dados (.zip)
                        </BotaoComCarregamento>
                        <BotaoComCarregamento
                            variant="contained"
                            startIcon={<UploadFileIcon />}
                            onClick={() => setDialogoImportarAberto(true)}>
                            Importar dados (.zip)
                        </BotaoComCarregamento>
                    </CabecalhoView>

                    <Typography variant="body2" color="text.secondary">
                        Os dados da aplicação ficam em documentos <code>.json</code> (pasta <code>dados/</code> ou Firestore): cadastro
                        de usuários do Toggl, configurações (Toggl e Jira), sprints, parâmetros e caches das consultas
                        de Relatório, Gant, Sprint e Planejamento.
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                        <strong>Baixar</strong> compacta todos os documentos em um <code>.zip</code>, útil
                        como backup ou para levar os dados a outra instalação. <strong>Importar</strong> restaura um{' '}
                        <code>.zip</code> desses: os arquivos enviados substituem os atuais de mesmo nome e a página é
                        recarregada ao final.
                    </Typography>

                    <Divider />

                    <ListaArquivosDados />
                </Stack>

                <ImportarDadosDialog
                    aberto={dialogoImportarAberto}
                    onFechar={() => setDialogoImportarAberto(false)}
                    onImportado={() => window.location.reload()}
                    titulo="Importar dados (.zip)"
                    descricao={DESCRICAO_REIMPORTACAO}
                    rotuloCancelar="Cancelar" />
            </CardContent>
        </Card>
    );
}