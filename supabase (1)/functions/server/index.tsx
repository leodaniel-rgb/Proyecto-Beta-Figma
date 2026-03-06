import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

// Health check endpoint
app.get("/make-server-0d7935a3/health", (c) => {
  return c.json({ status: "ok" });
});

// ==================== AUTHENTICATION ====================

// Signup for students
app.post("/make-server-0d7935a3/signup/student", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    // Validate @tecmilenio.mx domain
    if (!email.endsWith('@tecmilenio.mx')) {
      return c.json({ error: 'El correo debe ser del dominio @tecmilenio.mx' }, 400);
    }
    
    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store temporary user data with verification code
    await kv.set(`temp_user:${email}`, {
      email,
      password,
      name,
      userType: 'student',
      verificationCode,
      createdAt: new Date().toISOString(),
    });
    
    // Send verification email
    try {
      await sendVerificationEmail(email, verificationCode, name);
    } catch (emailError) {
      console.log(`Email sending error for ${email}: ${emailError}`);
      return c.json({ error: 'Error al enviar el correo de verificación. Por favor, verifica las credenciales SMTP.' }, 500);
    }
    
    return c.json({ 
      success: true, 
      message: 'Código de verificación enviado a tu correo' 
    });
  } catch (error) {
    console.log(`Student signup error: ${error}`);
    return c.json({ error: 'Error al registrar estudiante' }, 500);
  }
});

// Signup for companies
app.post("/make-server-0d7935a3/signup/company", async (c) => {
  try {
    const { email, password, companyName } = await c.req.json();
    
    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store temporary user data with verification code
    await kv.set(`temp_user:${email}`, {
      email,
      password,
      companyName,
      userType: 'company',
      verificationCode,
      createdAt: new Date().toISOString(),
    });
    
    // Send verification email
    try {
      await sendVerificationEmail(email, verificationCode, companyName);
    } catch (emailError) {
      console.log(`Email sending error for ${email}: ${emailError}`);
      return c.json({ error: 'Error al enviar el correo de verificación. Por favor, verifica las credenciales SMTP.' }, 500);
    }
    
    return c.json({ 
      success: true, 
      message: 'Código de verificación enviado a tu correo' 
    });
  } catch (error) {
    console.log(`Company signup error: ${error}`);
    return c.json({ error: 'Error al registrar empresa' }, 500);
  }
});

// Verify email code and create user
app.post("/make-server-0d7935a3/verify-email", async (c) => {
  try {
    const { email, code } = await c.req.json();
    
    // Get temporary user data
    const tempUserData = await kv.get(`temp_user:${email}`);
    
    if (!tempUserData) {
      return c.json({ error: 'Código de verificación expirado o inválido' }, 400);
    }
    
    if (tempUserData.verificationCode !== code) {
      return c.json({ error: 'Código de verificación incorrecto' }, 400);
    }
    
    // Create user in Supabase Auth
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase.auth.admin.createUser({
      email: tempUserData.email,
      password: tempUserData.password,
      user_metadata: { 
        name: tempUserData.name || tempUserData.companyName,
        userType: tempUserData.userType 
      },
      // Automatically confirm the user's email since we verified it with a code
      email_confirm: true
    });
    
    if (error) {
      console.log(`Supabase auth error during verification: ${error.message}`);
      return c.json({ error: 'Error al crear usuario' }, 500);
    }
    
    // Create user profile in KV store
    const userId = data.user.id;
    const profileData = {
      id: userId,
      email: tempUserData.email,
      userType: tempUserData.userType,
      name: tempUserData.name || tempUserData.companyName,
      profileComplete: false,
      createdAt: new Date().toISOString(),
    };
    
    if (tempUserData.userType === 'student') {
      profileData.career = '';
      profileData.semester = '';
      profileData.skills = [];
      profileData.interests = [];
      profileData.cvUrl = '';
    } else {
      profileData.companyName = tempUserData.companyName;
      profileData.category = '';
      profileData.description = '';
    }
    
    await kv.set(`user:${userId}`, profileData);
    
    // Delete temporary user data
    await kv.del(`temp_user:${email}`);
    
    return c.json({ 
      success: true,
      userId,
      userType: tempUserData.userType,
      message: 'Usuario verificado y creado exitosamente' 
    });
  } catch (error) {
    console.log(`Email verification error: ${error}`);
    return c.json({ error: 'Error al verificar correo' }, 500);
  }
});

// ==================== USER PROFILE ====================

// Get user profile
app.get("/make-server-0d7935a3/profile/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    // Verify user is authenticated
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'No autorizado' }, 401);
    }
    
    const profile = await kv.get(`user:${userId}`);
    
    if (!profile) {
      return c.json({ error: 'Perfil no encontrado' }, 404);
    }
    
    return c.json(profile);
  } catch (error) {
    console.log(`Get profile error: ${error}`);
    return c.json({ error: 'Error al obtener perfil' }, 500);
  }
});

// Update student profile
app.put("/make-server-0d7935a3/profile/student/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    // Verify user is authenticated
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || user.id !== userId || error) {
      return c.json({ error: 'No autorizado' }, 401);
    }
    
    const updates = await c.req.json();
    const currentProfile = await kv.get(`user:${userId}`);
    
    if (!currentProfile) {
      return c.json({ error: 'Perfil no encontrado' }, 404);
    }
    
    const updatedProfile = {
      ...currentProfile,
      ...updates,
      profileComplete: true,
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`user:${userId}`, updatedProfile);
    
    return c.json({ success: true, profile: updatedProfile });
  } catch (error) {
    console.log(`Update student profile error: ${error}`);
    return c.json({ error: 'Error al actualizar perfil' }, 500);
  }
});

// Update company profile
app.put("/make-server-0d7935a3/profile/company/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    // Verify user is authenticated
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || user.id !== userId || error) {
      return c.json({ error: 'No autorizado' }, 401);
    }
    
    const updates = await c.req.json();
    const currentProfile = await kv.get(`user:${userId}`);
    
    if (!currentProfile) {
      return c.json({ error: 'Perfil no encontrado' }, 404);
    }
    
    const updatedProfile = {
      ...currentProfile,
      ...updates,
      profileComplete: true,
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`user:${userId}`, updatedProfile);
    
    return c.json({ success: true, profile: updatedProfile });
  } catch (error) {
    console.log(`Update company profile error: ${error}`);
    return c.json({ error: 'Error al actualizar perfil' }, 500);
  }
});

// Upload CV (store as base64 in KV)
app.post("/make-server-0d7935a3/upload-cv/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    // Verify user is authenticated
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || user.id !== userId || error) {
      return c.json({ error: 'No autorizado' }, 401);
    }
    
    const { cvData, fileName } = await c.req.json();
    
    // Store CV in KV
    await kv.set(`cv:${userId}`, {
      data: cvData,
      fileName,
      uploadedAt: new Date().toISOString(),
    });
    
    return c.json({ success: true, message: 'CV subido exitosamente' });
  } catch (error) {
    console.log(`Upload CV error: ${error}`);
    return c.json({ error: 'Error al subir CV' }, 500);
  }
});

// Get CV
app.get("/make-server-0d7935a3/cv/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    // Verify user is authenticated
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'No autorizado' }, 401);
    }
    
    const cv = await kv.get(`cv:${userId}`);
    
    if (!cv) {
      return c.json({ error: 'CV no encontrado' }, 404);
    }
    
    return c.json(cv);
  } catch (error) {
    console.log(`Get CV error: ${error}`);
    return c.json({ error: 'Error al obtener CV' }, 500);
  }
});

// ==================== VACANCIES ====================

// Create vacancy
app.post("/make-server-0d7935a3/vacancy", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    // Verify user is authenticated
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'No autorizado' }, 401);
    }
    
    const vacancyData = await c.req.json();
    const vacancyId = crypto.randomUUID();
    
    const vacancy = {
      id: vacancyId,
      companyId: user.id,
      ...vacancyData,
      createdAt: new Date().toISOString(),
      active: true,
    };
    
    await kv.set(`vacancy:${vacancyId}`, vacancy);
    
    // Add vacancy to company's list
    const companyVacancies = await kv.get(`company_vacancies:${user.id}`) || [];
    companyVacancies.push(vacancyId);
    await kv.set(`company_vacancies:${user.id}`, companyVacancies);
    
    return c.json({ success: true, vacancy });
  } catch (error) {
    console.log(`Create vacancy error: ${error}`);
    return c.json({ error: 'Error al crear vacante' }, 500);
  }
});

// Get vacancies for company
app.get("/make-server-0d7935a3/vacancies/company/:companyId", async (c) => {
  try {
    const companyId = c.req.param('companyId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    // Verify user is authenticated
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'No autorizado' }, 401);
    }
    
    const vacancyIds = await kv.get(`company_vacancies:${companyId}`) || [];
    const vacancies = await kv.mget(vacancyIds.map(id => `vacancy:${id}`));
    
    return c.json(vacancies.filter(v => v !== null));
  } catch (error) {
    console.log(`Get company vacancies error: ${error}`);
    return c.json({ error: 'Error al obtener vacantes' }, 500);
  }
});

// ==================== MATCHING ====================

// Get potential matches for student
app.get("/make-server-0d7935a3/matches/student/:studentId", async (c) => {
  try {
    const studentId = c.req.param('studentId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    // Verify user is authenticated
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || user.id !== studentId || error) {
      return c.json({ error: 'No autorizado' }, 401);
    }
    
    const studentProfile = await kv.get(`user:${studentId}`);
    
    if (!studentProfile || !studentProfile.profileComplete) {
      return c.json({ error: 'Perfil incompleto' }, 400);
    }
    
    // Get all vacancies that match student's career
    const allVacancyKeys = await kv.getByPrefix('vacancy:');
    const matchingVacancies = [];
    
    for (const key of allVacancyKeys) {
      const vacancy = await kv.get(key);
      if (vacancy && vacancy.active && vacancy.career === studentProfile.career) {
        // Check if already swiped
        const swipeKey = `swipe:student:${studentId}:vacancy:${vacancy.id}`;
        const existingSwipe = await kv.get(swipeKey);
        
        if (!existingSwipe) {
          // Get company info
          const companyProfile = await kv.get(`user:${vacancy.companyId}`);
          matchingVacancies.push({
            vacancy,
            company: companyProfile,
          });
        }
      }
    }
    
    return c.json(matchingVacancies);
  } catch (error) {
    console.log(`Get student matches error: ${error}`);
    return c.json({ error: 'Error al obtener matches' }, 500);
  }
});

// Get potential matches for company
app.get("/make-server-0d7935a3/matches/company/:companyId/vacancy/:vacancyId", async (c) => {
  try {
    const companyId = c.req.param('companyId');
    const vacancyId = c.req.param('vacancyId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    // Verify user is authenticated
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || user.id !== companyId || error) {
      return c.json({ error: 'No autorizado' }, 401);
    }
    
    const vacancy = await kv.get(`vacancy:${vacancyId}`);
    
    if (!vacancy || vacancy.companyId !== companyId) {
      return c.json({ error: 'Vacante no encontrada' }, 404);
    }
    
    // Get all students with matching career
    const allUserKeys = await kv.getByPrefix('user:');
    const matchingStudents = [];
    
    for (const key of allUserKeys) {
      const student = await kv.get(key);
      if (student && student.userType === 'student' && 
          student.profileComplete && student.career === vacancy.career) {
        // Check if already swiped
        const swipeKey = `swipe:company:${companyId}:student:${student.id}:vacancy:${vacancyId}`;
        const existingSwipe = await kv.get(swipeKey);
        
        if (!existingSwipe) {
          matchingStudents.push(student);
        }
      }
    }
    
    return c.json(matchingStudents);
  } catch (error) {
    console.log(`Get company matches error: ${error}`);
    return c.json({ error: 'Error al obtener matches' }, 500);
  }
});

// Student swipes on vacancy
app.post("/make-server-0d7935a3/swipe/student", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    // Verify user is authenticated
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'No autorizado' }, 401);
    }
    
    const { studentId, vacancyId, liked } = await c.req.json();
    
    if (user.id !== studentId) {
      return c.json({ error: 'No autorizado' }, 401);
    }
    
    const swipeKey = `swipe:student:${studentId}:vacancy:${vacancyId}`;
    await kv.set(swipeKey, {
      studentId,
      vacancyId,
      liked,
      timestamp: new Date().toISOString(),
    });
    
    // If liked, check for mutual match
    let isMatch = false;
    if (liked) {
      const vacancy = await kv.get(`vacancy:${vacancyId}`);
      const companySwipeKey = `swipe:company:${vacancy.companyId}:student:${studentId}:vacancy:${vacancyId}`;
      const companySwipe = await kv.get(companySwipeKey);
      
      if (companySwipe && companySwipe.liked) {
        // It's a match!
        isMatch = true;
        const matchId = crypto.randomUUID();
        await kv.set(`match:${matchId}`, {
          id: matchId,
          studentId,
          companyId: vacancy.companyId,
          vacancyId,
          createdAt: new Date().toISOString(),
        });
        
        // Add to both users' match lists
        const studentMatches = await kv.get(`matches:student:${studentId}`) || [];
        studentMatches.push(matchId);
        await kv.set(`matches:student:${studentId}`, studentMatches);
        
        const companyMatches = await kv.get(`matches:company:${vacancy.companyId}`) || [];
        companyMatches.push(matchId);
        await kv.set(`matches:company:${vacancy.companyId}`, companyMatches);
      }
    }
    
    return c.json({ success: true, isMatch });
  } catch (error) {
    console.log(`Student swipe error: ${error}`);
    return c.json({ error: 'Error al procesar swipe' }, 500);
  }
});

// Company swipes on student
app.post("/make-server-0d7935a3/swipe/company", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    // Verify user is authenticated
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'No autorizado' }, 401);
    }
    
    const { companyId, studentId, vacancyId, liked } = await c.req.json();
    
    if (user.id !== companyId) {
      return c.json({ error: 'No autorizado' }, 401);
    }
    
    const swipeKey = `swipe:company:${companyId}:student:${studentId}:vacancy:${vacancyId}`;
    await kv.set(swipeKey, {
      companyId,
      studentId,
      vacancyId,
      liked,
      timestamp: new Date().toISOString(),
    });
    
    // If liked, check for mutual match
    let isMatch = false;
    if (liked) {
      const studentSwipeKey = `swipe:student:${studentId}:vacancy:${vacancyId}`;
      const studentSwipe = await kv.get(studentSwipeKey);
      
      if (studentSwipe && studentSwipe.liked) {
        // It's a match!
        isMatch = true;
        const matchId = crypto.randomUUID();
        await kv.set(`match:${matchId}`, {
          id: matchId,
          studentId,
          companyId,
          vacancyId,
          createdAt: new Date().toISOString(),
        });
        
        // Add to both users' match lists
        const studentMatches = await kv.get(`matches:student:${studentId}`) || [];
        studentMatches.push(matchId);
        await kv.set(`matches:student:${studentId}`, studentMatches);
        
        const companyMatches = await kv.get(`matches:company:${companyId}`) || [];
        companyMatches.push(matchId);
        await kv.set(`matches:company:${companyId}`, companyMatches);
      }
    }
    
    return c.json({ success: true, isMatch });
  } catch (error) {
    console.log(`Company swipe error: ${error}`);
    return c.json({ error: 'Error al procesar swipe' }, 500);
  }
});

// Get matches for user
app.get("/make-server-0d7935a3/matches/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    // Verify user is authenticated
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || user.id !== userId || error) {
      return c.json({ error: 'No autorizado' }, 401);
    }
    
    const userProfile = await kv.get(`user:${userId}`);
    const matchesKey = `matches:${userProfile.userType}:${userId}`;
    const matchIds = await kv.get(matchesKey) || [];
    
    const matches = [];
    for (const matchId of matchIds) {
      const match = await kv.get(`match:${matchId}`);
      if (match) {
        const vacancy = await kv.get(`vacancy:${match.vacancyId}`);
        const studentProfile = await kv.get(`user:${match.studentId}`);
        const companyProfile = await kv.get(`user:${match.companyId}`);
        
        matches.push({
          ...match,
          vacancy,
          student: studentProfile,
          company: companyProfile,
        });
      }
    }
    
    return c.json(matches);
  } catch (error) {
    console.log(`Get matches error: ${error}`);
    return c.json({ error: 'Error al obtener matches' }, 500);
  }
});

// ==================== EMAIL HELPER ====================

async function sendVerificationEmail(to: string, code: string, name: string) {
  // TurboSMTP Configuration
  const smtpHost = Deno.env.get('SMTP_HOST') || 'pro.turbo-smtp.com';
  const smtpPort = Deno.env.get('SMTP_PORT') || '587';
  const smtpUser = Deno.env.get('SMTP_USER') || 'a9f3e79914d4f180c497'; // Consumer Key
  const smtpPass = Deno.env.get('SMTP_PASS') || 'RzcKgIWoMh3JdZb6XAT0'; // Consumer Secret
  
  console.log(`Attempting to send email to ${to}`);
  console.log(`SMTP Config - Host: ${smtpHost}, Port: ${smtpPort}, User: ${smtpUser ? 'configured' : 'missing'}, Pass: ${smtpPass ? 'configured' : 'missing'}`);
  
  if (!smtpUser || !smtpPass) {
    const errorMsg = `TurboSMTP credentials not configured properly. User: ${smtpUser ? 'OK' : 'MISSING'}, Pass: ${smtpPass ? 'OK' : 'MISSING'}`;
    console.log(errorMsg);
    throw new Error(errorMsg);
  }
  
  try {
    // Using nodemailer through npm import
    const nodemailer = await import("npm:nodemailer@6");
    
    const port = parseInt(smtpPort);
    const transportConfig = {
      host: smtpHost,
      port: port,
      secure: port === 465 || port === 25025, // SSL for ports 465 and 25025
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      logger: true,
      debug: true,
    };
    
    console.log('Creating TurboSMTP transporter with config:', {
      host: transportConfig.host,
      port: transportConfig.port,
      secure: transportConfig.secure,
      auth: { user: transportConfig.auth.user, pass: '***' }
    });
    
    const transporter = nodemailer.default.createTransport(transportConfig);
    
    // Verify connection
    try {
      await transporter.verify();
      console.log('TurboSMTP connection verified successfully');
    } catch (verifyError) {
      console.log(`TurboSMTP verification warning: ${verifyError.message}`);
      // Continue anyway as some SMTP servers don't support verify
    }
    
    const mailOptions = {
      from: `"PlusZone" <atencion@pluszonetecmi.plus>`,
      to,
      subject: "Código de Verificación - PlusZone",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #8b5cf6;">¡Bienvenido a PlusZone!</h1>
          <p>Hola ${name},</p>
          <p>Tu código de verificación es:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #8b5cf6; margin: 20px 0;">
            ${code}
          </div>
          <p>Este código expirará pronto. Por favor, ingrésalo en la aplicación para completar tu registro.</p>
          <p>Si no solicitaste este código, puedes ignorar este correo.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">PlusZone - Conectando estudiantes de TecMilenio con empresas</p>
        </div>
      `,
    };
    
    console.log('Sending email via TurboSMTP with options:', { from: mailOptions.from, to: mailOptions.to, subject: mailOptions.subject });
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully via TurboSMTP. MessageId: ${info.messageId}, Response: ${info.response}`);
    
  } catch (emailError) {
    console.log(`Detailed TurboSMTP email error: ${emailError}`);
    console.log(`Error message: ${emailError.message}`);
    console.log(`Error stack: ${emailError.stack}`);
    throw emailError;
  }
}

Deno.serve(app.fetch);