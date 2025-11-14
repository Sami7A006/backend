import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Chat from '../models/Chat.js';
import CallSession from '../models/CallSession.js';

export const updateHealthProfile = async (req, res) => {
  try {
    const { age, weight, height, goal, allergies, dietaryPreferences, activityLevel } = req.body;
    
    // Calculate calorie requirement using Mifflin-St Jeor Equation
    let bmr = 0;
    if (req.user.healthProfile?.weight && req.user.healthProfile?.height && age) {
      if (req.user.healthProfile.gender === 'male') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
      } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
      }
      
      const activityMultipliers = {
        sedentary: 1.2,
        lightly_active: 1.375,
        moderately_active: 1.55,
        very_active: 1.725,
        extra_active: 1.9
      };
      
      const calorieRequirement = Math.round(bmr * (activityMultipliers[activityLevel] || 1.2));
      
      req.user.healthProfile = {
        ...req.user.healthProfile,
        age,
        weight,
        height,
        goal,
        allergies: allergies || [],
        dietaryPreferences: dietaryPreferences || [],
        activityLevel,
        calorieRequirement
      };
    } else {
      req.user.healthProfile = {
        ...req.user.healthProfile,
        age,
        weight,
        height,
        goal,
        allergies: allergies || [],
        dietaryPreferences: dietaryPreferences || [],
        activityLevel
      };
    }
    
    await req.user.save();
    res.json({ message: 'Health profile updated', healthProfile: req.user.healthProfile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addProgress = async (req, res) => {
  try {
    const { weight, notes } = req.body;
    
    req.user.progress.push({
      date: new Date(),
      weight,
      notes
    });
    
    await req.user.save();
    res.json({ message: 'Progress added', progress: req.user.progress });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDashboard = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('dietitian', 'name qualifications rating')
      .sort({ createdAt: -1 })
      .limit(10);
    
    const recentChats = await Chat.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }]
    })
      .populate('sender', 'name')
      .populate('receiver', 'name')
      .sort({ createdAt: -1 })
      .limit(10);
    
    const callHistory = await CallSession.find({
      user: req.user._id
    })
      .populate('dietitian', 'name')
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({
      user: req.user,
      bookings,
      recentChats,
      callHistory,
      progress: req.user.progress,
      savedFoods: req.user.savedFoods,
      dietPlans: req.user.dietPlans
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const saveFood = async (req, res) => {
  try {
    const { name, calories, nutrients } = req.body;
    
    req.user.savedFoods.push({ name, calories, nutrients });
    await req.user.save();
    
    res.json({ message: 'Food saved', savedFoods: req.user.savedFoods });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

