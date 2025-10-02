import { useRef } from "react";
import { Upload, FileVideo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface VideoUploadProps {
  onUpload: (file: File) => void;
  isAnalyzing: boolean;
}

const VideoUpload = ({ onUpload, isAnalyzing }: VideoUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      onUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
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
            Arraste e solte seu vídeo aqui
          </h3>
          <p className="text-muted-foreground">
            ou clique para selecionar um arquivo
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
          Escolher Vídeo
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,audio/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isAnalyzing}
        />
      </div>
    </Card>
  );
};

export default VideoUpload;
