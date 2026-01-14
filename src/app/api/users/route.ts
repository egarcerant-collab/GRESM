import { NextResponse } from 'next/server';
import { getUsers, addUser } from '@/lib/data/users';

export async function GET() {
    try {
        const users = await getUsers();
        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ message: 'Error al obtener usuarios' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { username, password, role, cargo, signature, fullName } = await request.json();
        if (!username || !password || !fullName) {
             throw new Error("El nombre de usuario, nombre completo y la contraseña no pueden estar vacíos.");
        }
        await addUser({ username, fullName, password, role, cargo, signature });
        return NextResponse.json({ message: 'Usuario creado exitosamente' }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 400 });
    }
}
