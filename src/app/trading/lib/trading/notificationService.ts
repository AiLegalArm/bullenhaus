import type { EngineState, NotificationEvent } from './types';

const makeId = () => crypto.randomUUID();

export class NotificationService {
  constructor(private state: EngineState) {}

  emit(event: Omit<NotificationEvent, 'id' | 'createdAt'>) {
    const notification: NotificationEvent = {
      ...event,
      id: makeId(),
      createdAt: new Date().toISOString(),
    };
    this.state.notifications.push(notification);
    return notification;
  }
}
