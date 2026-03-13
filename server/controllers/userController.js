const User = require('../models/User');

// @desc    Get user profile
// @route   GET /api/users/profile
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, profile, preferences } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (profile) {
      user.profile = { ...user.profile.toObject(), ...profile };
    }
    if (preferences) {
      user.preferences = { ...user.preferences.toObject(), ...preferences };
    }

    await user.save();
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/users/password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete account
// @route   DELETE /api/users/account
const deleteAccount = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile, changePassword, deleteAccount };
