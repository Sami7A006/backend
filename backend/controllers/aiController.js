import OpenAI from 'openai';

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

export const chatWithAI = async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({ 
        success: false, 
        message: 'AI disabled: Missing OPENAI_API_KEY.' 
      });
    }
    
    const { message, type, sessionId, chatHistory } = req.body;
    
    // Build system prompt based on type
    let systemPrompt = 'You are a helpful nutrition assistant. Provide accurate, evidence-based nutrition advice.';
    
    if (type === 'ingredient_analysis') {
      systemPrompt = 'You are a nutrition expert specializing in ingredient analysis. Analyze ingredients and identify any harmful substances, allergens, or concerning additives. Provide safety ratings and recommendations.';
    } else if (type === 'diet_plan') {
      systemPrompt = 'You are a professional dietitian. Create personalized diet plans with specific foods, portions, and nutritional information.';
    } else if (type === 'meal_suggestion') {
      systemPrompt = 'You are a nutrition expert. Provide daily meal suggestions based on user preferences and health goals. Include calorie counts and nutritional information.';
    }
    
    // Build messages array from chat history
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(chatHistory || []),
      { role: 'user', content: message }
    ];
    
    // Get AI response
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 500
    });
    
    const aiResponse = completion.choices[0].message.content;
    
    res.json({ 
      response: aiResponse,
      sessionId: sessionId || 'default'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const analyzeIngredient = async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({ 
        success: false, 
        message: 'AI disabled: Missing OPENAI_API_KEY.' 
      });
    }
    
    const { ingredient } = req.body;
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a nutrition expert specializing in ingredient analysis. Analyze ingredients and identify any harmful substances, allergens, or concerning additives. Provide a safety rating (1-10) and detailed explanation.'
        },
        {
          role: 'user',
          content: `Analyze these ingredients and provide safety information: ${ingredient}`
        }
      ],
      max_tokens: 300
    });
    
    const analysis = completion.choices[0].message.content;
    
    // Extract safety rating (simple regex)
    const ratingMatch = analysis.match(/rating[:\s]*(\d+)/i);
    const safetyRating = ratingMatch ? parseInt(ratingMatch[1]) : 5;
    
    res.json({
      ingredient,
      analysis,
      safetyRating: Math.min(10, Math.max(1, safetyRating))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const generateDietPlan = async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({ 
        success: false, 
        message: 'AI disabled: Missing OPENAI_API_KEY.' 
      });
    }
    
    const { preferences, duration, age, weight, height, goal, allergies, dietaryPreferences, calorieRequirement } = req.body;
    
    const prompt = `Create a ${duration || 7}-day personalized diet plan for:
- Age: ${age || 'N/A'}
- Weight: ${weight || 'N/A'}kg
- Height: ${height || 'N/A'}cm
- Goal: ${goal || 'general health'}
- Allergies: ${allergies?.join(', ') || 'None'}
- Dietary preferences: ${dietaryPreferences?.join(', ') || 'None'}
- Daily calorie target: ${calorieRequirement || 'N/A'} calories
- Additional preferences: ${preferences || 'None'}

Provide a detailed meal plan with breakfast, lunch, dinner, and snacks for each day. Include calorie counts and macronutrient breakdown.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a professional dietitian. Create detailed, personalized diet plans with specific foods, portions, and nutritional information.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000
    });
    
    const dietPlan = completion.choices[0].message.content;
    
    res.json({ dietPlan });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

