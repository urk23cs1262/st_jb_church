const User = require('../models/User');
const bcrypt = require('bcryptjs');

// GET /api/users — admin
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const query = {};
    if (search) query.$or = [{ name: new RegExp(search, 'i') }, { phone: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
    if (role) query.role = role;
    const total = await User.countDocuments(query);
    const users = await User.find(query).select('-passwordHash -otp -otpExpires').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, total, page: Number(page), users });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/users/:id — admin or self
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash -otp -otpExpires');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/users/profile — self
const updateProfile = async (req, res) => {
  try {
    let { 
      name, familyName, dob, gender, address, email, 
      preferredLanguage, subStation, familyRole, familyMembers, settings 
    } = req.body;
    
    if (email === "") email = undefined;
    
    // Parse familyMembers if sent as a JSON string from FormData
    if (typeof familyMembers === 'string') {
      try {
        familyMembers = JSON.parse(familyMembers);
      } catch (e) {
        console.error('Error parsing familyMembers:', e);
      }
    }

    if (typeof settings === 'string') {
      try {
        settings = JSON.parse(settings);
      } catch (e) {
        console.error('Error parsing settings:', e);
      }
    }

    const updateData = { 
      name, familyName, dob, gender, address, email, 
      preferredLanguage, subStation, familyRole, familyMembers 
    };
    if (settings) updateData.settings = settings;

    
    if (req.file) updateData.profilePhoto = `/uploads/profiles/${req.file.filename}`;
    
    const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true }).select('-passwordHash -otp -otpExpires');
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/users/:id — admin
const updateUser = async (req, res) => {
  try {
    const { role, isActive, isVerified, name, email, phone, parishMemberId } = req.body;
    const updateData = { role, isActive, isVerified };
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email === "" ? undefined : email;
    if (phone !== undefined) updateData.phone = phone;
    if (parishMemberId !== undefined) updateData.parishMemberId = parishMemberId;
    
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-passwordHash');
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// DELETE /api/users/:id — admin
const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/users/change-password — self
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) return res.status(400).json({ success: false, message: 'Current password incorrect' });
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(req.user._id, { passwordHash });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/users/settings — self

const updateSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings) {
      return res.status(400).json({ success: false, message: 'Settings payload is required' });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { settings } },
      { new: true }
    ).select('-passwordHash -otp -otpExpires');

    res.json({ success: true, message: 'Settings saved successfully', user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAllUsers, getUserById, updateProfile, updateUser, deleteUser, changePassword, updateSettings };

