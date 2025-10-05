import { useRef, useState } from "react";
import { Upload, FileVideo, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface VideoUploadProps {
  onUpload: (files: File[], pastedText?: string) => void;
  isAnalyzing: boolean;
}

const VideoUpload = ({ onUpload, isAnalyzing }: VideoUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pastedText, setPastedText] = useState<string>("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0 || pastedText.trim()) {
      onUpload(files, pastedText.trim() || undefined);
      setPastedText("");
    }
  };

  const handleSubmit = () => {
    const files = fileInputRef.current?.files ? Array.from(fileInputRef.current.files) : [];
    if (files.length > 0 || pastedText.trim()) {
      onUpload(files, pastedText.trim() || undefined);
      setPastedText("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('video/') || 
              file.type.startsWith('audio/') || 
              file.type.startsWith('image/')
    );
    if (files.length > 0 || pastedText.trim()) {
      onUpload(files, pastedText.trim() || undefined);
      setPastedText("");
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-6">
      <Card
        className="relative border-2 border-dashed border-primary/30 hover:border-primary/60 transition-all duration-300 cursor-pointer group overflow-hidden"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => !isAnalyzing && fileInputRef.current?.click()}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 group-hover:from-primary/10 group-hover:to-accent/10 transition-all duration-500" />
        
        <div className="relative p-12 text-center space-y-6">
          <div className="inline-flex items-center justify-center p-6 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
            <FileVideo className="w-12 h-12 text-primary group-hover:scale-110 transition-transform duration-300" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-semibold">
              Arraste e solte seus arquivos aqui
            </h3>
            <p className="text-muted-foreground">
              Vídeos, áudios e imagens - ou clique para selecionar
            </p>
          </div>

          <Button
            size="lg"
            disabled={isAnalyzing}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-glow"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            <Upload className="w-5 h-5 mr-2" />
            Escolher Arquivos
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,audio/*,image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isAnalyzing}
            multiple
          />
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <FileText className="w-5 h-5" />
          <Label className="text-lg font-semibold">Ou cole texto copiado (conversas, mensagens, etc.)</Label>
        </div>
        <Textarea
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          placeholder="Cole aqui conversas do WhatsApp, emails, mensagens ou qualquer texto relacionado ao problema..."
          className="min-h-[150px] resize-y"
          disabled={isAnalyzing}
        />
        <Button
          onClick={handleSubmit}
          disabled={isAnalyzing || (!pastedText.trim() && !fileInputRef.current?.files?.length)}
          className="w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          Enviar para Análise
        </Button>
      </Card>
    </div>
  );
};

export default VideoUpload;
