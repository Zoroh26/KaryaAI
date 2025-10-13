import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { productService } from '../services/products.services';
import { CreateProductData, UpdateProductData, ProductFilterOptions, ProductStatus } from '../models/products.model';

export class ProductController {
  /**
   * Create new product (Client only)
   */
  async createProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      const productData: CreateProductData = req.body;

      // Validation
      if (!productData.title || !productData.description) {
        res.status(400).json({
          success: false,
          error: 'Title and description are required',
          code: 'MISSING_REQUIRED_FIELDS'
        });
        return;
      }

      const product = await productService.createProduct(
        req.user.uid,
        req.user.full_name,
        req.user.email,
        productData
      );

      res.status(201).json({
        success: true,
        data: product,
        message: 'Product created successfully'
      });

    } catch (error: any) {
      console.error('ProductController.createProduct error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create product',
        code: 'CREATE_PRODUCT_ERROR'
      });
    }
  }

  /**
   * Get all products (Admin only)
   */
  async getAllProducts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { status, priority, category, page, limit, sortBy, sortOrder } = req.query;

      const filterOptions: ProductFilterOptions = {
        status: status as ProductStatus,
        priority: priority as any,
        category: category as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
      };

      const result = await productService.getAllProducts(filterOptions);

      res.json({
        success: true,
        data: result,
        message: `Retrieved ${result.products.length} products`
      });

    } catch (error: any) {
      console.error('ProductController.getAllProducts error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve products',
        code: 'FETCH_PRODUCTS_ERROR'
        
      });
    }
  }

  /**
   * Get client's own products
   */
  async getMyProducts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      const { status, priority, page, limit } = req.query;

      const filterOptions: Omit<ProductFilterOptions, 'clientId'> = {
        status: status as ProductStatus,
        priority: priority as any,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
      };

      const products = await productService.getProductsByClient(req.user.uid, filterOptions);

      res.json({
        success: true,
        data: products,
        message: `Retrieved ${products.length} products`
      });

    } catch (error: any) {
      console.error('ProductController.getMyProducts error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve your products',
        code: 'FETCH_MY_PRODUCTS_ERROR'
      });
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Product ID is required',
          code: 'MISSING_PRODUCT_ID'
        });
        return;
      }

      const product = await productService.getProductById(id);

      // Check if user has permission to view this product
      if (req.user?.role !== 'admin' && product.clientId !== req.user?.uid) {
        res.status(403).json({
          success: false,
          error: 'Access denied',
          code: 'ACCESS_DENIED'
        });
        return;
      }

      res.json({
        success: true,
        data: product,
        message: 'Product retrieved successfully'
      });

    } catch (error: any) {
      console.error('ProductController.getProductById error:', error);

      if (error.message === 'Product not found') {
        res.status(404).json({
          success: false,
          error: 'Product not found',
          code: 'PRODUCT_NOT_FOUND'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve product',
        code: 'FETCH_PRODUCT_ERROR'
      });
    }
  }

  /**
   * Update product (Admin or Owner)
   */
  async updateProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      let updateData: UpdateProductData = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Product ID is required',
          code: 'MISSING_PRODUCT_ID'
        });
        return;
      }

      // Get current product to check ownership
      const currentProduct = await productService.getProductById(id);

      // Check permissions
      const isOwner = currentProduct.clientId === req.user?.uid;
      const isAdmin = req.user?.role === 'admin';

      if (!isOwner && !isAdmin) {
        res.status(403).json({
          success: false,
          error: 'Access denied',
          code: 'ACCESS_DENIED'
        });
        return;
      }

      // Clients can only update certain fields
      if (isOwner && !isAdmin) {
        // Remove admin-only fields
        const allowedFields = ['title', 'description', 'category', 'priority', 'estimatedBudget', 'deadline', 'requirements'];
        const filteredUpdateData: UpdateProductData = {};
        
        Object.keys(updateData).forEach(key => {
          if (allowedFields.includes(key)) {
            (filteredUpdateData as any)[key] = (updateData as any)[key];
          }
        });
        
        updateData = filteredUpdateData;
      }

      const updatedProduct = await productService.updateProduct(id, updateData);

      res.json({
        success: true,
        data: updatedProduct,
        message: 'Product updated successfully'
      });

    } catch (error: any) {
      console.error('ProductController.updateProduct error:', error);

      if (error.message === 'Product not found') {
        res.status(404).json({
          success: false,
          error: 'Product not found',
          code: 'PRODUCT_NOT_FOUND'
        });
        return;
      }

      if (error.message.includes('cannot be empty') || error.message.includes('Cannot update deleted')) {
        res.status(400).json({
          success: false,
          error: error.message,
          code: 'VALIDATION_ERROR'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update product',
        code: 'UPDATE_PRODUCT_ERROR'
      });
    }
  }

  /**
   * Delete product (Admin only)
   */
  async deleteProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Product ID is required',
          code: 'MISSING_PRODUCT_ID'
        });
        return;
      }

      await productService.softDeleteProduct(id);

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });

    } catch (error: any) {
      console.error('ProductController.deleteProduct error:', error);

      if (error.message === 'Product not found') {
        res.status(404).json({
          success: false,
          error: 'Product not found',
          code: 'PRODUCT_NOT_FOUND'
        });
        return;
      }

      if (error.message.includes('already deleted')) {
        res.status(400).json({
          success: false,
          error: error.message,
          code: 'DELETION_ERROR'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to delete product',
        code: 'DELETE_PRODUCT_ERROR'
      });
    }
  }

  /**
   * Update product status (Admin only)
   */
  async updateProductStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!id || !status) {
        res.status(400).json({
          success: false,
          error: 'Product ID and status are required',
          code: 'MISSING_REQUIRED_FIELDS'
        });
        return;
      }

      const updatedProduct = await productService.updateProductStatus(id, status);

      res.json({
        success: true,
        data: updatedProduct,
        message: 'Product status updated successfully'
      });

    } catch (error: any) {
      console.error('ProductController.updateProductStatus error:', error);

      if (error.message === 'Product not found') {
        res.status(404).json({
          success: false,
          error: 'Product not found',
          code: 'PRODUCT_NOT_FOUND'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update product status',
        code: 'UPDATE_STATUS_ERROR'
      });
    }
  }

  /**
   * Get product statistics (Admin only)
   */
  async getProductStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = await productService.getProductStats();

      res.json({
        success: true,
        data: stats,
        message: 'Product statistics retrieved successfully'
      });

    } catch (error: any) {
      console.error('ProductController.getProductStats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve product statistics',
        code: 'STATS_ERROR'
      });
    }
  }
}

export const productController = new ProductController();
