import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
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
  date: {
    type: Date,
    required: true
  },
  timeSlot: {
    start: String,
    end: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  consultationType: {
    type: String,
    enum: ['chat', 'video', 'both'],
    default: 'both'
  },
  notes: String,
  goals: [String],
  dietChart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DietChart'
  }
}, {
  timestamps: true
});

export default mongoose.model('Booking', bookingSchema);

