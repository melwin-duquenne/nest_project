import { UserRole } from '../interfaces/user.interface';

export class User {
  id!: string;
  email!: string;
  name!: string;
  role!: UserRole;
  createdAt!: Date;
  updatedAt!: Date;
}
