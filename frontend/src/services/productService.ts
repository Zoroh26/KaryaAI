import { apiClient } from '@/lib/api';
import { Product, ApiResponse } from '@/types/api';

class ProductService {
  async getProducts(): Promise<Product[]> {
    const response = await apiClient.get<ApiResponse<{ products: Product[] }>>('/products');
    return response.data.products;
  }

  async getMyProducts(): Promise<Product[]> {
    const response = await apiClient.get<ApiResponse<Product[]>>('/products/my-products');
    return response.data;
  }

  async getProduct(id: string): Promise<Product> {
    const response = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data;
  }

  async createProduct(productData: Partial<Product>): Promise<Product> {
    const response = await apiClient.post<ApiResponse<Product>>('/products', productData);
    return response.data;
  }

  async updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
    const response = await apiClient.put<ApiResponse<Product>>(`/products/${id}`, productData);
    return response.data;
  }

  async updateProductStatus(id: string, status: string): Promise<Product> {
    const response = await apiClient.patch<ApiResponse<Product>>(`/products/${id}/status`, { status });
    return response.data;
  }

  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  }
}

export const productService = new ProductService();