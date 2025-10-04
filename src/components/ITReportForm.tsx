import { useState } from "react";
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

const reportSchema = z.object({
  atendente: z.string().min(1, "Nome do atendente é obrigatório"),
  cliente: z.string().min(1, "Nome do cliente é obrigatório"),
  versaoAndroid: z.boolean(),
  versaoIOS: z.boolean(),
  appMotorista: z.boolean(),
  appPassageiro: z.boolean(),
  dataReclamacao: z.string().min(1, "Data é obrigatória"),
  comprometeFunc: z.boolean(),
  descricao: z.string().min(10, "Descrição deve ter no mínimo 10 caracteres"),
  impacto: z.string().min(10, "Impacto deve ter no mínimo 10 caracteres"),
  evidencias: z.string().optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;

export function ITReportForm() {
  const [generatedReport, setGeneratedReport] = useState<string>("");
  const { toast } = useToast();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      versaoAndroid: false,
      versaoIOS: false,
      appMotorista: false,
      appPassageiro: false,
      comprometeFunc: false,
      dataReclamacao: new Date().toLocaleDateString('pt-BR'),
    }
  });

  const watchedValues = watch();

  const formatReport = (data: ReportFormData) => {
    return `ATENDENTE: ${data.atendente}
Cliente: ${data.cliente}
VERSÃO DO APP: ANDROID ( ${data.versaoAndroid ? 'X' : ' '} ) IOS ( ${data.versaoIOS ? 'X' : ' '} )
APP: MOTORISTA ( ${data.appMotorista ? 'X' : ' '} ) PASSAGEIRO ( ${data.appPassageiro ? 'X' : ' '} )
Data de Reclamação: ${data.dataReclamacao}

Este erro compromete diretamente o funcionamento básico do aplicativo?
SIM ( ${data.comprometeFunc ? 'X' : ' '} ) NÃO ( ${!data.comprometeFunc ? 'X' : ' '} )

DESCRIÇÃO DO OCORRIDO:
${data.descricao}

Impacto: ${data.impacto}

EVIDÊNCIAS:
${data.evidencias || 'Sem evidências anexadas.'}`;
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
                  <Checkbox id="versaoAndroid" {...register("versaoAndroid")} />
                  <Label htmlFor="versaoAndroid" className="font-normal">Android</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="versaoIOS" {...register("versaoIOS")} />
                  <Label htmlFor="versaoIOS" className="font-normal">iOS</Label>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Tipo de App *</Label>
              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox id="appMotorista" {...register("appMotorista")} />
                  <Label htmlFor="appMotorista" className="font-normal">Motorista</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="appPassageiro" {...register("appPassageiro")} />
                  <Label htmlFor="appPassageiro" className="font-normal">Passageiro</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataReclamacao">Data de Reclamação *</Label>
              <Input id="dataReclamacao" {...register("dataReclamacao")} placeholder="DD/MM/AAAA" />
              {errors.dataReclamacao && (
                <p className="text-sm text-destructive">{errors.dataReclamacao.message}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label>Compromete o funcionamento básico? *</Label>
              <div className="flex items-center space-x-2">
                <Checkbox id="comprometeFunc" {...register("comprometeFunc")} />
                <Label htmlFor="comprometeFunc" className="font-normal">Sim</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição do Ocorrido *</Label>
              <Textarea 
                id="descricao" 
                {...register("descricao")} 
                rows={6}
                placeholder="Descreva detalhadamente o problema encontrado..."
              />
              {errors.descricao && (
                <p className="text-sm text-destructive">{errors.descricao.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="impacto">Impacto *</Label>
              <Textarea 
                id="impacto" 
                {...register("impacto")} 
                rows={4}
                placeholder="Descreva o impacto deste problema..."
              />
              {errors.impacto && (
                <p className="text-sm text-destructive">{errors.impacto.message}</p>
              )}
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
