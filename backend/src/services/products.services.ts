import { firestore } from '../config/firebase';
import { Product, CreateProductData, UpdateProductData, ProductFilterOptions, ProductStatus } from '../models/products.model';

export class ProductService {
  private readonly productsCollection = 'products';

  /**
   * Create a new product
   */
  async createProduct(clientId: string, clientName: string, clientEmail: string, productData: CreateProductData): Promise<Product> {
    try {
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }

      const newProduct: Omit<Product, 'id'> = {
        clientId,
        clientName,
        clientEmail,
        title: productData.title.trim(),
        description: productData.description.trim(),
        category: productData.category?.trim(),
        priority: productData.priority || 'Medium',
        status: 'pending_review',
        estimatedBudget: productData.estimatedBudget,
        deadline: productData.deadline,
        requirements: productData.requirements || [],
        attachments: [],
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await firestore.collection(this.productsCollection).add(newProduct);

      return {
        id: docRef.id,
        ...newProduct,
      };

    } catch (error: any) {
      console.error('ProductService.createProduct error:', error);
      throw error;
    }
  }

  /**
   * Get all products with filtering and pagination
   */
  async getAllProducts(options: ProductFilterOptions = {}): Promise<{
    products: Product[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }

      let query: FirebaseFirestore.Query = firestore.collection(this.productsCollection);

      // Apply filters
      if (options.status) {
        query = query.where('status', '==', options.status);
      }

      if (options.priority) {
        query = query.where('priority', '==', options.priority);
      }

      if (options.clientId) {
        query = query.where('clientId', '==', options.clientId);
      }

      if (options.category) {
        query = query.where('category', '==', options.category);
      }

      // Filter out soft-deleted products
      query = query.where('isDeleted', '!=', true);

      // Apply sorting
      const sortBy = options.sortBy || 'createdAt';
      const sortOrder = options.sortOrder || 'desc';
      query = query.orderBy(sortBy, sortOrder);

      const snapshot = await query.get();
      const total = snapshot.size;

      // Apply pagination
      const page = options.page || 1;
      const limit = options.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      const products: Product[] = [];
      snapshot.docs.slice(startIndex, endIndex).forEach((doc) => {
        const productData = doc.data() as Omit<Product, 'id'>;
        products.push({
          id: doc.id,
          ...productData,
          createdAt: productData.createdAt,
          updatedAt: productData.updatedAt,
        });
      });

      return {
        products,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };

    } catch (error: any) {
      console.error('ProductService.getAllProducts error:', error);
      throw error;
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(productId: string): Promise<Product> {
    try {
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }

      const productDoc = await firestore.collection(this.productsCollection).doc(productId).get();

      if (!productDoc.exists) {
        throw new Error('Product not found');
      }

      const productData = productDoc.data() as Omit<Product, 'id'>;

      if (productData.isDeleted) {
        throw new Error('Product not found');
      }

      return {
        id: productDoc.id,
        ...productData,
      };

    } catch (error: any) {
      console.error('ProductService.getProductById error:', error);
      throw error;
    }
  }

  /**
   * Get products by client ID
   */
  async getProductsByClient(clientId: string, options: Omit<ProductFilterOptions, 'clientId'> = {}): Promise<Product[]> {
    try {
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }

      console.log('ProductService.getProductsByClient called with:', { clientId, options });

      // Use the simplest possible query to avoid composite index requirements
      let query: FirebaseFirestore.Query = firestore.collection(this.productsCollection);
      
      // Only filter by clientId in the database query - no orderBy to avoid composite index
      query = query.where('clientId', '==', clientId);

      const snapshot = await query.get();
      console.log(`Found ${snapshot.size} products for client ${clientId}`);

      let products: Product[] = [];
      snapshot.docs.forEach((doc) => {
        const productData = doc.data() as Omit<Product, 'id'>;
        products.push({
          id: doc.id,
          ...productData,
        });
      });

      // Apply all filtering and sorting in memory
      products = products.filter(product => {
        // Filter out soft-deleted products
        if (product.isDeleted) return false;
        
        // Apply status filter
        if (options.status && product.status !== options.status) return false;
        
        // Apply priority filter
        if (options.priority && product.priority !== options.priority) return false;
        
        // Apply category filter
        if (options.category && product.category !== options.category) return false;
        
        return true;
      });

      // Apply sorting in memory
      const sortBy = options.sortBy || 'createdAt';
      const sortOrder = options.sortOrder || 'desc';
      
      products.sort((a, b) => {
        let aValue: any;
        let bValue: any;
        
        if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
          // Handle Firestore Timestamp objects or Date objects
          const aField = a[sortBy as keyof Product] as any;
          const bField = b[sortBy as keyof Product] as any;
          
          aValue = aField?.toDate ? aField.toDate() : (aField instanceof Date ? aField : new Date(aField || 0));
          bValue = bField?.toDate ? bField.toDate() : (bField instanceof Date ? bField : new Date(bField || 0));
        } else {
          aValue = a[sortBy as keyof Product] || '';
          bValue = b[sortBy as keyof Product] || '';
        }
        
        if (sortOrder === 'desc') {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        } else {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        }
      });

      // Apply pagination
      const page = options.page || 1;
      const limit = options.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      const paginatedProducts = products.slice(startIndex, endIndex);
      
      console.log(`Returning ${paginatedProducts.length} products after filtering and pagination`);
      return paginatedProducts;

    } catch (error: any) {
      console.error('ProductService.getProductsByClient error:', error);
      throw error;
    }
  }

  /**
   * Update product
   */
  async updateProduct(productId: string, updateData: UpdateProductData): Promise<Product> {
    try {
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }

      // Check if product exists
      const productDoc = await firestore.collection(this.productsCollection).doc(productId).get();
      
      if (!productDoc.exists) {
        throw new Error('Product not found');
      }

      const currentProduct = productDoc.data() as Product;
      
      if (currentProduct.isDeleted) {
        throw new Error('Cannot update deleted product');
      }

      // Prepare update data
      const updates: any = {
        updatedAt: new Date(),
      };

      if (updateData.title !== undefined) {
        if (!updateData.title.trim()) {
          throw new Error('Product title cannot be empty');
        }
        updates.title = updateData.title.trim();
      }

      if (updateData.description !== undefined) {
        if (!updateData.description.trim()) {
          throw new Error('Product description cannot be empty');
        }
        updates.description = updateData.description.trim();
      }

      if (updateData.category !== undefined) {
        updates.category = updateData.category?.trim();
      }

      if (updateData.priority !== undefined) {
        updates.priority = updateData.priority;
      }

      if (updateData.status !== undefined) {
        updates.status = updateData.status;
      }

      if (updateData.estimatedBudget !== undefined) {
        updates.estimatedBudget = updateData.estimatedBudget;
      }

      if (updateData.deadline !== undefined) {
        updates.deadline = updateData.deadline;
      }

      if (updateData.requirements !== undefined) {
        updates.requirements = updateData.requirements;
      }

      // Update the document
      await firestore.collection(this.productsCollection).doc(productId).update(updates);

      // Return updated product
      return await this.getProductById(productId);

    } catch (error: any) {
      console.error('ProductService.updateProduct error:', error);
      throw error;
    }
  }

  /**
   * Soft delete product
   */
  async softDeleteProduct(productId: string): Promise<void> {
    try {
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }

      const productDoc = await firestore.collection(this.productsCollection).doc(productId).get();
      
      if (!productDoc.exists) {
        throw new Error('Product not found');
      }

      const productData = productDoc.data() as Product;

      if (productData.isDeleted) {
        throw new Error('Product is already deleted');
      }

      // Soft delete
      await firestore.collection(this.productsCollection).doc(productId).update({
        isDeleted: true,
        status: 'cancelled',
        deletedAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`Product ${productId} soft deleted successfully`);

    } catch (error: any) {
      console.error('ProductService.softDeleteProduct error:', error);
      throw error;
    }
  }

  /**
   * Update product status
   */
  async updateProductStatus(productId: string, status: ProductStatus): Promise<Product> {
    try {
      return await this.updateProduct(productId, { status });
    } catch (error: any) {
      console.error('ProductService.updateProductStatus error:', error);
      throw error;
    }
  }

  /**
   * Get product statistics
   */
  async getProductStats(): Promise<{
    totalProducts: number;
    productsByStatus: Record<ProductStatus, number>;
    productsByPriority: Record<string, number>;
    recentProducts: number;
  }> {
    try {
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }

      const allProductsSnapshot = await firestore.collection(this.productsCollection)
        .where('isDeleted', '!=', true)
        .get();

      const productsByStatus: Record<ProductStatus, number> = {
        'pending_review': 0,
        'approved': 0,
        'in_progress': 0,
        'completed': 0,
        'rejected': 0,
        'cancelled': 0
      };

      const productsByPriority: Record<string, number> = {
        'High': 0,
        'Medium': 0,
        'Low': 0
      };

      let recentProducts = 0;
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      allProductsSnapshot.docs.forEach(doc => {
        const product = doc.data() as Product;
        
        if (product.status && productsByStatus.hasOwnProperty(product.status)) {
          productsByStatus[product.status]++;
        }
        
        if (product.priority && productsByPriority.hasOwnProperty(product.priority)) {
          productsByPriority[product.priority]++;
        }

        if (product.createdAt && product.createdAt >= sevenDaysAgo) {
          recentProducts++;
        }
      });

      return {
        totalProducts: allProductsSnapshot.size,
        productsByStatus,
        productsByPriority,
        recentProducts
      };

    } catch (error: any) {
      console.error('ProductService.getProductStats error:', error);
      throw error;
    }
  }
}

export const productService = new ProductService();
