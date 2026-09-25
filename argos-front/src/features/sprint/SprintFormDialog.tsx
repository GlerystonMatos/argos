import type { ReactNode } from 'react';
import { useSprints } from './useSprints';
import { useEffect, useState } from 'react';
import type { Sprint } from '../../api/tipos';
import { useNotificacao } from '../../hooks/useNotificacao';
import { periodoEhValido, contarDiasUteis } from '../../utils/datas';
import { BotaoComCarregamento } from '../../components/BotaoComCarregamento';

import {
    Stack,
    Dialog,
    TextField,
    DialogTitle,
    DialogActions,
    DialogContent,
} from '@mui/material';

interface SprintFormDialogProps {
    aberto: boolean;
    sprintEmEdicao: Sprint | null;
    onFechar: () => void;
    onSalvo: (mensagem: string) => void;
}

export function SprintFormDialog({ aberto, sprintEmEdicao, onFechar, onSalvo }: SprintFormDialogProps): ReactNode {
    const emEdicao = sprintEmEdicao !== null;
    const somenteLeitura = sprintEmEdicao?.fechado ?? false;
    const { criar, editar } = useSprints();
    const { notificarErro } = useNotificacao();

    const [nome, setNome] = useState('');
    const [horasPorDia, setHorasPorDia] = useState('');
    const [margemPercentual, setMargemPercentual] = useState('');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [diasNaoUteis, setDiasNaoUteis] = useState('');
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        if (aberto) {
            setNome(sprintEmEdicao?.nome ?? '');
            setHorasPorDia(sprintEmEdicao ? String(sprintEmEdicao.horasPorDia) : '');
            setMargemPercentual(sprintEmEdicao ? String(sprintEmEdicao.margemPercentual) : '');
            setDataInicio(sprintEmEdicao?.dataInicio ?? '');
            setDataFim(sprintEmEdicao?.dataFim ?? '');
            setDiasNaoUteis(sprintEmEdicao && sprintEmEdicao.diasNaoUteis > 0 ? String(sprintEmEdicao.diasNaoUteis) : '');
        }
    }, [aberto, sprintEmEdicao]);

    function fecharEResetar(): void {
        setNome('');
        setHorasPorDia('');
        setMargemPercentual('');
        setDataInicio('');
        setDataFim('');
        setDiasNaoUteis('');
        onFechar();
    }

    const horasNumero = Number(horasPorDia.replace(',', '.'));
    const horasValidas = horasPorDia.trim() !== '' && Number.isFinite(horasNumero) && horasNumero > 0;
    const margemNumero = Number(margemPercentual.replace(',', '.'));
    const margemValida = margemPercentual.trim() !== '' && Number.isFinite(margemNumero) && margemNumero >= 0 && margemNumero < 100;
    const datasPreenchidas = dataInicio !== '' && dataFim !== '';
    const periodoValido = datasPreenchidas && periodoEhValido(dataInicio, dataFim);
    const diasUteisPeriodo = periodoValido ? contarDiasUteis(dataInicio, dataFim) : 0;
    const diasNaoUteisNumero = diasNaoUteis.trim() === '' ? 0 : Number(diasNaoUteis);
    const diasNaoUteisValidos =
        Number.isInteger(diasNaoUteisNumero) && diasNaoUteisNumero >= 0 && (!periodoValido || diasNaoUteisNumero <= diasUteisPeriodo);
    const formValido = nome.trim() !== '' && horasValidas && margemValida && periodoValido && diasNaoUteisValidos;
    const houveAlteracao =
        sprintEmEdicao === null ||
        nome.trim() !== sprintEmEdicao.nome ||
        horasNumero !== sprintEmEdicao.horasPorDia ||
        margemNumero !== sprintEmEdicao.margemPercentual ||
        dataInicio !== sprintEmEdicao.dataInicio ||
        dataFim !== sprintEmEdicao.dataFim ||
        diasNaoUteisNumero !== sprintEmEdicao.diasNaoUteis;

    async function salvar(): Promise<void> {
        if (!formValido) {
            notificarErro(new Error('Preencha nome, horas por dia (maior que zero), margem (0 a 99,9%), um período válido e, se informar, dias não úteis dentro dos dias úteis do período.'));
            return;
        }

        const dados = {
            nome: nome.trim(),
            horasPorDia: horasNumero,
            margemPercentual: margemNumero,
            dataInicio,
            dataFim,
            diasNaoUteis: diasNaoUteisNumero,
        };

        setSalvando(true);
        try {
            if (emEdicao && sprintEmEdicao) {
                await editar(sprintEmEdicao.chave, dados);
            } else {
                await criar(dados);
            }
            onSalvo(emEdicao ? 'Sprint atualizado com sucesso.' : 'Sprint criado com sucesso.');
            fecharEResetar();
        } catch (erro) {
            notificarErro(erro, 'Não foi possível salvar o sprint');
        } finally {
            setSalvando(false);
        }
    }

    return (
        <Dialog open={aberto} onClose={salvando ? undefined : fecharEResetar} fullWidth maxWidth="sm">
            <DialogTitle>{somenteLeitura ? 'Sprint fechado (somente leitura)' : emEdicao ? 'Editar sprint' : 'Adicionar sprint'}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField
                        required
                        label="Nome"
                        value={nome}
                        onChange={(evento) => setNome(evento.target.value)}
                        autoFocus
                        fullWidth
                        disabled={salvando || somenteLeitura} />

                    <TextField
                        required
                        label="Horas por dia"
                        type="number"
                        value={horasPorDia}
                        onChange={(evento) => setHorasPorDia(evento.target.value)}
                        error={horasPorDia.trim() !== '' && !horasValidas}
                        helperText={
                            horasPorDia.trim() !== '' && !horasValidas
                                ? 'Informe um número maior que zero (ex.: 7 ou 7.5).'
                                : undefined
                        }
                        slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
                        fullWidth
                        disabled={salvando || somenteLeitura} />

                    <TextField
                        required
                        label="Margem (%)"
                        type="number"
                        value={margemPercentual}
                        onChange={(evento) => setMargemPercentual(evento.target.value)}
                        error={margemPercentual.trim() !== '' && !margemValida}
                        helperText={
                            margemPercentual.trim() !== '' && !margemValida
                                ? 'Informe um número entre 0 e 99,9 (ex.: 30).'
                                : 'Percentual do tempo total reservado como margem (ex.: 30).'
                        }
                        slotProps={{ htmlInput: { min: 0, max: 99.9, step: 0.5 } }}
                        fullWidth
                        disabled={salvando || somenteLeitura} />

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                            required
                            label="Data início"
                            type="date"
                            value={dataInicio}
                            onChange={(evento) => setDataInicio(evento.target.value)}
                            slotProps={{ inputLabel: { shrink: true } }}
                            fullWidth
                            disabled={salvando || somenteLeitura} />
                        <TextField
                            required
                            label="Data fim"
                            type="date"
                            value={dataFim}
                            onChange={(evento) => setDataFim(evento.target.value)}
                            error={datasPreenchidas && !periodoValido}
                            helperText={
                                datasPreenchidas && !periodoValido
                                    ? 'A data fim não pode ser anterior à data início.'
                                    : undefined
                            }
                            slotProps={{ inputLabel: { shrink: true } }}
                            fullWidth
                            disabled={salvando || somenteLeitura} />
                    </Stack>

                    <TextField
                        label="Dias não úteis (opcional)"
                        type="number"
                        value={diasNaoUteis}
                        onChange={(evento) => setDiasNaoUteis(evento.target.value)}
                        error={!diasNaoUteisValidos}
                        helperText={
                            !diasNaoUteisValidos
                                ? `Informe um número inteiro entre 0 e ${diasUteisPeriodo} (dias úteis do período).`
                                : 'Feriados ou outros dias sem trabalho, descontados dos dias úteis do sprint.'
                        }
                        slotProps={{ htmlInput: { min: 0, max: periodoValido ? diasUteisPeriodo : undefined, step: 1 } }}
                        fullWidth
                        disabled={salvando || somenteLeitura} />
                </Stack>
            </DialogContent>
            <DialogActions>
                <BotaoComCarregamento onClick={fecharEResetar} disabled={salvando}>
                    {somenteLeitura ? 'Fechar' : 'Cancelar'}
                </BotaoComCarregamento>
                {!somenteLeitura ? (
                    <BotaoComCarregamento
                        variant="contained"
                        carregando={salvando}
                        disabled={!formValido || !houveAlteracao}
                        onClick={() => void salvar()}>
                        Salvar
                    </BotaoComCarregamento>
                ) : undefined}
            </DialogActions>
        </Dialog>
    );
}