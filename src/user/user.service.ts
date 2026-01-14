import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  private users: User[] = [];
  private nextId = 1;

  async create(data: { nombre: string; email: string; password: string }): Promise<User> {
    const user: User = {
      id: this.nextId++,
      nombre: data.nombre,
      email: data.email.toLowerCase().trim(),
      password: data.password,
      createdAt: new Date(),
    };

    this.users.push(user);
    return user;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const e = email.toLowerCase().trim();
    return this.users.find((u) => u.email === e);
  }

  async findById(id: number): Promise<User | undefined> {
    return this.users.find((u) => u.id === id);
  }
}
