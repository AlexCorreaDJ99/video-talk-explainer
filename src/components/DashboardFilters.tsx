import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter, X } from "lucide-react";

interface DashboardFiltersProps {
  filterUrgencia: string;
  filterStatus: string;
  filterCategoria: string;
  filterPeriodo: string;
  onFilterUrgencia: (value: string) => void;
  onFilterStatus: (value: string) => void;
  onFilterCategoria: (value: string) => void;
  onFilterPeriodo: (value: string) => void;
  onClearFilters: () => void;
}

export function DashboardFilters({
  filterUrgencia,
  filterStatus,
  filterCategoria,
  filterPeriodo,
  onFilterUrgencia,
  onFilterStatus,
  onFilterCategoria,
  onFilterPeriodo,
  onClearFilters,
}: DashboardFiltersProps) {
  const hasActiveFilters =
    filterUrgencia !== "all" ||
    filterStatus !== "all" ||
    filterCategoria !== "all" ||
    filterPeriodo !== "all";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Período</label>
          <Select value={filterPeriodo} onValueChange={onFilterPeriodo}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="semana">Última Semana</SelectItem>
              <SelectItem value="mes">Último Mês</SelectItem>
              <SelectItem value="trimestre">Último Trimestre</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Urgência</label>
          <Select value={filterUrgencia} onValueChange={onFilterUrgencia}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="critica">Crítica</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="media">Média</SelectItem>
              <SelectItem value="baixa">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select value={filterStatus} onValueChange={onFilterStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="em_progresso">Em Progresso</SelectItem>
              <SelectItem value="resolvido">Resolvido</SelectItem>
              <SelectItem value="nao_resolvido">Não Resolvido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Categoria</label>
          <Select value={filterCategoria} onValueChange={onFilterCategoria}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="tecnico">Técnico</SelectItem>
              <SelectItem value="financeiro">Financeiro</SelectItem>
              <SelectItem value="atendimento">Atendimento</SelectItem>
              <SelectItem value="operacional">Operacional</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}