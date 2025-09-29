"""
Unit tests for FindersNotKeepers application
Tests all major functions and components
"""

import unittest
import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app, initialize_sample_data
from ai_services import calculate_semantic_similarity, calculate_basic_similarity, generate_chatbot_response


class TestFindersNotKeepers(unittest.TestCase):
    """Test cases for FindersNotKeepers application"""

    def setUp(self):
        """Set up test client and initialize sample data"""
        self.app = app.test_client()
        self.app.testing = True

        # Initialize sample data for testing
        with app.app_context():
            initialize_sample_data()

    def test_homepage_loading(self):
        """Test that homepage loads successfully"""
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)

    def test_search_page_loading(self):
        """Test that search page loads successfully"""
        response = self.app.get('/search')
        self.assertEqual(response.status_code, 200)

    def test_login_page_loading(self):
        """Test that login page loads successfully"""
        response = self.app.get('/login')
        self.assertEqual(response.status_code, 200)

    def test_get_listings(self):
        """Test retrieving listings via API"""
        response = self.app.get('/api/listings')
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)

    def test_get_listings_with_filters(self):
        """Test retrieving listings with search filters"""
        # Test keyword search
        response = self.app.get('/api/listings?q=MacBook')
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        self.assertIsInstance(data, list)

        # Test category filter
        response = self.app.get('/api/listings?category=electronics')
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        self.assertIsInstance(data, list)

    def test_semantic_similarity_calculation(self):
        """Test semantic similarity calculation between listings"""
        # Create test listings
        listing1 = {
            'title': 'Black laptop bag',
            'description': 'Black laptop bag with red zippers',
            'category': 'accessories'
        }

        listing2 = {
            'title': 'Dark laptop case',
            'description': 'Dark colored laptop bag with zippers',
            'category': 'accessories'
        }

        listing3 = {
            'title': 'Water bottle',
            'description': 'Silver water bottle with stickers',
            'category': 'other'
        }

        # Calculate similarities
        similar_score = calculate_semantic_similarity(listing1, listing2)
        different_score = calculate_semantic_similarity(listing1, listing3)

        # Similar items should have higher similarity score
        self.assertGreater(similar_score, different_score)

        # Scores should be between 0 and 1
        self.assertGreaterEqual(similar_score, 0)
        self.assertLessEqual(similar_score, 1)
        self.assertGreaterEqual(different_score, 0)
        self.assertLessEqual(different_score, 1)

    def test_basic_similarity_calculation(self):
        """Test basic similarity calculation fallback"""
        listing1 = {
            'title': 'test item one',
            'description': 'this is a test description'
        }

        listing2 = {
            'title': 'test item two',
            'description': 'this is another test description'
        }

        score = calculate_basic_similarity(listing1, listing2)

        # Should return a valid similarity score
        self.assertGreaterEqual(score, 0)
        self.assertLessEqual(score, 1)

    def test_chatbot_response_generation(self):
        """Test chatbot response generation"""
        # Test greeting
        response, answered = generate_chatbot_response('hello')
        self.assertTrue(answered)
        self.assertIsInstance(response, str)
        self.assertGreater(len(response), 0)

        # Test help topic
        response, answered = generate_chatbot_response('how do I report a lost item')
        self.assertTrue(answered)
        self.assertIn('report', response.lower())

        # Test unknown question
        response, answered = generate_chatbot_response('what is the meaning of life')
        self.assertIsInstance(response, str)
        self.assertGreater(len(response), 0)

    def test_advanced_search(self):
        """Test advanced search functionality"""
        search_data = {
            'keywords': 'laptop',
            'category': 'electronics',
            'type': 'lost'
        }

        response = self.app.post('/api/search/advanced', json=search_data)
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        self.assertIsInstance(data, list)

    def test_user_authentication(self):
        """Test user login functionality"""
        # Test successful login
        login_data = {
            'username': 'user1',
            'password': 'pass123'
        }

        response = self.app.post('/api/login', json=login_data)
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        self.assertTrue(data['success'])
        self.assertIn('user', data)

        # Test failed login
        bad_login_data = {
            'username': 'user1',
            'password': 'wrongpassword'
        }

        response = self.app.post('/api/login', json=bad_login_data)
        self.assertEqual(response.status_code, 401)

        data = response.get_json()
        self.assertFalse(data['success'])

    def test_ai_threshold_update(self):
        """Test AI similarity threshold update"""
        # First login
        self.app.post('/api/login', json={'username': 'user1', 'password': 'pass123'})

        # Update threshold
        threshold_data = {'threshold': 0.8}
        response = self.app.post('/api/ai/threshold', json=threshold_data)

        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        self.assertTrue(data['success'])
        self.assertEqual(data['threshold'], 0.8)

    def test_search_settings_save_load(self):
        """Test saving and loading search settings"""
        # Login first
        self.app.post('/api/login', json={'username': 'user1', 'password': 'pass123'})

        # Save settings
        settings_data = {
            'keywords': 'laptop',
            'category': 'electronics',
            'radius': 5
        }

        response = self.app.post('/api/search/settings', json=settings_data)
        self.assertEqual(response.status_code, 200)

        # Load settings
        response = self.app.get('/api/search/settings')
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        self.assertEqual(data['keywords'], 'laptop')
        self.assertEqual(data['category'], 'electronics')


class TestAIServices(unittest.TestCase):
    """Test cases specifically for AI services"""

    def test_semantic_similarity_edge_cases(self):
        """Test semantic similarity with edge cases"""
        # Empty listings
        empty_listing = {'title': '', 'description': '', 'category': ''}
        result = calculate_semantic_similarity(empty_listing, empty_listing)
        self.assertEqual(result, 0.0)

        # Very similar listings
        listing1 = {'title': 'iphone', 'description': 'black iphone 13', 'category': 'electronics'}
        listing2 = {'title': 'iphone', 'description': 'black iphone 13', 'category': 'electronics'}
        result = calculate_semantic_similarity(listing1, listing2)
        self.assertAlmostEqual(result, 1.0, delta=0.1)

        # Completely different listings
        listing3 = {'title': 'textbook', 'description': 'math textbook', 'category': 'books'}
        result = calculate_semantic_similarity(listing1, listing3)
        self.assertLess(result, 0.5)


if __name__ == '__main__':
    # Run all tests
    unittest.main(verbosity=2)