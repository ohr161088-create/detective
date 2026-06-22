import { createInMemoryRewardLedger } from '../../src/server/receipt-detective/rewardLedger';
import { handleTossDisconnectRequest } from '../../src/server/receipt-detective/tossDisconnect';

const ledger = createInMemoryRewardLedger();

type ApiResponse = {
  status: (statusCode: number) => ApiResponse;
  json: (body: unknown) => void;
};

type ApiRequest = {
  method?: string;
  body?: unknown;
};

export default async function handler(request: ApiRequest, response: ApiResponse) {
  const result = await handleTossDisconnectRequest(
    {
      method: request.method ?? 'GET',
      body: request.body,
    },
    ledger,
  );

  response.status(result.status).json(result.body);
}
