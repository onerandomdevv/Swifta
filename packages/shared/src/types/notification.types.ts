import { NotificationType } from '../enums/notification-type.enum';
import { NotificationChannel } from '../enums/notification-channel.enum';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  channel: NotificationChannel;
  isRead: boolean;
  metadata?: any;
  createdAt: Date;
}
