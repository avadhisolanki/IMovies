import Theatre from '../models/theatreModel.js';
import { isMongoConnected } from '../config/db.js';
import { memoryDB } from '../config/memoryStore.js';

export const getAllTheatres = async (req, res) => {
  try {
    if (isMongoConnected()) {
      const theatres = await Theatre.find({}).sort({ theatreName: 1 });
      return res.json({ success: true, count: theatres.length, theatres });
    } else {
      return res.json({ success: true, count: memoryDB.theatres.length, theatres: memoryDB.theatres });
    }
  } catch (err) {
    console.error('Get Theatres Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

export const getTheatreById = async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongoConnected()) {
      const theatre = await Theatre.findById(id);
      if (!theatre) return res.status(404).json({ success: false, message: 'Theatre not found' });
      return res.json({ success: true, theatre });
    } else {
      const theatre = memoryDB.theatres.find(t => t._id === id);
      if (!theatre) return res.status(404).json({ success: false, message: 'Theatre not found' });
      return res.json({ success: true, theatre });
    }
  } catch (err) {
    console.error('Get Theatre By ID Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

export const createTheatre = async (req, res) => {
  try {
    const { theatreName, location, balconySeatPrice, middleSeatPrice, lowerSeatPrice, balconySeats, middleSeats, lowerSeats, amenities } = req.body;

    if (!theatreName || !location || balconySeatPrice == null || middleSeatPrice == null || lowerSeatPrice == null) {
      return res.status(400).json({ success: false, message: 'Missing required theatre properties' });
    }

    const theatreData = {
      theatreName: theatreName.trim(),
      location: location.trim(),
      balconySeatPrice: Number(balconySeatPrice),
      middleSeatPrice: Number(middleSeatPrice),
      lowerSeatPrice: Number(lowerSeatPrice),
      balconySeats: balconySeats || { rows: 2, cols: 10, prefix: 'B' },
      middleSeats: middleSeats || { rows: 3, cols: 10, prefix: 'M' },
      lowerSeats: lowerSeats || { rows: 2, cols: 10, prefix: 'L' },
      amenities: amenities || ['4K Laser', 'Dolby Atmos', 'Recliners'],
    };

    if (isMongoConnected()) {
      const theatre = await Theatre.create(theatreData);
      return res.status(201).json({ success: true, message: 'Theatre created successfully!', theatre });
    } else {
      const theatre = {
        _id: `theatre_${Date.now()}`,
        ...theatreData,
        createdAt: new Date(),
      };
      memoryDB.theatres.push(theatre);
      return res.status(201).json({ success: true, message: 'Theatre created successfully!', theatre });
    }
  } catch (err) {
    console.error('Create Theatre Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

export const updateTheatre = async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongoConnected()) {
      const theatre = await Theatre.findByIdAndUpdate(id, req.body, { new: true });
      if (!theatre) return res.status(404).json({ success: false, message: 'Theatre not found' });
      return res.json({ success: true, message: 'Theatre updated successfully!', theatre });
    } else {
      const idx = memoryDB.theatres.findIndex(t => t._id === id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Theatre not found' });
      memoryDB.theatres[idx] = { ...memoryDB.theatres[idx], ...req.body, updatedAt: new Date() };
      return res.json({ success: true, message: 'Theatre updated successfully!', theatre: memoryDB.theatres[idx] });
    }
  } catch (err) {
    console.error('Update Theatre Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

export const deleteTheatre = async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongoConnected()) {
      const theatre = await Theatre.findByIdAndDelete(id);
      if (!theatre) return res.status(404).json({ success: false, message: 'Theatre not found' });
      return res.json({ success: true, message: 'Theatre deleted successfully' });
    } else {
      const idx = memoryDB.theatres.findIndex(t => t._id === id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Theatre not found' });
      memoryDB.theatres.splice(idx, 1);
      return res.json({ success: true, message: 'Theatre deleted successfully' });
    }
  } catch (err) {
    console.error('Delete Theatre Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};
