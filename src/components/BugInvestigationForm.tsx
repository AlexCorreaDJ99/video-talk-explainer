import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Upload, Image as ImageIcon, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BugInvestigationFormProps {
  analysisId: string;
  onDataCollected: (data: any) => void;
}

export const BugInvestigationForm = ({ analysisId, onDataCollected }: BugInvestigationFormProps) => {
  const { toast } = useToast();
  const [reclamacaoCliente, setReclamacaoCliente] = useState("");
  const [dadosMotorista, setDadosMotorista] = useState({
    nome: "",
    id: "",
    telefone: "",
  });
  const [dadosPassageiro, setDadosPassageiro] = useState({
    nome: "",
    id: "",
    telefone: "",
  });
  const [dadosCorrida, setDadosCorrida] = useState({
    id_corrida: "",
    data_hora: "",
    origem: "",
    destino: "",
    valor: "",
    status: "",
  });
  const [evidencias, setEvidencias] = useState<File[]>([]);
  const [analisandoImagens, setAnalisandoImagens] = useState(false);
  const [analiseIA, setAnaliseIA] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setEvidencias([...evidencias, ...files]);
      toast({
        title: "Arquivos adicionados!",
        description: `${files.length} arquivo(s) pronto(s) para análise.`,
      });
    }
  };

  const handleAnalyzeImages = async () => {
    if (evidencias.length === 0) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Adicione imagens ou documentos primeiro.",
      });
      return;
    }

    setAnalisandoImagens(true);
    try {
      const formData = new FormData();
      evidencias.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });
      formData.append('analysis_id', analysisId);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-evidence`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) throw new Error('Erro ao analisar evidências');

      const data = await response.json();
      setAnaliseIA(data.analise);

      // Preencher campos automaticamente com dados estruturados da IA
      if (data.dados_estruturados) {
        const { motorista, passageiro, valores, reclamacao, horario, localizacao, erro_tecnico, observacoes } = data.dados_estruturados;
        
        // Reclamação do cliente
        if (reclamacao) setReclamacaoCliente(reclamacao);
        
        // Motorista
        if (motorista) {
          setDadosMotorista({
            nome: motorista.nome || '',
            id: motorista.identificador || '',
            telefone: '' // não disponível nas evidências
          });
        }
        
        // Passageiro
        if (passageiro) {
          setDadosPassageiro({
            nome: passageiro.nome || '',
            id: passageiro.identificador || '',
            telefone: ''
          });
        }
        
        // Corrida
        const origem = typeof localizacao === 'object' && localizacao?.origem ? localizacao.origem : (typeof localizacao === 'string' ? localizacao : '');
        const destino = typeof localizacao === 'object' && localizacao?.destino ? localizacao.destino : '';
        const statusFromObs = Array.isArray(observacoes)
          ? observacoes.filter(Boolean).join(' | ')
          : (observacoes || '');
        const statusFinal = [erro_tecnico, statusFromObs].filter(Boolean).join(' | ');
        
        setDadosCorrida({
          id_corrida: valores?.id_corrida || '',
          data_hora: horario || '',
          origem,
          destino,
          valor: valores?.valor_cobrado || valores?.valor_corrida || '',
          status: statusFinal,
        });
      }

      toast({
        title: "✅ Análise concluída!",
        description: "A IA analisou as evidências e preencheu os campos automaticamente.",
      });
    } catch (error) {
      console.error('Erro ao analisar:', error);
      toast({
        variant: "destructive",
        title: "Erro na análise",
        description: "Não foi possível analisar as evidências.",
      });
    } finally {
      setAnalisandoImagens(false);
    }
  };

  const handleSaveData = () => {
    const dadosCompletos = {
      reclamacao_cliente: reclamacaoCliente,
      dados_motorista: dadosMotorista,
      dados_passageiro: dadosPassageiro,
      dados_corrida: dadosCorrida,
      evidencias: evidencias.map(f => f.name),
      analise_ia: analiseIA,
    };

    onDataCollected(dadosCompletos);

    toast({
      title: "✅ Dados salvos!",
      description: "Informações da investigação registradas.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Investigação de Bug - Coleta de Dados
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          ⚠️ <strong>IMPORTANTE:</strong> Sempre peça ao cliente para enviar:
          prints/vídeos, dados da corrida, motorista e passageiro!
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Reclamação do Cliente */}
        <div className="space-y-2">
          <Label htmlFor="reclamacao">Reclamação do Cliente</Label>
          <Textarea
            id="reclamacao"
            placeholder="Descreva o problema reportado pelo cliente..."
            value={reclamacaoCliente}
            onChange={(e) => setReclamacaoCliente(e.target.value)}
            rows={3}
          />
        </div>

        {/* Upload de Evidências */}
        <div className="space-y-2">
          <Label>Evidências (Prints/Vídeos/Documentos)</Label>
          <div className="flex items-center gap-2">
            <Input
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleAnalyzeImages}
              disabled={evidencias.length === 0 || analisandoImagens}
              variant="secondary"
            >
              {analisandoImagens ? (
                "Analisando..."
              ) : (
                <>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Analisar com IA
                </>
              )}
            </Button>
          </div>
          {evidencias.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {evidencias.length} arquivo(s) carregado(s)
            </p>
          )}
        </div>

        {/* Análise da IA */}
        {analiseIA && (
          <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
            <div className="flex items-start gap-2">
              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <p className="font-medium text-sm">Análise da IA:</p>
                <p className="text-sm">{analiseIA}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Dados do Motorista */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Dados do Motorista</Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="motorista_nome" className="text-sm">Nome</Label>
              <Input
                id="motorista_nome"
                value={dadosMotorista.nome}
                onChange={(e) => setDadosMotorista({...dadosMotorista, nome: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="motorista_id" className="text-sm">ID</Label>
              <Input
                id="motorista_id"
                value={dadosMotorista.id}
                onChange={(e) => setDadosMotorista({...dadosMotorista, id: e.target.value})}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="motorista_tel" className="text-sm">Telefone</Label>
              <Input
                id="motorista_tel"
                value={dadosMotorista.telefone}
                onChange={(e) => setDadosMotorista({...dadosMotorista, telefone: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Dados do Passageiro */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Dados do Passageiro</Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="passageiro_nome" className="text-sm">Nome</Label>
              <Input
                id="passageiro_nome"
                value={dadosPassageiro.nome}
                onChange={(e) => setDadosPassageiro({...dadosPassageiro, nome: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="passageiro_id" className="text-sm">ID</Label>
              <Input
                id="passageiro_id"
                value={dadosPassageiro.id}
                onChange={(e) => setDadosPassageiro({...dadosPassageiro, id: e.target.value})}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="passageiro_tel" className="text-sm">Telefone</Label>
              <Input
                id="passageiro_tel"
                value={dadosPassageiro.telefone}
                onChange={(e) => setDadosPassageiro({...dadosPassageiro, telefone: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Dados da Corrida */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Dados da Corrida</Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="corrida_id" className="text-sm">ID da Corrida</Label>
              <Input
                id="corrida_id"
                value={dadosCorrida.id_corrida}
                onChange={(e) => setDadosCorrida({...dadosCorrida, id_corrida: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="corrida_data" className="text-sm">Data/Hora</Label>
              <Input
                id="corrida_data"
                type="datetime-local"
                value={dadosCorrida.data_hora}
                onChange={(e) => setDadosCorrida({...dadosCorrida, data_hora: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="corrida_origem" className="text-sm">Origem</Label>
              <Input
                id="corrida_origem"
                value={dadosCorrida.origem}
                onChange={(e) => setDadosCorrida({...dadosCorrida, origem: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="corrida_destino" className="text-sm">Destino</Label>
              <Input
                id="corrida_destino"
                value={dadosCorrida.destino}
                onChange={(e) => setDadosCorrida({...dadosCorrida, destino: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="corrida_valor" className="text-sm">Valor</Label>
              <Input
                id="corrida_valor"
                value={dadosCorrida.valor}
                onChange={(e) => setDadosCorrida({...dadosCorrida, valor: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="corrida_status" className="text-sm">Status</Label>
              <Input
                id="corrida_status"
                value={dadosCorrida.status}
                onChange={(e) => setDadosCorrida({...dadosCorrida, status: e.target.value})}
              />
            </div>
          </div>
        </div>

        <Button onClick={handleSaveData} className="w-full">
          Salvar Dados da Investigação
        </Button>
      </CardContent>
    </Card>
  );
};