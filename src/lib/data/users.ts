import fs from 'fs/promises';
import path from 'path';
import type { User } from '../types';

const usersFilePath = path.join(process.cwd(), 'data', 'users.json');

async function readUsers(): Promise<User[]> {
    try {
        const data = await fs.readFile(usersFilePath, 'utf-8');
        if (data.trim() === '') {
            throw new Error('Empty users file'); // Trigger recreation
        }
        return JSON.parse(data);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT' || (error as Error).message === 'Empty users file') {
            const defaultUsers: User[] = [
                { username: 'eg', fullName: 'EG', password: 'eg', role: 'admin', cargo: 'Mega Usuario' },
            ];
            await writeUsers(defaultUsers);
            return defaultUsers;
        }
        console.error('Failed to read users file:', error);
        return [];
    }
}

async function writeUsers(users: User[]): Promise<void> {
    try {
        await fs.mkdir(path.dirname(usersFilePath), { recursive: true });
        await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), 'utf-8');
    } catch (error) {
        console.error('Failed to write users file:', error);
    }
}

export async function findUserByUsernameForLogin(username: string): Promise<User | undefined> {
    const users = await readUsers();
    return users.find((u) => u.username === username);
}

export async function getUsers(includePasswords = false): Promise<Omit<User, 'password'>[] | User[]> {
    const users = await readUsers();
    if (includePasswords) {
        return users;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return users.map(({ password, ...user }) => user);
}


export async function findUserByFullName(fullName: string): Promise<User | undefined> {
    const users = await readUsers();
    return users.find((u) => u.fullName === fullName || u.username === fullName);
}

export async function createUser(userData: User): Promise<User> {
  const users = await readUsers() as User[];
  const userExists = users.some(u => u.username === userData.username);
  if (userExists) {
    throw new Error('El nombre de usuario ya existe.');
  }
  
  users.push(userData);
  await writeUsers(users);
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...newUser } = userData;
  return newUser;
}

export async function updateUser(username: string, userData: Partial<Omit<User, 'username'>>): Promise<User> {
    const users = await readUsers() as User[];
    const userIndex = users.findIndex(u => u.username === username);

    if (userIndex === -1) {
        throw new Error('Usuario no encontrado.');
    }

    const existingUser = users[userIndex];
    
    const updatedData = { ...userData };

    // Do not update password if a new one is not provided (is empty or undefined)
    if (!updatedData.password) {
        updatedData.password = existingUser.password;
    }

    users[userIndex] = {
        ...existingUser,
        ...updatedData,
    };
    
    await writeUsers(users);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userToReturn } = users[userIndex];
    return userToReturn;
}

export async function deleteUser(username: string): Promise<void> {
  if (username === 'eg') {
    throw new Error('No se puede eliminar al mega usuario.');
  }
  const users = await readUsers() as User[];
  const updatedUsers = users.filter(user => user.username !== username);
  if (users.length === updatedUsers.length) {
    throw new Error('Usuario no encontrado para eliminar.');
  }
  await writeUsers(updatedUsers);
}
