import mongoose from 'mongoose';

const dietChartSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dietitian: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dietitian',
    required: true
  },
  meals: [{
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      required: true
    },
    foods: [{
      name: String,
      quantity: String,
      calories: Number,
      nutrients: {
        protein: Number,
        carbs: Number,
        fats: Number
      }
    }],
    totalCalories: Number
  }],
  dailyCalorieTarget: Number,
  notes: String,
  startDate: Date,
  endDate: Date
}, {
  timestamps: true
});

export default mongoose.model('DietChart', dietChartSchema);

