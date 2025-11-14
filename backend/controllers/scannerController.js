import Tesseract from 'tesseract.js';
import OpenAI from 'openai';
import sharp from 'sharp';

// Initialize OpenAI client only if API key is available
let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '') {
  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  } catch (error) {
    console.warn('Warning: Failed to initialize OpenAI client:', error.message);
    openai = null;
  }
} else {
  console.warn('Warning: OPENAI_API_KEY is missing. AI features will be disabled.');
}

// Common allergens list
const COMMON_ALLERGENS = [
  'milk', 'eggs', 'fish', 'shellfish', 'tree nuts', 'peanuts', 'wheat', 'soybeans',
  'gluten', 'lactose', 'casein', 'albumin', 'gelatin'
];

// Common harmful additives
const HARMFUL_ADDITIVES = [
  'sodium nitrite', 'bha', 'bht', 'tbhq', 'potassium bromate', 'azodicarbonamide',
  'artificial colors', 'artificial flavors', 'high fructose corn syrup', 'trans fats',
  'sodium benzoate', 'potassium sorbate', 'sulfites', 'msg', 'aspartame', 'sucralose'
];

// Preprocess image for better OCR
async function preprocessImage(imageBuffer) {
  try {
    // Enhance image: increase contrast, adjust brightness, sharpen
    const processed = await sharp(imageBuffer)
      .greyscale() // Convert to grayscale for better OCR
      .normalize() // Normalize contrast
      .sharpen() // Sharpen edges
      .gamma(1.2) // Adjust gamma for better contrast
      .linear(1.1, -(128 * 0.1)) // Increase contrast
      .toBuffer();
    
    return processed;
  } catch (error) {
    console.error('Image preprocessing error:', error);
    return imageBuffer; // Return original if preprocessing fails
  }
}

// Extract structured information from text
function extractStructuredInfo(text) {
  const lowerText = text.toLowerCase();
  
  // Find allergens
  const foundAllergens = COMMON_ALLERGENS.filter(allergen => 
    lowerText.includes(allergen.toLowerCase())
  );
  
  // Find harmful additives
  const foundAdditives = HARMFUL_ADDITIVES.filter(additive => 
    lowerText.includes(additive.toLowerCase())
  );
  
  // Extract potential ingredients (lines that might be ingredients)
  const lines = text.split('\n').filter(line => line.trim().length > 2);
  const potentialIngredients = lines.slice(0, 30); // First 30 lines likely contain ingredients
  
  return {
    foundAllergens,
    foundAdditives,
    potentialIngredients
  };
}

export const scanIngredients = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image provided' });
    }
    
    const imageBuffer = req.file.buffer;
    
    // Preprocess image for better OCR
    const processedImage = await preprocessImage(imageBuffer);
    
    // Use Tesseract.js for OCR with optimized settings
    const { data: { text, confidence } } = await Tesseract.recognize(processedImage, 'eng', {
      logger: m => console.log(m),
      tessedit_pageseg_mode: '6', // Assume uniform block of text
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:()[]{}/- ',
    });
    
    const ingredientsText = text || '';
    
    if (!ingredientsText.trim()) {
      return res.status(400).json({ 
        message: 'Could not extract text from image. Please ensure the image is clear and contains readable text.',
        confidence: confidence || 0
      });
    }
    
    // Extract structured information
    const structuredInfo = extractStructuredInfo(ingredientsText);
    
    if (!openai) {
      // Return OCR results without AI analysis if OpenAI is not available
      return res.json({
        extractedText: ingredientsText,
        analysis: 'AI analysis is disabled. Please configure OPENAI_API_KEY to enable AI-powered ingredient analysis.',
        safetyRating: 5, // Default neutral rating
        harmfulIngredients: structuredInfo.foundAdditives.slice(0, 10),
        allergens: structuredInfo.foundAllergens.slice(0, 10),
        nutritionalInfo: null,
        recommendations: 'AI analysis unavailable. Please review ingredients manually.',
        confidence: confidence || 0,
        structuredInfo: {
          foundAllergens: structuredInfo.foundAllergens,
          foundAdditives: structuredInfo.foundAdditives
        },
        success: false,
        message: 'AI disabled: Missing OPENAI_API_KEY. Showing OCR results only.'
      });
    }
    
    // Enhanced AI analysis with detailed breakdown
    const analysisPrompt = `Analyze these ingredients extracted from a product label:

${ingredientsText}

Provide a comprehensive analysis in the following format:

1. SAFETY RATING: [Number from 1-10, where 10 is safest]

2. NUTRITIONAL INFORMATION:
   - Main nutrients present
   - Calorie content (if mentioned)
   - Macronutrient breakdown (if available)

3. ALLERGENS DETECTED:
   [List any allergens found from: milk, eggs, fish, shellfish, tree nuts, peanuts, wheat, soybeans, gluten]

4. HARMFUL ADDITIVES:
   [List any concerning additives, preservatives, artificial colors/flavors, or chemicals]

5. HEALTH IMPACT ASSESSMENT:
   - Overall healthiness
   - Potential concerns
   - Benefits (if any)

6. INGREDIENT CATEGORIZATION:
   - Natural ingredients
   - Processed ingredients
   - Artificial ingredients

7. RECOMMENDATIONS:
   - Should this product be consumed?
   - Who should avoid it?
   - Healthier alternatives (if applicable)

Provide detailed, evidence-based analysis.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a nutrition expert and food safety specialist. Analyze ingredient lists thoroughly and provide detailed, accurate information about nutritional content, allergens, additives, and health impacts.'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.3 // Lower temperature for more consistent, factual responses
    });
    
    const analysis = completion.choices[0].message.content;
    
    // Extract safety rating with multiple patterns
    const ratingPatterns = [
      /safety rating[:\s]*(\d+)/i,
      /rating[:\s]*(\d+)\s*\/\s*10/i,
      /(\d+)\s*\/\s*10/i,
      /rating[:\s]*(\d+)/i
    ];
    
    let safetyRating = 5; // Default
    for (const pattern of ratingPatterns) {
      const match = analysis.match(pattern);
      if (match) {
        safetyRating = parseInt(match[1]);
        break;
      }
    }
    safetyRating = Math.min(10, Math.max(1, safetyRating));
    
    // Extract harmful ingredients from analysis
    const harmfulSection = analysis.match(/harmful[^:]*:?\s*([^\n]+(?:\n[^\n]+)*?)(?=\n\n|\n[A-Z]|$)/i);
    const harmfulIngredients = harmfulSection 
      ? harmfulSection[1].split(/[,\n]/).map(s => s.trim()).filter(s => s.length > 0)
      : structuredInfo.foundAdditives;
    
    // Extract allergens
    const allergenSection = analysis.match(/allergens[^:]*:?\s*([^\n]+(?:\n[^\n]+)*?)(?=\n\n|\n[A-Z]|$)/i);
    const detectedAllergens = allergenSection
      ? allergenSection[1].split(/[,\n]/).map(s => s.trim()).filter(s => s.length > 0)
      : structuredInfo.foundAllergens;
    
    // Extract nutritional information
    const nutritionalSection = analysis.match(/nutritional information[^:]*:?\s*([^\n]+(?:\n[^\n]+)*?)(?=\n\n|\n[A-Z]|$)/i);
    const nutritionalInfo = nutritionalSection ? nutritionalSection[1].trim() : null;
    
    // Extract recommendations
    const recommendationsSection = analysis.match(/recommendations[^:]*:?\s*([^\n]+(?:\n[^\n]+)*?)(?=\n\n|\n[A-Z]|$)/i);
    const recommendations = recommendationsSection ? recommendationsSection[1].trim() : null;
    
    res.json({
      extractedText: ingredientsText,
      analysis,
      safetyRating,
      harmfulIngredients: harmfulIngredients.slice(0, 10), // Limit to 10
      allergens: detectedAllergens.slice(0, 10),
      nutritionalInfo,
      recommendations,
      confidence: confidence || 0,
      structuredInfo: {
        foundAllergens: structuredInfo.foundAllergens,
        foundAdditives: structuredInfo.foundAdditives
      }
    });
  } catch (error) {
    console.error('Scanner error:', error);
    res.status(500).json({ message: error.message });
  }
};
