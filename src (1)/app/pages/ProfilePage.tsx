import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, GraduationCap, Building2, Upload, X, LogOut, Briefcase, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { projectId } from '/utils/supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-0d7935a3`;

const CAREERS = ['Ingeniería en Software', 'Administración', 'Diseño Gráfico'];
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
const COMPANY_CATEGORIES = [
  'Tecnología', 'Finanzas', 'Retail', 'Manufactura', 'Servicios',
  'Educación', 'Salud', 'Marketing', 'Construcción', 'Otro',
];

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, signOut, getAccessToken } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [vacancies, setVacancies] = useState<any[]>([]);

  // Edit form states
  const [editCareer, setEditCareer] = useState('');
  const [editSemester, setEditSemester] = useState('');
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [editInterests, setEditInterests] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);

  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // New vacancy dialog
  const [showNewVacancy, setShowNewVacancy] = useState(false);
  const [newVacancyTitle, setNewVacancyTitle] = useState('');
  const [newVacancyCareer, setNewVacancyCareer] = useState('');
  const [newVacancyDescription, setNewVacancyDescription] = useState('');
  const [newVacancySalary, setNewVacancySalary] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const token = await getAccessToken();
      const response = await fetch(`${API_URL}/profile/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const profileData = await response.json();
        setProfile(profileData);

        if (profileData.userType === 'student') {
          setEditCareer(profileData.career || '');
          setEditSemester(profileData.semester || '');
          setEditSkills(profileData.skills || []);
          setEditInterests(profileData.interests || []);
        } else {
          setEditCategory(profileData.category || '');
          setEditDescription(profileData.description || '');
          loadVacancies();
        }
      }
    } catch (error) {
      console.error('Load profile error:', error);
      toast.error('Error al cargar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const loadVacancies = async () => {
    try {
      const token = await getAccessToken();
      const response = await fetch(`${API_URL}/vacancies/company/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const vacanciesData = await response.json();
        setVacancies(vacanciesData);
      }
    } catch (error) {
      console.error('Load vacancies error:', error);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const token = await getAccessToken();

      if (profile.userType === 'student') {
        // Upload CV if changed
        if (cvFile) {
          const reader = new FileReader();
          reader.readAsDataURL(cvFile);
          await new Promise((resolve) => {
            reader.onload = async () => {
              const cvData = reader.result as string;
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
              resolve(null);
            };
          });
        }

        // Update profile
        const response = await fetch(`${API_URL}/profile/student/${user.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            career: editCareer,
            semester: editSemester,
            skills: editSkills,
            interests: editInterests,
          }),
        });

        if (response.ok) {
          toast.success('Perfil actualizado');
          setIsEditing(false);
          loadProfile();
        }
      } else {
        // Update company profile
        const response = await fetch(`${API_URL}/profile/company/${user.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            category: editCategory,
            description: editDescription,
          }),
        });

        if (response.ok) {
          toast.success('Perfil actualizado');
          setIsEditing(false);
          loadProfile();
        }
      }
    } catch (error) {
      console.error('Save profile error:', error);
      toast.error('Error al guardar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateVacancy = async () => {
    try {
      const token = await getAccessToken();
      const response = await fetch(`${API_URL}/vacancy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newVacancyTitle,
          career: newVacancyCareer,
          description: newVacancyDescription,
          salary: newVacancySalary,
        }),
      });

      if (response.ok) {
        toast.success('Vacante creada');
        setShowNewVacancy(false);
        setNewVacancyTitle('');
        setNewVacancyCareer('');
        setNewVacancyDescription('');
        setNewVacancySalary('');
        loadVacancies();
      }
    } catch (error) {
      console.error('Create vacancy error:', error);
      toast.error('Error al crear vacante');
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-600 to-indigo-600">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/swipe')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Mi Perfil
          </h1>
        </div>
        <Button variant="ghost" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>

      {/* Content */}
      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Card */}
        <Card className="bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center">
                  {profile?.userType === 'student' ? (
                    <GraduationCap className="w-8 h-8 text-white" />
                  ) : (
                    <Building2 className="w-8 h-8 text-white" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-2xl">{profile?.name}</CardTitle>
                  <CardDescription>{profile?.email}</CardDescription>
                </div>
              </div>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)}>
                  Editar Perfil
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {profile?.userType === 'student' ? (
              <>
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label>Carrera</Label>
                      <Select value={editCareer} onValueChange={setEditCareer}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CAREERS.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Semestre</Label>
                      <Select value={editSemester} onValueChange={setEditSemester}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SEMESTERS.map((s) => (
                            <SelectItem key={s} value={s}>Semestre {s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Habilidades</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {editSkills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="pl-3 pr-1">
                            {skill}
                            <button
                              onClick={() => setEditSkills(editSkills.filter(s => s !== skill))}
                              className="ml-2 hover:bg-muted rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      {editSkills.length < 5 && (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Agregar habilidad..."
                            value={customSkill}
                            onChange={(e) => setCustomSkill(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && customSkill.trim()) {
                                setEditSkills([...editSkills, customSkill.trim()]);
                                setCustomSkill('');
                              }
                            }}
                          />
                          <Button
                            onClick={() => {
                              if (customSkill.trim()) {
                                setEditSkills([...editSkills, customSkill.trim()]);
                                setCustomSkill('');
                              }
                            }}
                            variant="outline"
                          >
                            Agregar
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Intereses</Label>
                      <div className="flex flex-wrap gap-2">
                        {editCareer && CATEGORIES[editCareer]?.map((cat) => (
                          <Badge
                            key={cat}
                            variant={editInterests.includes(cat) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              if (editInterests.includes(cat)) {
                                setEditInterests(editInterests.filter(i => i !== cat));
                              } else {
                                setEditInterests([...editInterests, cat]);
                              }
                            }}
                          >
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Actualizar CV (PDF)</Label>
                      {cvFile && (
                        <p className="text-sm text-muted-foreground">{cvFile.name}</p>
                      )}
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && file.type === 'application/pdf') {
                            setCvFile(file);
                          } else {
                            toast.error('Por favor sube un archivo PDF');
                          }
                        }}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setIsEditing(false);
                          loadProfile();
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSaveProfile}
                        className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600"
                        disabled={isSaving}
                      >
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-1">Carrera</p>
                      <p className="font-medium">{profile?.career}</p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-1">Semestre</p>
                      <p className="font-medium">Semestre {profile?.semester}</p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-2">Habilidades</p>
                      <div className="flex flex-wrap gap-2">
                        {profile?.skills?.map((skill: string) => (
                          <Badge key={skill} variant="secondary">{skill}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-2">Intereses</p>
                      <div className="flex flex-wrap gap-2">
                        {profile?.interests?.map((interest: string) => (
                          <Badge key={interest} variant="outline">{interest}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-1">CV</p>
                      <p className="text-sm text-muted-foreground">CV subido ✓</p>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label>Categoría</Label>
                      <Select value={editCategory} onValueChange={setEditCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COMPANY_CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Descripción</Label>
                      <Textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={5}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setIsEditing(false);
                          loadProfile();
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSaveProfile}
                        className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600"
                        disabled={isSaving}
                      >
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-1">Categoría</p>
                      <p className="font-medium">{profile?.category}</p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-1">Descripción</p>
                      <p className="text-sm">{profile?.description}</p>
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Vacancies (Company only) */}
        {profile?.userType === 'company' && (
          <Card className="bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Mis Vacantes</CardTitle>
                  <CardDescription>Gestiona tus ofertas de trabajo</CardDescription>
                </div>
                <Dialog open={showNewVacancy} onOpenChange={setShowNewVacancy}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Nueva Vacante
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Crear Nueva Vacante</DialogTitle>
                      <DialogDescription>
                        Completa la información de la vacante
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Título</Label>
                        <Input
                          value={newVacancyTitle}
                          onChange={(e) => setNewVacancyTitle(e.target.value)}
                          placeholder="ej. Desarrollador Frontend Junior"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Carrera Requerida</Label>
                        <Select value={newVacancyCareer} onValueChange={setNewVacancyCareer}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una carrera" />
                          </SelectTrigger>
                          <SelectContent>
                            {CAREERS.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Descripción</Label>
                        <Textarea
                          value={newVacancyDescription}
                          onChange={(e) => setNewVacancyDescription(e.target.value)}
                          placeholder="Descripción de la vacante..."
                          rows={4}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Salario</Label>
                        <Input
                          value={newVacancySalary}
                          onChange={(e) => setNewVacancySalary(e.target.value)}
                          placeholder="ej. $15,000 - $20,000 MXN/mes"
                        />
                      </div>

                      <Button
                        onClick={handleCreateVacancy}
                        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600"
                        disabled={!newVacancyTitle || !newVacancyCareer || !newVacancyDescription || !newVacancySalary}
                      >
                        Crear Vacante
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {vacancies.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No tienes vacantes activas
                </p>
              ) : (
                <div className="space-y-4">
                  {vacancies.map((vacancy) => (
                    <div key={vacancy.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{vacancy.title}</h3>
                          <p className="text-sm text-muted-foreground">{vacancy.career}</p>
                        </div>
                        <Briefcase className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm">{vacancy.description}</p>
                      <div className="flex items-center justify-between pt-2">
                        <Badge variant="secondary">{vacancy.salary}</Badge>
                        <p className="text-xs text-muted-foreground">
                          Creada el {new Date(vacancy.createdAt).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
