import { User } from './user.models';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
