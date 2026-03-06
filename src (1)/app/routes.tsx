import { createBrowserRouter } from "react-router";
import { LoadingPage } from "./pages/LoadingPage";
import { AuthPage } from "./pages/AuthPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { StudentProfileSetup } from "./pages/StudentProfileSetup";
import { CompanyProfileSetup } from "./pages/CompanyProfileSetup";
import { SwipePage } from "./pages/SwipePage";
import { MatchesPage } from "./pages/MatchesPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LoadingPage />,
  },
  {
    path: "/auth",
    element: <AuthPage />,
  },
  {
    path: "/verify-email",
    element: <VerifyEmailPage />,
  },
  {
    path: "/setup/student",
    element: (
      <ProtectedRoute>
        <StudentProfileSetup />
      </ProtectedRoute>
    ),
  },
  {
    path: "/setup/company",
    element: (
      <ProtectedRoute>
        <CompanyProfileSetup />
      </ProtectedRoute>
    ),
  },
  {
    path: "/swipe",
    element: (
      <ProtectedRoute>
        <SwipePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/matches",
    element: (
      <ProtectedRoute>
        <MatchesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
]);
