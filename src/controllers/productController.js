import mongoose from "mongoose";
import Product from "../models/Product.js";

// Helper to generate slug from title
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-')
    .trim();
};

// Helper to ensure all products have slugs
const ensureProductSlugs = (products) => {
  return products.map(product => {
    if (!product.slug) {
      product.slug = generateSlug(product.title);
    }
    return product;
  });
};

export const createProduct = async (req, res) => {
  try {
    const {
      title,
      slug,
      category,
      brand,
      description,
      highlights,
      price,
      mrp,
      discountPercentage,
      taxPercentage,
      currency,
      stock,
      sku,
      condition,
      status,
      // Extracted the 4 new image fields from req.body
      image1,
      image2,
      image3,
      image4,
      videos,
      warranty,
      dimensions,
      weight,
      attributes,
      specifications,
      variants,
    } = req.body || {};

    if (!title || !category || price === undefined || !sku) {
      return res
        .status(400)
        .json({ message: "title, category, price, and sku are required" });
    }

    const product = await Product.create({
      title,
      slug,
      category,
      brand,
      description,
      highlights,
      price,
      mrp,
      discountPercentage,
      taxPercentage,
      currency,
      stock,
      sku,
      condition,
      status,
      // Added the 4 new image fields here
      image1,
      image2,
      image3,
      image4,
      videos,
      warranty,
      dimensions,
      weight,
      attributes,
      specifications,
      variants,
      createdBy: req.user?.id,
    });

    return res.status(201).json({ message: "Product created", product });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ message: "SKU already exists" });
    return res.status(500).json({ message: err.message || "Create failed" });
  }
};

export const getProducts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);

    const filter = {};
    if (req.query.category) filter.category = String(req.query.category);
    if (req.query.brand) filter.brand = String(req.query.brand);

    if (req.query.search) {
      const term = String(req.query.search);
      filter.$or = [
        { title: { $regex: term, $options: "i" } },
        { description: { $regex: term, $options: "i" } },
        { slug: { $regex: term, $options: "i" } },
      ];
    }

    const minPrice = req.query.minPrice !== undefined ? Number(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice !== undefined ? Number(req.query.maxPrice) : null;
    if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
      filter.price = {};
      if (Number.isFinite(minPrice)) filter.price.$gte = minPrice;
      if (Number.isFinite(maxPrice)) filter.price.$lte = maxPrice;
    }

    if (req.query.inStock !== undefined) {
      const v = String(req.query.inStock).toLowerCase();
      if (v === "true" || v === "1") filter.stock = { $gt: 0 };
      if (v === "false" || v === "0") filter.stock = { $lte: 0 };
    }

    const total = await Product.countDocuments(filter);
    let products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Ensure all products have slugs
    products = ensureProductSlugs(products);

    return res.status(200).json({
      data: products,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Fetch failed" });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    let product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Ensure product has slug
    if (!product.slug) {
      product.slug = generateSlug(product.title);
    }

    return res.status(200).json({ product });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Fetch failed" });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    // Since req.body is passed directly, any included image1, image2, etc., will be updated naturally
    const updated = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) return res.status(404).json({ message: "Product not found" });
    return res.status(200).json({ message: "Product updated", product: updated });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ message: "Update conflict (SKU)" });
    return res.status(500).json({ message: err.message || "Update failed" });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Product not found" });

    return res.status(200).json({ message: "Product deleted", product: deleted });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Delete failed" });
  }
};