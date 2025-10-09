// Abstração de armazenamento - Supabase ou Local
import { supabase } from "@/integrations/supabase/client";

export type StorageMode = "remote" | "local";

const STORAGE_KEY = "video-talk-data";
const MODE_KEY = "storage-mode";

interface LocalData {
  conversations: any[];
  analyses: any[];
  evidences: any[];
}

// Obter modo de armazenamento
export const getStorageMode = (): StorageMode => {
  const mode = localStorage.getItem(MODE_KEY);
  return (mode as StorageMode) || "remote";
};

// Definir modo de armazenamento
export const setStorageMode = (mode: StorageMode) => {
  localStorage.setItem(MODE_KEY, mode);
};

// Obter dados locais
const getLocalData = (): LocalData => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    return { conversations: [], analyses: [], evidences: [] };
  }
  return JSON.parse(data);
};

// Salvar dados locais
const saveLocalData = (data: LocalData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// Gerar ID único
const generateId = () => {
  return crypto.randomUUID();
};

// Conversas
export const conversationsService = {
  async getAll() {
    if (getStorageMode() === "local") {
      const data = getLocalData();
      return { data: data.conversations, error: null };
    }
    return await supabase
      .from("conversations")
      .select("*, analyses(id, resolucao_status, analise_data)")
      .order("updated_at", { ascending: false });
  },

  async create(conversation: { cliente: string; atendente: string }) {
    if (getStorageMode() === "local") {
      const data = getLocalData();
      const newConv = {
        id: generateId(),
        ...conversation,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        analyses: [],
      };
      data.conversations.unshift(newConv);
      saveLocalData(data);
      return { data: newConv, error: null };
    }
    return await supabase.from("conversations").insert([conversation]).select().single();
  },

  async delete(id: string) {
    if (getStorageMode() === "local") {
      const data = getLocalData();
      data.conversations = data.conversations.filter((c) => c.id !== id);
      data.analyses = data.analyses.filter((a) => a.conversation_id !== id);
      data.evidences = data.evidences.filter((e) => {
        const analysis = data.analyses.find((a) => a.id === e.analysis_id);
        return analysis && analysis.conversation_id !== id;
      });
      saveLocalData(data);
      return { error: null };
    }
    return await supabase.from("conversations").delete().eq("id", id);
  },
};

// Análises
export const analysesService = {
  async getByConversation(conversationId: string) {
    if (getStorageMode() === "local") {
      const data = getLocalData();
      const analyses = data.analyses.filter((a) => a.conversation_id === conversationId);
      return { data: analyses, error: null };
    }
    return await supabase
      .from("analyses")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false });
  },

  async create(analysis: any) {
    if (getStorageMode() === "local") {
      const data = getLocalData();
      const newAnalysis = {
        id: generateId(),
        ...analysis,
        created_at: new Date().toISOString(),
      };
      data.analyses.push(newAnalysis);
      saveLocalData(data);
      return { data: newAnalysis, error: null };
    }
    return await supabase.from("analyses").insert([analysis]).select().single();
  },

  async update(id: string, updates: any) {
    if (getStorageMode() === "local") {
      const data = getLocalData();
      const index = data.analyses.findIndex((a) => a.id === id);
      if (index !== -1) {
        data.analyses[index] = { ...data.analyses[index], ...updates };
        saveLocalData(data);
        return { data: data.analyses[index], error: null };
      }
      return { data: null, error: { message: "Análise não encontrada" } };
    }
    return await supabase.from("analyses").update(updates).eq("id", id).select().single();
  },

  async delete(id: string) {
    if (getStorageMode() === "local") {
      const data = getLocalData();
      data.analyses = data.analyses.filter((a) => a.id !== id);
      data.evidences = data.evidences.filter((e) => e.analysis_id !== id);
      saveLocalData(data);
      return { error: null };
    }
    return await supabase.from("analyses").delete().eq("id", id);
  },

  async getAll() {
    if (getStorageMode() === "local") {
      const data = getLocalData();
      return { data: data.analyses, error: null };
    }
    return await supabase
      .from("analyses")
      .select("*, conversations(cliente, atendente)")
      .order("created_at", { ascending: false });
  },
};

// Evidências
export const evidencesService = {
  async getByAnalysis(analysisId: string) {
    if (getStorageMode() === "local") {
      const data = getLocalData();
      const evidences = data.evidences.filter((e) => e.analysis_id === analysisId);
      return { data: evidences, error: null };
    }
    return await supabase.from("evidences").select("*").eq("analysis_id", analysisId);
  },

  async create(evidence: any) {
    if (getStorageMode() === "local") {
      const data = getLocalData();
      const newEvidence = {
        id: generateId(),
        ...evidence,
        created_at: new Date().toISOString(),
      };
      data.evidences.push(newEvidence);
      saveLocalData(data);
      return { data: newEvidence, error: null };
    }
    return await supabase.from("evidences").insert([evidence]).select().single();
  },

  async delete(id: string) {
    if (getStorageMode() === "local") {
      const data = getLocalData();
      data.evidences = data.evidences.filter((e) => e.id !== id);
      saveLocalData(data);
      return { error: null };
    }
    return await supabase.from("evidences").delete().eq("id", id);
  },
};

// Exportar/Importar dados locais
export const dataBackup = {
  export: () => {
    const data = getLocalData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  import: (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          saveLocalData(data);
          resolve(true);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  },

  clear: () => {
    localStorage.removeItem(STORAGE_KEY);
  },
};
