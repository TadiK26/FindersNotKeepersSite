-- PostgreSQL Database Initialization Script

CREATE TABLE IF NOT EXISTS Users (
    UserID SERIAL PRIMARY KEY,
    Username VARCHAR(255) NOT NULL UNIQUE,
    Lastname VARCHAR(255) NOT NULL,
    Firstnames VARCHAR(255) NOT NULL,
    Email VARCHAR(255) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    Role VARCHAR(255) NOT NULL,
    NotificationPreference INT NOT NULL,
    DateOfCreation DATE NOT NULL DEFAULT CURRENT_DATE,
    CreationMethod VARCHAR(255) NOT NULL,
    LastLoginDate DATE NULL DEFAULT NULL,
    ProfileImageID INT NOT NULL
);

CREATE TABLE IF NOT EXISTS Category (
    CategoryID SERIAL PRIMARY KEY,
    Description VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS Listings (
    ListingID SERIAL PRIMARY KEY,
    UserID INT NOT NULL,
    ItemTitle VARCHAR(255) NOT NULL,
    CategoryID INT NOT NULL,
    Description VARCHAR(255) NULL,
    Image1ID INT NULL,
    Image2ID INT NULL,
    Image3ID INT NULL,
    Status VARCHAR(255) NOT NULL,
    CreationDate DATE NOT NULL DEFAULT CURRENT_DATE,
    CloseDate DATE NULL DEFAULT NULL,
    ClaimantID INT NULL,
    LocationLost VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS Action (
    ActionID INT PRIMARY KEY,
    Description VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS MessageThread (
    ThreadID VARCHAR(40) PRIMARY KEY,
    Participant1 INT NOT NULL,
    Participant2 INT NOT NULL,
    DateOfCreation DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS AuditLog (
    LogID SERIAL PRIMARY KEY,
    UserID INT NOT NULL,
    ActionID INT NOT NULL,
    DateOfAudit DATE NOT NULL DEFAULT CURRENT_DATE,
    IPAddress VARCHAR(255) NOT NULL,
    UserAgent TEXT NOT NULL,
    SessionID VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS ReportLog (
    ReportID SERIAL PRIMARY KEY,
    RequestedID INT NOT NULL,
    RequesterID INT NOT NULL,
    RequestDate DATE NOT NULL DEFAULT CURRENT_DATE,
    ReportCriteria VARCHAR(255) NOT NULL,
    Status VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS Image (
    ImageID SERIAL PRIMARY KEY,
    URL VARCHAR(255) NOT NULL,
    uploadDate DATE NOT NULL DEFAULT CURRENT_DATE,
    assocEntityType VARCHAR(255) NULL,
    assocEntityID INT NULL,
    imageVector VARCHAR(255) NULL,
    OriginalFileName VARCHAR(255) NOT NULL,
    FileSize INT NOT NULL
);

CREATE TABLE IF NOT EXISTS Notifications (
    NotificationID INT PRIMARY KEY,
    Description VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS WarningSetup (
    WarningID SERIAL PRIMARY KEY,
    UserID INT NOT NULL,
    ItemName VARCHAR(255) NULL,
    ItemLocation VARCHAR(255) NULL,
    ItemCategory VARCHAR(255) NULL
);

CREATE TABLE IF NOT EXISTS Claims (
    ClaimID SERIAL PRIMARY KEY,
    ImageID INT NOT NULL,
    ClaimantID INT NOT NULL,
    ListingID INT NOT NULL,
    Description VARCHAR(255) NULL,
    ClaimDate DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Set the starting value for Users UserID to 10000
ALTER SEQUENCE users_userid_seq RESTART WITH 10000;

-- Add foreign key constraints
ALTER TABLE Users ADD CONSTRAINT fk_Users_NotificationPreference
    FOREIGN KEY(NotificationPreference) REFERENCES Notifications(NotificationID);

ALTER TABLE Users ADD CONSTRAINT fk_Users_ProfileImageID
    FOREIGN KEY(ProfileImageID) REFERENCES Image(ImageID);

ALTER TABLE Listings ADD CONSTRAINT fk_Listings_UserID
    FOREIGN KEY(UserID) REFERENCES Users(UserID);

ALTER TABLE Listings ADD CONSTRAINT fk_Listings_CategoryID
    FOREIGN KEY(CategoryID) REFERENCES Category(CategoryID);

ALTER TABLE Listings ADD CONSTRAINT fk_Listings_Image1ID
    FOREIGN KEY(Image1ID) REFERENCES Image(ImageID);

ALTER TABLE Listings ADD CONSTRAINT fk_Listings_Image2ID
    FOREIGN KEY(Image2ID) REFERENCES Image(ImageID);

ALTER TABLE Listings ADD CONSTRAINT fk_Listings_Image3ID
    FOREIGN KEY(Image3ID) REFERENCES Image(ImageID);

ALTER TABLE Listings ADD CONSTRAINT fk_Listings_ClaimantID
    FOREIGN KEY(ClaimantID) REFERENCES Users(UserID);

ALTER TABLE MessageThread ADD CONSTRAINT fk_MessageThread_Participant1
    FOREIGN KEY(Participant1) REFERENCES Users(UserID);

ALTER TABLE MessageThread ADD CONSTRAINT fk_MessageThread_Participant2
    FOREIGN KEY(Participant2) REFERENCES Users(UserID);

ALTER TABLE AuditLog ADD CONSTRAINT fk_AuditLog_UserID
    FOREIGN KEY(UserID) REFERENCES Users(UserID);

ALTER TABLE AuditLog ADD CONSTRAINT fk_AuditLog_ActionID
    FOREIGN KEY(ActionID) REFERENCES Action(ActionID);

ALTER TABLE ReportLog ADD CONSTRAINT fk_ReportLog_RequestedID
    FOREIGN KEY(RequestedID) REFERENCES Users(UserID);

ALTER TABLE ReportLog ADD CONSTRAINT fk_ReportLog_RequesterID
    FOREIGN KEY(RequesterID) REFERENCES Users(UserID);

ALTER TABLE Claims ADD CONSTRAINT fk_Claims_ImageID
    FOREIGN KEY(ImageID) REFERENCES Image(ImageID);

ALTER TABLE Claims ADD CONSTRAINT fk_Claims_ClaimantID
    FOREIGN KEY(ClaimantID) REFERENCES Users(UserID);

ALTER TABLE Claims ADD CONSTRAINT fk_Claims_ListingID
    FOREIGN KEY(ListingID) REFERENCES Listings(ListingID);

-- Insert initial data
INSERT INTO Action (ActionID, Description)
VALUES
    (1, 'User Login'),
    (2, 'User Logout'),
    (3, 'Create Listing'),
    (4, 'Edit Listing'),
    (5, 'Delete Listing'),
    (6, 'Claim Item'),
    (7, 'Send Message'),
    (8, 'Update Profile'),
    (9, 'Report User'),
    (10, 'Password Reset'),
    (11, 'Account Creation');

INSERT INTO Category (CategoryID, Description)
VALUES
    (1, 'Student Card'),
    (2, 'Electronic Device'),
    (3, 'Clothing'),
    (4, 'Identification Document'),
    (5, 'Car Keys'),
    (6, 'Bag'),
    (7, 'Schooling Equipment'),
    (8, 'Other');

INSERT INTO Notifications (NotificationID, Description)
VALUES
    (1, 'No Email Notifications'),
    (2, 'All Email Notifications'),
    (3, 'Email Notifications of New Listings only'),
    (4, 'Email Notifications for Messages only'),
    (5, 'Email Notifications of Claims only'),
    (6, 'Email Notifications for Claims and Messages'),
    (7, 'Email Notifications for Listings and Claims'),
    (8, 'Email Notifications for Messages and Listings');

INSERT INTO Image (URL, OriginalFileName, FileSize)
VALUES ('local', 'default-icon.png', 2.7);
