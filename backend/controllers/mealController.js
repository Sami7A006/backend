import User from '../models/User.js';
import DietChart from '../models/DietChart.js';
import Booking from '../models/Booking.js';

export const generateMealPlan = async (req, res) => {
  try {
    const { duration, preferences } = req.body;
    const healthProfile = req.user.healthProfile || {};
    
    // This would typically call the AI service
    // For now, return a basic structure
    const mealPlan = {
      duration: duration || 7,
      dailyCalorieTarget: healthProfile.calorieRequirement || 2000,
      meals: []
    };
    
    // Generate sample meal plan structure
    for (let day = 1; day <= mealPlan.duration; day++) {
      mealPlan.meals.push({
        day,
        breakfast: { foods: [], calories: 0 },
        lunch: { foods: [], calories: 0 },
        dinner: { foods: [], calories: 0 },
        snacks: { foods: [], calories: 0 }
      });
    }
    
    res.json({ mealPlan });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const generateGroceryList = async (req, res) => {
  try {
    const { mealPlan } = req.body;
    
    if (!mealPlan || !mealPlan.meals) {
      return res.status(400).json({ message: 'Meal plan required' });
    }
    
    // Extract all foods from meal plan
    const groceryItems = new Map();
    
    mealPlan.meals.forEach(day => {
      ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mealType => {
        if (day[mealType] && day[mealType].foods) {
          day[mealType].foods.forEach(food => {
            const foodName = typeof food === 'string' ? food : food.name;
            const quantity = typeof food === 'object' && food.quantity ? food.quantity : '1 unit';
            
            if (groceryItems.has(foodName)) {
              // Merge quantities if same item
              groceryItems.set(foodName, {
                name: foodName,
                quantity: `${groceryItems.get(foodName).quantity}, ${quantity}`,
                category: 'General'
              });
            } else {
              groceryItems.set(foodName, {
                name: foodName,
                quantity,
                category: 'General'
              });
            }
          });
        }
      });
    });
    
    const groceryList = Array.from(groceryItems.values());
    
    res.json({ groceryList });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const saveMealPlan = async (req, res) => {
  try {
    const { mealPlan } = req.body;
    
    req.user.dietPlans.push({
      planId: new Date().getTime(),
      createdAt: new Date(),
      meals: mealPlan.meals || []
    });
    
    await req.user.save();
    
    res.json({ message: 'Meal plan saved', dietPlans: req.user.dietPlans });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

