import type { Appointment, VisitorCheckIn } from './types';

export interface VisitorDuration {
  visitorId: string;
  /** Visitor display name (alias for visitorName, for UI compatibility) */
  name: string;
  visitorName: string;
  hostName: string;
  location: string;
  checkInTime: Date;
  checkOutTime?: Date;
  durationMinutes: number;
  durationDisplay: string;
  isCurrentlyInside: boolean;
  badge?: string;
  email?: string;
  phone?: string;
}

export function calculateDuration(checkInTime: Date | string, checkOutTime?: Date | string): number {
  const startTime = new Date(checkInTime);
  const endTime = checkOutTime ? new Date(checkOutTime) : new Date();
  return Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));
}

export function formatDuration(minutes: number): string {
  if (minutes < 1) return 'Less than 1 min';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/** Build duration rows from check-ins joined to appointments */
export function getVisitorDurationDetails(
  checkins: VisitorCheckIn[],
  appointments: Appointment[]
): VisitorDuration[] {
  const aptById = new Map(appointments.map((a) => [a.id, a]));
  return checkins
    .filter((c) => c.checkInTime)
    .map((c) => {
      const apt = aptById.get(c.appointmentId);
      const hostName = '—';
      const durationMinutes = calculateDuration(c.checkInTime, c.checkOutTime);
      const isCurrentlyInside = !c.checkOutTime;
      const visitorName = apt?.visitorName ?? 'Unknown';
      return {
        visitorId: c.id,
        name: visitorName,
        visitorName,
        hostName,
        location: apt?.location ?? 'ENA',
        checkInTime: new Date(c.checkInTime),
        checkOutTime: c.checkOutTime ? new Date(c.checkOutTime) : undefined,
        durationMinutes,
        durationDisplay: formatDuration(durationMinutes),
        isCurrentlyInside,
        badge: c.badgeNumber,
        email: apt?.visitorEmail,
        phone: apt?.visitorPhone,
      };
    });
}

export function getAverageDuration(checkins: VisitorCheckIn[], appointments: Appointment[]): number {
  const details = getVisitorDurationDetails(checkins, appointments);
  const completed = details.filter((d) => d.checkOutTime);
  if (completed.length === 0) return 0;
  const total = completed.reduce((sum, d) => sum + d.durationMinutes, 0);
  return Math.floor(total / completed.length);
}

export function getMostFrequentVisitors(
  checkins: VisitorCheckIn[],
  appointments: Appointment[],
  limit: number = 10
) {
  const aptById = new Map(appointments.map((a) => [a.id, a]));
  const visitCount: Record<string, { count: number; name: string; email?: string; phone?: string; last?: Date }> =
    {};
  checkins.forEach((c) => {
    const apt = aptById.get(c.appointmentId);
    const name = apt?.visitorName ?? 'Unknown';
    if (!visitCount[name]) {
      visitCount[name] = { count: 0, name, email: apt?.visitorEmail, phone: apt?.visitorPhone };
    }
    visitCount[name].count++;
    visitCount[name].last = new Date(c.checkInTime);
  });
  return Object.values(visitCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((v) => ({
      name: v.name,
      count: v.count,
      lastVisit: v.last,
      email: v.email,
      phone: v.phone,
    }));
}

export function getAverageDurationByLocation(checkins: VisitorCheckIn[], appointments: Appointment[]) {
  const aptById = new Map(appointments.map((a) => [a.id, a]));
  const byLocation: Record<string, number[]> = {};
  checkins.forEach((c) => {
    if (!c.checkOutTime) return;
    const apt = aptById.get(c.appointmentId);
    const loc = apt?.location ?? 'ENA';
    const dur = calculateDuration(c.checkInTime, c.checkOutTime);
    if (!byLocation[loc]) byLocation[loc] = [];
    byLocation[loc].push(dur);
  });
  const result: Record<string, { avg: number; total: number; count: number }> = {};
  Object.keys(byLocation).forEach((loc) => {
    const durations = byLocation[loc];
    if (durations.length > 0) {
      const total = durations.reduce((a, b) => a + b, 0);
      result[loc] = { avg: Math.floor(total / durations.length), total, count: durations.length };
    }
  });
  return result;
}
