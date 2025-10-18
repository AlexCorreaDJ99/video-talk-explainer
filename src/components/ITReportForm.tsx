import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Copy, Download, FileText } from "lucide-react";
import { VideoAnalysis } from "@/pages/Index";

const reportSchema = z.object({
  atendente: z.string().min(1, "Nome do atendente é obrigatório"),
  cliente: z.string().min(1, "Nome do cliente é obrigatório"),
  versaoApp: z.string().optional(),
  versaoAndroid: z.boolean(),
  versaoIOS: z.boolean(),
  appMotorista: z.boolean(),
  appPassageiro: z.boolean(),
  dataReclamacao: z.string().min(1, "Data é obrigatória"),
  horarioRelato: z.string().optional(),
  comprometeFunc: z.boolean(),
  resumo: z.string().min(10, "Resumo deve ter no mínimo 10 caracteres"),
  descricao: z.string().min(10, "Descrição deve ter no mínimo 10 caracteres"),
  analiseTecnica: z.string().optional(),
  leituraTecnica: z.string().optional(),
  evidencias: z.string().optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface ITReportFormProps {
  analysisData?: VideoAnalysis;
  defaultValues?: {
    atendente?: string;
    cliente?: string;
  };
}

export function ITReportForm({ analysisData, defaultValues }: ITReportFormProps) {
  const [generatedReport, setGeneratedReport] = useState<string>("");
  const { toast } = useToast();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      atendente: defaultValues?.atendente || "",
      cliente: defaultValues?.cliente || "",
      versaoApp: "",
      versaoAndroid: false,
      versaoIOS: false,
      appMotorista: false,
      appPassageiro: false,
      comprometeFunc: false,
      dataReclamacao: new Date().toLocaleDateString('pt-BR'),
      horarioRelato: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    }
  });

  useEffect(() => {
    if (analysisData) {
      const contexto = analysisData.analise?.contexto || "";
      const problemas = analysisData.analise?.problemas?.join("\n\n") || "";
      const insights = analysisData.analise?.insights?.join("\n\n") || "";
      
      setValue("resumo", contexto);
      setValue("descricao", problemas || analysisData.transcricao || "");
      setValue("leituraTecnica", insights);
    }
  }, [analysisData, setValue]);

  const watchedValues = watch();

  const formatReport = (data: ReportFormData) => {
    const versaoCompleta = data.versaoApp ? ` ${data.versaoApp}` : '';
    
    let reportContent = `ATENDENTE: ${data.atendente}
CLIENTE: ${data.cliente}
VERSÃO DO APP: ANDROID ( ${data.versaoAndroid ? 'X' : ' '} ) IOS ( ${data.versaoIOS ? 'X' : ' '} )${versaoCompleta}
APP: MOTORISTA ( ${data.appMotorista ? 'X' : ' '} ) PASSAGEIRO ( ${data.appPassageiro ? 'X' : ' '} )
DATA DA RECLAMAÇÃO: ${data.dataReclamacao}

Este erro compromete diretamente o funcionamento básico do aplicativo?
SIM ( ${data.comprometeFunc ? 'X' : ' '} ) NÃO ( ${!data.comprometeFunc ? 'X' : ' '} )

DESCRIÇÃO DO OCORRIDO
${data.horarioRelato ? `Horário do relato: ${data.horarioRelato}.\n\n` : ''}Resumo: ${data.resumo}

${data.descricao}`;

    // Adiciona análise técnica se houver
    if (data.analiseTecnica) {
      reportContent += `\n\nAnálise por motorista (dados internos)\n${data.analiseTecnica}`;
    }

    // Adiciona leitura técnica se houver
    if (data.leituraTecnica) {
      reportContent += `\n\nLeitura técnica inicial\n\n${data.leituraTecnica}`;
    }

    // Formata evidências de forma inteligente
    if (data.evidencias) {
      const evidencias = data.evidencias.trim();
      
      // Verifica se parece ser um resultado de investigação (contém múltiplas linhas estruturadas)
      const linhasEvidencias = evidencias.split('\n');
      const temEstrutura = linhasEvidencias.some(linha => 
        linha.match(/^\d+\)/) || // Começa com número)
        linha.match(/^[A-Z][a-z]+:/) || // Começa com palavra seguida de :
        linha.match(/ID \w+/) || // Contém ID
        linha.match(/^\-/) || // Lista com traço
        linha.match(/Observação:/i) ||
        linha.match(/Consulta:/i)
      );

      if (temEstrutura) {
        // É uma investigação estruturada
        reportContent += `\n\n${evidencias}`;
      } else {
        // É uma evidência simples (links ou descrição curta)
        reportContent += `\n\nEVIDÊNCIAS:\n${evidencias}`;
      }
    }

    return reportContent;
  };

  const onSubmit = (data: ReportFormData) => {
    const report = formatReport(data);
    setGeneratedReport(report);
    toast({
      title: "Relatório gerado!",
      description: "Use os botões abaixo para copiar ou baixar.",
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedReport);
    toast({
      title: "Copiado!",
      description: "Relatório copiado para a área de transferência.",
    });
  };

  const downloadReport = () => {
    const blob = new Blob([generatedReport], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-ti-${watchedValues.dataReclamacao?.replace(/\//g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast({
      title: "Download iniciado!",
      description: "O relatório será salvo em seu dispositivo.",
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gerador de Relatório para TI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="atendente">Atendente *</Label>
                <Input id="atendente" {...register("atendente")} />
                {errors.atendente && (
                  <p className="text-sm text-destructive">{errors.atendente.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cliente">Cliente *</Label>
                <Input id="cliente" {...register("cliente")} />
                {errors.cliente && (
                  <p className="text-sm text-destructive">{errors.cliente.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Versão do App *</Label>
              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="versaoAndroid" 
                    checked={watchedValues.versaoAndroid}
                    onCheckedChange={(checked) => setValue("versaoAndroid", checked as boolean)}
                  />
                  <Label htmlFor="versaoAndroid" className="font-normal">Android</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="versaoIOS" 
                    checked={watchedValues.versaoIOS}
                    onCheckedChange={(checked) => setValue("versaoIOS", checked as boolean)}
                  />
                  <Label htmlFor="versaoIOS" className="font-normal">iOS</Label>
                </div>
              </div>
              <Input 
                id="versaoApp" 
                {...register("versaoApp")} 
                placeholder="Ex: 1.2.34"
                className="mt-2"
              />
            </div>

            <div className="space-y-3">
              <Label>Tipo de App *</Label>
              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="appMotorista" 
                    checked={watchedValues.appMotorista}
                    onCheckedChange={(checked) => setValue("appMotorista", checked as boolean)}
                  />
                  <Label htmlFor="appMotorista" className="font-normal">Motorista</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="appPassageiro" 
                    checked={watchedValues.appPassageiro}
                    onCheckedChange={(checked) => setValue("appPassageiro", checked as boolean)}
                  />
                  <Label htmlFor="appPassageiro" className="font-normal">Passageiro</Label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataReclamacao">Data de Reclamação *</Label>
                <Input id="dataReclamacao" {...register("dataReclamacao")} placeholder="DD/MM/AAAA" />
                {errors.dataReclamacao && (
                  <p className="text-sm text-destructive">{errors.dataReclamacao.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="horarioRelato">Horário do Relato</Label>
                <Input id="horarioRelato" {...register("horarioRelato")} placeholder="HH:MM" />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Compromete o funcionamento básico? *</Label>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="comprometeFunc" 
                  checked={watchedValues.comprometeFunc}
                  onCheckedChange={(checked) => setValue("comprometeFunc", checked as boolean)}
                />
                <Label htmlFor="comprometeFunc" className="font-normal">Sim</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resumo">Resumo *</Label>
              <Textarea 
                id="resumo" 
                {...register("resumo")} 
                rows={3}
                placeholder="Resumo breve do problema..."
              />
              {errors.resumo && (
                <p className="text-sm text-destructive">{errors.resumo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição Detalhada *</Label>
              <Textarea 
                id="descricao" 
                {...register("descricao")} 
                rows={6}
                placeholder="Descrição detalhada do problema, endereços citados, comparativos com outros apps, etc..."
              />
              {errors.descricao && (
                <p className="text-sm text-destructive">{errors.descricao.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="analiseTecnica">Análise Técnica (Dados de Motorista/Sistema)</Label>
              <Textarea 
                id="analiseTecnica" 
                {...register("analiseTecnica")} 
                rows={8}
                placeholder="Cole aqui os dados técnicos: IDs de motoristas, coordenadas, timestamps, consultas ao banco, etc..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="leituraTecnica">Leitura Técnica Inicial</Label>
              <Textarea 
                id="leituraTecnica" 
                {...register("leituraTecnica")} 
                rows={4}
                placeholder="Interpretação técnica dos dados, conclusões preliminares..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="evidencias">Evidências (links, descrições, etc.)</Label>
              <Textarea 
                id="evidencias" 
                {...register("evidencias")} 
                rows={4}
                placeholder="Cole links de imagens, vídeos ou descreva as evidências..."
              />
            </div>

            <Button type="submit" className="w-full">
              Gerar Relatório
            </Button>
          </form>
        </CardContent>
      </Card>

      {generatedReport && (
        <Card>
          <CardHeader>
            <CardTitle>Relatório Gerado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap font-mono overflow-x-auto">
              {generatedReport}
            </pre>
            <div className="flex gap-2">
              <Button onClick={copyToClipboard} variant="outline" className="flex-1">
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
              <Button onClick={downloadReport} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
