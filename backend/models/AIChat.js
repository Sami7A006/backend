import mongoose from 'mongoose';

const aiChatSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  type: {
    type: String,
    enum: ['general', 'ingredient_analysis', 'diet_plan', 'meal_suggestion'],
    default: 'general'
  }
}, {
  timestamps: true
});

export default mongoose.model('AIChat', aiChatSchema);

