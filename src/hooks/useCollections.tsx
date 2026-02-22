import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  cover_photo_url: string | null;
  lead_id: string | null;
  user_id: string | null;
  created_at: string;
  recipe_ids: string[];
}

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const leadId = sessionStorage.getItem("recetario_lead_id");

  const loadCollections = useCallback(async () => {
    setLoading(true);
    const { data: cols, error } = await supabase
      .from("recipe_collections")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    if (!cols || cols.length === 0) {
      setCollections([]);
      setLoading(false);
      return;
    }

    // Load items for all collections
    const { data: items } = await supabase
      .from("recipe_collection_items")
      .select("collection_id, recipe_id")
      .in("collection_id", cols.map((c) => c.id));

    const itemsMap = new Map<string, string[]>();
    (items || []).forEach((item) => {
      const list = itemsMap.get(item.collection_id) || [];
      list.push(item.recipe_id);
      itemsMap.set(item.collection_id, list);
    });

    setCollections(
      cols.map((c) => ({
        ...c,
        recipe_ids: itemsMap.get(c.id) || [],
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  const createCollection = async (name: string, description?: string, coverPhotoUrl?: string) => {
    const { data, error } = await supabase
      .from("recipe_collections")
      .insert({ name, description: description || null, cover_photo_url: coverPhotoUrl || null, lead_id: leadId })
      .select()
      .single();

    if (error) {
      toast.error("Error al crear colección");
      return null;
    }
    const newCol: Collection = { ...data, recipe_ids: [] };
    setCollections((prev) => [newCol, ...prev]);
    toast.success("Colección creada");
    return newCol;
  };

  const updateCollection = async (id: string, updates: { name?: string; description?: string | null; cover_photo_url?: string | null }) => {
    const { error } = await supabase
      .from("recipe_collections")
      .update(updates)
      .eq("id", id);

    if (error) {
      toast.error("Error al actualizar colección");
      return;
    }
    setCollections((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    toast.success("Colección actualizada");
  };

  const deleteCollection = async (id: string) => {
    const { error } = await supabase.from("recipe_collections").delete().eq("id", id);
    if (error) {
      toast.error("Error al eliminar colección");
    } else {
      setCollections((prev) => prev.filter((c) => c.id !== id));
      toast.success("Colección eliminada");
    }
  };

  const addRecipeToCollection = async (collectionId: string, recipeId: string) => {
    const { error } = await supabase
      .from("recipe_collection_items")
      .insert({ collection_id: collectionId, recipe_id: recipeId });

    if (error) {
      if (error.code === "23505") {
        toast.info("La receta ya está en esta colección");
      } else {
        toast.error("Error al añadir receta");
      }
      return;
    }

    setCollections((prev) =>
      prev.map((c) =>
        c.id === collectionId ? { ...c, recipe_ids: [...c.recipe_ids, recipeId] } : c
      )
    );
    toast.success("Receta añadida a la colección");
  };

  const removeRecipeFromCollection = async (collectionId: string, recipeId: string) => {
    const { error } = await supabase
      .from("recipe_collection_items")
      .delete()
      .eq("collection_id", collectionId)
      .eq("recipe_id", recipeId);

    if (error) {
      toast.error("Error al quitar receta");
      return;
    }

    setCollections((prev) =>
      prev.map((c) =>
        c.id === collectionId
          ? { ...c, recipe_ids: c.recipe_ids.filter((id) => id !== recipeId) }
          : c
      )
    );
  };

  return {
    collections,
    loading,
    createCollection,
    updateCollection,
    deleteCollection,
    addRecipeToCollection,
    removeRecipeFromCollection,
    reload: loadCollections,
  };
}
