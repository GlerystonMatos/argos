import type { ReactNode } from 'react';
import ErrorIcon from '@mui/icons-material/Error';
import type { QuadroJira } from '../../api/tipos';
import { IconeAjuda } from '../../components/IconeAjuda';
import { useConfiguracaoJira } from './useConfiguracaoJira';
import { useNotificacao } from '../../hooks/useNotificacao';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { SelectQuadroJira } from '../../components/SelectQuadroJira';
import { EsqueletoCarregando } from '../../components/EsqueletoCarregando';
import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { BotaoComCarregamento } from '../../components/BotaoComCarregamento';
import { Alert, Link, Stack, TextField, InputAdornment } from '@mui/material';

const URL_TOKENS_ATLASSIAN = 'https://id.atlassian.com/manage-profile/security/api-tokens';

interface JiraConexaoPanelProps {
    onValidoChange?: (valido: boolean) => void;
    onSujoChange?: (sujo: boolean) => void;
}

export interface JiraConexaoPanelHandle {
    salvar: () => Promise<boolean>;
}

export const JiraConexaoPanel = forwardRef<JiraConexaoPanelHandle, JiraConexaoPanelProps>(
    function JiraConexaoPanel({ onValidoChange, onSujoChange }, ref): ReactNode {
        const { carregando, carregado, carregar, salvarParcial, testarConexao } = useConfiguracaoJira();
        const { notificarErro, notificarSucesso } = useNotificacao();

        const [urlDominio, setUrlDominio] = useState('');
        const [email, setEmail] = useState('');
        const [apiToken, setApiToken] = useState('');
        const [tokenMascarado, setTokenMascarado] = useState('');
        const [alterado, setAlterado] = useState(false);
        const [salvoUrl, setSalvoUrl] = useState('');
        const [salvoEmail, setSalvoEmail] = useState('');
        const [quadro, setQuadro] = useState<QuadroJira | null>(null);
        const [salvoQuadroId, setSalvoQuadroId] = useState<number | null>(null);
        const [versaoConexao, setVersaoConexao] = useState(0);

        const [testando, setTestando] = useState(false);
        const [salvando, setSalvando] = useState(false);
        const [resultadoTeste, setResultadoTeste] = useState<{ sucesso: boolean; mensagem: string | null } | null>(null);

        useEffect(() => {
            carregar()
                .then((dados) => {
                    setUrlDominio(dados.urlDominio);
                    setEmail(dados.email);
                    setSalvoUrl(dados.urlDominio.trim());
                    setSalvoEmail(dados.email.trim());
                    setQuadro(dados.quadroId !== null ? { id: dados.quadroId, nome: dados.quadroNome, projeto: null } : null);
                    setSalvoQuadroId(dados.quadroId);
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
            setSalvando(true);
            try {
                const atualizado = await salvarParcial({
                    urlDominio: urlDominio.trim(),
                    email: email.trim(),
                    apiToken: apiToken.trim() !== '' ? apiToken.trim() : null,
                    quadroId: quadro?.id ?? null,
                    quadroNome: quadro?.nome ?? null,
                });
                setTokenMascarado(atualizado.tokenMascarado);
                setSalvoUrl(urlDominio.trim());
                setSalvoEmail(email.trim());
                setSalvoQuadroId(atualizado.quadroId);
                setVersaoConexao((atual) => atual + 1);
                setApiToken('');
                notificarSucesso('Dados da conexão com o Jira salvos com sucesso.');
                return true;
            } catch (erro) {
                notificarErro(erro, 'Não foi possível salvar a conexão com o Jira');
                return false;
            } finally {
                setSalvando(false);
            }
        }

        useImperativeHandle(ref, () => ({ salvar }));

        const tokenJaSalvo = tokenMascarado !== '' && tokenMascarado !== '****';
        const urlPreenchida = urlDominio.trim().length > 0;
        const emailPreenchido = email.trim().length > 0;
        const tokenPreenchido = apiToken.trim().length > 0;
        const podeTestar = urlPreenchida && emailPreenchido && tokenPreenchido;
        const quadroPreenchido = quadro !== null;
        const conexaoValida = urlPreenchida && emailPreenchido && (tokenPreenchido || tokenJaSalvo) && quadroPreenchido;
        const erroToken = alterado && !tokenPreenchido && !tokenJaSalvo;

        useEffect(() => {
            onValidoChange?.(conexaoValida);
        }, [conexaoValida]);

        const sujo = urlDominio.trim() !== salvoUrl || email.trim() !== salvoEmail || tokenPreenchido || (quadro?.id ?? null) !== salvoQuadroId;

        useEffect(() => {
            onSujoChange?.(sujo);
        }, [sujo]);

        function alterarCampo(definir: (valor: string) => void, valor: string): void {
            definir(valor);
            setAlterado(true);
            setResultadoTeste(null);
        }

        function alterarQuadro(valor: QuadroJira | null): void {
            setQuadro(valor);
            setAlterado(true);
        }

        const bloqueado = carregando || salvando;

        const linkTokens = (
            <>
                Gerado em{' '}
                <Link href={URL_TOKENS_ATLASSIAN} target="_blank" rel="noopener noreferrer">
                    id.atlassian.com/manage-profile/security/api-tokens
                </Link>
            </>
        );

        if (!carregado) return <EsqueletoCarregando />;

        return (
            <Stack spacing={3} sx={{ mt: '0.5rem !important' }}>
                <TextField
                    required
                    label="URL do domínio"
                    value={urlDominio}
                    onChange={(evento) => alterarCampo(setUrlDominio, evento.target.value)}
                    error={alterado && !urlPreenchida}
                    helperText={alterado && !urlPreenchida ? 'Informe a URL do domínio.' : undefined}
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
                    disabled={bloqueado}
                    fullWidth />

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: '1rem !important' }}>
                    <TextField
                        required
                        label="E-mail"
                        value={email}
                        onChange={(evento) => alterarCampo(setEmail, evento.target.value)}
                        error={alterado && !emailPreenchido}
                        helperText={alterado && !emailPreenchido ? 'Informe o e-mail.' : undefined}
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconeAjuda titulo="E-mail de login da conta Atlassian usada para gerar o API Token ao lado." />
                                    </InputAdornment>
                                ),
                            },
                        }}
                        disabled={bloqueado}
                        fullWidth />
                    <TextField
                        required={!tokenJaSalvo}
                        label="API Token"
                        type="password"
                        value={apiToken}
                        onChange={(evento) => alterarCampo(setApiToken, evento.target.value)}
                        error={erroToken}
                        placeholder={tokenJaSalvo ? `Atual: ${tokenMascarado} (deixe em branco para manter)` : undefined}
                        helperText={erroToken ? <>Informe o API Token. {linkTokens}</> : linkTokens}
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconeAjuda titulo="Acesse id.atlassian.com → Security → API tokens → Create API token, dê um nome e copie o valor gerado." />
                                    </InputAdornment>
                                ),
                            },
                        }}
                        disabled={bloqueado}
                        fullWidth />
                </Stack>

                <SelectQuadroJira
                    key={versaoConexao}
                    label="Quadro de DEV"
                    value={quadro}
                    onChange={alterarQuadro}
                    required
                    error={alterado && !quadroPreenchido}
                    helperText={alterado && !quadroPreenchido ? 'Selecione o quadro de DEV.' : undefined}
                    ajuda="Quadro Scrum do Jira usado pelo Planejamento (cartões do sprint ativo). A lista usa a conexão já salva: salve a conexão antes de listar os quadros."
                    disabled={bloqueado} />

                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: '0.8rem !important' }}>
                    <BotaoComCarregamento
                        variant="outlined"
                        carregando={testando}
                        disabled={!podeTestar || bloqueado}
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

                {!conexaoValida ? (
                    <Alert severity="info">
                        Preencha a URL do domínio, o e-mail, o API Token (obrigatório na primeira configuração) e o quadro de DEV para salvar a conexão.
                    </Alert>
                ) : undefined}
            </Stack>
        );
    },
);