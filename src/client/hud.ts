import type { Direction, RouteOutcome } from '../shared/domain';
import type { ClientState } from './state';

export type HudCallbacks = {
  onDirection(direction: Direction): void;
  onCommit(): void;
  onReplay(): void;
  onRetry(): void;
};

export type HudController = {
  render(state: ClientState): void;
  destroy(): void;
};

function requiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing #${id}`);
  return element as T;
}

function formatCountdown(seconds: number): string {
  const remaining = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const tail = remaining % 60;
  return [hours, minutes, tail]
    .map((part) => part.toString().padStart(2, '0'))
    .join(':');
}

const previousOutcomeCopy: Record<RouteOutcome, string> = {
  reached: 'Yesterday: reached the beacon',
  storm: 'Yesterday: crossed the squall',
  lost: 'Yesterday: drifted away',
};

export function displayedDirection(state: ClientState): Direction | null {
  return (
    state.pending?.direction ??
    state.voyage?.playerContribution?.direction ??
    null
  );
}

export function bindHud(callbacks: HudCallbacks): HudController {
  const previousResult = requiredElement<HTMLSpanElement>('previous-result');
  const contributionCount =
    requiredElement<HTMLSpanElement>('contribution-count');
  const timeLeft = requiredElement<HTMLSpanElement>('time-left');
  const loadingPanel = requiredElement<HTMLDivElement>('loading-panel');
  const instruction = requiredElement<HTMLParagraphElement>('instruction');
  const impact = requiredElement<HTMLParagraphElement>('impact');
  const commitButton = requiredElement<HTMLButtonElement>('commit-button');
  const replayButton = requiredElement<HTMLButtonElement>('replay-button');
  const retryButton = requiredElement<HTMLButtonElement>('retry-button');
  const directionButtons = Array.from(
    document.querySelectorAll<HTMLButtonElement>('[data-direction]')
  );

  const onDirection = (event: Event): void => {
    const button = event.currentTarget as HTMLButtonElement;
    callbacks.onDirection(button.dataset.direction as Direction);
  };
  const onCommit = (): void => callbacks.onCommit();
  const onReplay = (): void => callbacks.onReplay();
  const onRetry = (): void => callbacks.onRetry();

  for (const button of directionButtons) {
    button.addEventListener('click', onDirection);
  }
  commitButton.addEventListener('click', onCommit);
  replayButton.addEventListener('click', onReplay);
  retryButton.addEventListener('click', onRetry);

  let displayedSeconds: number | null = null;
  let lastVoyage = null as ClientState['voyage'];
  const renderCountdown = (): void => {
    timeLeft.textContent =
      displayedSeconds === null
        ? '--:--:--'
        : formatCountdown(displayedSeconds);
  };
  const countdownInterval = window.setInterval(() => {
    if (displayedSeconds === null) return;
    displayedSeconds = Math.max(0, displayedSeconds - 1);
    renderCountdown();
  }, 1000);

  return {
    render(state): void {
      loadingPanel.hidden = state.phase !== 'loading';
      loadingPanel.textContent =
        state.phase === 'loading' && state.error
          ? state.error
          : 'Reading the currents…';

      if (state.voyage) {
        const serverSeconds = Math.max(0, state.voyage.secondsRemaining);
        if (state.voyage !== lastVoyage) {
          if (
            displayedSeconds === null ||
            Math.abs(serverSeconds - displayedSeconds) > 2
          ) {
            displayedSeconds = serverSeconds;
          }
          lastVoyage = state.voyage;
        }
        contributionCount.textContent = `${state.voyage.contributionCount} gust${
          state.voyage.contributionCount === 1 ? '' : 's'
        }`;
        previousResult.textContent =
          state.voyage.previous.kind === 'prologue'
            ? 'Prologue: the beacon was reached'
            : previousOutcomeCopy[state.voyage.previous.outcome];
      } else {
        lastVoyage = null;
        displayedSeconds = null;
        contributionCount.textContent = '0 gusts';
        previousResult.textContent = 'Prologue: the beacon was reached';
      }
      renderCountdown();

      const directionsDisabled =
        !state.selectedCell ||
        state.phase === 'submitting' ||
        state.phase === 'committed';
      const chosenDirection = displayedDirection(state);
      for (const button of directionButtons) {
        const direction = button.dataset.direction as Direction;
        button.disabled = directionsDisabled;
        button.setAttribute(
          'aria-pressed',
          String(chosenDirection === direction)
        );
      }

      commitButton.hidden = state.phase === 'committed';
      commitButton.disabled = state.phase !== 'preview';
      replayButton.hidden = state.phase !== 'committed';
      retryButton.hidden = state.phase !== 'error';

      if (state.phase === 'loading') {
        instruction.textContent = "Reading today's voyage.";
        impact.textContent = '';
      } else if (state.phase === 'ready') {
        instruction.textContent = state.selectedCell
          ? 'Choose a gust direction.'
          : "Tap a tile to place today's gust.";
        impact.textContent = '';
      } else if (state.phase === 'preview') {
        instruction.textContent = 'Preview your shared route.';
        impact.textContent = 'Commit when the current feels right.';
      } else if (state.phase === 'submitting') {
        instruction.textContent = 'Committing your gust…';
        impact.textContent = '';
      } else if (state.phase === 'committed') {
        instruction.textContent = 'Voyage joined.';
        impact.textContent =
          'Your gust is part of the council. Replay the route anytime.';
      } else {
        instruction.textContent = state.error ?? 'The current shifted.';
        impact.textContent = state.pending
          ? 'Your gust is still here. Retry when ready.'
          : '';
      }
    },
    destroy(): void {
      window.clearInterval(countdownInterval);
      for (const button of directionButtons) {
        button.removeEventListener('click', onDirection);
      }
      commitButton.removeEventListener('click', onCommit);
      replayButton.removeEventListener('click', onReplay);
      retryButton.removeEventListener('click', onRetry);
    },
  };
}
