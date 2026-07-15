import type { CommitGustRequest } from '../shared/domain';
import type { ClientState } from './state';

type CommitStartPhase = 'preview' | 'error';

export function commitRequestForPhase(
  state: ClientState,
  phase: CommitStartPhase
): CommitGustRequest | null {
  if (state.phase !== phase || !state.voyage || !state.pending) return null;

  return {
    dayId: state.voyage.dayId,
    cell: { ...state.pending.cell },
    direction: state.pending.direction,
  };
}
