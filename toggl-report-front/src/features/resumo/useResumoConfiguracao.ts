import { useCallback, useRef, useState } from 'react';
import { useNotificacao } from '../../hooks/useNotificacao';
import { useCoresJira } from '../configuracoes/useCoresJira';
import { useConfiguracaoJira } from '../jira/useConfiguracaoJira';
import { useCategoriasSprint } from '../sprint/useCategoriasSprint';
import { useUsuariosToggl } from '../usuarios-toggl/useUsuariosToggl';
import { useStatusFinalSprint } from '../sprint/useStatusFinalSprint';
import { useResponsabilidadeSprint } from '../sprint/useResponsabilidadeSprint';
import { useMapeamentoJiraToggl } from '../configuracoes/useMapeamentoJiraToggl';

import {
    togglObrigatorioCompleto,
    statusResponsavelCompleto,
    configuracaoObrigatoriaCompleta,
} from '../configuracoes/completude';

import type {
    ConfiguracaoJira,
    CategoriasSprint,
    StatusFinalSprint,
    UsuarioTogglResumo,
    ResponsabilidadeSprint,
} from '../../api/tipos';

const CATEGORIAS_PADRAO: CategoriasSprint = { dev: [], rev: [], qa: [], agrupamento: 'ambos', tagsDetalhadas: [], corTag: '' };
const RESPONSABILIDADE_PADRAO: ResponsabilidadeSprint = { statusDev: [], statusRev: [], statusQa: [] };
const STATUS_FINAL_PADRAO: StatusFinalSprint = { statusConcluido: [], statusIgnorado: [] };

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
    quantidadeCamposJiraDefinidos: number;
    quantidadeCoresStatus: number;
    quantidadeCoresPrioridade: number;
    quantidadeMapeamentosJira: number;

    togglCompleto: boolean;
    statusResponsavelCompleto: boolean;
    configuracaoCompleta: boolean;
}

function contarCamposJiraDefinidos(configuracao: ConfiguracaoJira | null): number {
    if (!configuracao) return 0;
    return [
        configuracao.campoEstimativaDesenvolvimentoId,
        configuracao.campoEstimativaRevisaoId,
        configuracao.campoEstimativaTestesId,
        configuracao.campoRevisadoPorId,
    ].filter((id) => id.trim() !== '').length;
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
    const administrador = usuariosToggl.find((usuario) => usuario.administrador);
    const jiraUrlDominio = configuracaoJira?.urlDominio ?? '';

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
        statusFinal: statusFinalCarregado ?? STATUS_FINAL_PADRAO,

        jiraConfigurado: jiraUrlDominio.trim() !== '' && (configuracaoJira?.email.trim() ?? '') !== '',
        jiraUrlDominio,
        quantidadeCamposJiraDefinidos: contarCamposJiraDefinidos(configuracaoJira),
        quantidadeCoresStatus: coresJira ? Object.keys(coresJira.coresStatus).length : 0,
        quantidadeCoresPrioridade: coresJira ? Object.keys(coresJira.coresPrioridade).length : 0,
        quantidadeMapeamentosJira: mapeamentoJira ? Object.keys(mapeamentoJira.mapeamento).length : 0,

        togglCompleto: togglObrigatorioCompleto(categorias),
        statusResponsavelCompleto: statusResponsavelCompleto(responsabilidade),
        configuracaoCompleta: configuracaoObrigatoriaCompleta({ ...categorias, ...responsabilidade }),
    };
}