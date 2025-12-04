import type { SessionResponse } from '../types/session';

export const fetchSession = async (sessionId: string): Promise<SessionResponse> => {
  const response = await fetch(`/api/session/${sessionId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch session: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};
