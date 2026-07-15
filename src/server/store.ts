import { redis } from '@devvit/web/server';
import { DATA_TTL_SECONDS, type Gust } from '../shared/domain';
import { decodeGust, encodeGust } from '../shared/validation';

function gustKey(dayId: string): string {
  return `voyage:${dayId}:gusts`;
}

export async function readGusts(dayId: string): Promise<Gust[]> {
  const values = Object.values(await redis.hGetAll(gustKey(dayId)));
  const gusts: Gust[] = [];

  for (const value of values) {
    try {
      gusts.push(decodeGust(value));
    } catch (error) {
      console.error('Ignoring corrupt stored gust', error);
    }
  }

  return gusts;
}

export async function readPlayerGust(
  dayId: string,
  userId: string
): Promise<Gust | null> {
  const value = await redis.hGet(gustKey(dayId), userId);
  return value ? decodeGust(value) : null;
}

export async function commitStoredGust(
  dayId: string,
  userId: string,
  gust: Gust
): Promise<
  | { kind: 'inserted' }
  | { kind: 'same'; gust: Gust }
  | { kind: 'conflict'; gust: Gust }
> {
  const key = gustKey(dayId);
  const inserted = await redis.hSetNX(key, userId, encodeGust(gust));

  if (inserted === 1) {
    await redis.expire(key, DATA_TTL_SECONDS);
    return { kind: 'inserted' };
  }

  const existingValue = await redis.hGet(key, userId);
  if (!existingValue) {
    throw new Error('Contribution disappeared after hSetNX conflict');
  }

  const existing = decodeGust(existingValue);
  return encodeGust(existing) === encodeGust(gust)
    ? { kind: 'same', gust: existing }
    : { kind: 'conflict', gust: existing };
}
