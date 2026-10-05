import { apiRequest } from '@/src/api/client';
import { logger } from '@/src/utils/logger';
import type { ApiModel } from '@/src/api/models';

export type Announcement = ApiModel<'AnnouncementResponse', 'targetFloorNumber' | 'targetUnitId' | 'metadata' | 'readCount' | 'totalRecipientsCount', 'targetFloorNumber' | 'targetUnitId'>;

export function getAnnouncements(token: string, propertyId?: string): Promise<Announcement[]> {
  const query = propertyId ? `?propertyId=${propertyId}` : '';
  return apiRequest<any>(`/api/v1/announcement/announcements${query}`, {
    method: 'GET',
    token,
  }).then((res) => {
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.content)) return res.content;
    return [];
  });
}

export function markAnnouncementRead(token: string, id: string): Promise<void> {
  return apiRequest<void>(`/api/v1/announcement/announcements/${id}/read`, {
    method: 'POST',
    token,
  });
}

export function createAnnouncement(
  token: string,
  body: {
    propertyId: string;
    title: string;
    content: string;
    category: string;
    severity: string;
    targetType: string;
    targetFloorNumber?: number | null;
    targetUnitId?: string | null;
    metadata?: string;
  }
): Promise<Announcement> {
  logger.debug('[Announcement API] createAnnouncement called with:', body);
  return apiRequest<Announcement>('/api/v1/announcement/announcements', {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  })
    .then((result) => {
      logger.info('[Announcement API] Success:', result);
      return result;
    })
    .catch((error) => {
      logger.error('[Announcement API] Error:', error);
      throw error;
    });
}
