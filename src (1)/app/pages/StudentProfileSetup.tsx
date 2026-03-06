import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { GraduationCap, Upload, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { projectId } from '/utils/supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-0d7935a3`;

const CAREERS = [
  'Ingeniería en Software',
  'Administración',
  'Diseño Gráfico',
];

const SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

const CATEGORIES = {
  'Ingeniería en Software': ['Desarrollo Web', 'Desarrollo Mobile', 'DevOps', 'Data Science', 'Ciberseguridad'],
  'Administración': ['Finanzas', 'Marketing', 'Recursos Humanos', 'Operaciones', 'Ventas'],
  'Diseño Gráfico': ['Diseño UI/UX', 'Diseño Web', 'Branding', 'Publicidad', 'Motion Graphics'],
};

const SUGGESTED_SKILLS = {
  'Ingeniería en Software': ['JavaScript', 'Python', 'React', 'Node.js', 'Git', 'SQL', 'AWS', 'Docker'],
  'Administración': ['Excel', 'Liderazgo', 'Análisis Financiero', 'Planificación', 'Comunicación', 'CRM'],
  'Diseño Gráfico': ['Photoshop', 'Illustrator', 'Figma', 'After Effects', 'InDesign', 'Tipografía'],
};

export function StudentProfileSetup() {
  const navigate = useNavigate();
  const { user, getAccessToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Form state
  const [career, setCareer] = useState('');
  const [semester, setSemester] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [cvFile, setCvFile] = useState<File | null>(null);

  const handleAddSkill = (skill: string) => {
    if (skills.length < 5 && !skills.includes(skill)) {
      setSkills([...skills, skill]);
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleAddCustomSkill = () => {
    if (customSkill.trim() && skills.length < 5 && !skills.includes(customSkill.trim())) {
      setSkills([...skills, customSkill.trim()]);
      setCustomSkill('');
    }
  };

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('El archivo es muy grande', {
          description: 'El CV debe ser menor a 5MB',
        });
        return;
      }
      setCvFile(file);
    } else {
      toast.error('Formato inválido', {
        description: 'Por favor sube un archivo PDF',
      });
    }
  };

  const handleSubmit = async () => {
    if (!career || !semester || skills.length === 0 || interests.length === 0 || !cvFile) {
      toast.error('Completa todos los campos', {
        description: 'Asegúrate de llenar toda la información',
      });
      return;
    }

    setIsLoading(true);

    try {
      const token = await getAccessToken();

      // Convert CV to base64
      const reader = new FileReader();
      reader.readAsDataURL(cvFile);
      reader.onload = async () => {
        const cvData = reader.result as string;

        // Upload CV
        await fetch(`${API_URL}/upload-cv/${user.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            cvData,
            fileName: cvFile.name,
          }),
        });

        // Update profile
        const response = await fetch(`${API_URL}/profile/student/${user.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            career,
            semester,
            skills,
            interests,
            cvUrl: `cv:${user.id}`,
          }),
        });

        if (!response.ok) {
          toast.error('Error al guardar perfil');
          return;
        }

        toast.success('¡Perfil completado!', {
          description: 'Empieza a buscar oportunidades',
        });

        navigate('/swipe');
      };
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
          <GraduationCap className="w-16 h-16 text-white mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Configura tu Perfil</h1>
          <p className="text-white/80">Cuéntanos sobre ti para encontrar las mejores oportunidades</p>
        </motion.div>

        {/* Progress */}
        <div className="mb-6 flex justify-center space-x-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-24 h-2 rounded-full transition-colors ${
                s <= step ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </div>

        <Card className="backdrop-blur-sm bg-white/95">
          <CardHeader>
            <CardTitle>
              {step === 1 && 'Información Académica'}
              {step === 2 && 'Habilidades e Intereses'}
              {step === 3 && 'Curriculum Vitae'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Tu carrera y semestre actual'}
              {step === 2 && 'Tus habilidades y áreas de interés'}
              {step === 3 && 'Sube tu CV en formato PDF'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Academic Info */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label>Carrera</Label>
                  <Select value={career} onValueChange={setCareer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tu carrera" />
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
                  <Label>Semestre</Label>
                  <Select value={semester} onValueChange={setSemester}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tu semestre" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEMESTERS.map((s) => (
                        <SelectItem key={s} value={s}>
                          Semestre {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={() => setStep(2)}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600"
                  disabled={!career || !semester}
                >
                  Continuar
                </Button>
              </motion.div>
            )}

            {/* Step 2: Skills and Interests */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="space-y-3">
                  <Label>Habilidades (máximo 5)</Label>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="pl-3 pr-1">
                        {skill}
                        <button
                          onClick={() => handleRemoveSkill(skill)}
                          className="ml-2 hover:bg-muted rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>

                  {skills.length < 5 && career && (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {SUGGESTED_SKILLS[career]?.map((skill) => (
                          <Badge
                            key={skill}
                            variant="outline"
                            className="cursor-pointer hover:bg-violet-100"
                            onClick={() => handleAddSkill(skill)}
                          >
                            + {skill}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Input
                          placeholder="O escribe una habilidad..."
                          value={customSkill}
                          onChange={(e) => setCustomSkill(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddCustomSkill()}
                        />
                        <Button onClick={handleAddCustomSkill} variant="outline">
                          Agregar
                        </Button>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-3">
                  <Label>Categorías de Interés</Label>
                  <div className="flex flex-wrap gap-2">
                    {career && CATEGORIES[career]?.map((cat) => (
                      <Badge
                        key={cat}
                        variant={interests.includes(cat) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleInterest(cat)}
                      >
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                    Atrás
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600"
                    disabled={skills.length === 0 || interests.length === 0}
                  >
                    Continuar
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: CV Upload */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="space-y-3">
                  <Label>Curriculum Vitae (PDF)</Label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    {cvFile ? (
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto">
                          <Upload className="w-8 h-8 text-violet-600" />
                        </div>
                        <div>
                          <p className="font-medium">{cvFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(cvFile.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                        <Button
                          onClick={() => setCvFile(null)}
                          variant="outline"
                          size="sm"
                        >
                          Cambiar archivo
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Haz clic para subir tu CV
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PDF, máximo 5MB
                        </p>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => setStep(2)} variant="outline" className="flex-1">
                    Atrás
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600"
                    disabled={!cvFile || isLoading}
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
