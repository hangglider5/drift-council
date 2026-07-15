import type {
  ApiErrorBody,
  CommitGustRequest,
  CommitGustResponse,
  VoyageState,
} from '../shared/domain';

export class ApiError extends Error {
  constructor(
    public readonly httpStatus: number,
    public readonly body: ApiErrorBody
  ) {
    super(body.message);
    this.name = 'ApiError';
  }
}

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T | ApiErrorBody;
  if (!response.ok) {
    throw new ApiError(response.status, body as ApiErrorBody);
  }
  return body as T;
}

export async function fetchVoyage(): Promise<VoyageState> {
  return readJson(await fetch('/api/voyage'));
}

export async function commitGust(
  request: CommitGustRequest
): Promise<CommitGustResponse> {
  return readJson(
    await fetch('/api/gust', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request),
    })
  );
}
