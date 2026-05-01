import mongoose from "mongoose";
import HeroSection from "../models/HeroSection.js";
import Product from "../models/Product.js";

// Get all active hero sections (for frontend)
export const getHeroSections = async (req, res) => {
  try {
    const heroSections = await HeroSection.find({ status: "active" })
      .populate("productId", "title price mrp image1 image2 image3 image4 category stock")
      .sort({ order: 1, createdAt: -1 })
      .lean();

    // Format response for frontend
    const formatted = heroSections.map((hero) => ({
      _id: hero._id,
      productId: hero.productId?._id,
      badge: hero.badge,
      headline: hero.headline,
      sub: hero.sub,
      tag: hero.tag,
      accent: hero.accent,
      cta: hero.cta,
      ctaLink: hero.ctaLink,
      img: hero.productId?.image1 || "",
      product: hero.productId,
    }));

    return res.status(200).json(formatted);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Fetch failed" });
  }
};

// Get all hero sections (admin)
export const getAllHeroSections = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);

    const total = await HeroSection.countDocuments();
    const heroSections = await HeroSection.find()
      .populate("productId", "title price image1 category")
      .populate("createdBy", "name email")
      .sort({ order: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      data: heroSections,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Fetch failed" });
  }
};

// Create hero section
export const createHeroSection = async (req, res) => {
  try {
    const { productId, badge, headline, sub, tag, accent, cta, ctaLink, order } = req.body || {};

    if (!productId || !badge || !headline || !sub) {
      return res
        .status(400)
        .json({ message: "productId, badge, headline, and sub are required" });
    }

    // Validate product exists
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if product already has a hero section
    const existing = await HeroSection.findOne({ productId });
    if (existing) {
      return res.status(409).json({ message: "This product already has a hero section" });
    }

    const heroSection = await HeroSection.create({
      productId,
      badge,
      headline,
      sub,
      tag: tag || "",
      accent: accent || "#f97316",
      cta: cta || "Shop Now",
      ctaLink: ctaLink || "/shop",
      order: order || 0,
      createdBy: req.user?.id,
    });

    const populated = await HeroSection.findById(heroSection._id)
      .populate("productId", "title price image1 category")
      .populate("createdBy", "name email");

    return res.status(201).json({ message: "Hero section created", data: populated });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "This product already has a hero section" });
    }
    return res.status(500).json({ message: err.message || "Create failed" });
  }
};

// Update hero section
export const updateHeroSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { badge, headline, sub, tag, accent, cta, ctaLink, status, order } = req.body || {};

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid hero section ID" });
    }

    const heroSection = await HeroSection.findById(id);
    if (!heroSection) {
      return res.status(404).json({ message: "Hero section not found" });
    }

    // Update allowed fields
    if (badge !== undefined) heroSection.badge = badge;
    if (headline !== undefined) heroSection.headline = headline;
    if (sub !== undefined) heroSection.sub = sub;
    if (tag !== undefined) heroSection.tag = tag;
    if (accent !== undefined) heroSection.accent = accent;
    if (cta !== undefined) heroSection.cta = cta;
    if (ctaLink !== undefined) heroSection.ctaLink = ctaLink;
    if (status !== undefined) heroSection.status = status;
    if (order !== undefined) heroSection.order = order;

    await heroSection.save();

    const populated = await HeroSection.findById(heroSection._id)
      .populate("productId", "title price image1 category")
      .populate("createdBy", "name email");

    return res.status(200).json({ message: "Hero section updated", data: populated });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Update failed" });
  }
};

// Delete hero section
export const deleteHeroSection = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid hero section ID" });
    }

    const heroSection = await HeroSection.findByIdAndDelete(id);
    if (!heroSection) {
      return res.status(404).json({ message: "Hero section not found" });
    }

    return res.status(200).json({ message: "Hero section deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Delete failed" });
  }
};

// Get all products for dropdown (to select for hero section)
export const getAllProductsForHero = async (req, res) => {
  try {
    const search = req.query.search || "";

    const filter = {
      status: "active",
    };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
      ];
    }

    const products = await Product.find(filter)
      .select("_id title price mrp image1 sku category")
      .limit(100)
      .lean();

    return res.status(200).json(products);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Fetch failed" });
  }
};
