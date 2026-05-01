import { NextResponse } from 'next/server';
import { requireSession, hasRole } from '@/lib/auth-server';
import { query } from '@/lib/db';

export async function GET() {
  const session = await requireSession();
  if ('response' in session) return session.response;
  const { user } = session;

  // Managers only see their department
  const isManager = user.role === 'Manager';
  const deptFilter = isManager ? `AND department_id = '${user.departmentId}'` : '';
  const deptFilterWhere = isManager ? `WHERE department_id = '${user.departmentId}'` : '';
  
  try {
    // 1. Summary Metrics
    const summaryResult = await query(`
      SELECT 
        COUNT(*) as total_appointments,
        COUNT(CASE WHEN status = 'CheckedIn' THEN 1 END) as active_checkins,
        COUNT(CASE WHEN status = 'CheckedOut' THEN 1 END) as completed_visits,
        COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) as cancelled_visits
      FROM appointments
      ${deptFilterWhere}
    `);
    const summary = summaryResult.rows[0];

    // 2. Department Breakdown
    const deptBreakdown = await query(`
      SELECT d.name, COUNT(a.id) as count
      FROM departments d
      LEFT JOIN appointments a ON a.department_id = d.id
      ${isManager ? `WHERE d.id = '${user.departmentId}'` : ''}
      GROUP BY d.name
      ORDER BY count DESC
    `);

    // 3. Location Distribution
    const locationDist = await query(`
      SELECT location, COUNT(*) as count
      FROM appointments
      ${deptFilterWhere}
      GROUP BY location
    `);

    // 4. Last 30 Days Trend
    const trends = await query(`
      SELECT appointment_date, COUNT(*) as count
      FROM appointments
      WHERE appointment_date >= CURRENT_DATE - INTERVAL '30 days'
      ${deptFilter}
      GROUP BY appointment_date
      ORDER BY appointment_date ASC
    `);

    // 5. Peak Hours (from visitor_checkins)
    const peakHours = await query(`
      SELECT EXTRACT(HOUR FROM check_in_time) as hour, COUNT(*) as count
      FROM visitor_checkins vc
      JOIN appointments a ON vc.appointment_id = a.id
      ${isManager ? `WHERE a.department_id = '${user.departmentId}'` : ''}
      GROUP BY hour
      ORDER BY hour ASC
    `);

    // 6. Logistics (Car/Material)
    const logistics = await query(`
      SELECT 
        COUNT(CASE WHEN has_car = true THEN 1 END) as with_car,
        COUNT(CASE WHEN has_material = true THEN 1 END) as with_material,
        COUNT(*) as total
      FROM visitor_checkins vc
      JOIN appointments a ON vc.appointment_id = a.id
      ${isManager ? `WHERE a.department_id = '${user.departmentId}'` : ''}
    `);

    // 7. Top Hosts
    const topHosts = await query(`
      SELECT u.full_name, COUNT(a.id) as count
      FROM users u
      JOIN appointments a ON a.host_user_id = u.id
      ${isManager ? `WHERE a.department_id = '${user.departmentId}'` : ''}
      GROUP BY u.full_name
      ORDER BY count DESC
      LIMIT 5
    `);

    return NextResponse.json({
      summary: {
        total: parseInt(summary.total_appointments),
        active: parseInt(summary.active_checkins),
        completed: parseInt(summary.completed_visits),
        cancelled: parseInt(summary.cancelled_visits),
        cancellationRate: summary.total_appointments > 0 
          ? (parseInt(summary.cancelled_visits) / parseInt(summary.total_appointments) * 100).toFixed(1) + '%'
          : '0%'
      },
      departments: deptBreakdown.rows.map(r => ({ name: r.name, value: parseInt(r.count) })),
      locations: locationDist.rows.map(r => ({ name: r.location, value: parseInt(r.count) })),
      trends: trends.rows.map(r => ({ date: r.appointment_date, count: parseInt(r.count) })),
      peakHours: peakHours.rows.map(r => ({ hour: parseInt(r.hour), count: parseInt(r.count) })),
      logistics: {
        carPercentage: logistics.rows[0].total > 0 
          ? (parseInt(logistics.rows[0].with_car) / parseInt(logistics.rows[0].total) * 100).toFixed(1)
          : 0,
        materialPercentage: logistics.rows[0].total > 0 
          ? (parseInt(logistics.rows[0].with_material) / parseInt(logistics.rows[0].total) * 100).toFixed(1)
          : 0
      },
      topHosts: topHosts.rows.map(r => ({ name: r.full_name, count: parseInt(r.count) }))
    });

  } catch (error) {
    console.error('Analytics Error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
