-- Sample data for the Lost and Found database (PostgreSQL)

-- Additional sample images (ID 1 already exists as default)
INSERT INTO Image (URL, OriginalFileName, FileSize) VALUES
('https://example.com/images/profile2.jpg', 'user_profile_2.jpg', 156.5),
('https://example.com/images/profile3.jpg', 'user_profile_3.jpg', 203.8),
('https://example.com/images/profile4.jpg', 'user_profile_4.jpg', 189.2),
('https://example.com/images/iphone.jpg', 'lost_iphone_13.jpg', 2048.7),
('https://example.com/images/wallet.jpg', 'brown_wallet.jpg', 1024.3),
('https://example.com/images/backpack.jpg', 'blue_backpack.jpg', 1536.8),
('https://example.com/images/keys.jpg', 'car_keys_toyota.jpg', 512.4),
('https://example.com/images/laptop.jpg', 'dell_laptop.jpg', 2560.1),
('https://example.com/images/headphones.jpg', 'sony_headphones.jpg', 768.9),
('https://example.com/images/jacket.jpg', 'red_jacket.jpg', 1280.5);

-- Sample users with corrected roles and admin ID ranges
INSERT INTO Users (UserID, Username, Lastname, Firstnames, Email, PasswordHash, Role, NotificationPreference, CreationMethod, ProfileImageID) VALUES
(10000, 'john_doe', 'Doe', 'John Michael', 'miniepe321+john_doe@gmail.com',  '$2b$12$Rcn9G54vuSy8wrYWrBK1P.Dknm3j.kPkT8R0SZBP7EKSMwiUsqfTi', 'USER', 2, 'Manual Registration', 2),
(10001, 'sarah_smith', 'Smith', 'Sarah Jane', 'miniepe321+sarah_smith@gmail.com','$2b$12$Rcn9G54vuSy8wrYWrBK1P.Dknm3j.kPkT8R0SZBP7EKSMwiUsqfTi', 'USER', 3, 'Manual Registration', 3),
(150, 'admin_wilson', 'Wilson', 'David Robert', 'miniepe321+admin_wilson@gmail.com','$2b$12$Rcn9G54vuSy8wrYWrBK1P.Dknm3j.kPkT8R0SZBP7EKSMwiUsqfTi', 'ADMIN', 1, 'System Creation',  1),
(10003, 'mike_jones', 'Jones', 'Michael Anthony', 'miniepe321+mike_jones@gmail.com', '$2b$12$Rcn9G54vuSy8wrYWrBK1P.Dknm3j.kPkT8R0SZBP7EKSMwiUsqfTi', 'USER', 4, 'Manual Registration',  4),
(10004, 'emma_brown', 'Brown', 'Emma Louise', 'miniepe321+emma_brown@gmail.com', '$2b$12$Rcn9G54vuSy8wrYWrBK1P.Dknm3j.kPkT8R0SZBP7EKSMwiUsqfTi', 'USER', 5, 'Google SSO',  1),
(10005, 'prof_adams', 'Adams', 'Professor James', 'miniepe321+prof_adams@gmail.com', '$2b$12$Rcn9G54vuSy8wrYWrBK1P.Dknm3j.kPkT8R0SZBP7EKSMwiUsqfTi', 'STAFF', 2, 'Manual Registration',  1),
(250, 'admin_clark', 'Clark', 'Lisa Marie', 'miniepe321+admin_clark@gmail.com', '$2b$12$Rcn9G54vuSy8wrYWrBK1P.Dknm3j.kPkT8R0SZBP7EKSMwiUsqfTi', 'ADMIN', 2, 'System Creation',  1);

-- Sample listings
INSERT INTO Listings (UserID, ItemTitle, CategoryID, Description, Image1ID, Image2ID, Status, LocationLost) VALUES
(10000, 'Lost iPhone 13 Pro', 2, 'Blue iPhone 13 Pro with cracked screen protector. Has a black case with card holder.', 5, NULL, 'Active', 'IT Building - Computer Lab 2'),
(10001, 'Found Brown Leather Wallet', 4, 'Found brown leather wallet containing student card and some cash. No ID visible.', 6, NULL, 'Active', 'Library - Ground Floor Reading Area'),
(10003, 'Lost Blue Backpack', 6, 'Navy blue Jansport backpack with multiple compartments. Contains textbooks and notebooks.', 7, NULL, 'Active', 'Engineering Building - Lecture Hall C'),
(10000, 'Found Car Keys', 5, 'Toyota car keys with blue keychain. Found near parking area.', 8, NULL, 'Claimed', 'Main Campus - Parking Lot B'),
(10004, 'Lost Dell Laptop', 2, 'Dell Inspiron 15 with Ubuntu stickers. In black laptop bag.', 9, NULL, 'Active', 'Student Center - Food Court'),
(10001, 'Found Sony Headphones', 2, 'Black over-ear Sony headphones. Model WH-CH720N.', 10, NULL, 'Active', 'Music Department - Practice Room 5'),
(10003, 'Lost Red Jacket', 3, 'Red windbreaker jacket, size Medium. Has UP logo on the back.', 11, NULL, 'Closed', 'Sports Complex - Main Gym');

-- Update one listing to have a claimant
UPDATE Listings SET ClaimantID = 10004, CloseDate = '2024-09-20' WHERE ListingID = 4;

-- Sample message threads
INSERT INTO MessageThread (ThreadID, Participant1, Participant2) VALUES
('thread_000_001_20240920145830', 10000, 10001),
('thread_003_000_20240921103245', 10003, 10000),
('thread_004_001_20240922091530', 10004, 10001),
('thread_150_003_20240923084215', 150, 10003);

-- Sample audit log entries (expanded)
INSERT INTO AuditLog (UserID, ActionID, IPAddress, UserAgent, SessionID) VALUES
-- Day 1 activities (Sept 20, 2024)
(10000, 11, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'sess_abc123def456'),
(10001, 11, '10.0.0.50', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'sess_xyz789uvw012'),
(10000, 1, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'sess_abc123def456'),
(10000, 3, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'sess_abc123def456'),
(10001, 1, '10.0.0.50', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'sess_xyz789uvw012'),
(10001, 3, '10.0.0.50', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'sess_xyz789uvw012'),
(10000, 7, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'sess_abc123def456'),
(10001, 7, '10.0.0.50', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'sess_xyz789uvw012'),
(10000, 2, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'sess_abc123def456'),
(10001, 2, '10.0.0.50', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'sess_xyz789uvw012'),

-- Day 2 activities (Sept 21, 2024)
(10003, 11, '172.16.0.25', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', 'sess_qwe456rty789'),
(150, 1, '192.168.10.5', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'sess_admin150xyz'),
(10003, 1, '172.16.0.25', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', 'sess_qwe456rty789'),
(10003, 3, '172.16.0.25', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', 'sess_qwe456rty789'),
(10000, 1, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'sess_abc789def012'),
(10000, 7, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'sess_abc789def012'),
(10003, 7, '172.16.0.25', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', 'sess_qwe456rty789'),
(150, 9, '192.168.10.5', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'sess_admin150xyz'),
(10003, 2, '172.16.0.25', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', 'sess_qwe456rty789'),
(150, 2, '192.168.10.5', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'sess_admin150xyz'),

-- Day 3 activities (Sept 22, 2024)
(10004, 11, '192.168.1.75', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15', 'sess_asd123fgh456'),
(10005, 1, '10.0.0.100', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15', 'sess_prof_adams01'),
(10004, 1, '192.168.1.75', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15', 'sess_asd123fgh456'),
(10001, 1, '10.0.0.50', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'sess_xyz345uvw678'),
(10004, 6, '192.168.1.75', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15', 'sess_asd123fgh456'),
(10001, 7, '10.0.0.50', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'sess_xyz345uvw678'),
(10004, 7, '192.168.1.75', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15', 'sess_asd123fgh456'),
(10005, 3, '10.0.0.100', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15', 'sess_prof_adams01'),
(10004, 2, '192.168.1.75', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15', 'sess_asd123fgh456'),
(10005, 2, '10.0.0.100', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15', 'sess_prof_adams01'),

-- Day 4 activities (Sept 23, 2024 - Current day)
(250, 1, '192.168.10.10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'sess_admin250abc'),
(10000, 1, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'sess_abc567def890'),
(10001, 1, '10.0.0.50', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'sess_xyz901uvw234'),
(10004, 1, '192.168.1.75', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15', 'sess_asd789fgh012'),
(10000, 4, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'sess_abc567def890'),
(10001, 3, '10.0.0.50', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'sess_xyz901uvw234'),
(250, 9, '192.168.10.10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'sess_admin250abc'),
(10004, 8, '192.168.1.75', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15', 'sess_asd789fgh012'),
(150, 1, '192.168.10.5', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'sess_admin150def'),
(10000, 7, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'sess_abc567def890'),
(10001, 7, '10.0.0.50', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'sess_xyz901uvw234'),
(150, 9, '192.168.10.5', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'sess_admin150def'),
(10004, 10, '192.168.1.75', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15', 'sess_asd789fgh012');

-- Sample report logs
INSERT INTO ReportLog (RequestedID, RequesterID, ReportCriteria, Status) VALUES
(10000, 150, 'User Activity Report - Last 30 Days', 'Completed'),
(10001, 150, 'Listing History Report', 'In Progress'),
(10003, 250, 'Message Thread Report', 'Pending');

-- Sample warning setups (alerts for specific items)
INSERT INTO WarningSetup (UserID, ItemName, ItemLocation, ItemCategory) VALUES
(10000, 'Apple AirPods', 'Library', 'Electronic Device'),
(10001, 'Student Card', 'Any Location', 'Student Card'),
(10003, 'House Keys', 'Engineering Building', 'Car Keys'),
(10004, 'Black Notebook', 'Student Center', 'Schooling Equipment');

-- Update some users' last login dates
UPDATE Users SET LastLoginDate = '2024-09-23' WHERE UserID IN (10000, 10001, 10004, 150);
UPDATE Users SET LastLoginDate = '2024-09-22' WHERE UserID IN (10003, 10005);
UPDATE Users SET LastLoginDate = '2024-09-23' WHERE UserID = 250;
