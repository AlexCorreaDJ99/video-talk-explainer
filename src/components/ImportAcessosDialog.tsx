import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface ImportAcessosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImportAcessosDialog = ({ open, onOpenChange }: ImportAcessosDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validar tipo de arquivo
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/plain', // .txt
        'application/pdf' // .pdf
      ];
      
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(docx?|xlsx?|txt|pdf)$/i)) {
        toast.error("Tipo de arquivo não suportado. Use Word, Excel, TXT ou PDF.");
        return;
      }

      if (selectedFile.size > 20 * 1024 * 1024) { // 20MB
        toast.error("Arquivo muito grande. Tamanho máximo: 20MB");
        return;
      }

      setFile(selectedFile);
    }
  };

  const parseClientData = (content: string): Array<{ cliente_nome: string; login: string; senha: string; observacoes?: string }> => {
    const clients: Array<{ cliente_nome: string; login: string; senha: string; observacoes?: string }> = [];
    const lines = content.split('\n');
    
    let currentClient: any = {};
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Detectar padrões comuns
      // Formato: Cliente: Nome | Login: user | Senha: pass
      if (trimmedLine.toLowerCase().includes('cliente:') || trimmedLine.toLowerCase().includes('nome:')) {
        if (currentClient.cliente_nome && currentClient.login && currentClient.senha) {
          clients.push(currentClient);
        }
        const match = trimmedLine.match(/(?:cliente|nome):\s*([^|\n]+)/i);
        currentClient = { cliente_nome: match ? match[1].trim() : '' };
      } else if (trimmedLine.toLowerCase().includes('login:')) {
        const match = trimmedLine.match(/login:\s*([^|\n]+)/i);
        if (match) currentClient.login = match[1].trim();
      } else if (trimmedLine.toLowerCase().includes('senha:')) {
        const match = trimmedLine.match(/senha:\s*([^|\n]+)/i);
        if (match) currentClient.senha = match[1].trim();
      } else if (trimmedLine.toLowerCase().includes('observa')) {
        const match = trimmedLine.match(/observa[çc][õo]es?:\s*([^|\n]+)/i);
        if (match) currentClient.observacoes = match[1].trim();
      }
      
      // Formato tabular separado por tabs ou pipes
      const parts = trimmedLine.split(/[\t|]/).map(p => p.trim()).filter(p => p);
      if (parts.length >= 3 && !trimmedLine.toLowerCase().match(/cliente|login|senha/)) {
        clients.push({
          cliente_nome: parts[0],
          login: parts[1],
          senha: parts[2],
          observacoes: parts[3] || undefined
        });
      }
    }
    
    // Adicionar último cliente se existir
    if (currentClient.cliente_nome && currentClient.login && currentClient.senha) {
      clients.push(currentClient);
    }
    
    return clients.filter(c => c.cliente_nome && c.login && c.senha);
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Selecione um arquivo primeiro");
      return;
    }

    setIsProcessing(true);

    try {
      // Ler o arquivo como texto se for .txt
      let content = '';
      
      if (file.type === 'text/plain') {
        content = await file.text();
      } else {
        // Para outros tipos, vamos tentar ler como texto simples primeiro
        // Em produção, você pode usar bibliotecas como mammoth.js para .docx
        try {
          content = await file.text();
        } catch {
          toast.error("Não foi possível ler o arquivo. Use um arquivo de texto ou formato compatível.");
          setIsProcessing(false);
          return;
        }
      }

      // Parse dos dados
      const clients = parseClientData(content);

      if (clients.length === 0) {
        toast.error("Nenhum cliente encontrado no arquivo. Verifique o formato.");
        setIsProcessing(false);
        return;
      }

      // Inserir/atualizar no banco
      let successCount = 0;
      let errorCount = 0;
      let updatedCount = 0;

      for (const client of clients) {
        // Verificar se já existe acesso com mesmo cliente_nome E login
        const { data: existing } = await supabase
          .from("acessos_clientes")
          .select("id, senha")
          .eq("cliente_nome", client.cliente_nome)
          .eq("login", client.login)
          .maybeSingle();

        if (existing) {
          // Se existe e senha é diferente, atualizar
          if (existing.senha !== client.senha) {
            const { error } = await supabase
              .from("acessos_clientes")
              .update({
                senha: client.senha,
                observacoes: client.observacoes,
                updated_at: new Date().toISOString()
              })
              .eq("id", existing.id);

            if (error) {
              console.error("Erro ao atualizar:", error);
              errorCount++;
            } else {
              updatedCount++;
            }
          }
          // Se senha igual, não faz nada (evita duplicatas)
        } else {
          // Inserir novo
          const { error } = await supabase
            .from("acessos_clientes")
            .insert({
              cliente_nome: client.cliente_nome,
              login: client.login,
              senha: client.senha,
              observacoes: client.observacoes
            });

          if (error) {
            console.error("Erro ao inserir:", error);
            errorCount++;
          } else {
            successCount++;
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ["acessos-clientes"] });
      
      const messages = [];
      if (successCount > 0) messages.push(`${successCount} novo(s)`);
      if (updatedCount > 0) messages.push(`${updatedCount} atualizado(s)`);
      
      if (messages.length > 0) {
        toast.success(`Importação concluída: ${messages.join(', ')}`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} erro(s) ao importar`);
      }

      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onOpenChange(false);

    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      toast.error("Erro ao processar arquivo");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Acessos de Clientes</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo com os dados dos clientes. Formatos aceitos: Word, Excel, TXT, PDF.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept=".doc,.docx,.xls,.xlsx,.txt,.pdf"
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              {file ? (
                <>
                  <FileText className="h-12 w-12 text-primary" />
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Clique para selecionar um arquivo
                  </p>
                </>
              )}
            </label>
          </div>

          <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
            <p className="font-medium">Formato esperado:</p>
            <div className="space-y-1 text-muted-foreground">
              <p>• Cliente: Nome do Cliente</p>
              <p>• Login: usuario@email.com</p>
              <p>• Senha: senhaSegura123</p>
              <p>• Observações: Notas adicionais (opcional)</p>
            </div>
            <p className="text-xs mt-2">
              Ou formato tabular separado por tabs ou pipes (|)
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleImport}
              disabled={!file || isProcessing}
              className="flex-1"
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isProcessing ? "Processando..." : "Importar"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
                onOpenChange(false);
              }}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
