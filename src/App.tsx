import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Ranking from "./pages/Ranking";
import Calendario from "./pages/Calendario";
import Bases from "./pages/Bases";
import Contacto from "./pages/Contacto";
import Descarga from "./pages/Descarga";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/Profile";
import VideosGallery from "./pages/VideosGallery";
import Videos2025 from "./pages/Videos2025";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

// Mobile App Pages
import AppChallenges from "./pages/app/AppChallenges";
import AppCalendar from "./pages/app/AppCalendar";
import AppGallery from "./pages/app/AppGallery";
import AppProfile from "./pages/app/AppProfile";
import AppAuth from "./pages/app/AppAuth";
import AppRanking from "./pages/app/AppRanking";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/calendario" element={<Calendario />} />
            <Route path="/bases" element={<Bases />} />
            <Route path="/contacto" element={<Contacto />} />
            <Route path="/descarga" element={<Descarga />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/videos" element={<VideosGallery />} />
            <Route path="/2025" element={<Videos2025 />} />
            <Route path="/admin" element={<Admin />} />
            
            {/* Mobile App Routes */}
            <Route path="/app" element={<AppChallenges />} />
            <Route path="/app/calendario" element={<AppCalendar />} />
            <Route path="/app/galeria" element={<AppGallery />} />
            <Route path="/app/perfil" element={<AppProfile />} />
            <Route path="/app/auth" element={<AppAuth />} />
            <Route path="/app/ranking" element={<AppRanking />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
