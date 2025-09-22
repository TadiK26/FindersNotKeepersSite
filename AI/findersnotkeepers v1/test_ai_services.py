import unittest
from ai_services import calculate_similarity, preprocess_text, calculate_location_similarity, enhance_with_brand_recognition

class TestAIServices(unittest.TestCase):
    def setUp(self):
        """Set up test data"""
        self.lost_iphone = {
            "type": "lost", 
            "category": "electronics", 
            "title": "iPhone 13 Pro Max", 
            "description": "Silver iPhone 13 Pro Max with black case. Has a small scratch on the bottom right corner.", 
            "location": "Main Library, Study Room 3B"
        }
        
        self.found_iphone = {
            "type": "found", 
            "category": "electronics", 
            "title": "Silver iPhone with black case", 
            "description": "Found an iPhone in the library. It has a black protective case and a small scratch on the bottom.", 
            "location": "Main Library, near study rooms"
        }
        
        self.found_jacket = {
            "type": "found", 
            "category": "clothing", 
            "title": "Blue jacket in cafeteria", 
            "description": "Found a blue North Face jacket in the student cafeteria. It seems to be waterproof.", 
            "location": "Student Center Dining Area"
        }

    def test_preprocess_text_removes_punctuation(self):
        """Test that preprocess_text removes punctuation and short words"""
        text = "Hello, world! This is a test with short words: a, an, the."
        result = preprocess_text(text)
        expected = ["hello", "world", "this", "test", "with", "short", "words"]
        self.assertEqual(result, expected)

    def test_preprocess_text_empty_string(self):
        """Test preprocess_text with empty string"""
        result = preprocess_text("")
        self.assertEqual(result, [])

    def test_calculate_similarity_high_match(self):
        """Test that similar items return high similarity score"""
        similarity = calculate_similarity(self.lost_iphone, self.found_iphone)
        self.assertGreaterEqual(similarity, 0.5, "Similar iPhone listings should match highly")
        
    def test_calculate_similarity_low_match(self):
        """Test that dissimilar items return low similarity score"""
        similarity = calculate_similarity(self.lost_iphone, self.found_jacket)
        self.assertLess(similarity, 0.3, "Different category items should have low similarity")

    def test_calculate_similarity_same_type_returns_zero(self):
        """Test that items of same type return 0 similarity"""
        similar_type_listing = self.found_iphone.copy()
        similar_type_listing["type"] = "lost"  # Change to same type
        similarity = calculate_similarity(self.lost_iphone, similar_type_listing)
        self.assertEqual(similarity, 0, "Items of same type should return 0 similarity")

    def test_location_similarity_same_location(self):
        """Test location similarity with identical locations"""
        loc1 = preprocess_text("Main Library, Study Room 3B")
        loc2 = preprocess_text("Main Library, Study Room 3B")
        similarity = calculate_location_similarity(loc1, loc2)
        self.assertGreaterEqual(similarity, 0.8, "Identical locations should have high similarity")

    def test_location_similarity_different_location(self):
        """Test location similarity with different locations"""
        loc1 = preprocess_text("Main Library, Study Room 3B")
        loc2 = preprocess_text("Student Center Cafeteria")
        similarity = calculate_location_similarity(loc1, loc2)
        self.assertLess(similarity, 0.3, "Different locations should have low similarity")

    def test_brand_recognition_apple_products(self):
        """Test brand recognition for Apple products"""
        # Both mention Apple products
        listing1 = {"title": "iPhone 13", "description": "Silver iPhone with case"}
        listing2 = {"title": "Found Apple iPhone", "description": "Black iPhone found in library"}
        
        result = enhance_with_brand_recognition(listing1, listing2)
        self.assertTrue(result, "Both Apple products should trigger brand recognition")

    def test_brand_recognition_different_brands(self):
        """Test brand recognition with different brands"""
        listing1 = {"title": "iPhone 13", "description": "Silver iPhone with case"}
        listing2 = {"title": "Samsung Galaxy", "description": "Black Samsung phone found"}
        
        result = enhance_with_brand_recognition(listing1, listing2)
        self.assertFalse(result, "Different brands should not trigger brand recognition")

    def test_similarity_score_range(self):
        """Test that similarity score is always between 0 and 1"""
        similarity = calculate_similarity(self.lost_iphone, self.found_iphone)
        self.assertGreaterEqual(similarity, 0, "Similarity should not be negative")
        self.assertLessEqual(similarity, 1, "Similarity should not exceed 1")

if __name__ == '__main__':
    unittest.main()