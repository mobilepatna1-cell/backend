import mongoose from "mongoose";
import User from "../models/User.js";

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Fetch failed" });
  }
};

// Update user profile (name, email, number, gender)
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { name, email, number, gender } = req.body;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (number !== undefined) updateData.number = number;
    if (gender !== undefined) updateData.gender = gender;

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "Profile updated", user });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Email already in use" });
    }
    return res.status(500).json({ message: err.message || "Update failed" });
  }
};

// Add new address
export const addAddress = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { label, fullAddress, city, state, postalCode, country, isDefault } = req.body;

    if (!fullAddress || !city || !state || !postalCode) {
      return res.status(400).json({
        message: "fullAddress, city, state, and postalCode are required",
      });
    }

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If this is the first address or isDefault is true, set as default
    if (!user.addresses || user.addresses.length === 0 || isDefault) {
      user.addresses?.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    const newAddress = {
      _id: new mongoose.Types.ObjectId(),
      label: label || "Home",
      fullAddress,
      city,
      state,
      postalCode,
      country: country || "India",
      isDefault: isDefault || user.addresses.length === 0,
      createdAt: new Date(),
    };

    if (!user.addresses) {
      user.addresses = [];
    }
    user.addresses.push(newAddress);
    await user.save();

    return res.status(201).json({
      message: "Address added successfully",
      address: newAddress,
      user: user.toJSON(),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Add address failed" });
  }
};

// Update address
export const updateAddress = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { addressId } = req.params;
    const { label, fullAddress, city, state, postalCode, country, isDefault } = req.body;

    if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(addressId)) {
      return res.status(400).json({ message: "Invalid user or address id" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const address = user.addresses?.find((addr) => addr._id.toString() === addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Update address fields
    if (label !== undefined) address.label = label;
    if (fullAddress !== undefined) address.fullAddress = fullAddress;
    if (city !== undefined) address.city = city;
    if (state !== undefined) address.state = state;
    if (postalCode !== undefined) address.postalCode = postalCode;
    if (country !== undefined) address.country = country;

    // Handle isDefault
    if (isDefault === true) {
      user.addresses?.forEach((addr) => {
        addr.isDefault = false;
      });
      address.isDefault = true;
    } else if (isDefault === false && address.isDefault) {
      // Don't allow unsetting the only default address
      if (user.addresses?.filter((a) => a.isDefault).length === 1) {
        return res.status(400).json({
          message: "Cannot unset the default address. Set another as default first.",
        });
      }
      address.isDefault = false;
    }

    await user.save();

    return res.status(200).json({
      message: "Address updated successfully",
      address,
      user: user.toJSON(),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Update address failed" });
  }
};

// Delete address
export const deleteAddress = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { addressId } = req.params;

    if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(addressId)) {
      return res.status(400).json({ message: "Invalid user or address id" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const addressIndex = user.addresses?.findIndex(
      (addr) => addr._id.toString() === addressId
    );

    if (addressIndex === -1 || addressIndex === undefined) {
      return res.status(404).json({ message: "Address not found" });
    }

    const deletedAddress = user.addresses[addressIndex];

    // If deleting the default address, set another as default
    if (deletedAddress.isDefault && user.addresses.length > 1) {
      user.addresses[addressIndex === 0 ? 1 : 0].isDefault = true;
    }

    user.addresses.splice(addressIndex, 1);
    await user.save();

    return res.status(200).json({
      message: "Address deleted successfully",
      address: deletedAddress,
      user: user.toJSON(),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Delete address failed" });
  }
};

// Get all addresses for user
export const getAddresses = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(userId).select("addresses");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ addresses: user.addresses || [] });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Fetch failed" });
  }
};
