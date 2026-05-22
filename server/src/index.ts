import express from 'express';
import cors from 'cors';
import authRouter from './modules/auth/auth.routes.js';
import productRouter from './modules/product/product.routes.js';
import categoryRouter from './modules/category/category.routes.js';
import cartRouter from './modules/cart/cart.routes.js';
import orderRouter from './modules/order/order.routes.js';
import paymentRouter from './modules/payment/payment.routes.js';
import shipmentRouter from './modules/shipment/shipment.routes.js';
import invoiceRouter from './modules/invoice/invoice.routes.js';
import userRouter from './modules/user/user.routes.js';
import reviewRouter from './modules/review/review.routes.js';
import wishlistRouter from './modules/wishlist/wishlist.routes.js';
import dashboardRouter from './modules/dashboard/dashboard.routes.js';
import addressRouter from './modules/address/address.routes.js';
import warehouseRouter from './modules/warehouse/warehouse.routes.js';
import posRouter from './modules/pos/pos.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_URLS = (process.env.CLIENT_URL || 'http://localhost:3001,http://localhost:5173').split(',');

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || CLIENT_URLS.some(u => origin.startsWith(u.trim()))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes
app.use('/api/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/reviews', reviewRouter);

// Protected routes
app.use('/api/cart', cartRouter);
app.use('/api/orders', orderRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/shipments', shipmentRouter);
app.use('/api/invoices', invoiceRouter);
app.use('/api/users', userRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/addresses', addressRouter);
app.use('/api/warehouse', warehouseRouter);
app.use('/api/pos', posRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`👓 Optic Luxe Server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});

export default app;
