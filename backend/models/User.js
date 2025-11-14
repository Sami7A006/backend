import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'dietitian'],
    default: 'user'
  },
  healthProfile: {
    age: Number,
    weight: Number,
    height: Number,
    goal: {
      type: String,
      enum: ['weight_loss', 'weight_gain', 'muscle_gain', 'maintain', 'general_health']
    },
    allergies: [String],
    dietaryPreferences: [String],
    activityLevel: {
      type: String,
      enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active']
    },
    calorieRequirement: Number
  },
  progress: [{
    date: Date,
    weight: Number,
    notes: String
  }],
  savedFoods: [{
    name: String,
    calories: Number,
    nutrients: {
      protein: Number,
      carbs: Number,
      fats: Number
    }
  }],
  dietPlans: [{
    planId: mongoose.Schema.Types.ObjectId,
    createdAt: Date,
    meals: [{
      mealType: String,
      foods: [String],
      calories: Number
    }]
  }],
  refreshToken: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);

