import { withCandidateGust } from '../shared/aggregation';
import type {
  Direction,
  GridCell,
  Gust,
  RouteResult,
  VoyageState,
} from '../shared/domain';
import { createMap } from '../shared/map';
import { simulateRoute } from '../shared/simulation';

export type ClientPhase =
  'loading' | 'ready' | 'preview' | 'submitting' | 'committed' | 'error';

export type ClientState = {
  phase: ClientPhase;
  voyage: VoyageState | null;
  selectedCell: GridCell | null;
  pending: Gust | null;
  previewRoute: RouteResult | null;
  error: string | null;
};

export type ClientAction =
  | { type: 'loaded'; voyage: VoyageState }
  | { type: 'loadFailed'; message: string }
  | { type: 'selectCell'; cell: GridCell }
  | { type: 'chooseDirection'; direction: Direction }
  | { type: 'submit' }
  | { type: 'commitSucceeded'; voyage: VoyageState }
  | { type: 'commitFailed'; message: string }
  | { type: 'retryCommit' }
  | { type: 'staleDay' };

export const initialClientState: ClientState = {
  phase: 'loading',
  voyage: null,
  selectedCell: null,
  pending: null,
  previewRoute: null,
  error: null,
};

function buildPreview(
  voyage: VoyageState,
  pending: Gust
): Pick<ClientState, 'pending' | 'previewRoute'> {
  const previewAggregate = withCandidateGust(voyage.aggregate, pending);
  const map = createMap(voyage.mapSeed);
  return {
    pending,
    previewRoute: simulateRoute(map, previewAggregate),
  };
}

export function reduceClientState(
  state: ClientState,
  action: ClientAction
): ClientState {
  switch (action.type) {
    case 'loaded':
      return {
        phase: action.voyage.playerContribution ? 'committed' : 'ready',
        voyage: action.voyage,
        selectedCell: action.voyage.playerContribution?.cell ?? null,
        pending: null,
        previewRoute: null,
        error: null,
      };
    case 'loadFailed':
      return {
        ...initialClientState,
        phase: 'error',
        error: action.message,
      };
    case 'selectCell': {
      if (state.phase === 'submitting' || state.phase === 'committed') {
        return state;
      }
      if (!state.voyage) return state;

      if (
        state.pending &&
        (state.phase === 'preview' || state.phase === 'error')
      ) {
        return {
          ...state,
          phase: 'preview',
          selectedCell: action.cell,
          ...buildPreview(state.voyage, {
            cell: action.cell,
            direction: state.pending.direction,
          }),
          error: null,
        };
      }

      return {
        ...state,
        phase: 'ready',
        selectedCell: action.cell,
        error: null,
      };
    }
    case 'chooseDirection': {
      if (
        !state.voyage ||
        !state.selectedCell ||
        state.phase === 'submitting' ||
        state.phase === 'committed' ||
        state.phase === 'loading'
      ) {
        return state;
      }

      return {
        ...state,
        phase: 'preview',
        ...buildPreview(state.voyage, {
          cell: state.selectedCell,
          direction: action.direction,
        }),
        error: null,
      };
    }
    case 'submit':
      if (state.phase !== 'preview' || !state.pending) return state;
      return { ...state, phase: 'submitting', error: null };
    case 'commitSucceeded':
      if (state.phase !== 'submitting') return state;
      return {
        phase: 'committed',
        voyage: action.voyage,
        selectedCell: action.voyage.playerContribution?.cell ?? null,
        pending: null,
        previewRoute: null,
        error: null,
      };
    case 'commitFailed':
      if (state.phase !== 'submitting' || !state.pending) return state;
      return { ...state, phase: 'error', error: action.message };
    case 'retryCommit':
      if (state.phase !== 'error' || !state.pending) return state;
      return { ...state, phase: 'submitting', error: null };
    case 'staleDay':
      return {
        ...initialClientState,
        error: "That voyage just closed. Loading today's field…",
      };
  }
}
