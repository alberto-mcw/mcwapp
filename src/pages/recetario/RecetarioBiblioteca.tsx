import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Plus, Star, Clock, ChefHat, Download, Search, Loader2, X, Trash2, Globe, Eye, EyeOff, ImagePlus, FolderPlus, Folder, ChevronDown, Pencil } from "lucide-react";
import { RecetarioAccountMenu } from "@/components/recetario/RecetarioAccountMenu";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { useCollections, Collection } from "@/hooks/useCollections";
const recetarioLogo = "/images/recetario-logo.png";

type SortBy = "date" | "favorites" | "type";

export default function RecetarioBiblioteca() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [search, setSearch] = useState("");
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [cookbookName, setCookbookName] = useState("");
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [coverPhotoDims, setCoverPhotoDims] = useState<{ w: number; h: number } | null>(null);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDesc, setNewCollectionDesc] = useState("");
  const [newCollectionPhoto, setNewCollectionPhoto] = useState<string | null>(null);
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPhoto, setEditPhoto] = useState<string | null>(null);
  const [assignMenuRecipeId, setAssignMenuRecipeId] = useState<string | null>(null);
  const [pdfCollectionId, setPdfCollectionId] = useState<string | null>(null);
  const [uploadingCollectionPhoto, setUploadingCollectionPhoto] = useState(false);
  const { collections, createCollection, updateCollection, deleteCollection, addRecipeToCollection, removeRecipeFromCollection } = useCollections();

  const leadId = sessionStorage.getItem("recetario_lead_id");
  const email = sessionStorage.getItem("recetario_email");

  useEffect(() => {
    loadRecipes();
  }, []);

  useEffect(() => {
    if (email) {
      setCookbookName(`El fogón de ${email.split("@")[0]}`);
    }
  }, [email]);

  const loadRecipes = async () => {
    setLoading(true);
    let query = supabase
      .from("recipes")
      .select("*")
      .eq("status", "completed");

    if (leadId) {
      query = query.eq("lead_id", leadId);
    } else if (user?.id) {
      query = query.eq("user_id", user.id);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Error al cargar recetas");
    } else {
      setRecipes(data || []);
    }
    setLoading(false);
  };

  const toggleFavorite = async (recipeId: string, current: boolean) => {
    await supabase.from("recipes").update({ is_favorite: !current }).eq("id", recipeId);
    setRecipes((prev) =>
      prev.map((r) => (r.id === recipeId ? { ...r, is_favorite: !current } : r))
    );
  };

  const deleteRecipe = async (recipeId: string) => {
    if (!confirm("¿Seguro que quieres eliminar esta receta? Esta acción no se puede deshacer.")) return;
    setDeletingId(recipeId);
    const { error } = await supabase.from("recipes").delete().eq("id", recipeId);
    if (error) {
      toast.error("Error al eliminar receta");
    } else {
      setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
      toast.success("Receta eliminada");
    }
    setDeletingId(null);
  };

  const toggleVisibility = async (recipeId: string, currentVisibility: string) => {
    const newVisibility = currentVisibility === "public" ? "private" : "public";
    const { error } = await supabase.from("recipes").update({ visibility: newVisibility }).eq("id", recipeId);
    if (error) {
      toast.error("Error al cambiar visibilidad");
    } else {
      setRecipes((prev) =>
        prev.map((r) => (r.id === recipeId ? { ...r, visibility: newVisibility } : r))
      );
      toast.success(newVisibility === "public" ? "Receta ahora es pública" : "Receta ahora es privada");
    }
  };

  const makeAllPublic = async () => {
    if (!confirm("¿Hacer públicas todas tus recetas? Serán visibles en la comunidad.")) return;
    const ids = recipes.map((r) => r.id);
    const { error } = await supabase.from("recipes").update({ visibility: "public" }).in("id", ids);
    if (error) {
      toast.error("Error al actualizar visibilidad");
    } else {
      setRecipes((prev) => prev.map((r) => ({ ...r, visibility: "public" })));
      toast.success("¡Todas tus recetas son públicas!");
    }
  };

  const uploadCollectionPhoto = async (file: File): Promise<string | null> => {
    setUploadingCollectionPhoto(true);
    const ext = file.name.split(".").pop();
    const path = `collections/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("recipe-images").upload(path, file);
    if (error) {
      toast.error("Error al subir foto");
      setUploadingCollectionPhoto(false);
      return null;
    }
    const { data: urlData } = supabase.storage.from("recipe-images").getPublicUrl(path);
    setUploadingCollectionPhoto(false);
    return urlData.publicUrl;
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;
    let photoUrl = newCollectionPhoto;
    await createCollection(newCollectionName.trim(), newCollectionDesc.trim() || undefined, photoUrl || undefined);
    setNewCollectionName("");
    setNewCollectionDesc("");
    setNewCollectionPhoto(null);
    setShowNewCollection(false);
  };

  const startEditCollection = (col: Collection) => {
    setEditingCollectionId(col.id);
    setEditName(col.name);
    setEditDesc(col.description || "");
    setEditPhoto(col.cover_photo_url || null);
  };

  const handleUpdateCollection = async () => {
    if (!editingCollectionId || !editName.trim()) return;
    await updateCollection(editingCollectionId, {
      name: editName.trim(),
      description: editDesc.trim() || null,
      cover_photo_url: editPhoto,
    });
    setEditingCollectionId(null);
  };

  const activeCollection = collections.find((c) => c.id === activeCollectionId);

  const filteredRecipes = recipes
    .filter((r) => {
      // Filter by active collection
      if (activeCollectionId && activeCollection) {
        if (!activeCollection.recipe_ids.includes(r.id)) return false;
      }
      if (!search) return true;
      const title = (r.structured_data?.titulo || r.title || "").toLowerCase();
      return title.includes(search.toLowerCase());
    })
    .sort((a, b) => {
      if (sortBy === "favorites") return (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0);
      if (sortBy === "type") return (a.recipe_type || "").localeCompare(b.recipe_type || "");
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const pdfRecipes = pdfCollectionId
    ? recipes.filter((r) => collections.find((c) => c.id === pdfCollectionId)?.recipe_ids.includes(r.id))
    : recipes;

  const loadImageAsBase64WithDims = (url: string): Promise<{ base64: string; w: number; h: number } | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0);
        resolve({ base64: canvas.toDataURL("image/jpeg", 0.8), w: img.naturalWidth, h: img.naturalHeight });
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  };

  const handleCoverPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        setCoverPhoto(reader.result as string);
        setCoverPhotoDims({ w: img.naturalWidth, h: img.naturalHeight });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const generateFullPdf = async () => {
    if (pdfRecipes.length === 0) {
      toast.error("No hay recetas para exportar");
      return;
    }
    setGeneratingPdf(true);
    try {
      // Pre-load all recipe images
      const imageMap = new Map<string, string>();
      const imageDimensions = new Map<string, { w: number; h: number }>();
      const imagePromises = pdfRecipes.map(async (recipe) => {
        const imgUrl = (recipe.structured_data as any)?.generated_image_url;
        if (imgUrl) {
          const result = await loadImageAsBase64WithDims(imgUrl);
          if (result) {
            imageMap.set(recipe.id, result.base64);
            imageDimensions.set(recipe.id, { w: result.w, h: result.h });
          }
        }
      });

      // Pre-load logo
      const logoResult = await loadImageAsBase64WithDims("/images/recetario-logo.png");

      await Promise.all(imagePromises);

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const w = doc.internal.pageSize.getWidth();
      const h = doc.internal.pageSize.getHeight();
      const margin = 18;
      const contentW = w - margin * 2;
      const name = cookbookName || "Mi Recetario Eterno";

      // Color palette (from CSS tokens)
      const colors = {
        bg: [255, 248, 240] as [number, number, number],
        fg: [61, 43, 31] as [number, number, number],
        primary: [199, 91, 42] as [number, number, number],
        muted: [139, 115, 85] as [number, number, number],
        mutedLight: [200, 190, 175] as [number, number, number],
        surface: [245, 230, 211] as [number, number, number],
        border: [232, 213, 196] as [number, number, number],
        card: [255, 255, 255] as [number, number, number],
        vichyLine: [245, 225, 210] as [number, number, number],
      };

      // Helper: draw vichy pattern background
      const drawVichyBg = () => {
        doc.setFillColor(...colors.bg);
        doc.rect(0, 0, w, h, "F");
        // Vichy pattern: subtle grid lines
        doc.setDrawColor(...colors.vichyLine);
        doc.setLineWidth(0.15);
        for (let x = 0; x < w; x += 8) {
          doc.line(x, 0, x, h);
        }
        for (let y = 0; y < h; y += 8) {
          doc.line(0, y, w, y);
        }
        // Overlay to soften pattern
        doc.setFillColor(255, 248, 240);
        doc.setGState(new (doc as any).GState({ opacity: 0.3 }));
        doc.rect(0, 0, w, h, "F");
        doc.setGState(new (doc as any).GState({ opacity: 1 }));
      };

      // Helper: draw rounded card
      const drawCard = (x: number, y: number, cw: number, ch: number, radius = 4) => {
        doc.setFillColor(...colors.card);
        doc.roundedRect(x, y, cw, ch, radius, radius, "F");
        doc.setDrawColor(...colors.border);
        doc.setLineWidth(0.3);
        doc.roundedRect(x, y, cw, ch, radius, radius, "S");
      };

      // Helper: draw page footer
      const drawPageFooter = (pageNum?: number) => {
        doc.setFontSize(7);
        doc.setTextColor(...colors.mutedLight);
        doc.text("El Recetario Eterno", w / 2, h - 8, { align: "center" });
        if (pageNum !== undefined) {
          doc.text(`${pageNum}`, w - margin, h - 8, { align: "right" });
        }
      };

      // Helper: decorative divider
      const drawDivider = (x: number, y: number, divW: number) => {
        doc.setDrawColor(...colors.primary);
        doc.setLineWidth(0.4);
        doc.line(x, y, x + divW, y);
        // Small diamond in center
        const cx = x + divW / 2;
        doc.setFillColor(...colors.primary);
        doc.circle(cx, y, 0.8, "F");
      };

      // Determine cover photo
      let finalCoverPhoto = coverPhoto;
      let finalCoverDims = coverPhotoDims;
      if (!finalCoverPhoto && pdfCollectionId) {
        const selectedCol = collections.find((c) => c.id === pdfCollectionId);
        if (selectedCol?.cover_photo_url) {
          const result = await loadImageAsBase64WithDims(selectedCol.cover_photo_url);
          if (result) {
            finalCoverPhoto = result.base64;
            finalCoverDims = { w: result.w, h: result.h };
          }
        }
      }

      // ═══════════════════════════════
      // ── COVER PAGE ──
      // ═══════════════════════════════
      drawVichyBg();

      // Outer decorative border
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.5);
      doc.roundedRect(8, 8, w - 16, h - 16, 6, 6, "S");
      doc.setDrawColor(...colors.primary);
      doc.setLineWidth(0.3);
      doc.roundedRect(10, 10, w - 20, h - 20, 5, 5, "S");

      // Central card for cover content
      const coverCardX = 25;
      const coverCardW = w - 50;
      const coverCardY = 30;
      const coverCardH = h - 60;
      drawCard(coverCardX, coverCardY, coverCardW, coverCardH, 6);

      let coverY = coverCardY + 15;

      // Logo at the top of cover card
      if (logoResult) {
        const logoH = 22;
        const logoW = logoH * (logoResult.w / logoResult.h);
        const logoX = w / 2 - logoW / 2;
        doc.addImage(logoResult.base64, "PNG", logoX, coverY, logoW, logoH);
        coverY += logoH + 8;
      }

      // Top divider
      drawDivider(w / 2 - 25, coverY, 50);
      coverY += 12;

      // Cover photo — elegant rounded frame
      if (finalCoverPhoto && finalCoverDims) {
        const maxPhotoW = coverCardW - 40;
        const maxPhotoH = 80;
        const ratio = finalCoverDims.w / finalCoverDims.h;
        let photoW = maxPhotoW;
        let photoH = photoW / ratio;
        if (photoH > maxPhotoH) {
          photoH = maxPhotoH;
          photoW = photoH * ratio;
        }
        const photoX = w / 2 - photoW / 2;

        // Shadow effect
        doc.setFillColor(220, 210, 200);
        doc.roundedRect(photoX + 1, coverY + 1, photoW, photoH, 4, 4, "F");

        // Photo with rounded border
        doc.addImage(finalCoverPhoto, "JPEG", photoX, coverY, photoW, photoH);
        doc.setDrawColor(...colors.primary);
        doc.setLineWidth(0.8);
        doc.roundedRect(photoX, coverY, photoW, photoH, 4, 4, "S");

        coverY += photoH + 12;
      }

      // Cookbook title
      doc.setFontSize(26);
      doc.setTextColor(...colors.fg);
      const titleLines = doc.splitTextToSize(name, coverCardW - 30);
      doc.text(titleLines, w / 2, coverY, { align: "center" });
      coverY += titleLines.length * 11 + 4;

      // Collection info
      const selectedCol = pdfCollectionId ? collections.find((c) => c.id === pdfCollectionId) : null;
      if (selectedCol) {
        doc.setFontSize(13);
        doc.setTextColor(...colors.primary);
        doc.text(selectedCol.name, w / 2, coverY, { align: "center" });
        coverY += 7;
        if (selectedCol.description) {
          doc.setFontSize(9);
          doc.setTextColor(...colors.muted);
          const descLines = doc.splitTextToSize(selectedCol.description, coverCardW - 40);
          doc.text(descLines, w / 2, coverY, { align: "center" });
          coverY += descLines.length * 4.5 + 4;
        }
      }

      // Bottom divider
      drawDivider(w / 2 - 20, coverY + 2, 40);
      coverY += 14;

      // Recipe count and edition
      doc.setFontSize(10);
      doc.setTextColor(...colors.muted);
      doc.text(`${pdfRecipes.length} recetas  ·  Edición 2026`, w / 2, coverY, { align: "center" });

      // Footer on cover
      doc.setFontSize(8);
      doc.setTextColor(...colors.mutedLight);
      doc.text("Digitalizado con amor · El Recetario Eterno", w / 2, coverCardY + coverCardH - 8, { align: "center" });

      // ═══════════════════════════════
      // ── INDEX PAGE ──
      // ═══════════════════════════════
      doc.addPage();
      drawVichyBg();

      // Index card
      const idxCardX = margin - 4;
      const idxCardW = contentW + 8;
      drawCard(idxCardX, 15, idxCardW, h - 30, 5);

      doc.setFontSize(18);
      doc.setTextColor(...colors.primary);
      doc.text("Índice", w / 2, 30, { align: "center" });

      drawDivider(w / 2 - 15, 34, 30);

      let indexY = 44;
      doc.setFontSize(10);
      pdfRecipes.forEach((recipe, i) => {
        const data = recipe.structured_data as any;
        const title = data?.titulo || recipe.title || "Sin título";
        if (indexY > h - 30) {
          doc.addPage();
          drawVichyBg();
          drawCard(idxCardX, 15, idxCardW, h - 30, 5);
          indexY = 30;
        }
        doc.setTextColor(...colors.primary);
        doc.setFontSize(9);
        doc.text(`${String(i + 1).padStart(2, "0")}`, margin + 4, indexY);
        doc.setTextColor(...colors.fg);
        const truncTitle = title.length > 50 ? title.substring(0, 50) + "…" : title;
        doc.text(truncTitle, margin + 16, indexY);

        // Dotted line
        doc.setDrawColor(...colors.border);
        doc.setLineWidth(0.15);
        const titleEndX = margin + 16 + doc.getTextWidth(truncTitle) + 3;
        const pageNumStr = `${i + 1}`;
        const pageNumEndX = w - margin - 4 - doc.getTextWidth(pageNumStr);
        if (pageNumEndX > titleEndX) {
          for (let dx = titleEndX; dx < pageNumEndX; dx += 1.5) {
            doc.circle(dx, indexY - 0.5, 0.15, "F");
          }
        }
        doc.setTextColor(...colors.muted);
        doc.text(pageNumStr, w - margin - 4, indexY, { align: "right" });
        indexY += 7;
      });

      drawPageFooter();

      // ═══════════════════════════════
      // ── RECIPE PAGES ──
      // ═══════════════════════════════
      for (let ri = 0; ri < pdfRecipes.length; ri++) {
        const recipe = pdfRecipes[ri];
        const data = recipe.structured_data as any;
        if (!data) continue;

        doc.addPage();
        drawVichyBg();

        let y = 15;
        const cardPad = 8;
        const cardX = margin - 4;
        const cardW = contentW + 8;

        // Recipe image — full width at top with rounded corners
        const imgBase64 = imageMap.get(recipe.id);
        if (imgBase64) {
          const imgEl = imageDimensions.get(recipe.id);
          const maxImgW = cardW;
          const maxImgH = 65;
          let imgW = maxImgW;
          let imgH = maxImgH;
          if (imgEl) {
            const ratio = imgEl.w / imgEl.h;
            imgW = maxImgW;
            imgH = maxImgW / ratio;
            if (imgH > maxImgH) { imgH = maxImgH; imgW = maxImgH * ratio; }
          }
          const imgX = cardX + (cardW - imgW) / 2;
          // Shadow
          doc.setFillColor(220, 210, 200);
          doc.roundedRect(imgX + 0.5, y + 0.5, imgW, imgH, 4, 4, "F");
          doc.addImage(imgBase64, "JPEG", imgX, y, imgW, imgH);
          doc.setDrawColor(...colors.border);
          doc.setLineWidth(0.3);
          doc.roundedRect(imgX, y, imgW, imgH, 4, 4, "S");
          y += imgH + 6;
        }

        // Content card
        const contentCardY = y;
        // We'll draw the card after calculating height — for now track content

        const contentStartY = y + cardPad;
        let cy = contentStartY;

        // Title
        doc.setFontSize(18);
        doc.setTextColor(...colors.fg);
        const recipeTitle = data.titulo || recipe.title || "Sin título";
        const rTitleLines = doc.splitTextToSize(recipeTitle, cardW - cardPad * 2);
        doc.text(rTitleLines, cardX + cardPad, cy + 6);
        cy += rTitleLines.length * 7 + 4;

        drawDivider(cardX + cardPad, cy, 30);
        cy += 6;

        // Meta badges
        doc.setFontSize(8);
        doc.setTextColor(...colors.muted);
        const metaParts = [
          data.tiempo_estimado && `⏱ ${data.tiempo_estimado}`,
          data.dificultad,
          `${recipe.servings || data.raciones || 4} pers.`,
          data.calorias_por_racion && `~${data.calorias_por_racion} kcal`,
        ].filter(Boolean);
        doc.text(metaParts.join("  ·  "), cardX + cardPad, cy);
        cy += 7;

        // Story
        if (data.historia_emocional) {
          doc.setFontSize(8);
          doc.setTextColor(...colors.muted);
          const storyLines = doc.splitTextToSize(`"${data.historia_emocional}"`, cardW - cardPad * 2);
          doc.text(storyLines, cardX + cardPad, cy);
          cy += storyLines.length * 3.8 + 5;
        }

        // Ingredients section header
        doc.setFontSize(12);
        doc.setTextColor(...colors.primary);
        doc.text("Ingredientes", cardX + cardPad, cy);
        cy += 5;

        doc.setFontSize(8.5);
        doc.setTextColor(...colors.fg);
        const ingredients = data.ingredientes || [];
        // Two-column layout for ingredients
        const colW = (cardW - cardPad * 2) / 2;
        const halfLen = Math.ceil(ingredients.length / 2);
        let maxIngY = cy;
        ingredients.forEach((ing: any, i: number) => {
          const col = i < halfLen ? 0 : 1;
          const row = i < halfLen ? i : i - halfLen;
          const ix = cardX + cardPad + col * colW;
          const iy = cy + row * 4.5;
          if (iy > h - 25) return; // safety
          doc.text(`•  ${ing.cantidad} ${ing.unidad} ${ing.nombre}`, ix, iy);
          if (iy + 4.5 > maxIngY) maxIngY = iy + 4.5;
        });
        cy = maxIngY + 5;

        // Check if we need a new page for steps
        if (cy > h - 50) {
          // Draw card background up to current content
          // First, re-draw card behind content
          const cardH = cy - contentCardY + cardPad;
          // insert card behind (using save/restore approach won't work in jsPDF, so we accept content on bg)
          doc.addPage();
          drawVichyBg();
          cy = 20;
        }

        // Steps
        doc.setFontSize(12);
        doc.setTextColor(...colors.primary);
        doc.text("Preparación", cardX + cardPad, cy);
        cy += 6;

        doc.setFontSize(8.5);
        (data.pasos || []).forEach((step: string, i: number) => {
          if (cy > h - 22) {
            doc.addPage();
            drawVichyBg();
            cy = 20;
          }
          // Step number badge
          doc.setFillColor(...colors.primary);
          doc.circle(cardX + cardPad + 3, cy - 1.2, 2.5, "F");
          doc.setFontSize(7);
          doc.setTextColor(255, 255, 255);
          doc.text(`${i + 1}`, cardX + cardPad + 3, cy, { align: "center" });

          doc.setFontSize(8.5);
          doc.setTextColor(...colors.fg);
          const stepLines = doc.splitTextToSize(step, cardW - cardPad * 2 - 12);
          doc.text(stepLines, cardX + cardPad + 9, cy);
          cy += stepLines.length * 4 + 3;
        });

        // Tip
        if (data.consejo_final) {
          cy += 3;
          if (cy > h - 25) { doc.addPage(); drawVichyBg(); cy = 20; }
          // Tip card
          const tipLines = doc.splitTextToSize(data.consejo_final, cardW - cardPad * 2 - 10);
          const tipH = tipLines.length * 4 + 8;
          doc.setFillColor(...colors.surface);
          doc.roundedRect(cardX + cardPad, cy, cardW - cardPad * 2, tipH, 3, 3, "F");
          doc.setFontSize(8);
          doc.setTextColor(...colors.primary);
          doc.text("💡 Consejo", cardX + cardPad + 4, cy + 5);
          doc.setTextColor(...colors.muted);
          doc.text(tipLines, cardX + cardPad + 4, cy + 10);
        }

        drawPageFooter(ri + 1);
      }

      doc.save(`${name.replace(/\s+/g, "_")}.pdf`);
      toast.success("¡Recetario descargado!");
      setShowPdfModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Error al generar el recetario");
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (!leadId && !email && !user) {
    return (
      <div className="min-h-screen recetario-vichy-bg flex flex-col items-center justify-center px-6">
        <img src={recetarioLogo} alt="Mi Recetario Eterno" className="h-20 mb-4" />
        <h1 className="font-display text-2xl font-bold text-recetario-fg mb-2">Mi recetario</h1>
        <p className="text-recetario-muted text-sm mb-6 text-center max-w-sm font-body">
          Para acceder a tu recetario, primero necesitas digitalizar una receta.
        </p>
        <Button onClick={() => navigate("/recetario")} className="bg-recetario-primary hover:bg-recetario-primary-hover text-white rounded-full px-6">
          Empezar
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen recetario-vichy-bg">
      {/* Header */}
      <header className="px-6 py-0 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center">
          <img src={recetarioLogo} alt="Mi Recetario Eterno" className="h-56 sm:h-64 -my-[50px]" />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <RecetarioAccountMenu />
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/recetario/explorar")}
            className="rounded-full border-recetario-primary text-recetario-primary hover:bg-recetario-primary/5 text-sm h-9"
          >
            <Globe className="w-4 h-4 mr-1" /> Explorar
          </Button>
          {recipes.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={makeAllPublic}
                className="rounded-full border-recetario-primary text-recetario-primary hover:bg-recetario-primary/5 text-sm h-9"
              >
                <Eye className="w-4 h-4 mr-1" /> Hacer todo público
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPdfModal(true)}
                className="rounded-full border-recetario-primary text-recetario-primary hover:bg-recetario-primary/5 text-sm h-9"
              >
                <Download className="w-4 h-4 mr-1" /> PDF
              </Button>
            </>
          )}
          <Button
            onClick={() => navigate("/recetario/subir")}
            className="bg-recetario-primary hover:bg-recetario-primary-hover text-white rounded-full text-sm px-4 h-9"
          >
            <Plus className="w-4 h-4 mr-1" /> Nueva
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 pb-20">
        {/* Search & filters */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-recetario-muted-light" />
            <Input
              placeholder="Buscar recetas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl border-recetario-border bg-recetario-card text-recetario-fg placeholder:text-recetario-muted-light/50 focus-visible:ring-recetario-primary"
            />
          </div>
          <div className="flex gap-1">
            {(["date", "favorites", "type"] as SortBy[]).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`px-3 py-2 rounded-full text-xs font-medium transition-all ${
                  sortBy === s
                    ? "bg-recetario-primary text-white"
                    : "bg-recetario-card text-recetario-muted border border-recetario-border hover:bg-recetario-bg"
                }`}
              >
                {s === "date" ? "Fecha" : s === "favorites" ? "Favoritas" : "Tipo"}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-recetario-card rounded-2xl p-4 border border-recetario-border text-center">
            <p className="text-2xl font-bold text-recetario-primary font-display">{recipes.length}</p>
            <p className="text-xs text-recetario-muted-light font-body">Recetas</p>
          </div>
          <div className="bg-recetario-card rounded-2xl p-4 border border-recetario-border text-center">
            <p className="text-2xl font-bold text-recetario-primary font-display">{recipes.filter((r) => r.is_favorite).length}</p>
            <p className="text-xs text-recetario-muted-light font-body">Favoritas</p>
          </div>
          <div className="bg-recetario-card rounded-2xl p-4 border border-recetario-border text-center">
            <p className="text-2xl font-bold text-recetario-primary font-display">{recipes.filter((r) => r.visibility === "public").length}</p>
            <p className="text-xs text-recetario-muted-light font-body">Públicas</p>
          </div>
        </div>

        {/* Collections */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm font-bold text-recetario-fg">Colecciones</h3>
            <button
              onClick={() => setShowNewCollection(true)}
              className="text-xs text-recetario-primary hover:text-recetario-primary-hover flex items-center gap-1 font-body"
            >
              <FolderPlus className="w-3.5 h-3.5" /> Nueva colección
            </button>
          </div>

          {/* Filter pills */}
          <div className="flex gap-2 flex-wrap mb-4">
            <button
              onClick={() => setActiveCollectionId(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                !activeCollectionId
                  ? "bg-recetario-primary text-white"
                  : "bg-recetario-card text-recetario-muted border border-recetario-border hover:bg-recetario-bg"
              }`}
            >
              Todas
            </button>
            {collections.map((col) => (
              <button
                key={col.id}
                onClick={() => setActiveCollectionId(activeCollectionId === col.id ? null : col.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                  activeCollectionId === col.id
                    ? "bg-recetario-primary text-white"
                    : "bg-recetario-card text-recetario-muted border border-recetario-border hover:bg-recetario-bg"
                }`}
              >
                <Folder className="w-3 h-3" /> {col.name} ({col.recipe_ids.length})
              </button>
            ))}
          </div>

          {/* Collection cards */}
          {collections.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
              {collections.map((col) => (
                <div
                  key={col.id}
                  className={`relative group/col bg-recetario-card rounded-xl border overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                    activeCollectionId === col.id ? "border-recetario-primary ring-1 ring-recetario-primary" : "border-recetario-border"
                  }`}
                  onClick={() => setActiveCollectionId(activeCollectionId === col.id ? null : col.id)}
                >
                  {col.cover_photo_url ? (
                    <img src={col.cover_photo_url} alt={col.name} className="w-full h-20 object-cover" />
                  ) : (
                    <div className="w-full h-20 bg-recetario-bg flex items-center justify-center">
                      <Folder className="w-8 h-8 text-recetario-muted-light/30" />
                    </div>
                  )}
                  <div className="p-2.5">
                    <p className="font-display text-xs font-bold text-recetario-fg truncate">{col.name}</p>
                    {col.description && (
                      <p className="text-[10px] text-recetario-muted-light line-clamp-2 mt-0.5 font-body">{col.description}</p>
                    )}
                    <p className="text-[10px] text-recetario-muted mt-1 font-body">{col.recipe_ids.length} recetas</p>
                  </div>
                  {/* Edit & delete buttons */}
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover/col:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); startEditCollection(col); }}
                      className="bg-recetario-card/90 backdrop-blur-sm text-recetario-muted-light hover:text-recetario-primary rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteCollection(col.id); }}
                      className="bg-recetario-card/90 backdrop-blur-sm text-recetario-muted-light hover:text-red-500 rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* New collection form */}
          {showNewCollection && (
            <div className="bg-recetario-card rounded-xl border border-recetario-border p-4 mb-4">
              <p className="font-display text-sm font-bold text-recetario-fg mb-3">Nueva colección</p>
              <Input
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="Nombre (ej: Recetas de la abuela María)"
                className="h-9 rounded-xl border-recetario-border bg-recetario-bg text-recetario-fg placeholder:text-recetario-muted-light/50 focus-visible:ring-recetario-primary text-sm mb-2"
                autoFocus
              />
              <Input
                value={newCollectionDesc}
                onChange={(e) => setNewCollectionDesc(e.target.value)}
                placeholder="Descripción (opcional)"
                className="h-9 rounded-xl border-recetario-border bg-recetario-bg text-recetario-fg placeholder:text-recetario-muted-light/50 focus-visible:ring-recetario-primary text-sm mb-2"
              />
              <div className="flex items-center gap-3 mb-3">
                {newCollectionPhoto ? (
                  <div className="relative">
                    <img src={newCollectionPhoto} alt="Portada" className="w-16 h-16 rounded-lg object-cover" />
                    <button onClick={() => setNewCollectionPhoto(null)} className="absolute -top-1 -right-1 bg-recetario-fg text-recetario-bg rounded-full w-4 h-4 flex items-center justify-center text-[10px]">✕</button>
                  </div>
                ) : (
                  <label className="flex items-center gap-1.5 text-xs text-recetario-primary cursor-pointer hover:text-recetario-primary-hover font-body">
                    <ImagePlus className="w-4 h-4" />
                    {uploadingCollectionPhoto ? "Subiendo..." : "Añadir foto de portada"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const url = await uploadCollectionPhoto(file);
                        if (url) setNewCollectionPhoto(url);
                      }}
                    />
                  </label>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreateCollection} disabled={!newCollectionName.trim()} className="bg-recetario-primary hover:bg-recetario-primary-hover text-white rounded-full text-xs h-9 px-4">
                  Crear
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setShowNewCollection(false); setNewCollectionName(""); setNewCollectionDesc(""); setNewCollectionPhoto(null); }} className="rounded-full text-xs h-9 border-recetario-border text-recetario-muted">
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Edit collection modal */}
          {editingCollectionId && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setEditingCollectionId(null)}>
              <div className="bg-recetario-card rounded-2xl border border-recetario-border p-5 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <p className="font-display text-base font-bold text-recetario-fg">Editar colección</p>
                  <button onClick={() => setEditingCollectionId(null)} className="text-recetario-muted-light hover:text-recetario-fg"><X className="w-4 h-4" /></button>
                </div>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nombre"
                  className="h-9 rounded-xl border-recetario-border bg-recetario-bg text-recetario-fg placeholder:text-recetario-muted-light/50 focus-visible:ring-recetario-primary text-sm mb-2"
                  autoFocus
                />
                <Input
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Descripción (opcional)"
                  className="h-9 rounded-xl border-recetario-border bg-recetario-bg text-recetario-fg placeholder:text-recetario-muted-light/50 focus-visible:ring-recetario-primary text-sm mb-3"
                />
                <div className="flex items-center gap-3 mb-4">
                  {editPhoto ? (
                    <div className="relative">
                      <img src={editPhoto} alt="Portada" className="w-20 h-20 rounded-lg object-cover" />
                      <button onClick={() => setEditPhoto(null)} className="absolute -top-1 -right-1 bg-recetario-fg text-recetario-bg rounded-full w-4 h-4 flex items-center justify-center text-[10px]">✕</button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-1.5 text-xs text-recetario-primary cursor-pointer hover:text-recetario-primary-hover font-body">
                      <ImagePlus className="w-4 h-4" />
                      {uploadingCollectionPhoto ? "Subiendo..." : "Añadir foto de portada"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const url = await uploadCollectionPhoto(file);
                          if (url) setEditPhoto(url);
                        }}
                      />
                    </label>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleUpdateCollection} disabled={!editName.trim()} className="bg-recetario-primary hover:bg-recetario-primary-hover text-white rounded-full text-xs h-9 px-4">
                    Guardar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingCollectionId(null)} className="rounded-full text-xs h-9 border-recetario-border text-recetario-muted">
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recipe grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-recetario-primary" />
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-10 h-10 text-recetario-primary/30 mx-auto mb-3" />
            <p className="text-recetario-muted-light text-sm font-body">
              {search ? "No se encontraron recetas" : "Aún no tienes recetas. ¡Sube tu primera receta!"}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecipes.map((recipe) => {
              const data = recipe.structured_data as any;
              return (
                <div
                  key={recipe.id}
                  className="bg-recetario-card rounded-2xl border border-recetario-border overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => navigate(`/recetario/receta/${recipe.id}`)}
                >
                  {/* Card image */}
                  {data?.generated_image_url && (
                    <img src={data.generated_image_url} alt={data?.titulo} className="w-full h-32 object-cover" />
                  )}
                  {/* Card header */}
                  <div className={`${data?.generated_image_url ? '' : 'bg-recetario-fg'} p-5 relative`}>
                    {!data?.generated_image_url && (
                      <p className="text-[10px] text-recetario-muted-light uppercase tracking-wider mb-1 font-display">El Recetario Eterno</p>
                    )}
                    <h3 className={`font-display text-lg font-bold leading-tight ${data?.generated_image_url ? 'text-recetario-fg' : 'text-recetario-bg'}`}>
                      {data?.titulo || recipe.title}
                    </h3>
                  </div>

                  {/* Card body */}
                  <div className="p-4">
                    <div className="flex flex-wrap gap-2 mb-3 text-xs text-recetario-muted font-body">
                      {data?.tiempo_estimado && (
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{data.tiempo_estimado}</span>
                      )}
                      <span className="flex items-center gap-1"><ChefHat className="w-3 h-3" />{recipe.recipe_type}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-xs bg-recetario-bg text-recetario-primary px-2 py-1 rounded-full font-medium">{recipe.servings} pers.</span>
                        {recipe.healthy_version_active && (
                          <span className="text-xs bg-recetario-healthy-bg text-recetario-healthy px-2 py-1 rounded-full font-medium">Saludable</span>
                        )}
                        {recipe.visibility === "public" && (
                          <span className="text-xs bg-recetario-surface text-recetario-muted px-2 py-1 rounded-full font-medium">Pública</span>
                        )}
                      </div>
                      {/* Add to collection */}
                      {collections.length > 0 && (
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAssignMenuRecipeId(assignMenuRecipeId === recipe.id ? null : recipe.id);
                            }}
                            className="text-recetario-muted-light hover:text-recetario-primary transition-colors"
                            title="Añadir a colección"
                          >
                            <FolderPlus className="w-4 h-4" />
                          </button>
                          {assignMenuRecipeId === recipe.id && (
                            <div
                              className="absolute bottom-full right-0 mb-1 bg-recetario-card border border-recetario-border rounded-xl shadow-lg p-2 z-10 min-w-[160px]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {collections.map((col) => {
                                const isIn = col.recipe_ids.includes(recipe.id);
                                return (
                                  <button
                                    key={col.id}
                                    onClick={() => {
                                      if (isIn) {
                                        removeRecipeFromCollection(col.id, recipe.id);
                                      } else {
                                        addRecipeToCollection(col.id, recipe.id);
                                      }
                                      setAssignMenuRecipeId(null);
                                    }}
                                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-body transition-colors flex items-center gap-2 ${
                                      isIn ? "text-recetario-primary bg-recetario-primary/5" : "text-recetario-fg hover:bg-recetario-bg"
                                    }`}
                                  >
                                    <Folder className="w-3 h-3" />
                                    {col.name}
                                    {isIn && <span className="ml-auto text-[10px]">✓</span>}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                      {/* Action buttons */}
                      <div className="flex gap-1.5 ml-auto">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleVisibility(recipe.id, recipe.visibility);
                          }}
                          title={recipe.visibility === "public" ? "Hacer privada" : "Hacer pública"}
                        >
                          {recipe.visibility === "public" ? (
                            <Eye className="w-4 h-4 text-recetario-primary" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-recetario-muted-light hover:text-recetario-primary transition-colors" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(recipe.id, recipe.is_favorite);
                          }}
                        >
                          <Star
                            className={`w-4 h-4 transition-all ${
                              recipe.is_favorite ? "fill-recetario-primary text-recetario-primary" : "text-recetario-muted-light hover:text-recetario-primary"
                            }`}
                          />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRecipe(recipe.id);
                          }}
                          disabled={deletingId === recipe.id}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {deletingId === recipe.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-recetario-muted-light" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-recetario-muted-light hover:text-red-500 transition-colors" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PDF Modal */}
      {showPdfModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-recetario-card rounded-2xl border border-recetario-border p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold text-recetario-fg">Descargar recetario</h2>
              <button onClick={() => setShowPdfModal(false)} className="text-recetario-muted-light hover:text-recetario-fg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-recetario-muted mb-4 font-body">
              Se generará un PDF con {pdfRecipes.length} recetas. Dale un nombre a tu recetario:
            </p>

            {/* Collection selector */}
            {collections.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-recetario-muted font-body mb-2">📁 Descargar por colección (opcional)</p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setPdfCollectionId(null)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      !pdfCollectionId
                        ? "bg-recetario-primary text-white"
                        : "bg-recetario-card text-recetario-muted border border-recetario-border"
                    }`}
                  >
                    Todas ({recipes.length})
                  </button>
                  {collections.map((col) => (
                    <button
                      key={col.id}
                      onClick={() => setPdfCollectionId(pdfCollectionId === col.id ? null : col.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                        pdfCollectionId === col.id
                          ? "bg-recetario-primary text-white"
                          : "bg-recetario-card text-recetario-muted border border-recetario-border"
                      }`}
                    >
                      <Folder className="w-3 h-3" /> {col.name} ({col.recipe_ids.length})
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Input
              value={cookbookName}
              onChange={(e) => setCookbookName(e.target.value)}
              placeholder="El fogón de Ángela"
              className="mb-4 h-12 rounded-xl border-recetario-border bg-recetario-bg text-recetario-fg placeholder:text-recetario-muted-light/50 focus-visible:ring-recetario-primary font-display text-lg"
            />

            {/* Cover photo upload */}
            <div className="mb-4">
              <p className="text-xs text-recetario-muted font-body mb-2">📸 Foto para la portada (opcional)</p>
              <label className="flex items-center gap-3 cursor-pointer">
                {coverPhoto ? (
                  <div className="relative">
                    <img src={coverPhoto} alt="Portada" className="w-16 h-16 rounded-full object-cover border-2 border-recetario-primary" />
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setCoverPhoto(null); setCoverPhotoDims(null); }}
                      className="absolute -top-1 -right-1 bg-recetario-fg text-recetario-bg rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-recetario-border flex items-center justify-center bg-recetario-bg">
                    <ImagePlus className="w-5 h-5 text-recetario-muted-light" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm text-recetario-fg font-body">
                    {coverPhoto ? "Foto seleccionada" : "Sube una foto de la abuela"}
                  </p>
                  <p className="text-[11px] text-recetario-muted-light font-body">Aparecerá en la portada del recetario</p>
                </div>
                <input type="file" accept="image/*" onChange={handleCoverPhotoChange} className="hidden" />
              </label>
            </div>

            <div className="bg-recetario-surface rounded-xl p-4 mb-5 border border-recetario-border">
              <p className="text-xs text-recetario-muted font-body mb-2">Tu recetario incluirá:</p>
              <ul className="text-xs text-recetario-fg font-body space-y-1">
                <li>📖 Portada personalizada{coverPhoto ? " con foto" : ""}</li>
                <li>📋 Índice con todas las recetas</li>
                <li>🍳 {pdfRecipes.length} recetas completas con ingredientes y pasos</li>
                <li>💡 Consejos y curiosidades</li>
              </ul>
            </div>

            <Button
              onClick={generateFullPdf}
              disabled={generatingPdf || !cookbookName.trim()}
              className="w-full bg-recetario-primary hover:bg-recetario-primary-hover text-white rounded-full h-12 font-display text-base"
            >
              {generatingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Generando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" /> Descargar recetario
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
