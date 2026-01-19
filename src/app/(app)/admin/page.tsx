
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCollection, useFirestore, useUser } from '@/firebase';
import type { UserProfile } from '@/lib/types';
import { Loader2, UserPlus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { UserForm } from '@/components/admin/user-form';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { collection, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();

  const { data: users, isLoading: loading, error } = useCollection<UserProfile>(collection(firestore, 'users'));
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const { toast } = useToast();

  const [password, setPassword] = useState('');
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user) {
        const userDocRef = doc(firestore, 'users', user.uid);
        getDoc(userDocRef).then(docSnap => {
            if (docSnap.exists() && docSnap.data().role !== 'admin') {
                router.push('/dashboard');
            }
        });
    }
  }, [user, firestore, router]);


  if (error) {
    return <div>Error: {error.message}</div>
  }

  const handleEditClick = (user: UserProfile) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };
  
  const handleDeleteUser = async () => {
    if (password !== '123456') {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Contraseña incorrecta.',
      });
      setPassword('');
      return;
    }
    
    if (!userToDelete) return;

    if (userToDelete.email.startsWith('eg@')) {
        toast({
            variant: 'destructive',
            title: 'Acción no permitida',
            description: 'No se puede eliminar al mega usuario.',
        });
        return;
    }

    setIsDeleting(true);
    try {
      // NOTE: This only deletes the Firestore record, not the Firebase Auth user.
      // A robust solution would use a Cloud Function to delete the Auth user too.
      await deleteDoc(doc(firestore, 'users', userToDelete.uid));
       toast({
        title: 'Usuario Eliminado',
        description: 'El usuario ha sido eliminado exitosamente.',
      });
    } catch(e: any) {
       toast({
        variant: 'destructive',
        title: 'Error al eliminar',
        description: e.message || 'Ocurrió un error',
      });
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
      setPassword('');
    }
  };

  const onFormFinished = () => {
      setIsFormOpen(false);
      setEditingUser(null);
  }

  const onOpenChange = (open: boolean) => {
    if (!open) {
      setPassword('');
      setUserToDelete(null);
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold font-headline">Panel de Administración</h1>
        
        <Card>
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
            <UserForm onFinished={onFormFinished} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usuarios Existentes</CardTitle>
            <CardDescription>Gestiona los usuarios registrados en el sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
              <ul className="space-y-4">
                {users && users.map((user) => (
                  <li
                    key={user.uid}
                    className="flex justify-between items-start p-4 border rounded-lg gap-4 flex-wrap hover:bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                        <div className='flex items-center gap-2'>
                            <p className="font-semibold text-lg">{user.fullName || user.username}</p>
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                {user.role}
                            </Badge>
                        </div>
                      
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      {user.cargo && <p className="text-sm text-foreground mt-1">{user.cargo}</p>}
                      {user.signature && (
                        <div className="mt-2">
                             <p className="text-xs font-medium text-muted-foreground mb-1">Firma:</p>
                             <Image src={user.signature} alt={`Firma de ${user.username}`} width={120} height={60} className="bg-white border rounded object-contain p-1" />
                        </div>
                      )}
                    </div>
                    <div className='flex items-center gap-1'>
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(user)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar Usuario</span>
                        </Button>
                         <AlertDialog onOpenChange={onOpenChange}>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className='text-destructive hover:text-destructive' disabled={user.email.startsWith('eg@')} onClick={() => setUserToDelete(user)}>
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Eliminar Usuario</span>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Esto eliminará permanentemente al usuario. Para confirmar, introduce la contraseña.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="space-y-2 py-2">
                                    <Label htmlFor="delete-password-admin">Contraseña</Label>
                                    <Input
                                        id="delete-password-admin"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Introduce la contraseña"
                                    />
                                </div>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteUser} disabled={isDeleting}>
                                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Eliminar
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {users?.length === 0 && !loading && (
                 <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
                    <h3 className="text-xl font-semibold text-foreground">No se encontraron usuarios.</h3>
                    <p className="mt-2">Comienza creando el primer usuario en el formulario de arriba.</p>
                </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                <DialogTitle>Editar Usuario: {editingUser?.username}</DialogTitle>
                 <DialogDescription>
                  Actualice los detalles del usuario a continuación. Deje la contraseña en blanco para no cambiarla.
                </DialogDescription>
                </DialogHeader>
                <UserForm onFinished={onFormFinished} initialData={editingUser} />
            </DialogContent>
        </Dialog>
    </div>
  );
}
