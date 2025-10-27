-- PostgreSQL Drop Tables Script
-- Drop child tables first (tables that reference others)
DROP TABLE IF EXISTS AuditLog CASCADE;
DROP TABLE IF EXISTS ReportLog CASCADE;
DROP TABLE IF EXISTS MessageThread CASCADE;
DROP TABLE IF EXISTS Claims CASCADE;
DROP TABLE IF EXISTS Listings CASCADE;
DROP TABLE IF EXISTS Users CASCADE;

-- Drop parent tables (tables that are referenced by others)
DROP TABLE IF EXISTS Category CASCADE;
DROP TABLE IF EXISTS Action CASCADE;
DROP TABLE IF EXISTS Image CASCADE;
DROP TABLE IF EXISTS Notifications CASCADE;
DROP TABLE IF EXISTS WarningSetup CASCADE;
