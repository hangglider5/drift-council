import * as Phaser from 'phaser';
import type { CommitGustRequest, Direction, GridCell } from '../shared/domain';
import { ApiError, commitGust, fetchVoyage } from './api';
import { bindHud } from './hud';
import { commitRequestForPhase } from './interaction';
import { DriftScene } from './scenes/DriftScene';
import {
  initialClientState,
  reduceClientState,
  type ClientAction,
} from './state';
import { COMMIT_FAILURE_MESSAGE, LOAD_FAILURE_MESSAGE } from './ui-copy';

let state = initialClientState;
let keyboardCursor: GridCell = { x: 0, y: 0 };

const scene = new DriftScene(selectCell);
new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-container',
  transparent: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1024,
    height: 768,
  },
  scene: [scene],
});

const hud = bindHud({
  onDirection: chooseDirection,
  onCommit: commit,
  onReplay: replay,
  onRetry: retry,
});

function dispatch(action: ClientAction): void {
  state = reduceClientState(state, action);
  hud.render(state);
  scene.renderVoyage(state);
}

async function load(): Promise<void> {
  try {
    dispatch({ type: 'loaded', voyage: await fetchVoyage() });
  } catch {
    dispatch({
      type: 'loadFailed',
      message: LOAD_FAILURE_MESSAGE,
    });
  }
}

function selectCell(cell: GridCell): void {
  keyboardCursor = { ...cell };
  dispatch({ type: 'selectCell', cell });
}

function chooseDirection(direction: Direction): void {
  dispatch({ type: 'chooseDirection', direction });
}

async function sendPendingGust(request: CommitGustRequest): Promise<void> {
  try {
    const response = await commitGust(request);
    dispatch({ type: 'commitSucceeded', voyage: response.state });
  } catch (error) {
    if (error instanceof ApiError && error.body.code === 'STALE_DAY') {
      dispatch({ type: 'staleDay' });
      await load();
      return;
    }
    if (error instanceof ApiError && error.body.code === 'ALREADY_COMMITTED') {
      await load();
      return;
    }

    dispatch({
      type: 'commitFailed',
      message: COMMIT_FAILURE_MESSAGE,
    });
  }
}

function commit(): void {
  const request = commitRequestForPhase(state, 'preview');
  if (!request) return;

  dispatch({ type: 'submit' });
  void sendPendingGust(request);
}

function replay(): void {
  scene.replayRoute();
}

function retry(): void {
  const request = commitRequestForPhase(state, 'error');
  if (request) {
    dispatch({ type: 'retryCommit' });
    void sendPendingGust(request);
    return;
  }
  if (state.phase === 'error') void load();
}

const gameContainer = document.getElementById('game-container');
if (!gameContainer) throw new Error('Missing #game-container');

gameContainer.addEventListener('keydown', (event) => {
  const movement: Partial<Record<string, GridCell>> = {
    ArrowUp: { x: 0, y: -1 },
    ArrowRight: { x: 1, y: 0 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
  };
  const delta = movement[event.key];
  if (!delta) return;

  event.preventDefault();
  selectCell({
    x: Math.min(5, Math.max(0, keyboardCursor.x + delta.x)),
    y: Math.min(5, Math.max(0, keyboardCursor.y + delta.y)),
  });
});

hud.render(state);
scene.renderVoyage(state);
void load();
