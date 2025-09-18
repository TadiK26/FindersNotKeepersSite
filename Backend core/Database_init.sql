CREATE TABLE `Users` (
    `UserID` int  NOT NULL ,
    `Username` string  NOT NULL ,
    `Lastname` string  NOT NULL ,
    `Firstnames` string  NOT NULL ,
    `Email` string  NOT NULL ,
    `UP_ID` int  NULL ,
    `PasswordHash` string  NOT NULL ,
    `Role` string  NOT NULL ,
    `NotificationPreference` int  NOT NULL ,
    `DateOfCreation` date  NOT NULL ,
    `CreationMethod` string  NOT NULL ,
    `PhoneNumber` string  NULL ,
    `LastLoginDate` date  NOT NULL ,
    `ProfileImageID` int  NOT NULL ,
    PRIMARY KEY (
        `UserID`
    ),
    CONSTRAINT `uc_Users_Username` UNIQUE (
        `Username`
    )
);

CREATE TABLE `Category` (
    `CategoryID` int  NOT NULL ,
    `Description` string  NOT NULL ,
    PRIMARY KEY (
        `CategoryID`
    )
);

CREATE TABLE `Listings` (
    `ListingID` int  NOT NULL ,
    `UserID` int  NOT NULL ,
    `ItemTitle` string  NOT NULL ,
    `CategoryID` int  NOT NULL ,
    `Description` string  NULL ,
    `Image1ID` int  NOT NULL ,
    `Image2ID` int  NULL ,
    `Image3ID` int  NULL ,
    `Status` string  NOT NULL ,
    `CreationDate` date  NOT NULL ,
    `CloseDate` date  NULL ,
    `ClaimantID` int  NULL ,
    `LocationLost` string  NOT NULL ,
    `ContactInfo` string  NULL ,
    PRIMARY KEY (
        `ListingID`
    )
);

CREATE TABLE `Action` (
    `ActionID` int  NOT NULL ,
    `Description` string  NOT NULL ,
    PRIMARY KEY (
        `ActionID`
    )
);

CREATE TABLE `MessageThread` (
    `ThreadID` int  NOT NULL ,
    `Participant1` int  NOT NULL ,
    `Participant2` int  NOT NULL ,
    `DateOfCreation` date  NOT NULL ,
    PRIMARY KEY (
        `ThreadID`
    )
);

CREATE TABLE `AuditLog` (
    `LogID` int  NOT NULL ,
    `UserID` int  NOT NULL ,
    `ActionID` int  NOT NULL ,
    `DateOfAudit` date  NOT NULL ,
    `IPAddress` string  NOT NULL ,
    `UserAgent` text  NOT NULL ,
    `SessionID` string  NOT NULL ,
    PRIMARY KEY (
        `LogID`
    )
);

CREATE TABLE `ReportLog` (
    `ReportID` int  NOT NULL ,
    `RequestedID` int  NOT NULL ,
    `RequesterID` int  NOT NULL ,
    `RequestDate` date  NOT NULL ,
    `ReportCriteria` string  NOT NULL ,
    `Status` string  NOT NULL ,
    PRIMARY KEY (
        `ReportID`
    )
);

CREATE TABLE `Image` (
    `ImageID` int  NOT NULL ,
    `URL` string  NOT NULL ,
    `uploadDate` date  NOT NULL ,
    `assocEntityType` string  NULL ,
    `assocEntityID` int  NULL ,
    `imageVector` string  NULL ,
    `OriginalFileName` string  NOT NULL ,
    `FileSize` int  NOT NULL ,
    PRIMARY KEY (
        `ImageID`
    )
);

CREATE TABLE `Notifications` (
    `NotificationID` int  NOT NULL ,
    `Description` string  NOT NULL ,
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

