import Constants from 'expo-constants';
import { FeedbackEventType, RecipeFeedbackEvent } from '../types';
import {
  enqueueFeedbackEvent,
  loadFeedbackQueue,
  saveFeedbackQueue,
} from '../utils/storage';

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getFeedbackEndpoint(): string | null {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  const endpoint = process.env.EXPO_PUBLIC_FEEDBACK_ENDPOINT
    || extra.EXPO_PUBLIC_FEEDBACK_ENDPOINT
    || extra.feedbackEndpoint;
  return endpoint ? String(endpoint).trim() : null;
}

export async function recordFeedbackEvent(input: {
  type: FeedbackEventType;
  recipeId?: string;
  mealType?: RecipeFeedbackEvent['mealType'];
  metadata?: RecipeFeedbackEvent['metadata'];
}): Promise<RecipeFeedbackEvent> {
  const event: RecipeFeedbackEvent = {
    id: createId(),
    type: input.type,
    recipeId: input.recipeId,
    mealType: input.mealType,
    metadata: input.metadata,
    createdAt: new Date().toISOString(),
  };
  await enqueueFeedbackEvent(event);
  return event;
}

export async function flushFeedbackQueue(): Promise<{
  sent: number;
  remaining: number;
  configured: boolean;
}> {
  const queue = await loadFeedbackQueue();
  const endpoint = getFeedbackEndpoint();

  if (!endpoint || queue.length === 0) {
    return {
      sent: 0,
      remaining: queue.length,
      configured: Boolean(endpoint),
    };
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ events: queue }),
    });

    if (!response.ok) {
      throw new Error(`Feedback upload failed: ${response.status}`);
    }

    await saveFeedbackQueue([]);
    return { sent: queue.length, remaining: 0, configured: true };
  } catch {
    return {
      sent: 0,
      remaining: queue.length,
      configured: true,
    };
  }
}
