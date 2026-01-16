import fs from 'fs/promises';
import path from 'path';
import type { User } from '../types';

const usersFilePath = path.join(process.cwd(), 'src', 'lib', 'data', 'users.json');

async function readUsers(): Promise<User[]> {
    try {
        await fs.access(usersFilePath); // Check if file exists
        const data = await fs.readFile(usersFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            const defaultUsers: User[] = [
                { username: 'admin', fullName: 'Administrador Principal', password: 'admin', role: 'admin', cargo: 'Administrador del Sistema' },
                { username: 'user', fullName: 'Usuario de Prueba', password: 'user', role: 'user', cargo: 'Usuario Estándar' },
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

export async function getUsers(includePasswords = false): Promise<Omit<User, 'password'>[] | User[]> {
    const users = await readUsers();
    if (includePasswords) {
        return users;
    }
    return users.map(({ password, ...user }) => user);
}


export async function findUserByFullName(fullName: string): Promise<User | undefined> {
    const users = await readUsers();
    return users.find((u) => u.fullName === fullName || u.username === fullName);
}
