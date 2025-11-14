import mongoose from 'mongoose';

const callSessionSchema = new mongoose.Schema({
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
  startTime: Date,
  endTime: Date,
  duration: Number, // in seconds
  status: {
    type: String,
    enum: ['initiated', 'ongoing', 'ended', 'failed'],
    default: 'initiated'
  },
  recordingUrl: String // if recording is enabled
}, {
  timestamps: true
});

export default mongoose.model('CallSession', callSessionSchema);

