# Admin Dashboard Guide

## Overview
A comprehensive admin dashboard has been created at `/admin` for moderating and managing the FindersNotKeepers platform.

## Features

### 1. **Listings Moderation**
- View all pending listings
- Approve or deny listings
- See listing details, category, location, and user information
- Automatically updates listing status

### 2. **Claims Moderation**
- View all pending claims for items
- Approve or deny claims
- When approved, automatically updates listing status to "claimed"
- View claim details including proof images

### 3. **Audit Log Reports**
- Generate reports based on:
  - **Date Range**: Start date and end date filters
  - **User ID**: Filter by specific user
  - **Action**: Filter by action type (login, create listing, claim item, etc.)
- Export reports to CSV format
- View up to 1000 most recent audit log entries
- See IP address and user agent for each action

### 4. **User Management**
- View all registered users
- Ban or unban users
- See user role, status, and creation date
- Prevents admin from banning themselves

## Access

### URL
```
/admin
```

### Authorization
- **Role Required**: Admin
- Users without admin role will be redirected to /listings with an access denied message

### Setting Admin Role
To make a user an admin, update their role in the database:
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

## Frontend Files Created

### 1. **Admin.jsx** (`LiveSite/src/Pages/Admin.jsx`)
Main admin dashboard component with:
- Tab navigation system
- Listings moderation interface
- Claims moderation interface
- Audit report generator with filters
- User management table
- CSV export functionality

### 2. **Admin.css** (`LiveSite/src/Pages/Admin.css`)
Beautiful, modern styling with:
- Gradient purple theme
- Card-based layouts
- Responsive tables
- Hover effects and animations
- Mobile-friendly design

### 3. **WebRoute.jsx** (Updated)
Added admin route:
```jsx
<Route path="/admin" element={<Admin />} />
```

## Backend Files Created

### 1. **admin.js** (`Server/routes/admin.js`)
Complete admin API with endpoints for:

#### Listings Moderation
- `GET /api/admin/listings` - Get pending listings
- `PUT /api/admin/listings/:id/approve` - Approve listing
- `PUT /api/admin/listings/:id/deny` - Deny listing

#### Claims Moderation
- `GET /api/admin/claims` - Get pending claims
- `PUT /api/admin/claims/:id/approve` - Approve claim
- `PUT /api/admin/claims/:id/deny` - Deny claim

#### Audit Reports
- `GET /api/admin/audit-logs` - Get audit logs with filters
  - Query params: `startDate`, `endDate`, `userId`, `action`

#### User Management
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/ban` - Ban user
- `PUT /api/admin/users/:id/unban` - Unban user

#### Dashboard Stats
- `GET /api/admin/stats` - Get dashboard statistics
  - Returns: total users, listings, pending items

### 2. **server.js** (Updated)
Added admin route:
```javascript
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);
```

## How to Use

### For Admins

1. **Login as Admin**
   - Ensure your user account has `role = 'admin'` in the database
   - Login normally through `/login`

2. **Access Dashboard**
   - Navigate to `/admin` or click admin link from navigation

3. **Moderate Listings**
   - Click "Listings Moderation" tab
   - Review pending listings
   - Click "Approve" or "Deny" for each listing

4. **Moderate Claims**
   - Click "Claims Moderation" tab
   - Review pending claims
   - Approve legitimate claims or deny fraudulent ones

5. **Generate Reports**
   - Click "Audit Reports" tab
   - Set filters (date range, user, action type)
   - Click "Generate Report"
   - Optionally export to CSV

6. **Manage Users**
   - Click "User Management" tab
   - View all users
   - Ban problematic users
   - Unban users as needed

## Database Requirements

### Required Tables

#### 1. **users** table
Must have:
- `role` column (VARCHAR) - values: 'user', 'admin'
- `banned` column (BOOLEAN) - auto-created if missing

#### 2. **listings** table
Must have:
- `status` column - values: 'pending', 'approved', 'denied', 'claimed'

#### 3. **verifications** table (for claims)
Must have:
- `status` column - values: 'pending', 'approved', 'denied'
- `user_id` - claimant ID
- `listing_id` - listing being claimed

#### 4. **audit_logs** table
Should have:
- `user_id` - user who performed action
- `action_id` - reference to actions table
- `created_at` - timestamp
- `ip_address` - user's IP
- `user_agent` - browser/client info

#### 5. **actions** table
Reference table for action types:
```sql
1  - User Login
2  - User Logout
3  - Create Listing
4  - Edit Listing
5  - Delete Listing
6  - Claim Item
7  - Send Message
8  - Update Profile
9  - Report User
10 - Password Reset
11 - Account Creation
```

## API Authentication

All admin endpoints require:
- Valid JWT token in Authorization header
- User must have `role = 'admin'`

Example request:
```javascript
fetch('http://localhost:5000/api/admin/listings', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

## Features Breakdown

### Listings Moderation
- **Purpose**: Review user-submitted listings before going live
- **Workflow**:
  1. User creates listing → status = 'pending'
  2. Admin reviews listing
  3. Admin approves → status = 'approved' (visible to all)
  4. Admin denies → status = 'denied' (hidden)

### Claims Moderation
- **Purpose**: Verify legitimate ownership claims
- **Workflow**:
  1. User submits claim for found item
  2. Admin reviews claim and proof
  3. Admin approves → listing status = 'claimed'
  4. Admin denies → claim rejected, listing stays active

### Audit Reports
- **Purpose**: Track user activity and system events
- **Use Cases**:
  - Investigate suspicious activity
  - Generate compliance reports
  - Monitor user behavior
  - Track system usage patterns

### User Management
- **Purpose**: Control user access
- **Actions**:
  - Ban: User cannot login or perform actions
  - Unban: Restore user access
  - View user activity and creation date

## Security Features

1. **Role-Based Access Control**
   - Only admin users can access admin routes
   - Frontend checks user role before rendering
   - Backend validates admin role on every request

2. **Self-Protection**
   - Admins cannot ban themselves
   - Prevents accidental lockout

3. **Audit Trail**
   - All actions logged to audit_logs table
   - Includes IP address and user agent
   - Searchable and exportable

## Responsive Design

The admin dashboard is fully responsive:
- **Desktop**: Multi-column grid layouts
- **Tablet**: Adjusted column counts
- **Mobile**: Single column, stacked elements

## Customization

### Change Theme Colors
Edit `Admin.css`:
```css
/* Primary gradient */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Accent colors */
.admin-btn.approve { background: #4caf50; } /* Green */
.admin-btn.deny { background: #f44336; } /* Red */
```

### Add New Actions to Audit Filter
Edit `Admin.jsx`:
```jsx
<option value="12">New Action</option>
```

And add to database:
```sql
INSERT INTO actions (action_id, description) VALUES (12, 'New Action');
```

## Troubleshooting

### "Access Denied" Message
- Check user role in database: `SELECT role FROM users WHERE id = ?`
- Ensure role is exactly 'admin' (case-sensitive)

### No Pending Items Showing
- Check database for items with status='pending'
- Verify API is returning data (check browser console)

### CSV Export Not Working
- Ensure audit logs were generated first
- Check browser console for JavaScript errors
- Verify CSV blob creation is supported in browser

### Backend Errors
- Check database tables exist
- Verify adminAuth middleware is working
- Check server logs for detailed error messages

## Future Enhancements

Potential additions:
- [ ] Dashboard analytics with charts
- [ ] Bulk approve/deny actions
- [ ] Email notifications for admins
- [ ] Activity timeline view
- [ ] Advanced search and filters
- [ ] User role management (create/modify roles)
- [ ] Scheduled reports
- [ ] Real-time notifications for pending items

## Testing Checklist

Before deploying:
- [ ] Create admin user in database
- [ ] Test login as admin
- [ ] Access /admin page
- [ ] Approve a test listing
- [ ] Deny a test listing
- [ ] Approve a test claim
- [ ] Generate audit report
- [ ] Export report to CSV
- [ ] Ban a test user
- [ ] Unban test user
- [ ] Verify non-admin users cannot access
- [ ] Check mobile responsiveness

## Support

For issues or questions:
- Check server logs: `npm run dev` output in Server/
- Check browser console for frontend errors
- Verify database schema matches requirements
- Ensure JWT_SECRET is set in environment variables

---

**Admin Dashboard Successfully Created! 🎉**

Access it at: `/admin`
