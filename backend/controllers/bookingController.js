import Booking from '../models/Booking.js';
import Dietitian from '../models/Dietitian.js';
import User from '../models/User.js';

export const createBooking = async (req, res) => {
  try {
    const { dietitianId, date, timeSlot, consultationType, notes, goals } = req.body;
    
    const dietitian = await Dietitian.findById(dietitianId);
    if (!dietitian) {
      return res.status(404).json({ message: 'Dietitian not found' });
    }
    
    // Check if slot is available
    const existingBooking = await Booking.findOne({
      dietitian: dietitianId,
      date: new Date(date),
      timeSlot: { start: timeSlot.start },
      status: { $in: ['pending', 'confirmed'] }
    });
    
    if (existingBooking) {
      return res.status(400).json({ message: 'Slot already booked' });
    }
    
    const booking = await Booking.create({
      user: req.user._id,
      dietitian: dietitianId,
      date: new Date(date),
      timeSlot,
      consultationType: consultationType || 'both',
      notes,
      goals: goals || []
    });
    
    await booking.populate('dietitian', 'name qualifications rating');
    await booking.populate('user', 'name email');
    
    res.status(201).json({ message: 'Booking created', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('dietitian', 'name qualifications rating specialization profileImage')
      .sort({ date: -1 });
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check authorization
    const dietitian = await Dietitian.findOne({ userId: req.user._id });
    if (booking.dietitian.toString() !== dietitian?._id.toString() && 
        booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    booking.status = status;
    await booking.save();
    
    res.json({ message: 'Booking status updated', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

