import { describe, expect, it } from 'vitest';
import {
  COMMIT_FAILURE_MESSAGE,
  LOAD_FAILURE_MESSAGE,
  committedOutcomeMessage,
} from './ui-copy';

describe('submission recovery copy', () => {
  it('uses the exact recoverable failure messages', () => {
    expect(LOAD_FAILURE_MESSAGE).toBe('The current is hard to read. Retry.');
    expect(COMMIT_FAILURE_MESSAGE).toBe('Gust not committed — retry.');
  });

  it('describes every authoritative committed outcome', () => {
    expect(committedOutcomeMessage('reached')).toBe(
      'Your gust joined the council. The beacon is within reach.'
    );
    expect(committedOutcomeMessage('storm')).toBe(
      'Your gust joined the council. The route still crosses the squall.'
    );
    expect(committedOutcomeMessage('lost')).toBe(
      'Your gust joined the council. The Driftling still needs help.'
    );
  });
});
