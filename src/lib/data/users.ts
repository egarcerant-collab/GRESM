import fs from 'fs/promises';
import path from 'path';
import type { User } from '../types';

const usersFilePath = path.join(process.cwd(), 'users.json');

async function readUsers(): Promise<User[]> {
    try {
        const data = await fs.readFile(usersFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        // Si el archivo no existe, inicializa con usuarios por defecto
        const defaultUsers: User[] = [
            { username: 'admin', fullName: 'Administrador Principal', password: 'admin', role: 'admin', cargo: 'Administrador del Sistema' },
            { username: 'user', fullName: 'Usuario de Prueba', password: 'user', role: 'user', cargo: 'Usuario Estándar' },
        ];
        await writeUsers(defaultUsers);
        return defaultUsers;
    }
}

async function writeUsers(users: User[]): Promise<void> {
    await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), 'utf-8');
}

export async function getUsers(includePasswords = false): Promise<Omit<User, 'password'>[] | User[]> {
    const users = await readUsers();
    if (includePasswords) {
        return users;
    }
    return users.map(({ password, ...user }) => user);
}

export async function findUser(username: string): Promise<User | undefined> {
    const users = await readUsers();
    return users.find((u) => u.username === username);
}

export async function addUser(user: User): Promise<void> {
    const users = await readUsers();
    if (users.some((u) => u.username === user.username)) {
        throw new Error(`El usuario "${user.username}" ya existe.`);
    }
    if (!user.username || !user.password || !user.fullName) {
        throw new Error("El nombre de usuario, nombre completo y la contraseña no pueden estar vacíos.");
    }
    users.push(user);
    await writeUsers(users);
}

export async function updateUser(username: string, data: Partial<User>): Promise<void> {
    const users = await readUsers();
    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex === -1) {
        throw new Error(`El usuario "${username}" no fue encontrado.`);
    }
    
    // Update fields that are provided
    if (data.fullName !== undefined) users[userIndex].fullName = data.fullName;
    if (data.role) users[userIndex].role = data.role;
    if (data.cargo !== undefined) users[userIndex].cargo = data.cargo;
    if (data.signature !== undefined) users[userIndex].signature = data.signature;
    if (data.password && data.password.length > 0) users[userIndex].password = data.password;

    await writeUsers(users);
}
