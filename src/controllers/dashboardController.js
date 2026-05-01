import User from "../models/User.js";
import Product from "../models/Product.js";

export const getDashboardStats = async (req, res) => {
  try {
    // Count total users
    const totalUsers = await User.countDocuments();
    
    // Count total products
    const totalProducts = await Product.countDocuments();
    
    // Count active products
    const activeProducts = await Product.countDocuments({ status: "active" });
    
    // Count low stock products (stock < 10 but > 0)
    const lowStockProducts = await Product.countDocuments({ 
      stock: { $gt: 0, $lt: 10 } 
    });
    
    // Count out of stock products
    const outOfStockProducts = await Product.countDocuments({ stock: 0 });
    
    // Calculate total inventory value
    const inventoryData = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ["$price", "$stock"] } },
          totalCost: { $sum: { $multiply: ["$mrp", "$stock"] } }
        }
      }
    ]);
    
    const totalInventoryValue = inventoryData[0]?.totalValue || 0;
    const totalCostValue = inventoryData[0]?.totalCost || 0;
    
    // Get recent 5 products
    const recentProducts = await Product.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title price stock category createdAt image1");
    
    // Count users by role
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Count products by status
    const productsByStatus = await Product.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Count products by category (top 5)
    const topCategories = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ["$price", "$stock"] } }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Calculate revenue by status
    const revenueByStatus = await Product.aggregate([
      {
        $group: {
          _id: "$status",
          revenue: { $sum: { $multiply: ["$price", "$stock"] } }
        }
      }
    ]);

    return res.status(200).json({
      summary: {
        totalUsers,
        totalProducts,
        activeProducts,
        lowStockProducts,
        outOfStockProducts,
        totalInventoryValue: Math.round(totalInventoryValue),
        totalCostValue: Math.round(totalCostValue)
      },
      usersByRole,
      productsByStatus,
      topCategories,
      revenueByStatus,
      recentProducts
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Dashboard fetch failed" });
  }
};
