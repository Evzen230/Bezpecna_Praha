# CityAlert - Real-time Emergency Alert System

## Overview

CityAlert is a full-stack web application for managing and displaying real-time emergency alerts on an interactive map. The system allows administrators to create, update, and manage alerts for road hazards and criminal activity. The public can view alerts on an interactive map without requiring authentication, while only authenticated administrators can create and manage alerts.

## User Preferences

Preferred communication style: Simple, everyday language.

## Project Vision
User envisions a Google Maps-like system for GAME environments where admins can manage city infrastructure:
- Add/remove streets and roads
- Create new map points and infrastructure  
- Manage road closures with precise control
- Provide navigation-like route suggestions
- Full administrative control over city's digital representation
- Custom coordinate system (no GPS needed - game environment)

Current decision: Build game-focused city management system with custom coordinates and full admin control over map elements.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: shadcn/ui component library built on top of Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy using session-based authentication
- **Session Storage**: PostgreSQL-backed session store using connect-pg-simple
- **Password Security**: Node.js crypto module with scrypt for password hashing

### Database Architecture
- **Database**: PostgreSQL (using Neon serverless)
- **ORM**: Drizzle ORM with schema-first approach
- **Schema**: Two main tables - users and alerts with proper relations
- **Migration**: Drizzle Kit for database migrations

## Admin Features & Security

### Admin Panel Interface
- **Location**: `/admin` - accessible only to admin users (redirects others to home)
- **Admin Link**: Shows in header navigation only for logged-in admins
- **User Management Table**: Shows all users with their current role and status
- **Real-time Updates**: User list updates automatically after any action
- **Database Debug Section**: View and manage all data in JSON format

### User Management & Security
- **Change User Role**: Admin dropdown to switch users between 'admin' and 'user' roles
- **Ban Users**: Click "Blokovat" button, enter reason (min 5 chars)
- **Unban Users**: Click "Odblokovat" to remove ban status
- **Ban reasons** displayed to banned users on login attempt
- **Duplicate Prevention**: Registration validates both email AND username - no duplicates allowed
- **API Endpoints**:
  - `POST /api/admin/ban/:userId` - Ban user with reason
  - `POST /api/admin/unban/:userId` - Unban user
  - `PATCH /api/admin/users/:userId/role` - Change user role
  - `GET /api/admin/users` - Get all users (admin only)

### Alert Management
- **Admin Control**: Admins can create, edit, and delete ALL alerts (not just their own)
- **User Control**: Regular users can only create and edit their own alerts
- **Alert Categories**: road, criminal, emergency, other
- **Severity Levels**: critical, high, medium, low
- **Auto-Expiration**: Set expiration minutes (0 = no expiration)
- **API Endpoints**:
  - `POST /api/alerts` - Create new alert
  - `PUT /api/alerts/:id` - Edit alert (creator or admin only)
  - `DELETE /api/alerts/:id` - Delete alert (creator or admin only)
  - `GET /api/alerts` - Get all active alerts

### Data & Security
- **File-Based Storage**: Uses `data.json` for persistent storage
- **Automatic Sync**: All changes (user creation, bans, alerts) auto-save to data.json
- **Password Encryption**: All passwords hashed with scrypt before storage
- **Email Verification**: Users must verify email before login
- **Reset Code Protection**: Password reset codes sent via email only (not displayed in UI)
- **In-Memory Database**: MemStorage with automatic file persistence

## Key Components

### Authentication System
- Session-based authentication with secure password hashing
- Protected routes requiring authentication for admin functions
- User registration and login functionality
- Two account types: **admin** and **user**
- Admin privileges for alert management and user moderation
- User ban system with ban reasons
- Banned users cannot login (error message shows ban reason)

### Alert Management System
- CRUD operations for emergency alerts
- Alert categorization (road hazards, criminal activity)
- Severity levels (critical, high, medium, low)
- Time-based alert expiration
- Position-based alert placement on map coordinates
- Alternative route suggestions for road closures
- Click-to-create alerts with auto-filled coordinates

### Interactive Map Interface
- Public access to view alerts without authentication
- Click-to-create alerts for administrators
- Visual alert markers with category-specific icons
- Color-coded severity indicators
- Real-time alert filtering by category and severity
- Zoom and pan functionality for detailed map navigation
- Responsive design for desktop and mobile

### Real-time Data Flow
- TanStack Query for efficient data fetching and caching
- Automatic alert statistics calculation
- Live alert status tracking
- Optimistic updates for better user experience

## Data Flow

1. **Alert Creation**: Admin clicks on map → Position captured → Form modal opens → Data validated → API request → Database insertion → UI update
2. **Alert Display**: Page load → Fetch alerts from API → Filter by criteria → Render map markers → Display statistics
3. **Authentication**: User submits credentials → Passport validation → Session creation → Protected route access

## Email System

### Configuration
- **Service**: Gmail SMTP via App Password
- **Provider**: Google Gmail (free, no domain required)
- **Credentials**: Stored as secure environment variables (GMAIL_USER, GMAIL_APP_PASSWORD)
- **Usage**: Automatic integration with registration and password reset flows

### Email Events
- Verification email sent on user registration
- Password reset email sent when user requests password reset

### How It Works
- Uses Nodemailer with Gmail SMTP transporter
- App Password approach (not regular Gmail password) for security
- Credentials are safely stored in Replit Secrets management

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL serverless driver
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **@radix-ui/**: Headless UI component primitives
- **passport**: Authentication middleware
- **express-session**: Session management
- **zod**: Runtime type validation
- **resend**: Email service library (pre-installed for future use)

### Development Tools
- **Vite**: Fast build tool and dev server
- **TypeScript**: Type safety across the stack
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundler for production

## Deployment Strategy

### Build Process
- **Client**: Vite builds React app to `dist/public`
- **Server**: ESBuild bundles server code to `dist/index.js`
- **Database**: Drizzle migrations applied via `db:push` command

### Environment Configuration
- **Development**: Vite dev server with Express API
- **Production**: Single Node.js server serving both API and static files
- **Database**: PostgreSQL connection via DATABASE_URL environment variable
- **Sessions**: Secure session secret via SESSION_SECRET environment variable

### File Structure
- `client/`: React frontend application
- `server/`: Express backend with auth and API routes
- `shared/`: Common schemas and types used by both client and server
- `migrations/`: Database migration files generated by Drizzle

The application follows a monorepo structure with clear separation between frontend, backend, and shared code, enabling efficient development and deployment while maintaining type safety across the entire stack.