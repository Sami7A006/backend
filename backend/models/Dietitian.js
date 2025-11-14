import mongoose from 'mongoose';

const dietitianSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  qualifications: [String],
  specialization: [String],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  bio: String,
  experience: Number, // years
  availability: {
    timezone: String,
    slots: [{
      day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      startTime: String, // HH:mm format
      endTime: String,
      isAvailable: {
        type: Boolean,
        default: true
      }
    }]
  },
  pricePerSession: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  profileImage: String
}, {
  timestamps: true
});

export default mongoose.model('Dietitian', dietitianSchema);

