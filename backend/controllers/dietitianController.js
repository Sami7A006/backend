import Dietitian from '../models/Dietitian.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';

export const getAllDietitians = async (req, res) => {
  try {
    const dietitians = await Dietitian.find({ isVerified: true })
      .populate('userId', 'name email')
      .select('-userId.password');
    
    res.json(dietitians);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDietitian = async (req, res) => {
  try {
    const dietitian = await Dietitian.findById(req.params.id)
      .populate('userId', 'name email');
    
    if (!dietitian) {
      return res.status(404).json({ message: 'Dietitian not found' });
    }
    
    res.json(dietitian);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateDietitianProfile = async (req, res) => {
  try {
    const dietitian = await Dietitian.findOne({ userId: req.user._id });
    
    if (!dietitian) {
      return res.status(404).json({ message: 'Dietitian profile not found' });
    }
    
    const { qualifications, specialization, bio, experience, availability, pricePerSession, profileImage } = req.body;
    
    if (qualifications) dietitian.qualifications = qualifications;
    if (specialization) dietitian.specialization = specialization;
    if (bio) dietitian.bio = bio;
    if (experience) dietitian.experience = experience;
    if (availability) dietitian.availability = availability;
    if (pricePerSession !== undefined) dietitian.pricePerSession = pricePerSession;
    if (profileImage) dietitian.profileImage = profileImage;
    
    await dietitian.save();
    res.json({ message: 'Profile updated', dietitian });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDietitianDashboard = async (req, res) => {
  try {
    const dietitian = await Dietitian.findOne({ userId: req.user._id });
    
    if (!dietitian) {
      return res.status(404).json({ message: 'Dietitian profile not found' });
    }
    
    const upcomingBookings = await Booking.find({
      dietitian: dietitian._id,
      status: { $in: ['pending', 'confirmed'] },
      date: { $gte: new Date() }
    })
      .populate('user', 'name email healthProfile')
      .sort({ date: 1 });
    
    const recentBookings = await Booking.find({
      dietitian: dietitian._id
    })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({
      dietitian,
      upcomingBookings,
      recentBookings
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAvailableSlots = async (req, res) => {
  try {
    const { dietitianId, date } = req.query;
    
    const dietitian = await Dietitian.findById(dietitianId);
    if (!dietitian) {
      return res.status(404).json({ message: 'Dietitian not found' });
    }
    
    // Get existing bookings for the date
    const existingBookings = await Booking.find({
      dietitian: dietitianId,
      date: new Date(date),
      status: { $in: ['pending', 'confirmed'] }
    });
    
    // Get day of week
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const dayAvailability = dietitian.availability.slots.find(slot => slot.day === dayOfWeek);
    
    if (!dayAvailability || !dayAvailability.isAvailable) {
      return res.json({ availableSlots: [] });
    }
    
    // Generate available slots (30-minute intervals)
    const slots = [];
    const [startHour, startMin] = dayAvailability.startTime.split(':').map(Number);
    const [endHour, endMin] = dayAvailability.endTime.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMin = startMin;
    
    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const slotStart = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      currentMin += 30;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour++;
      }
      const slotEnd = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      
      // Check if slot is already booked
      const isBooked = existingBookings.some(booking => {
        return booking.timeSlot.start === slotStart;
      });
      
      if (!isBooked) {
        slots.push({ start: slotStart, end: slotEnd });
      }
    }
    
    res.json({ availableSlots: slots });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

