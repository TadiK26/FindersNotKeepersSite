CREATE TABLE IF NOT EXISTS `Users` (
    `UserID` int  NOT NULL ,
    `Username` VARCHAR(255)  NOT NULL ,
    `Lastname` VARCHAR(255)  NOT NULL ,
    `Firstnames` VARCHAR(255)  NOT NULL ,
    `Email` VARCHAR(255)  NOT NULL ,
    `UP_ID` VARCHAR(8) NULL ,
    `PasswordHash` VARCHAR(255)  NOT NULL ,
    `Role` VARCHAR(255)  NOT NULL ,
    `NotificationPreference` int  NOT NULL ,
    `DateOfCreation` DATE  NOT NULL ,
    `CreationMethod` VARCHAR(255)  NOT NULL ,
    `PhoneNumber` VARCHAR(255)  NULL ,
    `LastLoginDate` DATE  NULL ,
    `ProfileImageID` int  NULL ,
    PRIMARY KEY (
        `UserID`
    ),
    CONSTRAINT `uc_Users_Username` UNIQUE (
        `Username`
    )
);

CREATE TABLE IF NOT EXISTS `Category` (
    `CategoryID` int  NOT NULL ,
    `Description` VARCHAR(255)  NOT NULL ,
    PRIMARY KEY (
        `CategoryID`
    )
);

CREATE TABLE IF NOT EXISTS `Listings` (
    `ListingID` int  NOT NULL ,
    `UserID` int  NOT NULL ,
    `ItemTitle` VARCHAR(255)  NOT NULL ,
    `CategoryID` int  NOT NULL ,
    `Description` VARCHAR(255)  NULL ,
    `Image1ID` int  NOT NULL ,
    `Image2ID` int  NULL ,
    `Image3ID` int  NULL ,
    `Status` VARCHAR(255)  NOT NULL ,
    `CreationDate` DATE  NOT NULL ,
    `CloseDate` DATE  NULL ,
    `ClaimantID` int  NULL ,
    `LocationLost` VARCHAR(255)  NOT NULL ,
    `ContactInfo` VARCHAR(255)  NULL ,
    PRIMARY KEY (
        `ListingID`
    )
);

CREATE TABLE IF NOT EXISTS `Action` (
    `ActionID` int  NOT NULL ,
    `Description` VARCHAR(255)  NOT NULL ,
    PRIMARY KEY (
        `ActionID`
    )
);

CREATE TABLE IF NOT EXISTS `MessageThread` (
    `ThreadID` int  NOT NULL ,
    `Participant1` int  NOT NULL ,
    `Participant2` int  NOT NULL ,
    `DateOfCreation` DATE  NOT NULL ,
    PRIMARY KEY (
        `ThreadID`
    )
);

CREATE TABLE IF NOT EXISTS `AuditLog` (
    `LogID` int  NOT NULL ,
    `UserID` int  NOT NULL ,
    `ActionID` int  NOT NULL ,
    `DateOfAudit` DATE  NOT NULL ,
    `IPAddress` VARCHAR(255)  NOT NULL ,
    `UserAgent` text  NOT NULL ,
    `SessionID` VARCHAR(255)  NOT NULL ,
    PRIMARY KEY (
        `LogID`
    )
);

CREATE TABLE IF NOT EXISTS `ReportLog` (
    `ReportID` int  NOT NULL ,
    `RequestedID` int  NOT NULL ,
    `RequesterID` int  NOT NULL ,
    `RequestDate` DATE  NOT NULL ,
    `ReportCriteria` VARCHAR(255)  NOT NULL ,
    `Status` VARCHAR(255)  NOT NULL ,
    PRIMARY KEY (
        `ReportID`
    )
);

CREATE TABLE IF NOT EXISTS `Image` (
    `ImageID` int  NOT NULL ,
    `URL` VARCHAR(255)  NOT NULL ,
    `uploadDate` DATE  NOT NULL ,
    `assocEntityType` VARCHAR(255)  NULL ,
    `assocEntityID` int  NULL ,
    `imageVector` VARCHAR(255)  NULL ,
    `OriginalFileName` VARCHAR(255)  NOT NULL ,
    `FileSize` int  NOT NULL ,
    PRIMARY KEY (
        `ImageID`
    )
);

CREATE TABLE IF NOT EXISTS `Notifications` (
    `NotificationID` int  NOT NULL ,
    `Description` VARCHAR(255)  NOT NULL ,
    PRIMARY KEY (
        `NotificationID`
    )
);

ALTER TABLE `Users` ADD CONSTRAINT `fk_Users_NotificationPreference` FOREIGN KEY(`NotificationPreference`)
REFERENCES `Notifications` (`NotificationID`);

ALTER TABLE `Users` ADD CONSTRAINT `fk_Users_ProfileImageID` FOREIGN KEY(`ProfileImageID`)
REFERENCES `Image` (`ImageID`);

ALTER TABLE `Listings` ADD CONSTRAINT `fk_Listings_UserID` FOREIGN KEY(`UserID`)
REFERENCES `Users` (`UserID`);

ALTER TABLE `Listings` ADD CONSTRAINT `fk_Listings_CategoryID` FOREIGN KEY(`CategoryID`)
REFERENCES `Category` (`CategoryID`);

ALTER TABLE `Listings` ADD CONSTRAINT `fk_Listings_Image1ID` FOREIGN KEY(`Image1ID`)
REFERENCES `Image` (`ImageID`);

ALTER TABLE `Listings` ADD CONSTRAINT `fk_Listings_Image2ID` FOREIGN KEY(`Image2ID`)
REFERENCES `Image` (`ImageID`);

ALTER TABLE `Listings` ADD CONSTRAINT `fk_Listings_Image3ID` FOREIGN KEY(`Image3ID`)
REFERENCES `Image` (`ImageID`);

ALTER TABLE `Listings` ADD CONSTRAINT `fk_Listings_ClaimantID` FOREIGN KEY(`ClaimantID`)
REFERENCES `Users` (`UserID`);

ALTER TABLE `MessageThread` ADD CONSTRAINT `fk_MessageThread_Participant1` FOREIGN KEY(`Participant1`)
REFERENCES `Users` (`UserID`);

ALTER TABLE `MessageThread` ADD CONSTRAINT `fk_MessageThread_Participant2` FOREIGN KEY(`Participant2`)
REFERENCES `Users` (`UserID`);

ALTER TABLE `AuditLog` ADD CONSTRAINT `fk_AuditLog_UserID` FOREIGN KEY(`UserID`)
REFERENCES `Users` (`UserID`);

ALTER TABLE `AuditLog` ADD CONSTRAINT `fk_AuditLog_ActionID` FOREIGN KEY(`ActionID`)
REFERENCES `Action` (`ActionID`);

ALTER TABLE `ReportLog` ADD CONSTRAINT `fk_ReportLog_RequestedID` FOREIGN KEY(`RequestedID`)
REFERENCES `Users` (`UserID`);

ALTER TABLE `ReportLog` ADD CONSTRAINT `fk_ReportLog_RequesterID` FOREIGN KEY(`RequesterID`)
REFERENCES `Users` (`UserID`);

ALTER TABLE `Users` 
MODIFY COLUMN `DateOfCreation` DATE NOT NULL DEFAULT (NOW()),
MODIFY COLUMN `LastLoginDate` DATE NOT NULL DEFAULT (NOW());

ALTER TABLE `Listings` 
MODIFY COLUMN `CreationDate` DATE NOT NULL DEFAULT (NOW()),
MODIFY COLUMN `CloseDate` DATE NULL DEFAULT NULL;

ALTER TABLE `MessageThread` 
MODIFY COLUMN `DateOfCreation` DATE NOT NULL DEFAULT (NOW());

ALTER TABLE `AuditLog` 
MODIFY COLUMN `DateOfAudit` DATE NOT NULL DEFAULT (NOW());

ALTER TABLE `ReportLog` 
MODIFY COLUMN `RequestDate` DATE NOT NULL DEFAULT (NOW());

ALTER TABLE `Image` 
MODIFY COLUMN `uploadDate` DATE NOT NULL DEFAULT (NOW());



INSERT INTO `Action` (`ActionID`, `Description`) 
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

INSERT INTO `Category` (`CategoryID`, `Description`) 
VALUES 
    (1, 'Student Card'),
    (2, 'Electronic Device'),
    (3, 'Clothing'),
    (4, 'Identification Document'),
    (5, 'Car Keys'),
    (6, 'Bag'),
    (7, 'Schooling Equipment'),
    (8, 'Other');

INSERT INTO `Notifications` (`NotificationID`, `Description`) 
VALUES 
    (1, 'No Email Notifications'),
    (2, 'All Email Notifications'),
    (3, 'Email Notifications of New Listings only'),
    (4, 'Email Notifications for Messages only'),
    (5, 'Email Notifications of Claims only'),
    (6, 'Email Notifications for Claims and Messages'),
    (7, 'Email Notifications for Listings and Claims'),
    (8, 'Email Notifications for Messages and Listings'); 

INSERT INTO `Users` (`Username`, `Lastname`, `Firstnames`, `Email`, `UP_ID`, `PasswordHash`,
            `Role`, `NotificationPreference`, `CreationMethod`, `PhoneNumber`, `ProfileImageID`)
VALUES ("Admin_TADI", "Kabaira", "Tadiwanashe", "u22490125@tuks.co.za", "22490125", "asd23fjsd", "ADMIN", 1, "ADMIN", "0814361609", NULL);
  