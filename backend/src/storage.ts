import { User, InsertUser, Product, InsertProduct, Workflow, InsertWorkflow, Task, InsertTask } from "./types/schema";
import { firebaseService } from './services/firebaseService';

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser & { id: string }): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<void>;
  getAvailableEmployees(): Promise<User[]>;

  // Product methods
  createProduct(product: InsertProduct): Promise<Product>;
  getProduct(id: string): Promise<Product | undefined>;
  updateProduct(id: string, updates: Partial<Product>): Promise<void>;
  getProducts(filters?: { status?: string; clientId?: string }): Promise<Product[]>;

  // Workflow methods
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  getWorkflow(id: string): Promise<Workflow | undefined>;
  updateWorkflow(id: string, updates: Partial<Workflow>): Promise<void>;
  getWorkflows(filters?: { status?: string; productId?: string }): Promise<Workflow[]>;

  // Task methods
  createTask(task: InsertTask): Promise<Task>;
  getTask(id: string): Promise<Task | undefined>;
  updateTask(id: string, updates: Partial<Task>): Promise<void>;
  getTasks(filters?: { 
    status?: string; 
    assignedTo?: string; 
    workflowId?: string;
    productId?: string;
  }): Promise<Task[]>;
  getTasksByEmployee(employeeId: string): Promise<Task[]>;
}

export class FirebaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const user = await firebaseService.getUser(id);
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await firebaseService.getUserByEmail(email);
    return user || undefined;
  }

  async createUser(user: InsertUser & { id: string }): Promise<User> {
    const { id, ...userData } = user;
    return await firebaseService.createUser({
      ...userData,
      isActive: userData.isActive ?? true,
      isAvailable: userData.isAvailable ?? true,
      createdAt: new Date(),
    } as any);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    await firebaseService.updateUser(id, updates);
  }

  async getAvailableEmployees(): Promise<User[]> {
    return await firebaseService.getAvailableEmployees();
  }

  // Product methods
  async createProduct(product: InsertProduct): Promise<Product> {
    return await firebaseService.createProduct({
      ...product,
      status: product.status ?? 'pending_review',
    } as any);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const product = await firebaseService.getProduct(id);
    return product || undefined;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    await firebaseService.updateProduct(id, updates);
  }

  async getProducts(filters?: { status?: string; clientId?: string }): Promise<Product[]> {
    return await firebaseService.getProducts(filters);
  }

  // Workflow methods
  async createWorkflow(workflow: InsertWorkflow): Promise<Workflow> {
    return await firebaseService.createWorkflow({
      ...workflow,
      status: workflow.status ?? 'pending',
    } as any);
  }

  async getWorkflow(id: string): Promise<Workflow | undefined> {
    const workflow = await firebaseService.getWorkflow(id);
    return workflow || undefined;
  }

  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<void> {
    await firebaseService.updateWorkflow(id, updates);
  }

  async getWorkflows(filters?: { status?: string; productId?: string }): Promise<Workflow[]> {
    return await firebaseService.getWorkflows(filters);
  }

  // Task methods
  async createTask(task: InsertTask): Promise<Task> {
    return await firebaseService.createTask({
      ...task,
      status: task.status ?? 'unassigned',
    } as any);
  }

  async getTask(id: string): Promise<Task | undefined> {
    const task = await firebaseService.getTask(id);
    return task || undefined;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    await firebaseService.updateTask(id, updates);
  }

  async getTasks(filters?: { 
    status?: string; 
    assignedTo?: string; 
    workflowId?: string;
    productId?: string;
  }): Promise<Task[]> {
    return await firebaseService.getTasks(filters);
  }

  async getTasksByEmployee(employeeId: string): Promise<Task[]> {
    return await firebaseService.getTasksByEmployee(employeeId);
  }
}

export const storage = new FirebaseStorage();
