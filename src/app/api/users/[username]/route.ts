import { NextResponse } from 'next/server';
import { updateUser } from '@/lib/data/users';

export async function PUT(request: Request, { params }: { params: { username: string } }) {
    try {
        const { username } = params;
        const { fullName, role, cargo, signature, password } = await request.json();
        
        await updateUser(username, { fullName, role, cargo, signature, password });

        return NextResponse.json({ message: 'Usuario actualizado exitosamente' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 400 });
    }
}
