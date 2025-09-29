/**
 * Client-side Matching Utilities for FindersNotKeepers
 * Supplemental matching functions for client-side use
 */

/**
 * Calculate basic similarity between two listings (client-side fallback)
 * @param {Object} listing1 - First listing object
 * @param {Object} listing2 - Second listing object
 * @returns {number} Similarity score between 0 and 1
 */
function calculateBasicSimilarity(listing1, listing2) {
    // Don't compare listings of the same type
    if (listing1.type === listing2.type) {
        return 0;
    }

    let score = 0;

    // Category match (30% weight)
    if (listing1.category === listing2.category) {
        score += 0.3;
    }

    // Title similarity (25% weight)
    const titleSimilarity = calculateTextSimilarity(listing1.title, listing2.title);
    score += titleSimilarity * 0.25;

    // Description similarity (35% weight)
    const descSimilarity = calculateTextSimilarity(listing1.description, listing2.description);
    score += descSimilarity * 0.35;

    // Location similarity (10% weight)
    const locSimilarity = calculateLocationSimilarity(listing1.location, listing2.location);
    score += locSimilarity * 0.1;

    return Math.min(score, 1.0);
}

/**
 * Calculate text similarity using word overlap
 * @param {string} text1 - First text
 * @param {string} text2 - Second text
 * @returns {number} Similarity score between 0 and 1
 */
function calculateTextSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;

    // Preprocess texts
    const words1 = preprocessText(text1);
    const words2 = preprocessText(text2);

    if (words1.length === 0 || words2.length === 0) return 0;

    // Calculate Jaccard similarity
    const set1 = new Set(words1);
    const set2 = new Set(words2);

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Calculate location similarity
 * @param {string} location1 - First location
 * @param {string} location2 - Second location
 * @returns {number} Similarity score between 0 and 1
 */
function calculateLocationSimilarity(location1, location2) {
    if (!location1 || !location2) return 0;

    const loc1 = location1.toLowerCase();
    const loc2 = location2.toLowerCase();

    // Exact match
    if (loc1 === loc2) return 1.0;

    // Contains match
    if (loc1.includes(loc2) || loc2.includes(loc1)) return 0.7;

    // Common location keywords
    const commonKeywords = ['library', 'center', 'building', 'cafe', 'cafeteria', 'hall', 'room', 'lab', 'grounds', 'parking'];
    const keywords1 = commonKeywords.filter(keyword => loc1.includes(keyword));
    const keywords2 = commonKeywords.filter(keyword => loc2.includes(keyword));

    if (keywords1.length > 0 && keywords2.length > 0) {
        const common = keywords1.filter(keyword => keywords2.includes(keyword));
        return common.length / Math.max(keywords1.length, keywords2.length) * 0.5;
    }

    return 0;
}

/**
 * Preprocess text for similarity calculation
 * @param {string} text - Input text
 * @returns {Array} Array of processed words
 */
function preprocessText(text) {
    return text.toLowerCase()
        .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
        .split(/\s+/) // Split on whitespace
        .filter(word => word.length > 2) // Remove short words
        .filter(word => !stopWords.has(word)); // Remove stop words
}

/**
 * Common English stop words
 */
const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
    'might', 'must', 'can', 'its', 'their', 'what', 'which', 'who', 'whom', 'whose'
]);

/**
 * Find potential matches for a listing from a list of candidates
 * @param {Object} targetListing - The listing to find matches for
 * @param {Array} candidateListings - Array of potential matching listings
 * @param {number} threshold - Similarity threshold (0-1)
 * @returns {Array} Array of matches with similarity scores
 */
function findPotentialMatches(targetListing, candidateListings, threshold = 0.6) {
    const matches = [];

    candidateListings.forEach(candidate => {
        // Skip if same type or same user
        if (targetListing.type === candidate.type || targetListing.user_id === candidate.user_id) {
            return;
        }

        const similarity = calculateBasicSimilarity(targetListing, candidate);

        if (similarity >= threshold) {
            matches.push({
                listing: candidate,
                similarity: similarity,
                details: getMatchDetails(targetListing, candidate)
            });
        }
    });

    // Sort by similarity (highest first)
    return matches.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Get detailed match analysis between two listings
 * @param {Object} listing1 - First listing
 * @param {Object} listing2 - Second listing
 * @returns {Object} Match details object
 */
function getMatchDetails(listing1, listing2) {
    const details = {
        categoryMatch: listing1.category === listing2.category,
        titleSimilarity: calculateTextSimilarity(listing1.title, listing2.title),
        descriptionSimilarity: calculateTextSimilarity(listing1.description, listing2.description),
        locationSimilarity: calculateLocationSimilarity(listing1.location, listing2.location),
        commonKeywords: findCommonKeywords(listing1, listing2)
    };

    return details;
}

/**
 * Find common keywords between two listings
 * @param {Object} listing1 - First listing
 * @param {Object} listing2 - Second listing
 * @returns {Array} Array of common keywords
 */
function findCommonKeywords(listing1, listing2) {
    const text1 = `${listing1.title} ${listing1.description}`.toLowerCase();
    const text2 = `${listing2.title} ${listing2.description}`.toLowerCase();

    const words1 = preprocessText(text1);
    const words2 = preprocessText(text2);

    const common = [...new Set(words1.filter(word => words2.includes(word)))];
    return common.slice(0, 10); // Return top 10 common keywords
}

/**
 * Format similarity score for display
 * @param {number} score - Similarity score (0-1)
 * @returns {string} Formatted percentage string
 */
function formatSimilarityScore(score) {
    return `${Math.round(score * 100)}%`;
}

/**
 * Check if two listings are likely the same item
 * @param {Object} listing1 - First listing
 * @param {Object} listing2 - Second listing
 * @param {number} highThreshold - High confidence threshold (default: 0.8)
 * @param {number} mediumThreshold - Medium confidence threshold (default: 0.6)
 * @returns {Object} Confidence assessment
 */
function assessMatchConfidence(listing1, listing2, highThreshold = 0.8, mediumThreshold = 0.6) {
    const similarity = calculateBasicSimilarity(listing1, listing2);

    let confidence = 'low';
    if (similarity >= highThreshold) {
        confidence = 'high';
    } else if (similarity >= mediumThreshold) {
        confidence = 'medium';
    }

    return {
        confidence: confidence,
        score: similarity,
        formattedScore: formatSimilarityScore(similarity),
        details: getMatchDetails(listing1, listing2)
    };
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateBasicSimilarity,
        calculateTextSimilarity,
        calculateLocationSimilarity,
        findPotentialMatches,
        assessMatchConfidence,
        formatSimilarityScore
    };
}