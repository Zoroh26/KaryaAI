import { firestore } from '../config/firebase';
import { User, Product, Workflow, Task } from '../types/schema';

export class FirebaseService {
  // Users collection
  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    if (!firestore) throw new Error('Firebase not initialized');
    const userRef = firestore.collection('users').doc();
    const user: User = {
      ...userData,
      id: userRef.id,
      createdAt: new Date(),
    };
    await userRef.set(user);
    return user;
  }

  async getUser(id: string): Promise<User | null> {
    if (!firestore) throw new Error('Firebase not initialized');
    const doc = await firestore.collection('users').doc(id).get();
    return doc.exists ? ({ id: doc.id, ...doc.data() } as User) : null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    if (!firestore) throw new Error('Firebase not initialized');
    const snapshot = await firestore.collection('users').where('email', '==', email).limit(1).get();
    return snapshot.empty ? null : (snapshot.docs[0].data() as User);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    if (!firestore) throw new Error('Firebase not initialized');
    await firestore.collection('users').doc(id).update(updates);
  }

  async getAvailableEmployees(): Promise<User[]> {
    if (!firestore) throw new Error('Firebase not initialized');
    const snapshot = await firestore.collection('users')
      .where('role', '==', 'employee')
      .where('isAvailable', '==', true)
      .get();
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as User));
  }

  // Products collection
  async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    if (!firestore) throw new Error('Firebase not initialized');
    const productRef = firestore.collection('products').doc();
    const product: Product = {
      ...productData,
      id: productRef.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await productRef.set(product);
    return product;
  }

  async getProduct(id: string): Promise<Product | null> {
    if (!firestore) throw new Error('Firebase not initialized');
    const doc = await firestore.collection('products').doc(id).get();
    return doc.exists ? (doc.data() as Product) : null;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    if (!firestore) throw new Error('Firebase not initialized');
    await firestore.collection('products').doc(id).update({
      ...updates,
      updatedAt: new Date(),
    });
  }

  async getProducts(filters?: { status?: string; clientId?: string }): Promise<Product[]> {
    if (!firestore) throw new Error('Firebase not initialized');
    let query: any = firestore.collection('products');
    
    if (filters?.status) {
      query = query.where('status', '==', filters.status);
    }
    if (filters?.clientId) {
      query = query.where('clientId', '==', filters.clientId);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc: any) => doc.data() as Product);
  }

    // Workflows collection
  async createWorkflow(workflowData: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workflow> {
    if (!firestore) throw new Error('Firebase not initialized');
    const workflowRef = firestore.collection('workflows').doc();
    const workflow: Workflow = {
      ...workflowData,
      id: workflowRef.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await workflowRef.set(workflow);
    return workflow;
  }

  async getWorkflow(id: string): Promise<Workflow | null> {
    if (!firestore) throw new Error('Firebase not initialized');
    const doc = await firestore.collection('workflows').doc(id).get();
    return doc.exists ? (doc.data() as Workflow) : null;
  }

  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<void> {
    if (!firestore) throw new Error('Firebase not initialized');
    await firestore.collection('workflows').doc(id).update(updates);
  }

  async getWorkflows(filters?: { status?: string; productId?: string }): Promise<Workflow[]> {
    if (!firestore) throw new Error('Firebase not initialized');
    let query: any = firestore.collection('workflows');
    
    if (filters?.status) {
      query = query.where('status', '==', filters.status);
    }
    if (filters?.productId) {
      query = query.where('productId', '==', filters.productId);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc: any) => doc.data() as Workflow);
  }

  // Tasks collection
  async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    if (!firestore) throw new Error('Firebase not initialized');
    const taskRef = firestore.collection('tasks').doc();
    const task: Task = {
      ...taskData,
      id: taskRef.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await taskRef.set(task);
    return task;
  }

  async getTask(id: string): Promise<Task | null> {
    if (!firestore) throw new Error('Firebase not initialized');
    const doc = await firestore.collection('tasks').doc(id).get();
    return doc.exists ? ({ id: doc.id, ...doc.data() } as Task) : null;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    if (!firestore) throw new Error('Firebase not initialized');
    await firestore.collection('tasks').doc(id).update({
      ...updates,
      updatedAt: new Date(),
    });
  }

  async getTasks(filters?: { 
    status?: string; 
    assignedTo?: string; 
    workflowId?: string;
    productId?: string;
  }): Promise<Task[]> {
    if (!firestore) throw new Error('Firebase not initialized');
    let query: any = firestore.collection('tasks');
    
    if (filters?.status) {
      query = query.where('status', '==', filters.status);
    }
    if (filters?.assignedTo) {
      query = query.where('assignedTo', '==', filters.assignedTo);
    }
    if (filters?.workflowId) {
      query = query.where('workflowId', '==', filters.workflowId);
    }
    if (filters?.productId) {
      query = query.where('productId', '==', filters.productId);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc: any) => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Task));
  }

  async getTasksByEmployee(employeeId: string): Promise<Task[]> {
    if (!firestore) throw new Error('Firebase not initialized');
    if (!employeeId) return []; // Return empty array if no employeeId provided
    
    const snapshot = await firestore.collection('tasks')
      .where('assignedTo', '==', employeeId)
      .get();
    return snapshot.docs.map((doc: any) => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Task));
  }
}

export const firebaseService = new FirebaseService();
