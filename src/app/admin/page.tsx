"use client";

import { useState, useEffect, useCallback, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Edit, Loader2, UserPlus, Users } from "lucide-react";
import type { User } from '@/lib/types';
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";


export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser, loading: authLoading } = useAuth();

  // State for new user form
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [cargo, setCargo] = useState("");
  const [signature, setSignature] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [users, setUsers] = useState<Omit<User, 'password'>[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  
  // State for editing user
  const [editingUser, setEditingUser] = useState<(Omit<User, 'password'> & { newPassword?: string }) | null>(null);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);


  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los usuarios.' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo conectar al servidor.' });
    } finally {
        setUsersLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading) {
      if (currentUser?.role === "admin") {
        fetchUsers();
      } else {
        router.push("/");
      }
    }
  }, [authLoading, currentUser, router, fetchUsers]);


  const handleSignatureUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setSignature(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const handleEditSignatureUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (!editingUser) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
        setEditingUser({ ...editingUser, signature: reader.result as string });
    };
    reader.readAsDataURL(file);
  };


  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!username || !password || !fullName) {
      setFormError("El usuario, nombre completo y la contraseña son obligatorios.");
      return;
    }
    setIsCreating(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, fullName, password, role, cargo, signature }),
      });

      if (response.ok) {
        await fetchUsers();
        toast({
          title: "Usuario Creado",
          description: `El usuario "${username}" ha sido creado exitosamente.`,
        });
        // Reset form
        setUsername("");
        setFullName("");
        setPassword("");
        setRole("user");
        setCargo("");
        setSignature("");
        const fileInput = document.getElementById('new-signature') as HTMLInputElement;
        if (fileInput) fileInput.value = "";

      } else {
        const data = await response.json();
        setFormError(data.message);
      }
    } catch (error: any) {
      setFormError('No se pudo conectar al servidor.');
    } finally {
        setIsCreating(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    setIsUpdating(true);

    const { newPassword, ...userData } = editingUser;
    const payload: Partial<User> = {
        fullName: userData.fullName,
        role: userData.role,
        cargo: userData.cargo,
        signature: userData.signature,
    };
    if (newPassword) {
        payload.password = newPassword;
    }

    try {
        const response = await fetch(`/api/users/${editingUser.username}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            await fetchUsers();
            toast({
                title: "Usuario Actualizado",
                description: `Los datos de "${editingUser.username}" han sido actualizados.`,
            });
            setIsEditUserOpen(false);
            setEditingUser(null);
        } else {
            const data = await response.json();
            throw new Error(data.message || 'Error al actualizar usuario');
        }
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error",
            description: error.message
        });
    } finally {
        setIsUpdating(false);
    }
  };

  const openEditModal = (user: Omit<User, 'password'>) => {
    setEditingUser({ ...user, newPassword: '' });
    setIsEditUserOpen(true);
  };


  if (authLoading || !currentUser) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verificando permisos...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold font-headline">Panel de Administración</h1>
            <Button asChild variant="outline">
                <Link href="/">Volver al Inicio</Link>
            </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
            <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserPlus />
                    Crear Nuevo Usuario
                </CardTitle>
                <CardDescription>
                Crea un nuevo usuario para la aplicación con su rol, cargo y firma.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleAddUser} className="grid gap-6">
                {formError && (
                    <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{formError}</AlertDescription>
                    </Alert>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                    <Label htmlFor="new-username">Usuario</Label>
                    <Input id="new-username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ej. nuevousuario" required/>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="new-fullname">Nombre Completo</Label>
                        <Input id="new-fullname" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ej. Juan Pérez" required />
                    </div>
                    <div className="grid gap-2">
                    <Label htmlFor="new-password">Contraseña</Label>
                    <Input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <div className="grid gap-2">
                    <Label htmlFor="new-role">Rol</Label>
                    <Select value={role} onValueChange={(v) => setRole(v as "admin" | "user")}>
                        <SelectTrigger id="new-role"><SelectValue /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="user">Usuario</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                    </Select>
                    </div>
                    <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="new-cargo">Cargo</Label>
                    <Input id="new-cargo" value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Ej. Gerente de Proyectos" />
                    </div>
                    <div className="grid gap-2 col-span-1 sm:col-span-2">
                        <Label htmlFor="new-signature">Firma (Imagen)</Label>
                        <Input id="new-signature" type="file" accept="image/*" onChange={handleSignatureUpload} />
                        {signature && (
                            <div className="mt-2 p-2 border rounded-md bg-muted">
                                <p className="text-sm font-medium mb-1">Previsualización de la firma:</p>
                                <Image src={signature} alt="Previsualización de la firma" width={150} height={75} className="bg-white object-contain" />
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button type="submit" disabled={isCreating}>
                        {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Añadir Usuario
                    </Button>
                </div>
                </form>
            </CardContent>
            </Card>

            <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users />
                    Usuarios Existentes
                </CardTitle>
            </CardHeader>
            <CardContent>
                {usersLoading ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /> : (
                <ul className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {users.map((u) => (
                    <li
                        key={u.username}
                        className="flex justify-between items-center p-3 border rounded-lg gap-4"
                    >
                        <div className="flex-1 min-w-0">
                        <p className="font-semibold">{u.fullName || u.username} <span className="ml-2 text-xs font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{u.role}</span></p>
                        <p className="text-sm text-muted-foreground truncate">@{u.username}</p>
                        {u.cargo && <p className="text-sm text-muted-foreground mt-1">{u.cargo}</p>}
                        {u.signature && (
                            <div className="mt-2">
                                <Image src={u.signature} alt={`Firma de ${u.username}`} width={100} height={50} className="bg-white border rounded object-contain" />
                            </div>
                        )}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => openEditModal(u)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar Usuario</span>
                        </Button>
                    </li>
                    ))}
                </ul>
                )}
                <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                    <DialogTitle>Editar Usuario: {editingUser?.username}</DialogTitle>
                    </DialogHeader>
                    {editingUser && (
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-fullname">Nombre Completo</Label>
                            <Input id="edit-fullname" value={editingUser.fullName || ''} onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })} placeholder="Ej. Juan Pérez" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-password">Nueva Contraseña (opcional)</Label>
                            <Input id="edit-password" type="password" value={editingUser.newPassword || ''} onChange={(e) => setEditingUser({ ...editingUser, newPassword: e.target.value })} placeholder="Dejar en blanco para no cambiar" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-role">Rol</Label>
                            <Select value={editingUser.role} onValueChange={(v) => setEditingUser({ ...editingUser, role: v as "admin" | "user" })}>
                                <SelectTrigger id="edit-role"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">Usuario</SelectItem>
                                    <SelectItem value="admin">Administrador</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-cargo">Cargo</Label>
                            <Input id="edit-cargo" value={editingUser.cargo || ''} onChange={(e) => setEditingUser({ ...editingUser, cargo: e.target.value })} placeholder="Ej. Gerente" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-signature">Firma (Imagen)</Label>
                            <Input id="edit-signature" type="file" accept="image/*" onChange={handleEditSignatureUpload} />
                            {editingUser.signature && (
                                <div className="mt-2 p-2 border rounded-md bg-muted">
                                    <p className="text-sm font-medium mb-1">Firma actual:</p>
                                    <Image src={editingUser.signature} alt="Previsualización de la firma" width={150} height={75} className="bg-white object-contain" />
                                </div>
                            )}
                        </div>
                    </div>
                    )}
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancelar</Button>
                        </DialogClose>
                        <Button onClick={handleUpdateUser} disabled={isUpdating}>
                            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
                </Dialog>
            </CardContent>
            </Card>
        </div>
    </div>
  );
}
