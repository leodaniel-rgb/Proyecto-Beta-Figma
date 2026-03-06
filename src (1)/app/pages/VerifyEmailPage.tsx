import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion } from 'motion/react';
import { Mail, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../components/ui/input-otp';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-0d7935a3`;

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast.error('Por favor ingresa el código completo');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error('Error al verificar', {
          description: data.error,
        });
        return;
      }

      toast.success('¡Cuenta verificada!', {
        description: 'Ahora completa tu perfil',
      });

      // Redirect to appropriate setup page
      if (data.userType === 'student') {
        navigate('/setup/student');
      } else {
        navigate('/setup/company');
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Error al verificar código');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Sparkles className="w-12 h-12 text-white mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white">Verificar Correo</h1>
        </div>

        <Card className="backdrop-blur-sm bg-white/95">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-violet-600" />
            </div>
            <CardTitle>Revisa tu correo</CardTitle>
            <CardDescription>
              Hemos enviado un código de verificación de 6 dígitos a<br />
              <strong className="text-foreground">{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={code}
                onChange={setCode}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              onClick={handleVerify}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
              disabled={isLoading || code.length !== 6}
            >
              {isLoading ? 'Verificando...' : 'Verificar Código'}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              ¿No recibiste el código?{' '}
              <button
                onClick={() => toast.info('Funcionalidad próximamente')}
                className="text-violet-600 hover:underline font-medium"
              >
                Reenviar
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
