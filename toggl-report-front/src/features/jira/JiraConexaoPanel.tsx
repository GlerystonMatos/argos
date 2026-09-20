import type { ReactNode } from 'react';
import ErrorIcon from '@mui/icons-material/Error';
import { IconeAjuda } from '../../components/IconeAjuda';
import { useConfiguracaoJira } from './useConfiguracaoJira';
import { useNotificacao } from '../../hooks/useNotificacao';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { BotaoComCarregamento } from '../../components/BotaoComCarregamento';
import { Alert, Link, Stack, TextField, InputAdornment } from '@mui/material';

const URL_TOKENS_ATLASSIAN = 'https://id.atlassian.com/manage-profile/security/api-tokens';

interface JiraConexaoPanelProps {
    onValidoChange?: (valido: boolean) => void;
}

export interface JiraConexaoPanelHandle {
    salvar: () => Promise<boolean>;
}

export const JiraConexaoPanel = forwardRef<JiraConexaoPanelHandle, JiraConexaoPanelProps>(
    function JiraConexaoPanel({ onValidoChange }, ref): ReactNode {
        const { carregando, carregar, salvarParcial, testarConexao } = useConfiguracaoJira();
        const { notificarErro, notificarSucesso } = useNotificacao();

        const [urlDominio, setUrlDominio] = useState('');
        const [email, setEmail] = useState('');
        const [apiToken, setApiToken] = useState('');
        const [tokenMascarado, setTokenMascarado] = useState('');

        const [testando, setTestando] = useState(false);
        const [resultadoTeste, setResultadoTeste] = useState<{ sucesso: boolean; mensagem: string | null } | null>(null);

        useEffect(() => {
            carregar()
                .then((dados) => {
                    setUrlDominio(dados.urlDominio);
                    setEmail(dados.email);
                    setTokenMascarado(dados.tokenMascarado);
                })
                .catch((erro: unknown) => notificarErro(erro, 'Não foi possível carregar a configuração do Jira'));
        }, []);

        async function testar(): Promise<void> {
            setTestando(true);
            setResultadoTeste(null);
            try {
                const resposta = await testarConexao({ urlDominio: urlDominio.trim(), email: email.trim(), apiToken: apiToken.trim() });
                setResultadoTeste({ sucesso: resposta.sucesso, mensagem: resposta.mensagem });
            } catch (erro) {
                notificarErro(erro, 'Não foi possível testar a conexão com o Jira');
            } finally {
                setTestando(false);
            }
        }

        async function salvar(): Promise<boolean> {
            try {
                const atualizado = await salvarParcial({
                    urlDominio: urlDominio.trim(),
                    email: email.trim(),
                    apiToken: apiToken.trim() !== '' ? apiToken.trim() : null,
                });
                setTokenMascarado(atualizado.tokenMascarado);
                setApiToken('');
                notificarSucesso('Conexão com o Jira salva.');
                return true;
            } catch (erro) {
                notificarErro(erro, 'Não foi possível salvar a conexão com o Jira');
                return false;
            }
        }

        useImperativeHandle(ref, () => ({ salvar }));

        const camposObrigatoriosPreenchidos = urlDominio.trim().length > 0 && email.trim().length > 0;
        const podeTestar = camposObrigatoriosPreenchidos && apiToken.trim().length > 0;
        const tokenJaSalvo = tokenMascarado !== '' && tokenMascarado !== '****';

        useEffect(() => {
            onValidoChange?.(camposObrigatoriosPreenchidos);
        }, [camposObrigatoriosPreenchidos]);

        return (
            <Stack spacing={3}>
                <TextField
                    label="URL do domínio"
                    value={urlDominio}
                    onChange={(evento) => {
                        setUrlDominio(evento.target.value);
                        setResultadoTeste(null);
                    }}
                    placeholder="empresa.atlassian.net"
                    slotProps={{
                        input: {
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconeAjuda titulo="URL do seu site Jira, ex.: suaempresa.atlassian.net — é o endereço que aparece no navegador ao acessar o Jira." />
                                </InputAdornment>
                            ),
                        },
                    }}
                    disabled={carregando}
                    fullWidth />

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                        label="E-mail"
                        value={email}
                        onChange={(evento) => {
                            setEmail(evento.target.value);
                            setResultadoTeste(null);
                        }}
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconeAjuda titulo="E-mail de login da conta Atlassian usada para gerar o API Token ao lado." />
                                    </InputAdornment>
                                ),
                            },
                        }}
                        disabled={carregando}
                        fullWidth />
                    <TextField
                        label="API Token"
                        type="password"
                        value={apiToken}
                        onChange={(evento) => {
                            setApiToken(evento.target.value);
                            setResultadoTeste(null);
                        }}
                        placeholder={tokenJaSalvo ? `Atual: ${tokenMascarado} (deixe em branco para manter)` : undefined}
                        helperText={
                            <>
                                Gerado em{' '}
                                <Link href={URL_TOKENS_ATLASSIAN} target="_blank" rel="noopener noreferrer">
                                    id.atlassian.com/manage-profile/security/api-tokens
                                </Link>
                            </>
                        }
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconeAjuda titulo="Acesse id.atlassian.com → Security → API tokens → Create API token, dê um nome e copie o valor gerado." />
                                    </InputAdornment>
                                ),
                            },
                        }}
                        disabled={carregando}
                        fullWidth />
                </Stack>

                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: '0rem !important' }}>
                    <BotaoComCarregamento
                        variant="outlined"
                        carregando={testando}
                        disabled={!podeTestar || carregando}
                        onClick={() => void testar()}>
                        Testar conexão
                    </BotaoComCarregamento>
                    {resultadoTeste?.sucesso === true ? (
                        <Alert icon={<CheckCircleIcon fontSize="inherit" />} severity="success" sx={{ py: 0 }}>
                            {resultadoTeste.mensagem ?? 'Conexão bem-sucedida.'}
                        </Alert>
                    ) : undefined}
                    {resultadoTeste?.sucesso === false ? (
                        <Alert icon={<ErrorIcon fontSize="inherit" />} severity="warning" sx={{ py: 0 }}>
                            {resultadoTeste.mensagem ?? 'Não foi possível conectar.'}
                        </Alert>
                    ) : undefined}
                </Stack>
            </Stack>
        );
    },
);