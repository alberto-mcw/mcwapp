import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Ranking from "./pages/Ranking";
import Calendario from "./pages/Calendario";
import Bases from "./pages/Bases";
import Contacto from "./pages/Contacto";
import Descarga from "./pages/Descarga";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
