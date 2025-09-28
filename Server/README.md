## Adding files to repo

cd findersnotkeepers
git add .
git commit -m "Added feature"
git push origin main

## Server

### Description

- Server sauts: Active Development
- API version: v1.0
- Maintainer: Obakeng Mokgatle

### Core functionality

- User authentication & authorization (JWT-based)

- Item listings management (Lost/Found items with images)

- Advanced search & filtering (Category, location, date, type)

- Secure messaging system (In-platform communication)

- Email notifications (SMTP integration)

- File upload system (Image storage for listings)

- Admin moderation panel (Content approval system)

### Security features

- Password hashing with bcryptjs

- JWT token authentication

- File type validation

- SQL injection prevention

- CORS configuration

- Input validation & sanitization

### Technology stack
- Runtime: Node.js + Express (Server framework)
- Database: PostgresSQL (Primary data storage)
- Authentication: JWT + bcryptjs (Secure user sessions)
- File Storage: Multer + Local FS (Image upload handling)
- Email Service:  Nodemailer (Notification system)
- Validation: Express-validator (Data validation)
- Environment: Dotenv (Configuration management)

### Server structure

server/
├── config/
│   └── database.js          # PostgreSQL connection pool
├── middleware/
│   ├── auth.js              # JWT authentication
│   └── upload.js            # File upload handling
├── models/
│   ├── User.js              # User data operations
│   ├── Listing.js           # Listing management
│   └── Email.js             # Email operations
├── routes/
│   ├── auth.js              # Authentication endpoints
│   ├── users.js             # User profile management
│   ├── listings.js          # Item listing CRUD
│   └── emails.js            # Email functionality
├── uploads/                 # File storage directory
├── .env                     # Environment variables
├── server.js               # Main server entry point
└── package.json            # Dependencies & scripts

### API endpoints

#### Authentication (/api/auth)

- POST /register - User registration

- POST /login - User login

- GET /me - Get current user profile

#### Users (/api/users)

- GET /profile - Get user profile

#### Listings (/api/listings)

- POST / - Create new listing (with image upload)

- GET / - Get all listings (with filters)

- GET /:id - Get specific listing

- GET /user/my-listings - Get user's listings

- PATCH /:id/status - Update listing status (Admin only)

#### Emails (/api/emails)

- POST /send - Send email notification

- GET /my-emails - Get user's email history

### System

- GET /api/health - Server health check

## Frontend integration

Authentication flow:
- Register: Send POST to /api/auth/register

- Login: Send POST to /api/auth/login

- Store Token: Save JWT in localStorage/sessionStorage

- API Calls: Include Authorization: Bearer <token> header

## Database schema

- users: User accounts and profiles

- listings: Lost/found item posts

- emails: Email history and notifications

- verifications: Ownership proof submissions

## Key relationships

- Users to Listings (One-to-Many)

- Listings to Verifications (One-to-Many)

- Users to Emails (One-to-Many)

## Testing & development

Run the following commands:
npm run dev      # Development with auto-reload
npm start        # Production start
npm test         # Run tests (when implemented)

## Error handling

- The API returns error responses in this format:
{
  "error": "Error type",
  "message": "Human-readable description",
  "details": {...} 
}

## Common HTTP status codes

- status 200 - Success

- status 201 - Created

- status 400 - Bad Request (validation errors)

- status 401 - Unauthorized (authentication required)

- status 403 - Forbidden (insufficient permissions)

- status 404 - Not Found

- status 500 - Internal Server Error

## Deployment

- HTTPS enforcement

- Rate limiting

- Helmet.js for security headers

- Database connection encryption

## Moitoring & logging

- Console logging for development

- Error tracking in API responses

- File upload tracking

- Planned Enhancem