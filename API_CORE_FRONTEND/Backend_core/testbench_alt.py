import unittest
import mysql.connector
import os
import tempfile
import shutil
from unittest.mock import Mock, patch, MagicMock
from User import User
import json

class TestUser(unittest.TestCase):
    """Test suite for User class functionality"""

    def setUp(self):
        """Set up test fixtures before each test method"""
        self.test_user = User(
            UserID=10001,
            Username="testuser",
            Lastname="Doe",
            Firstnames="John",
            Email="john.doe@example.com",
            PasswordHash="hashed_password",
            Role="Student",
            NotificationPreference=2,
            ProfileImageID=1,
            sessionIP="192.168.1.1",
            sessionID="test_session_123"
        )
        
        self.test_user2 = User(
            UserID=10002,
            Username="testuser2", 
            Lastname="Smith",
            Firstnames="Jane",
            Email="jane.smith@example.com",
            sessionIP="192.168.1.2",
            sessionID="test_session_456"
        )
        
        # Create temporary directory for message threads
        self.temp_dir = tempfile.mkdtemp()
        self.original_cwd = os.getcwd()
        os.chdir(self.temp_dir)

    def tearDown(self):
        """Clean up after each test method"""
        os.chdir(self.original_cwd)
        shutil.rmtree(self.temp_dir)

    @patch('User.User.get_connection')
    def test_update_profile_success(self, mock_get_connection):
        """Test successful profile update"""
        # Mock database connection and cursor
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_get_connection.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        
        result = self.test_user.UpdateProfile()
        
        # Verify database operations
        self.assertTrue(result)
        mock_cursor.execute.assert_called()
        mock_conn.commit.assert_called()
        mock_cursor.close.assert_called()
        mock_conn.close.assert_called()

    @patch('User.User.get_connection')
    def test_update_profile_failure(self, mock_get_connection):
        """Test profile update failure"""
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_get_connection.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.execute.side_effect = Exception("Database error")
        
        result = self.test_user.UpdateProfile()
        
        self.assertFalse(result)

    @patch('User.Notification')
    @patch('User.User.get_connection')
    def test_make_listing_success(self, mock_get_connection, mock_notification):
        """Test successful listing creation"""
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_get_connection.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.lastrowid = 123
        
        result = self.test_user.MakeListing(
            ItemTitle="Lost Phone",
            CategoryID=2,
            Description="Black iPhone 12",
            Location="Library",
            Status="Lost",
            Image1=1,
            Image2=2,
            Image3=3
        )
        
        self.assertEqual(result, 1)
        self.assertEqual(mock_cursor.execute.call_count, 4)  # Insert + 2 updates + audit
        mock_notification.assert_called_once()

    @patch('User.User.get_connection')
    def test_remove_listing(self, mock_get_connection):
        """Test listing removal"""
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_get_connection.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        
        result = self.test_user.RemoveListing(123, "No longer needed")
        
        self.assertEqual(result, 1)
        mock_cursor.execute.assert_called()

    @patch('User.User.get_connection')
    def test_update_listing(self, mock_get_connection):
        """Test listing update"""
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_get_connection.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        
        self.test_user.UpdateListing(
            listingID=123,
            ItemTitle="Updated Phone",
            CategoryID=2,
            Description="Updated description",
            Location="Updated location",
            Contact=True,
            Image1=1
        )
        
        mock_cursor.execute.assert_called()
        mock_conn.commit.assert_called()

    @patch('User.User.get_connection')
    def test_mark_returned(self, mock_get_connection):
        """Test marking item as returned"""
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_get_connection.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        
        result = self.test_user.MarkReturned(123)
        
        self.assertEqual(result, 1)
        mock_cursor.execute.assert_called()

    @patch('User.Notification')
    @patch('User.User.get_connection')
    def test_claim_success(self, mock_get_connection, mock_notification):
        """Test successful claim creation"""
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_get_connection.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        
        # Mock listing exists and is available for claiming
        mock_cursor.fetchone.side_effect = [
            (10002, None, "Active"),  # listing check: different owner, no claimant
            None  # existing claim check: no existing claim
        ]
        mock_cursor.lastrowid = 456
        
        result = self.test_user.Claim(123, 789, "This is my phone")
        
        self.assertEqual(result, 0)  # Success
        mock_notification.assert_called_once()

    @patch('User.User.get_connection')
    def test_claim_own_listing(self, mock_get_connection):
        """Test user cannot claim their own listing"""
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_get_connection.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        
        # Mock listing owned by same user
        mock_cursor.fetchone.return_value = (10001, None, "Active")
        
        result = self.test_user.Claim(123, 789, "This is my phone")
        
        self.assertEqual(result, 3)  # Cannot claim own listing

    @patch('User.User.get_connection')
    def test_claim_already_claimed(self, mock_get_connection):
        """Test claiming already claimed item"""
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_get_connection.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        
        # Mock listing already claimed by someone else
        mock_cursor.fetchone.return_value = (10002, 10003, "Claimed")
        
        result = self.test_user.Claim(123, 789, "This is my phone")
        
        self.assertEqual(result, 4)  # Already claimed by someone else

    @patch('User.User.get_connection')
    def test_claim_duplicate_claim(self, mock_get_connection):
        """Test user has already filed claim for this listing"""
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_get_connection.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        
        # Mock listing available but user already has claim
        mock_cursor.fetchone.side_effect = [
            (10002, None, "Active"),  # listing check
            (999,)  # existing claim found
        ]
        
        result = self.test_user.Claim(123, 789, "This is my phone")
        
        self.assertEqual(result, 1)  # Already filed claim

    @patch('User.User.get_connection')
    def test_claim_listing_not_found(self, mock_get_connection):
        """Test claiming non-existent listing"""
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_get_connection.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        
        # Mock listing not found
        mock_cursor.fetchone.return_value = None
        
        result = self.test_user.Claim(999, 789, "This is my phone")
        
        self.assertEqual(result, 2)  # Listing not found

    @patch('User.User.CreateMessageThread')
    @patch('User.User.decrypt')
    @patch('User.User.get_connection')
    def test_contact_user_existing_thread(self, mock_get_connection, mock_decrypt, mock_create_thread):
        """Test contacting user with existing message thread"""
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_get_connection.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        
        # Mock existing thread found
        mock_cursor.fetchone.return_value = ("ABCD_12345", 10001, 10002, "2024-01-01")
        mock_decrypt.return_value = "Previous messages..."
        
        # Create test file
        os.makedirs("MessageThreads", exist_ok=True)
        with open("MessageThreads/ABCD_12345_messages.txt", "w") as f:
            f.write("test")
        
        message_id, content = self.test_user.ContactUser(10002)
        
        self.assertIsNotNone(message_id)
        self.assertEqual(content, "Previous messages...")
        mock_create_thread.assert_not_called()

    @patch('User.User.CreateMessageThread')
    @patch('User.User.decrypt')
    @patch('User.User.get_connection')
    def test_contact_user_new_thread(self, mock_get_connection, mock_decrypt, mock_create_thread):
        """Test contacting user without existing message thread"""
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_get_connection.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        
        # Mock no existing thread found
        mock_cursor.fetchone.return_value = None
        mock_decrypt.return_value = "New conversation started..."
        
        # Create test file
        os.makedirs("MessageThreads", exist_ok=True)
        
        message_id, content = self.test_user.ContactUser(10002)
        
        self.assertIsNotNone(message_id)
        mock_create_thread.assert_called_once()

    def test_contact_self(self):
        """Test user cannot contact themselves"""
        result = self.test_user.ContactUser(10001)
        
        self.assertIsNone(result)

    @patch('User.User.get_connection')
    def test_create_message_thread(self, mock_get_connection):
        """Test creating a new message thread"""
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_get_connection.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        
        self.test_user.CreateMessageThread("TEST_123", 10001, 10002)
        
        mock_cursor.execute.assert_called_once()
        mock_conn.commit.assert_called_once()
        
        # Check file creation
        self.assertTrue(os.path.exists("MessageThreads/TEST_123.json"))

    @patch('User.Notification')
    @patch('User.User.encrypt')
    @patch('User.User.get_connection')
    def test_send_message(self, mock_get_connection, mock_encrypt, mock_notification):
        """Test sending a message"""
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_get_connection.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_encrypt.return_value = 1
        
        self.test_user.SendMessage("TEST_123", 10002, "Hello there!")
        
        mock_encrypt.assert_called_once_with(10001, 10002, "Hello there!", "TEST_123.json")
        mock_cursor.execute.assert_called()

    def test_generate_key(self):
        """Test key generation for encryption"""
        key1 = self.test_user.generateKey(10001, 10002)
        key2 = self.test_user.generateKey(10002, 10001)  # Reverse order
        
        self.assertEqual(key1, key2)  # Should be same regardless of order
        self.assertEqual(len(key1), 32)  # 256-bit key

    def test_encrypt_decrypt_roundtrip(self):
        """Test encryption and decryption work together"""
        test_message = "This is a test message!"
        filename = "test_message"
        
        # First encryption (no existing file)
        result = self.test_user.encrypt(10001, 10002, test_message, filename)
        self.assertEqual(result, 0)  # No existing file
        
        # Create initial encrypted file
        key = self.test_user.generateKey(10001, 10002)
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM
        import base64
        
        aesgcm = AESGCM(key)
        nonce = os.urandom(12)
        ct = aesgcm.encrypt(nonce, test_message.encode('utf-8'), associated_data=None)
        
        out = {
            "ids_sorted": "10001:10002",
            "salt_hex": "test",
            "nonce_b64": base64.b64encode(nonce).decode('utf-8'),
            "ciphertext_b64": base64.b64encode(ct).decode('utf-8'),
            "kdf_info": "HKDF-SHA256 length=32 info='two-id-comm-key' deterministic-salt-from-ids"
        }
        
        with open(f"{filename}.json", 'w') as f:
            json.dump(out, f, indent=2)
        
        # Test decryption
        decrypted = self.test_user.decrypt(10001, 10002, filename)
        self.assertEqual(decrypted, test_message)
        
        # Test appending to existing file
        additional_message = " Additional text!"
        result = self.test_user.encrypt(10001, 10002, additional_message, filename)
        self.assertEqual(result, 1)  # Success
        
        # Verify combined content
        combined = self.test_user.decrypt(10001, 10002, filename)
        self.assertEqual(combined, test_message + additional_message)

    def test_decrypt_nonexistent_file(self):
        """Test decryption of non-existent file raises exception"""
        with self.assertRaises(FileNotFoundError):
            self.test_user.decrypt(10001, 10002, "nonexistent")

class TestUserIntegration(unittest.TestCase):
    """Integration tests requiring actual database connection (optional)"""
    
    @classmethod
    def setUpClass(cls):
        """Set up test database (if available)"""
        try:
            cls.test_conn = User.get_connection()
            cls.has_db = True
        except:
            cls.has_db = False
            
    def setUp(self):
        if not self.has_db:
            self.skipTest("Database not available for integration tests")
            
        self.test_user = User(
            UserID=99999,  # Use high ID to avoid conflicts
            Username="integration_test_user",
            sessionIP="127.0.0.1",
            sessionID="integration_test"
        )

    def test_database_connection(self):
        """Test database connection works"""
        if self.has_db:
            conn = User.get_connection()
            self.assertIsNotNone(conn)
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            self.assertEqual(result[0], 1)
            cursor.close()
            conn.close()

if __name__ == '__main__':
    # Run the tests
    unittest.main(verbosity=2)