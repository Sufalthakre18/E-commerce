import express from "express";
import cors from "cors";
import dotenv from "dotenv";

//importing routes
import productRoutes from "../src/routes/product.route";
import authRoutes from "../src/routes/auth.route";
import orderRoutes from "../src/routes/order.routes";
import addressRoutes from "../src/routes/address.routes";
import paymentRoutes from "../src/routes/payment.routes";
import reviewRoutes from "../src/routes/review.route";
import PromoRoutes from './routes/promotion.routes';

// Admin importing routes
import adminRoutes from "../src/routes/admin.routes";
import adminProductRoutes from "../src/routes/adminProduct.routes";
import adminCategoryRoutes from "../src/routes/adminCategory.routes";
import adminUsersRoutes from "../src/routes/adminUser.routes";
import adminReviewRoutes from "../src/routes/adminReview.routes";

dotenv.config();

const app = express();

app.use(
  cors()
);

app.use(express.json());

// Routes for user
app.use("/api/products", productRoutes);  //  
app.use("/api/auth", authRoutes);   // 
app.use("/api/order", orderRoutes); // 
app.use("/api/address", addressRoutes); //
app.use("/api/payment", paymentRoutes);// 
app.use("/api/reviews", reviewRoutes); //
app.use("/api/promo", PromoRoutes); // here admin also can access the promo routes

// Admin routes (protected)
app.use("/api/admin", adminRoutes); // 
app.use("/api/admin/products", adminProductRoutes); //  
app.use("/api/admin/category", adminCategoryRoutes);// // modules/admin/category
app.use("/api/admin/users", adminUsersRoutes); // // modules/admin/user
app.use("/api/admin/reviews", adminReviewRoutes);



const PORT = parseInt(process.env.PORT || '5000', 10); // parse to number

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});