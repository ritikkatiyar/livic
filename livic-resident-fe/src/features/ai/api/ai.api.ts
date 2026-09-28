import { apiRequest } from '@/src/api/client';

export type AICommandRequest = {
  message: string;
};

export type AICommandResponse = {
  message: string;
  executionId?: string;
  status?: 'COMPLETED' | 'FAILED';
};

export function runAICommand(payload: AICommandRequest, token: string): Promise<AICommandResponse> {
  return apiRequest<AICommandResponse>('/api/v1/ai/commands', {
    method: 'POST',
    token,
    useAiApi: true,
    timeout: 60000, // the assistant may make several model and backend calls before it answers
    body: JSON.stringify(payload),
  });
}
