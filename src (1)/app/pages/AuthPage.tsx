import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Building2, GraduationCap, Mail, Lock, User, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-0d7935a3`;

export function AuthPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [userType, setUserType] = useState<'student' | 'company'>('student');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Student signup form
  const [studentEmail, setStudentEmail] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentPassword, setStudentPassword] = useState('');

  // Company signup form
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyPassword, setCompanyPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await signIn(loginEmail, loginPassword);

      if (error) {
        toast.error('Error al iniciar sesión', {
          description: 'Verifica tu correo y contraseña',
        });
        return;
      }

      // Get user profile to check if setup is complete
      const token = data.session.access_token;
      const response = await fetch(`${API_URL}/profile/${data.user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const profile = await response.json();
        
        if (!profile.profileComplete) {
          // Redirect to setup
          if (profile.userType === 'student') {
            navigate('/setup/student');
          } else {
            navigate('/setup/company');
          }
        } else {
          // Redirect to swipe page
          navigate('/swipe');
        }
      } else {
        navigate('/swipe');
      }

      toast.success('¡Bienvenido a PlusZone!');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/signup/student`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          email: studentEmail,
          password: studentPassword,
          name: studentName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error('Error al registrarse', {
          description: data.error,
        });
        return;
      }

      toast.success('¡Código enviado!', {
        description: 'Revisa tu correo para verificar tu cuenta',
      });

      // Navigate to verification page
      navigate('/verify-email', { 
        state: { email: studentEmail }
      });
    } catch (error) {
      console.error('Student signup error:', error);
      toast.error('Error al registrarse');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompanySignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/signup/company`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          email: companyEmail,
          password: companyPassword,
          companyName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error('Error al registrarse', {
          description: data.error,
        });
        return;
      }

      toast.success('¡Código enviado!', {
        description: 'Revisa tu correo para verificar tu cuenta',
      });

      // Navigate to verification page
      navigate('/verify-email', { 
        state: { email: companyEmail }
      });
    } catch (error) {
      console.error('Company signup error:', error);
      toast.error('Error al registrarse');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="inline-block mb-4"
          >
            <Sparkles className="w-16 h-16 text-white mx-auto" />
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-2">PlusZone</h1>
          <p className="text-white/80">Conecta con tu futuro profesional</p>
        </div>

        <Card className="backdrop-blur-sm bg-white/95">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              {authMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </CardTitle>
            <CardDescription className="text-center">
              {authMode === 'login' 
                ? 'Ingresa tus credenciales para continuar' 
                : 'Regístrate para empezar a conectar'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="signup">Registrarse</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Correo Electrónico</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="tu@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup">
                <Tabs value={userType} onValueChange={(v) => setUserType(v as any)} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="student">
                      <GraduationCap className="w-4 h-4 mr-2" />
                      Estudiante
                    </TabsTrigger>
                    <TabsTrigger value="company">
                      <Building2 className="w-4 h-4 mr-2" />
                      Empresa
                    </TabsTrigger>
                  </TabsList>

                  {/* Student Signup */}
                  <TabsContent value="student">
                    <form onSubmit={handleStudentSignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="student-name">Nombre Completo</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="student-name"
                            type="text"
                            placeholder="Juan Pérez"
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            className="pl-9"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="student-email">Correo Institucional</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="student-email"
                            type="email"
                            placeholder="tu@tecmilenio.mx"
                            value={studentEmail}
                            onChange={(e) => setStudentEmail(e.target.value)}
                            className="pl-9"
                            required
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Debe ser un correo @tecmilenio.mx
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="student-password">Contraseña</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="student-password"
                            type="password"
                            placeholder="••••••••"
                            value={studentPassword}
                            onChange={(e) => setStudentPassword(e.target.value)}
                            className="pl-9"
                            required
                            minLength={6}
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Registrando...' : 'Registrarse como Estudiante'}
                      </Button>
                    </form>
                  </TabsContent>

                  {/* Company Signup */}
                  <TabsContent value="company">
                    <form onSubmit={handleCompanySignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="company-name">Nombre de la Empresa</Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="company-name"
                            type="text"
                            placeholder="Mi Empresa S.A."
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="pl-9"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="company-email">Correo Empresarial</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="company-email"
                            type="email"
                            placeholder="contacto@empresa.com"
                            value={companyEmail}
                            onChange={(e) => setCompanyEmail(e.target.value)}
                            className="pl-9"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="company-password">Contraseña</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="company-password"
                            type="password"
                            placeholder="••••••••"
                            value={companyPassword}
                            onChange={(e) => setCompanyPassword(e.target.value)}
                            className="pl-9"
                            required
                            minLength={6}
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Registrando...' : 'Registrarse como Empresa'}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
