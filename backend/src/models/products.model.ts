export interface Product {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  title: string;
  description: string;
  category?: string;
  priority: ProductPriority;
  status: ProductStatus;
  estimatedBudget?: number;
  deadline?: Date;
  requirements?: string[];
  attachments?: string[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export type ProductStatus = 
  | 'pending_review' 
  | 'approved' 
  | 'in_progress' 
  | 'completed' 
  | 'rejected'
  | 'cancelled';

export type ProductPriority = 'High' | 'Medium' | 'Low';

export interface CreateProductData {
  title: string;
  description: string;
  category?: string;
  priority?: ProductPriority;
  estimatedBudget?: number;
  deadline?: Date;
  requirements?: string[];
}

export interface UpdateProductData {
  title?: string;
  description?: string;
  category?: string;
  priority?: ProductPriority;
  status?: ProductStatus;
  estimatedBudget?: number;
  deadline?: Date;
  requirements?: string[];
}

export interface ProductFilterOptions {
  status?: ProductStatus;
  priority?: ProductPriority;
  clientId?: string;
  category?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'deadline' | 'priority';
  sortOrder?: 'asc' | 'desc';
}
