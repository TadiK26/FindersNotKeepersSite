import re
from datetime import datetime


# Replace your calculate_similarity function in ai_services.py
def calculate_similarity(listing1, listing2):
    """
    Calculate similarity between two listings using a multi-factor approach.
    
    The algorithm considers:
    - Category match (30% weight)
    - Description similarity based on word overlap (40% weight)
    - Location similarity using keyword matching (15% weight)
    - Title similarity based on word overlap (15% weight)
    - Brand/model recognition bonus (20% bonus if both reference same brand)
    
    Args:
        listing1 (dict): First listing with keys: type, category, title, description, location
        listing2 (dict): Second listing with same structure as listing1
        
    Returns:
        float: Similarity score between 0 and 1, where 1 is identical
    """
    print(f"🔍 Comparing: '{listing1['title']}' vs '{listing2['title']}'")
    print(f"   Type: {listing1['type']} vs {listing2['type']}")

    # Don't compare listings of the same type
    if listing1['type'] == listing2['type']:
        print("Skipping - same type")
        return 0

    score = 0
    details = {}

    # 1. Category match (30% weight)
    if listing1['category'] == listing2['category']:
        score += 0.3
        details['category'] = 0.3
        print(f"Category match: +0.3")
    else:
        details['category'] = 0
        print(f"Category mismatch: {listing1['category']} vs {listing2['category']}")

    # 2. Description similarity (40% weight)
    words1 = preprocess_text(listing1['description'])
    words2 = preprocess_text(listing2['description'])

    common_words = set(words1) & set(words2)

    if words1 or words2:  # Avoid division by zero
        description_similarity = len(common_words) / max(len(words1), len(words2))
        score += description_similarity * 0.4
        details['description'] = description_similarity * 0.4
        print(f"Description similarity: {len(common_words)} common words, score: {description_similarity * 0.4:.2f}")
    else:
        details['description'] = 0
        print("No words to compare in descriptions")

    # 3. Location similarity (15% weight)
    loc1 = preprocess_text(listing1['location'])
    loc2 = preprocess_text(listing2['location'])

    # Check for location keywords instead of exact match
    location_similarity = calculate_location_similarity(loc1, loc2)
    score += location_similarity * 0.15
    details['location'] = location_similarity * 0.15
    print(f"Location similarity: {location_similarity * 0.15:.2f}")

    # 4. Title similarity (15% weight)
    title1_words = preprocess_text(listing1['title'])
    title2_words = preprocess_text(listing2['title'])

    if title1_words and title2_words:
        title_similarity = len(set(title1_words) & set(title2_words)) / max(len(title1_words), len(title2_words))
        score += title_similarity * 0.15
        details['title'] = title_similarity * 0.15
        print(f"Title similarity: {title_similarity * 0.15:.2f}")
    else:
        details['title'] = 0

    # 5. Brand/model recognition (bonus 20%)
    brand_match = enhance_with_brand_recognition(listing1, listing2)
    if brand_match:
        bonus = 0.2
        score += bonus
        details['brand'] = bonus
        print(f"Brand recognition bonus: +{bonus}")
    else:
        details['brand'] = 0

    final_score = min(score, 1.0)  # Cap at 1.0
    print(f"Total similarity score: {final_score:.2f} (Details: {details})")

    return final_score


def preprocess_text(text):
    """
    Preprocess text by converting to lowercase, removing punctuation, 
    and filtering out short words to improve matching accuracy.
    
    Args:
        text (str): Input text to preprocess
        
    Returns:
        list: List of processed words with length > 2 characters
    """
    text = text.lower()
    # Remove punctuation
    text = re.sub(r'[^\w\s]', '', text)
    # Split into words and remove short words
    words = text.split()
    words = [word for word in words if len(word) > 2]  # Reduced from 3 to 2
    return words


def calculate_location_similarity(loc1, loc2):
    """
    Calculate similarity between two locations using keyword matching
    and common word analysis.
    
    Args:
        loc1 (list): Preprocessed words from first location
        loc2 (list): Preprocessed words from second location
        
    Returns:
        float: Location similarity score between 0 and 1
    """
    location_keywords = ['library', 'center', 'building', 'cafeteria', 'student', 'room']

    # Check if any keywords match
    keyword_matches = 0
    for keyword in location_keywords:
        if keyword in loc1 and keyword in loc2:
            keyword_matches += 1

    # Also check for any common words
    common_words = set(loc1) & set(loc2)

    # Combine both measures
    similarity = (len(common_words) / max(len(loc1), len(loc2))) * 0.7 + (
                keyword_matches / len(location_keywords)) * 0.3

    return min(similarity, 1.0)


# Add to ai_services.py to fix apple and iphone issue
def enhance_with_brand_recognition(listing1, listing2):
    """
    Detect if both listings reference the same brand or product type
    to apply a similarity bonus.
    
    Args:
        listing1 (dict): First listing with title and description
        listing2 (dict): Second listing with title and description
        
    Returns:
        bool: True if both listings reference the same brand, False otherwise
    """
    # Common product brands and models
    product_patterns = {
        'iphone': ['apple', 'iphone'],
        'macbook': ['apple', 'macbook', 'mac'],
        'samsung': ['samsung', 'galaxy'],
        'sony': ['sony'],
        'nike': ['nike'],
        'north face': ['north face', 'northface']
    }

    # Check both titles and descriptions
    text1 = f"{listing1['title']} {listing1['description']}".lower()
    text2 = f"{listing2['title']} {listing2['description']}".lower()

    brand_match = False
    for product, keywords in product_patterns.items():
        match1 = any(keyword in text1 for keyword in keywords)
        match2 = any(keyword in text2 for keyword in keywords)

        if match1 and match2:
            brand_match = True
            print(f"Brand/model match detected: {product}")
            break

    return brand_match




def generate_chatbot_response(message):
    """
    Generate response for chatbot
    """
    lower_message = message.lower()

    # FAQ responses
    if 'how' in lower_message and 'report' in lower_message:
        return "To report a lost or found item, simply fill out the form on the homepage with details about the item. Our AI will then try to match it with other listings."
    elif 'match' in lower_message or 'similar' in lower_message:
        return "Our AI matching algorithm compares new listings with existing ones based on category, description, and location. You can adjust the similarity threshold in the AI panel."
    elif 'notification' in lower_message:
        return "You'll receive a notification when our AI finds a potential match for your item. The notification will show the similarity percentage."
    elif 'claim' in lower_message or 'proof' in lower_message:
        return "To claim an item, you need to provide proof of ownership. This could be a photo, receipt, or detailed description that matches the item."
    elif 'hello' in lower_message or 'hi' in lower_message:
        return "Hello! How can I help you with FindersNotKeepers today?"
    else:
        return "I'm sorry, I didn't understand that. I can help with questions about reporting items, the matching process, notifications, or claiming items."