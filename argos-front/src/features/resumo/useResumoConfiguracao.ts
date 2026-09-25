import { useCallback, useRef, useState } from 'react';
import { rotularQuadroJira } from '../../utils/rotulos';
import { useNotificacao } from '../../hooks/useNotificacao';
import { useCoresJira } from '../configuracoes/useCoresJira';
import { useConfiguracaoJira } from '../jira/useConfiguracaoJira';
import { useCategoriasSprint } from '../sprint/useCategoriasSprint';
import { useUsuariosToggl } from '../usuarios-toggl/useUsuariosToggl';
import { useStatusFinalSprint } from '../sprint/useStatusFinalSprint';
import { useQuadroPlanejamento } from '../configuracoes/useQuadroPlanejamento';
import { useResponsabilidadeSprint } from '../sprint/useResponsabilidadeSprint';
import { useMapeamentoJiraToggl } from '../configuracoes/useMapeamentoJiraToggl';

import {
    jiraCamposCompleto,
    statusFinalCompleto,
    togglObrigatorioCompleto,
    statusResponsavelCompleto,
    contarCamposJiraDefinidos,
    avaliarMapeamentoJiraToggl,
    configuracaoObrigatoriaCompleta,
} from '../configuracoes/completude';

import type {
    CategoriasSprint,
    StatusFinalSprint,
    UsuarioTogglResumo,
    ResponsabilidadeSprint,
    EntradaMapeamentoJiraToggl,
} from '../../api/tipos';

const CATEGORIAS_PADRAO: CategoriasSprint = { dev: [], rev: [], qa: [], agrupamento: 'ambos', tagsDetalhadas: [], corTag: '' };
const RESPONSABILIDADE_PADRAO: ResponsabilidadeSprint = { statusDev: [], statusRev: [], statusQa: [] };
const STATUS_FINAL_PADRAO: StatusFinalSprint = { statusConcluido: [], statusIgnorado: [] };
const CORES_VAZIAS: Record<string, string> = {};
const MAPEAMENTO_VAZIO: Record<string, EntradaMapeamentoJiraToggl> = {};
const COLUNAS_OCULTAS_VAZIAS: string[] = [];

export interface ResumoConfiguracao {
    carregando: boolean;
    carregado: boolean;
    recarregar: () => Promise<UsuarioTogglResumo[] | null>;

    usuariosCarregados: boolean;
    semUsuarios: boolean;
    quantidadeUsuarios: number;
    existeUsuarioAdministrador: boolean;
    nomeAdministrador: string | null;

    categorias: CategoriasSprint;
    responsabilidade: ResponsabilidadeSprint;
    statusFinal: StatusFinalSprint;

    jiraConfigurado: boolean;
    jiraUrlDominio: string;
    jiraEmail: string;
    jiraQuadroDev: string | null;
    jiraQuadroAnalise: string | null;
    quantidadeCamposJiraDefinidos: number;
    previsaoLiberacaoConfigurada: boolean;
    janelaAlertaPrevisaoLiberacaoDias: number;
    coresStatus: Record<string, string>;
    coresPrioridade: Record<string, string>;
    coresColunaDev: Record<string, string>;
    coresColunaAnalise: Record<string, string>;
    coresTime: Record<string, string>;
    coresEpico: Record<string, string>;
    quantidadeCoresStatus: number;
    quantidadeCoresPrioridade: number;
    quantidadeCoresColunaDev: number;
    quantidadeCoresColunaAnalise: number;
    quantidadeCoresTime: number;
    quantidadeCoresEpico: number;
    colunasOcultasDev: string[];
    colunasOcultasAnalise: string[];
    quantidadeMapeamentosJira: number;
    mapeamentoJira: Record<string, EntradaMapeamentoJiraToggl>;
    usuariosToggl: UsuarioTogglResumo[];
    usuariosTogglSemMapeamento: UsuarioTogglResumo[];
    entradasMapeamentoInvalidas: string[];

    togglCompleto: boolean;
    statusResponsavelCompleto: boolean;
    statusFinalCompleto: boolean;
    jiraCamposCompleto: boolean;
    mapeamentoCompleto: boolean;
    configuracaoCompleta: boolean;
}

export function useResumoConfiguracao(): ResumoConfiguracao {
    const { notificarErro } = useNotificacao();
    const { usuariosToggl, carregar: carregarUsuarios } = useUsuariosToggl();
    const { configuracao: configuracaoJira, carregar: carregarConfiguracaoJira } = useConfiguracaoJira();
    const { dados: categoriasCarregadas, carregar: carregarCategorias } = useCategoriasSprint();
    const { dados: responsabilidadeCarregada, carregar: carregarResponsabilidade } = useResponsabilidadeSprint();
    const { dados: statusFinalCarregado, carregar: carregarStatusFinal } = useStatusFinalSprint();
    const { dados: coresJira, carregar: carregarCoresJira } = useCoresJira();
    const { dados: mapeamentoJira, carregar: carregarMapeamentoJira } = useMapeamentoJiraToggl();
    const { dados: quadroPlanejamento, carregar: carregarQuadroPlanejamento } = useQuadroPlanejamento();

    const [carregado, setCarregado] = useState(false);
    const [usuariosCarregados, setUsuariosCarregados] = useState(false);
    const [cargasEmAndamento, setCargasEmAndamento] = useState(0);

    const cargaEmAndamentoRef = useRef<Promise<UsuarioTogglResumo[] | null> | null>(null);
    const cargaPendenteRef = useRef<Promise<UsuarioTogglResumo[] | null> | null>(null);

    const executarRecarga = useCallback(async (): Promise<UsuarioTogglResumo[] | null> => {
        function tentar<T>(carga: Promise<T>, mensagemErro: string): Promise<T | null> {
            return carga.catch((erro: unknown) => {
                notificarErro(erro, mensagemErro);
                return null;
            });
        }

        setCargasEmAndamento((atual) => atual + 1);
        try {
            const [lista] = await Promise.all([
                tentar(carregarUsuarios(), 'Não foi possível listar os usuários do Toggl'),
                tentar(carregarConfiguracaoJira(), 'Não foi possível carregar a configuração do Jira'),
                tentar(carregarCategorias(), 'Não foi possível carregar as configurações'),
                tentar(carregarResponsabilidade(), 'Não foi possível carregar o status por responsável'),
                tentar(carregarStatusFinal(), 'Não foi possível carregar os status finais'),
                tentar(carregarCoresJira(), 'Não foi possível carregar o mapeamento de cores do Jira'),
                tentar(carregarMapeamentoJira(), 'Não foi possível carregar o mapeamento Jira ↔ Toggl'),
                tentar(carregarQuadroPlanejamento(), 'Não foi possível carregar a configuração do quadro do Jira'),
            ]);
            if (lista !== null) setUsuariosCarregados(true);
            return lista;
        } finally {
            setCargasEmAndamento((atual) => atual - 1);
            setCarregado(true);
        }
    }, [
        notificarErro,
        carregarUsuarios,
        carregarConfiguracaoJira,
        carregarCategorias,
        carregarResponsabilidade,
        carregarStatusFinal,
        carregarCoresJira,
        carregarMapeamentoJira,
        carregarQuadroPlanejamento,
    ]);

    const recarregar = useCallback((): Promise<UsuarioTogglResumo[] | null> => {
        function iniciar(): Promise<UsuarioTogglResumo[] | null> {
            const carga = executarRecarga().finally(() => {
                cargaEmAndamentoRef.current = null;
            });
            cargaEmAndamentoRef.current = carga;
            return carga;
        }

        if (cargaEmAndamentoRef.current === null) return iniciar();

        if (cargaPendenteRef.current === null) {
            cargaPendenteRef.current = cargaEmAndamentoRef.current
                .catch(() => null)
                .then(() => {
                    cargaPendenteRef.current = null;
                    return iniciar();
                });
        }
        return cargaPendenteRef.current;
    }, [executarRecarga]);

    const categorias = categoriasCarregadas ?? CATEGORIAS_PADRAO;
    const responsabilidade = responsabilidadeCarregada ?? RESPONSABILIDADE_PADRAO;
    const statusFinal = statusFinalCarregado ?? STATUS_FINAL_PADRAO;
    const administrador = usuariosToggl.find((usuario) => usuario.administrador);
    const jiraUrlDominio = configuracaoJira?.urlDominio ?? '';
    const jiraEmail = configuracaoJira?.email ?? '';
    const jiraQuadroDev = configuracaoJira?.quadroDevId != null
        ? rotularQuadroJira(configuracaoJira.quadroDevId, configuracaoJira.quadroDevNome)
        : null;
    const jiraQuadroAnalise = configuracaoJira?.quadroAnaliseId != null
        ? rotularQuadroJira(configuracaoJira.quadroAnaliseId, configuracaoJira.quadroAnaliseNome)
        : null;
    const camposJiraCompletos = jiraCamposCompleto(configuracaoJira);
    const mapeamento = mapeamentoJira?.mapeamento ?? MAPEAMENTO_VAZIO;
    const avaliacaoMapeamento = avaliarMapeamentoJiraToggl(mapeamento, usuariosToggl);
    const mapeamentoCompleto = usuariosCarregados && avaliacaoMapeamento.completo;

    return {
        carregando: cargasEmAndamento > 0,
        carregado,
        recarregar,

        usuariosCarregados,
        semUsuarios: usuariosCarregados && usuariosToggl.length === 0,
        quantidadeUsuarios: usuariosToggl.length,
        existeUsuarioAdministrador: administrador !== undefined,
        nomeAdministrador: administrador?.nomeExibicao ?? null,

        categorias,
        responsabilidade,
        statusFinal,

        jiraConfigurado: jiraUrlDominio.trim() !== '' && jiraEmail.trim() !== '',
        jiraUrlDominio,
        jiraEmail,
        jiraQuadroDev,
        jiraQuadroAnalise,
        quantidadeCamposJiraDefinidos: contarCamposJiraDefinidos(configuracaoJira),
        previsaoLiberacaoConfigurada: (configuracaoJira?.campoPrevisaoLiberacaoId ?? '').trim() !== '',
        janelaAlertaPrevisaoLiberacaoDias: configuracaoJira?.janelaAlertaPrevisaoLiberacaoDias || 5,
        coresStatus: coresJira?.coresStatus ?? CORES_VAZIAS,
        coresPrioridade: coresJira?.coresPrioridade ?? CORES_VAZIAS,
        coresColunaDev: coresJira?.coresColunaDev ?? CORES_VAZIAS,
        coresColunaAnalise: coresJira?.coresColunaAnalise ?? CORES_VAZIAS,
        coresTime: coresJira?.coresTime ?? CORES_VAZIAS,
        coresEpico: coresJira?.coresEpico ?? CORES_VAZIAS,
        quantidadeCoresStatus: coresJira ? Object.keys(coresJira.coresStatus).length : 0,
        quantidadeCoresPrioridade: coresJira ? Object.keys(coresJira.coresPrioridade).length : 0,
        quantidadeCoresColunaDev: coresJira ? Object.keys(coresJira.coresColunaDev).length : 0,
        quantidadeCoresColunaAnalise: coresJira ? Object.keys(coresJira.coresColunaAnalise).length : 0,
        quantidadeCoresTime: coresJira ? Object.keys(coresJira.coresTime).length : 0,
        quantidadeCoresEpico: coresJira ? Object.keys(coresJira.coresEpico).length : 0,
        colunasOcultasDev: quadroPlanejamento?.colunasOcultasDev ?? COLUNAS_OCULTAS_VAZIAS,
        colunasOcultasAnalise: quadroPlanejamento?.colunasOcultasAnalise ?? COLUNAS_OCULTAS_VAZIAS,
        quantidadeMapeamentosJira: Object.keys(mapeamento).length,
        mapeamentoJira: mapeamento,
        usuariosToggl,
        usuariosTogglSemMapeamento: avaliacaoMapeamento.usuariosTogglSemPar,
        entradasMapeamentoInvalidas: avaliacaoMapeamento.entradasInvalidas,

        togglCompleto: togglObrigatorioCompleto(categorias),
        statusResponsavelCompleto: statusResponsavelCompleto(responsabilidade),
        statusFinalCompleto: statusFinalCompleto(statusFinal),
        jiraCamposCompleto: camposJiraCompletos,
        mapeamentoCompleto,
        configuracaoCompleta: configuracaoObrigatoriaCompleta({
            ...categorias,
            ...responsabilidade,
            ...statusFinal,
            camposJiraCompletos,
            mapeamentoCompleto,
        }),
    };
}