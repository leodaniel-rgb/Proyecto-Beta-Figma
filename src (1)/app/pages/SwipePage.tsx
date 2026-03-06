import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { Heart, X, Briefcase, User, MessageSquare, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { projectId } from '/utils/supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-0d7935a3`;

export function SwipePage() {
  const navigate = useNavigate();
  const { user, getAccessToken } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVacancy, setSelectedVacancy] = useState<any>(null);
  const [vacancies, setVacancies] = useState<any[]>([]);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (userProfile) {
      if (userProfile.userType === 'student') {
        loadStudentMatches();
      } else {
        loadCompanyVacancies();
      }
    }
  }, [userProfile]);

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

        if (!profile.profileComplete) {
          if (profile.userType === 'student') {
            navigate('/setup/student');
          } else {
            navigate('/setup/company');
          }
        }
      }
    } catch (error) {
      console.error('Load profile error:', error);
      toast.error('Error al cargar perfil');
    }
  };

  const loadStudentMatches = async () => {
    setIsLoading(true);
    try {
      const token = await getAccessToken();
      const response = await fetch(`${API_URL}/matches/student/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const matches = await response.json();
        setCards(matches);
      }
    } catch (error) {
      console.error('Load student matches error:', error);
      toast.error('Error al cargar vacantes');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCompanyVacancies = async () => {
    try {
      const token = await getAccessToken();
      const response = await fetch(`${API_URL}/vacancies/company/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const companyVacancies = await response.json();
        setVacancies(companyVacancies);
        
        if (companyVacancies.length > 0) {
          setSelectedVacancy(companyVacancies[0]);
          loadCompanyMatches(companyVacancies[0].id);
        } else {
          setIsLoading(false);
          toast.info('No tienes vacantes activas');
        }
      }
    } catch (error) {
      console.error('Load company vacancies error:', error);
      setIsLoading(false);
    }
  };

  const loadCompanyMatches = async (vacancyId: string) => {
    setIsLoading(true);
    try {
      const token = await getAccessToken();
      const response = await fetch(
        `${API_URL}/matches/company/${user.id}/vacancy/${vacancyId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const matches = await response.json();
        setCards(matches);
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('Load company matches error:', error);
      toast.error('Error al cargar candidatos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwipe = async (liked: boolean) => {
    if (currentIndex >= cards.length) return;

    try {
      const token = await getAccessToken();
      
      if (userProfile.userType === 'student') {
        const card = cards[currentIndex];
        const response = await fetch(`${API_URL}/swipe/student`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            studentId: user.id,
            vacancyId: card.vacancy.id,
            liked,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.isMatch) {
            toast.success('¡Match! 🎉', {
              description: 'Pueden contactarse mutuamente',
            });
          }
        }
      } else {
        const card = cards[currentIndex];
        const response = await fetch(`${API_URL}/swipe/company`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            companyId: user.id,
            studentId: card.id,
            vacancyId: selectedVacancy.id,
            liked,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.isMatch) {
            toast.success('¡Match! 🎉', {
              description: 'Pueden contactarse mutuamente',
            });
          }
        }
      }

      setCurrentIndex(currentIndex + 1);
    } catch (error) {
      console.error('Swipe error:', error);
      toast.error('Error al procesar swipe');
    }
  };

  const handleDragEnd = (_: any, info: any) => {
    if (Math.abs(info.offset.x) > 100) {
      handleSwipe(info.offset.x > 0);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-600 to-indigo-600">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const hasMoreCards = currentIndex < cards.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
          PlusZone
        </h1>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/matches')}
          >
            <MessageSquare className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/profile')}
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Company Vacancy Selector */}
      {userProfile?.userType === 'company' && vacancies.length > 1 && (
        <div className="bg-white border-b px-4 py-3 flex items-center gap-2 overflow-x-auto">
          {vacancies.map((vacancy) => (
            <Badge
              key={vacancy.id}
              variant={selectedVacancy?.id === vacancy.id ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => {
                setSelectedVacancy(vacancy);
                loadCompanyMatches(vacancy.id);
              }}
            >
              {vacancy.title}
            </Badge>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="container max-w-md mx-auto px-4 py-8 h-[calc(100vh-120px)] flex flex-col">
        <div className="flex-1 relative flex items-center justify-center">
          {!hasMoreCards ? (
            <Card className="p-8 text-center bg-white/95 backdrop-blur-sm">
              <div className="text-6xl mb-4">😴</div>
              <h2 className="text-2xl font-bold mb-2">No hay más {userProfile?.userType === 'student' ? 'vacantes' : 'candidatos'}</h2>
              <p className="text-muted-foreground mb-4">
                Vuelve más tarde para ver nuevas oportunidades
              </p>
              <Button onClick={() => navigate('/matches')}>
                Ver mis Matches
              </Button>
            </Card>
          ) : (
            <motion.div
              className="absolute w-full max-w-sm"
              style={{ x, rotate, opacity }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={handleDragEnd}
              animate={{ scale: 1 }}
              initial={{ scale: 0.9 }}
            >
              <Card className="overflow-hidden bg-white shadow-xl">
                {userProfile?.userType === 'student' ? (
                  // Student view - showing vacancy
                  <>
                    <div className="h-64 bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center">
                      <Briefcase className="w-24 h-24 text-white" />
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <h2 className="text-2xl font-bold mb-1">
                          {currentCard.vacancy.title}
                        </h2>
                        <p className="text-lg text-muted-foreground">
                          {currentCard.company.name}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{currentCard.vacancy.career}</Badge>
                        <Badge variant="outline">{currentCard.company.category}</Badge>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2">Oferta Salarial</h3>
                        <p className="text-lg text-violet-600 font-bold">
                          {currentCard.vacancy.salary}
                        </p>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2">Descripción</h3>
                        <p className="text-sm text-muted-foreground">
                          {currentCard.vacancy.description}
                        </p>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2">Sobre la Empresa</h3>
                        <p className="text-sm text-muted-foreground">
                          {currentCard.company.description}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  // Company view - showing student
                  <>
                    <div className="h-64 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                      <User className="w-24 h-24 text-white" />
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <h2 className="text-2xl font-bold mb-1">
                          {currentCard.name}
                        </h2>
                        <p className="text-lg text-muted-foreground">
                          {currentCard.career} - Semestre {currentCard.semester}
                        </p>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2">Habilidades</h3>
                        <div className="flex flex-wrap gap-2">
                          {currentCard.skills?.map((skill: string) => (
                            <Badge key={skill} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2">Intereses</h3>
                        <div className="flex flex-wrap gap-2">
                          {currentCard.interests?.map((interest: string) => (
                            <Badge key={interest} variant="outline">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </Card>
            </motion.div>
          )}
        </div>

        {/* Action Buttons */}
        {hasMoreCards && (
          <div className="flex justify-center items-center gap-6 mt-8">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSwipe(false)}
              className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-red-50 transition-colors"
            >
              <X className="w-8 h-8 text-red-500" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSwipe(true)}
              className="w-20 h-20 rounded-full bg-white shadow-xl flex items-center justify-center hover:bg-green-50 transition-colors"
            >
              <Heart className="w-10 h-10 text-green-500 fill-green-500" />
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
