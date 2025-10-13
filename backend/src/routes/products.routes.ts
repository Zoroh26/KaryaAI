import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { authenticateToken } from '../middlewares/auth';
import { requireAdmin, requireClient, requireClientOrAdmin } from '../middlewares/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Client routes
router.post('/', requireClient, productController.createProduct);
router.get('/my-products', requireClient, productController.getMyProducts);

// Admin routes
router.get('/', requireAdmin, productController.getAllProducts);
router.get('/stats', requireAdmin, productController.getProductStats);
router.delete('/:id', requireAdmin, productController.deleteProduct);
router.patch('/:id/status', requireAdmin, productController.updateProductStatus);

// Client or Admin routes
router.get('/:id', requireClientOrAdmin, productController.getProductById);
router.put('/:id', requireClientOrAdmin, productController.updateProduct);

export default router;
