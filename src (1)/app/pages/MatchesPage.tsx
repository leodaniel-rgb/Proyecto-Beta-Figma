import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Heart, ArrowLeft, Building2, User, Briefcase, Mail } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { projectId } from '/utils/supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-0d7935a3`;

export function MatchesPage() {
  const navigate = useNavigate();
  const { user, getAccessToken } = useAuth();
  const [matches, setMatches] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
    loadMatches();
  }, []);

  const loadProfile = async () => {
    try {
      const token = await getAccessToken();
      const response = await fetch(`${API_URL}/profile/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const profile = await response.json();
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Load profile error:', error);
    }
  };

  const loadMatches = async () => {
    setIsLoading(true);
    try {
      const token = await getAccessToken();
      const response = await fetch(`${API_URL}/matches/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const matchesData = await response.json();
        setMatches(matchesData);
      }
    } catch (error) {
      console.error('Load matches error:', error);
      toast.error('Error al cargar matches');
    } finally {
      setIsLoading(false);
    }
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
      <div className="bg-white border-b px-4 py-3 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/swipe')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
          Mis Matches
        </h1>
      </div>

      {/* Content */}
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {matches.length === 0 ? (
          <Card className="text-center p-12 bg-white/95 backdrop-blur-sm">
            <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No tienes matches aún</h2>
            <p className="text-muted-foreground mb-6">
              Sigue buscando para encontrar tu {userProfile?.userType === 'student' ? 'oportunidad ideal' : 'candidato perfecto'}
            </p>
            <Button onClick={() => navigate('/swipe')}>
              Volver a Buscar
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <Card key={match.id} className="overflow-hidden bg-white/95 backdrop-blur-sm hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center">
                        {userProfile?.userType === 'student' ? (
                          <Building2 className="w-6 h-6 text-white" />
                        ) : (
                          <User className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-xl">
                          {userProfile?.userType === 'student' 
                            ? match.company.name
                            : match.student.name}
                        </CardTitle>
                        <CardDescription>
                          Match el {new Date(match.createdAt).toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </CardDescription>
                      </div>
                    </div>
                    <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {userProfile?.userType === 'student' ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold">{match.vacancy.title}</span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{match.vacancy.career}</Badge>
                        <Badge variant="outline">{match.company.category}</Badge>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-muted-foreground mb-1">
                          Oferta Salarial
                        </p>
                        <p className="text-lg font-bold text-violet-600">
                          {match.vacancy.salary}
                        </p>
                      </div>

                      <Separator />

                      <div>
                        <p className="text-sm font-semibold text-muted-foreground mb-2">
                          Descripción de la Vacante
                        </p>
                        <p className="text-sm">{match.vacancy.description}</p>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-muted-foreground mb-2">
                          Sobre la Empresa
                        </p>
                        <p className="text-sm">{match.company.description}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground mb-1">
                          Carrera y Semestre
                        </p>
                        <p className="font-medium">
                          {match.student.career} - Semestre {match.student.semester}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-muted-foreground mb-2">
                          Habilidades
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {match.student.skills?.map((skill: string) => (
                            <Badge key={skill} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-muted-foreground mb-2">
                          Intereses
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {match.student.interests?.map((interest: string) => (
                            <Badge key={interest} variant="outline">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <p className="text-sm font-semibold text-muted-foreground mb-1">
                          Vacante
                        </p>
                        <p className="font-medium">{match.vacancy.title}</p>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      {userProfile?.userType === 'student' 
                        ? match.company.email
                        : match.student.email}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const email = userProfile?.userType === 'student' 
                          ? match.company.email
                          : match.student.email;
                        window.location.href = `mailto:${email}`;
                      }}
                    >
                      Contactar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
