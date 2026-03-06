import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Building2, Briefcase, DollarSign } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { projectId } from '/utils/supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-0d7935a3`;

const COMPANY_CATEGORIES = [
  'Tecnología',
  'Finanzas',
  'Retail',
  'Manufactura',
  'Servicios',
  'Educación',
  'Salud',
  'Marketing',
  'Construcción',
  'Otro',
];

const CAREERS = [
  'Ingeniería en Software',
  'Administración',
  'Diseño Gráfico',
];

export function CompanyProfileSetup() {
  const navigate = useNavigate();
  const { user, getAccessToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Company info
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  // Vacancy info
  const [vacancyTitle, setVacancyTitle] = useState('');
  const [vacancyCareer, setVacancyCareer] = useState('');
  const [vacancyDescription, setVacancyDescription] = useState('');
  const [salary, setSalary] = useState('');

  const handleSubmit = async () => {
    if (!category || !description || !vacancyTitle || !vacancyCareer || !vacancyDescription || !salary) {
      toast.error('Completa todos los campos', {
        description: 'Asegúrate de llenar toda la información',
      });
      return;
    }

    setIsLoading(true);

    try {
      const token = await getAccessToken();

      // Update company profile
      const profileResponse = await fetch(`${API_URL}/profile/company/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          category,
          description,
        }),
      });

      if (!profileResponse.ok) {
        toast.error('Error al guardar perfil');
        return;
      }

      // Create vacancy
      const vacancyResponse = await fetch(`${API_URL}/vacancy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: vacancyTitle,
          career: vacancyCareer,
          description: vacancyDescription,
          salary,
        }),
      });

      if (!vacancyResponse.ok) {
        toast.error('Error al crear vacante');
        return;
      }

      toast.success('¡Perfil completado!', {
        description: 'Empieza a buscar candidatos',
      });

      navigate('/swipe');
    } catch (error) {
      console.error('Profile setup error:', error);
      toast.error('Error al configurar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 p-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Building2 className="w-16 h-16 text-white mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Configura tu Empresa</h1>
          <p className="text-white/80">Cuéntanos sobre tu empresa y crea tu primera vacante</p>
        </motion.div>

        {/* Progress */}
        <div className="mb-6 flex justify-center space-x-2">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`w-32 h-2 rounded-full transition-colors ${
                s <= step ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </div>

        <Card className="backdrop-blur-sm bg-white/95">
          <CardHeader>
            <CardTitle>
              {step === 1 && 'Información de la Empresa'}
              {step === 2 && 'Crear Vacante'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Descripción y categoría de tu empresa'}
              {step === 2 && 'Detalles de la vacante que ofreces'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Company Info */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPANY_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Descripción de la Empresa</Label>
                  <Textarea
                    placeholder="Cuéntanos sobre tu empresa, misión, valores..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    {description.length}/500 caracteres
                  </p>
                </div>

                <Button
                  onClick={() => setStep(2)}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600"
                  disabled={!category || !description || description.length < 50}
                >
                  Continuar
                </Button>
              </motion.div>
            )}

            {/* Step 2: Vacancy */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label>Título de la Vacante</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="ej. Desarrollador Frontend Junior"
                      value={vacancyTitle}
                      onChange={(e) => setVacancyTitle(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Carrera Requerida</Label>
                  <Select value={vacancyCareer} onValueChange={setVacancyCareer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una carrera" />
                    </SelectTrigger>
                    <SelectContent>
                      {CAREERS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Descripción de la Vacante</Label>
                  <Textarea
                    placeholder="Responsabilidades, requisitos, beneficios..."
                    value={vacancyDescription}
                    onChange={(e) => setVacancyDescription(e.target.value)}
                    rows={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Oferta Salarial</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="ej. $15,000 - $20,000 MXN/mes"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                    Atrás
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600"
                    disabled={isLoading || !vacancyTitle || !vacancyCareer || !vacancyDescription || !salary}
                  >
                    {isLoading ? 'Guardando...' : 'Completar Perfil'}
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
