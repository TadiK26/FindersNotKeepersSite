-- Drop child tables first (tables that reference others)
DROP TABLE IF EXISTS `AuditLog`;
DROP TABLE IF EXISTS `ReportLog`;
DROP TABLE IF EXISTS `MessageThread`;
DROP TABLE IF EXISTS `Listings`;
DROP TABLE IF EXISTS `Users`;

-- Drop parent tables (tables that are referenced by others)
DROP TABLE IF EXISTS `Category`;
DROP TABLE IF EXISTS `Action`;
DROP TABLE IF EXISTS `Image`;
DROP TABLE IF EXISTS `Notifications`;
DROP TABLE IF EXISTS `WarningSetup`;