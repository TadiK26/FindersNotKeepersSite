Backend core consists of databases along side the functional and logical parts of the finders not keepers web application.

Databases are
    - Users
    - Listings
    - MessageThreads
    - ReportLog
    - AuditLog
    - Category
    - Image

Classes are
    - User
    - Admin
    - Verification
    - Notification 
    - ItemListing
    - SearchFilter
    - Category
    - Image
    - Report
    - AuditLog
    - MessageThread
    - SecureMessage

# FinderNotKeepers Database

Database schema for managing lost items on the University Of Pretoria (UP) campus.

## Overview

This system enables users to report lost items and communicate with each other through secure messaging while providing administrative oversight through comprehensive logging and reporting features.

## Database Schema

### Core Tables

#### Users
Central user management table storing account information and preferences.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| UserID | int | PRIMARY KEY | Unique user identifier |
| Username | VARCHAR(255) | NOT NULL, UNIQUE | User's login name |
| Lastname | VARCHAR(255) | NOT NULL | User's last name |
| Firstnames | VARCHAR(255) | NOT NULL | User's first name(s) |
| Email | VARCHAR(255) | NOT NULL | User's email address |
| UP_ID | int | NULL | University Person ID (optional) |
| PasswordHash | VARCHAR(255) | NOT NULL | Encrypted password |
| Role | VARCHAR(255) | NOT NULL | User role (Student, Staff, Admin, etc.) |
| NotificationPreference | int | NOT NULL | FK to Notifications table |
| DateOfCreation | date | NOT NULL | Account creation date |
| CreationMethod | VARCHAR(255) | NOT NULL | How the account was created |
| PhoneNumber | VARCHAR(255) | NULL | Optional phone number |
| LastLoginDate | date | NOT NULL | Date of last login |
| ProfileImageID | int | NOT NULL | FK to Image table |

#### Listings
Central table for all lost and found item postings.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| ListingID | int | PRIMARY KEY | Unique listing identifier |
| UserID | int | NOT NULL, FK | User who created the listing |
| ItemTitle | VARCHAR(255) | NOT NULL | Brief item description |
| CategoryID | int | NOT NULL, FK | Item category |
| Description | VARCHAR(255) | NULL | Detailed item description |
| Image1ID | int | NOT NULL, FK | Primary image |
| Image2ID | int | NULL, FK | Optional second image |
| Image3ID | int | NULL, FK | Optional third image |
| Status | VARCHAR(255) | NOT NULL | Listing status (Active, Claimed, Closed) |
| CreationDate | date | NOT NULL | When listing was created |
| CloseDate | date | NULL | When listing was closed |
| ClaimantID | int | NULL, FK | User who claimed the item |
| LocationLost | VARCHAR(255) | NOT NULL | Where item was lost/found |
| ContactInfo | VARCHAR(255) | NULL | Additional contact information |

#### Image
Manages all images in the system with metadata and AI features.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| ImageID | int | PRIMARY KEY | Unique image identifier |
| URL | VARCHAR(255) | NOT NULL | Image file location |
| uploadDate | date | NOT NULL | When image was uploaded |
| assocEntityType | VARCHAR(255) | NULL | Type of entity image belongs to |
| assocEntityID | int | NULL | ID of associated entity |
| imageVector | VARCHAR(255) | NULL | AI-generated image vector for similarity matching |
| OriginalFileName | VARCHAR(255) | NOT NULL | Original uploaded filename |
| FileSize | int | NOT NULL | File size in bytes |

### Communication System

#### MessageThread
Manages communication channels between users. Messages are stored in encrypted files external to the database.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| ThreadID | int | PRIMARY KEY | Unique thread identifier |
| Participant1 | int | NOT NULL, FK | First participant |
| Participant2 | int | NOT NULL, FK | Second participant |
| DateOfCreation | date | NOT NULL | When thread was created |

### Administrative Tables

#### Category
Defines item categories for organization and filtering.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| CategoryID | int | PRIMARY KEY | Unique category identifier |
| Description | VARCHAR(255) | NOT NULL | Category name/description |

#### Action
Defines possible user actions for audit logging.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| ActionID | int | PRIMARY KEY | Unique action identifier |
| Description | VARCHAR(255) | NOT NULL | Action description |

#### Notifications
Defines notification preference types.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| NotificationID | int | PRIMARY KEY | Unique notification type identifier |
| Description | VARCHAR(255) | NOT NULL | Notification type description |

### Logging and Reporting

#### AuditLog
Comprehensive audit trail of all user actions.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| LogID | int | PRIMARY KEY | Unique log entry identifier |
| UserID | int | NOT NULL, FK | User who performed the action |
| ActionID | int | NOT NULL, FK | Type of action performed |
| DateOfAudit | date | NOT NULL | When action occurred |
| IPAddress | VARCHAR(255) | NOT NULL | User's IP address |
| UserAgent | text | NOT NULL | User's browser information |
| SessionID | VARCHAR(255) | NOT NULL | User's session identifier |

#### ReportLog
Tracks user reports and complaints.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| ReportID | int | PRIMARY KEY | Unique report identifier |
| RequestedID | int | NOT NULL, FK | User being reported |
| RequesterID | int | NOT NULL, FK | User making the report |
| RequestDate | date | NOT NULL | When report was made |
| ReportCriteria | VARCHAR(255) | NOT NULL | Reason for report |
| Status | VARCHAR(255) | NOT NULL | Report status |

## Key Features

### Security & Privacy
- **Encrypted Messaging**: All messages stored in encrypted files outside the database
- **Comprehensive Audit Trail**: Every user action is logged with session details
- **User Reporting System**: Built-in mechanism for reporting inappropriate behavior

### AI-Powered Matching
- **Image Vectors**: AI-generated vectors enable automatic matching of lost and found items
- **Smart Search**: Enhanced search capabilities using image similarity

### Flexible Communication
- **Optional Phone Numbers**: Users can choose to share phone numbers for direct contact
- **Secure Messaging Threads**: Database tracks communication channels while keeping content secure

### Administrative Control
- **Role-Based Access**: Support for different user roles (Student, Staff, Admin)
- **Comprehensive Logging**: Full audit trail for accountability
- **Category Management**: Organized item categorization system


## Usage Notes

- **Profile Images**: All users must have a profile image (consider providing default options)
- **Image Requirements**: All listings must have at least one image
- **Location Information**: The `LocationLost` field is required for all listings
- **Message Storage**: Remember that actual message content is stored externally in encrypted files

## Relationships

The database maintains referential integrity through foreign key constraints:
- Users can have multiple listings
- Users can participate in multiple message threads
- Listings can have multiple images (up to 3)
- All actions are logged with user and action type references
