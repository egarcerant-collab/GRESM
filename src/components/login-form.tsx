
'use client';

import { useEffect } from 'react';

export function LoginForm() {
  useEffect(() => {
    // Redirect to dashboard if this component is ever rendered.
    window.location.assign('/dashboard');
  }, []);

  return (
    <div>
      <p>El sistema de inicio de sesión ha sido deshabilitado.</p>
      <p>Serás redirigido al panel principal...</p>
    </div>
  );
}
