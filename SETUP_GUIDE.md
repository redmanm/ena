# Setup & Deployment Guide

## Prerequisites

- Node.js 18+ (with npm)
- MySQL 8.0+ or PostgreSQL 12+
- Git (optional)

## Local Development Setup

### 1. Clone/Download Project

```bash
cd /path/to/project
```

### 2. Install Dependencies

```bash
npm install --legacy-peer-deps
```

This installs all required packages. The `--legacy-peer-deps` flag resolves peer dependency conflicts.

### 3. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your database credentials:

```env
DB_USER=postgres          # or 'root' for MySQL
DB_PASS=admin             # Your password
DB_HOST=localhost         # Database host
DB_PORT=5432              # PostgreSQL: 5432, MySQL: 3306
DB_NAME=ena_visitors_db   # Database name

NODE_ENV=development
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=24h
```

### 4. Create Database

#### For MySQL:
```bash
mysql -u root -p
mysql> CREATE DATABASE ena_visitors_db;
mysql> EXIT;

# Run schema
mysql -u root -p ena_visitors_db < scripts/schema.sql

# Optional: Seed data
mysql -u root -p ena_visitors_db < scripts/seed-data.sql
```

#### For PostgreSQL:
```bash
createdb ena_visitors_db

# Run schema
psql -U postgres -d ena_visitors_db -f scripts/schema.sql

# Optional: Seed data
psql -U postgres -d ena_visitors_db -f scripts/seed-data.sql
```

### 5. Start Development Server

```bash
npm run dev
```

The server starts at `http://localhost:3000`

### 6. Login

Navigate to `http://localhost:3000/login` and use any test credential:

- Email: `abel.manager@ena.et`
- Password: `password123`

## Development Workflow

### Useful Scripts

```bash
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run type-check   # Check TypeScript
```

### Code Structure

- **Pages**: `app/(app)/*/page.tsx` - Add new pages here
- **Components**: `components/*.tsx` - Create reusable components
- **Services**: `lib/*-service.ts` - Business logic
- **Styles**: `app/globals.css` - Global styles
- **API**: `app/api/*/route.ts` - API endpoints

### Adding a New Feature

1. Create page in `app/(app)/feature-name/page.tsx`
2. Add API route in `app/api/feature-name/route.ts`
3. Create component in `components/feature-name.tsx`
4. Add permissions in `lib/permissions.ts`
5. Update sidebar in `components/sidebar.tsx`

## Deployment

### Vercel Deployment (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

1. Connect your Git repository
2. Vercel auto-detects Next.js
3. Set environment variables in Vercel dashboard
4. Deploy with one click

### Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Deploy:

```bash
docker build -t ena-visitor-system .
docker run -p 3000:3000 --env-file .env.local ena-visitor-system
```

### Manual Server Deployment

```bash
# Build
npm run build

# Install production dependencies only
npm ci --legacy-peer-deps --production

# Start server
npm start
```

### Environment Variables for Production

Set these in your hosting platform:

```env
NODE_ENV=production
DB_USER=your_production_db_user
DB_PASS=your_production_db_password
DB_HOST=your_production_db_host
DB_PORT=5432
DB_NAME=ena_visitors_db_prod
JWT_SECRET=your_super_secret_key
JWT_EXPIRY=24h
```

## Database Backup & Recovery

### Backup MySQL

```bash
mysqldump -u root -p ena_visitors_db > backup.sql
```

### Restore MySQL

```bash
mysql -u root -p ena_visitors_db < backup.sql
```

### Backup PostgreSQL

```bash
pg_dump -U postgres ena_visitors_db > backup.sql
```

### Restore PostgreSQL

```bash
psql -U postgres -d ena_visitors_db < backup.sql
```

## Troubleshooting

### Port Already in Use

```bash
# Find process on port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Database Connection Error

1. Verify database is running
2. Check credentials in `.env.local`
3. Ensure database exists
4. Check firewall/network access

### Module Not Found

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### TypeScript Errors

```bash
npm run type-check
# Fix any reported errors
```

### Build Fails

```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

## Performance Optimization

### Database Optimization

```sql
-- Add indexes for faster queries
CREATE INDEX idx_appointment_status ON appointments(status);
CREATE INDEX idx_visitor_checkin ON visitors(checkInTime);
CREATE INDEX idx_audit_action ON audit_logs(action, timestamp);
```

### Caching Strategy

- Use Next.js ISR (Incremental Static Regeneration)
- Implement Redis for session caching
- Cache API responses with SWR on frontend

### Bundle Optimization

```bash
# Analyze bundle size
npm run build --analyze
```

## Security Checklist

- [ ] Change all test credentials
- [ ] Update JWT_SECRET to strong random value
- [ ] Enable HTTPS in production
- [ ] Set secure environment variables
- [ ] Configure database user with minimal permissions
- [ ] Enable database backups
- [ ] Set up monitoring/alerts
- [ ] Enable audit logging
- [ ] Regular security updates

## Monitoring & Logging

### Application Logs

Logs are displayed in:
- Development: Console output
- Production: Vercel/hosting platform logs

### Database Monitoring

Monitor:
- Query performance
- Slow queries
- Connection count
- Disk usage

### Audit Trail

View audit logs:
- Dashboard: Admin → Audit Logs
- API: `GET /api/audit-logs`
- Database: `audit_logs` table

## Support & Resources

- **Documentation**: See README.md
- **API Reference**: See API_DOCUMENTATION.md
- **Setup Issues**: Check troubleshooting section
- **Feature Requests**: Contact development team

---

**Version**: 1.0.0  
**Last Updated**: April 25, 2026
