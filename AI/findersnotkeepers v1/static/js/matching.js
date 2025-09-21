// This file would contain client-side matching logic if needed
// Currently all matching is handled by the Python backend

// Client-side similarity calculation (for demonstration)
function calculateSimilarityClient(listing1, listing2) {
    // This is a simplified version for demonstration
    // The actual matching happens on the server
    
    let score = 0;
    
    // Category match
    if (listing1.category === listing2.category) {
        score += 0.3;
    }
    
    // Simple word overlap in description
    const words1 = listing1.description.toLowerCase().split(/\W+/);
    const words2 = listing2.description.toLowerCase().split(/\W+/);
    
    const commonWords = words1.filter(word => 
        word.length > 3 && words2.includes(word)
    );
    
    const descriptionSimilarity = commonWords.length / Math.max(words1.length, words2.length);
    score += descriptionSimilarity * 0.5;
    
    // Location similarity
    const loc1 = listing1.location.toLowerCase();
    const loc2 = listing2.location.toLowerCase();
    
    if (loc1 === loc2) {
        score += 0.2;
    } else if (loc1.includes(loc2) || loc2.includes(loc1)) {
        score += 0.1;
    }
    
    return Math.min(score, 1.0);
}