import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Trash2, Database, AlertTriangle, UserCog, Shield } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const DatabaseManager = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [evidences, setEvidences] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");

  useEffect(() => {
    checkAdminRole();
  }, []);

  const checkAdminRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!error && data) {
      setIsAdmin(true);
      loadAllData();
    } else {
      setIsAdmin(false);
    }
    setLoading(false);
  };

  const loadAllData = async () => {
    const [convResponse, analResponse, evidResponse, profilesResponse] = await Promise.all([
      supabase.from("conversations").select("*").order("created_at", { ascending: false }),
      supabase.from("analyses").select("*").order("created_at", { ascending: false }),
      supabase.from("evidences").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select(`
        id,
        email,
        nome_completo,
        created_at,
        user_roles (role)
      `).order("created_at", { ascending: false })
    ]);

    if (convResponse.data) setConversations(convResponse.data);
    if (analResponse.data) setAnalyses(analResponse.data);
    if (evidResponse.data) setEvidences(evidResponse.data);
    if (profilesResponse.data) setUsers(profilesResponse.data);
  };

  const deleteConversation = async (id: string) => {
    const { error } = await supabase.from("conversations").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao deletar conversa");
    } else {
      toast.success("Conversa deletada");
      loadAllData();
    }
  };

  const deleteAnalysis = async (id: string) => {
    const { error } = await supabase.from("analyses").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao deletar análise");
    } else {
      toast.success("Análise deletada");
      loadAllData();
    }
  };

  const deleteEvidence = async (id: string) => {
    const { error } = await supabase.from("evidences").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao deletar evidência");
    } else {
      toast.success("Evidência deletada");
      loadAllData();
    }
  };

  const promoteToAdmin = async (email: string) => {
    if (!email) {
      toast.error("Digite um email");
      return;
    }

    // Buscar usuário pelo email
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (profileError || !profile) {
      toast.error("Usuário não encontrado");
      return;
    }

    // Verificar se já é admin
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", profile.id)
      .eq("role", "admin")
      .maybeSingle();

    if (existingRole) {
      toast.info("Usuário já é administrador");
      return;
    }

    // Adicionar role de admin
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: profile.id, role: "admin" });

    if (error) {
      toast.error("Erro ao promover usuário");
    } else {
      toast.success("Usuário promovido a administrador!");
      setNewAdminEmail("");
      loadAllData();
    }
  };

  const removeAdmin = async (userId: string) => {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", "admin");

    if (error) {
      toast.error("Erro ao remover privilégios de admin");
    } else {
      toast.success("Privilégios de admin removidos");
      loadAllData();
    }
  };

  const clearAllData = async () => {
    const { error: evidError } = await supabase.from("evidences").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    const { error: analError } = await supabase.from("analyses").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    const { error: convError } = await supabase.from("conversations").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    if (evidError || analError || convError) {
      toast.error("Erro ao limpar banco de dados");
    } else {
      toast.success("Banco de dados limpo com sucesso");
      loadAllData();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Gerenciamento de Banco de Dados
          </CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Gerenciamento de Banco de Dados
          </CardTitle>
          <CardDescription className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Acesso restrito apenas para administradores
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Gerenciamento de Banco de Dados
        </CardTitle>
        <CardDescription>
          Visualize e gerencie todos os dados do sistema (apenas administradores)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users">Usuários ({users.length})</TabsTrigger>
            <TabsTrigger value="conversations">Conversas ({conversations.length})</TabsTrigger>
            <TabsTrigger value="analyses">Análises ({analyses.length})</TabsTrigger>
            <TabsTrigger value="evidences">Evidências ({evidences.length})</TabsTrigger>
            <TabsTrigger value="actions">Ações</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="h-5 w-5" />
                  Promover Usuário a Administrador
                </CardTitle>
                <CardDescription>
                  Digite o email do usuário para dar privilégios de administrador
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="admin-email">Email do Usuário</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="usuario@email.com"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={() => promoteToAdmin(newAdminEmail)}
                    className="self-end"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Promover
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const isUserAdmin = user.user_roles?.some((r: any) => r.role === 'admin');
                    return (
                      <TableRow key={user.id}>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.nome_completo || "N/A"}</TableCell>
                        <TableCell>
                          {isUserAdmin ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              <Shield className="h-3 w-3" />
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                              Usuário
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {isUserAdmin && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Remover Admin
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remover privilégios de admin</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja remover os privilégios de administrador deste usuário?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => removeAdmin(user.id)}>
                                    Remover
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="conversations" className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Atendente</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conversations.map((conv) => (
                    <TableRow key={conv.id}>
                      <TableCell>{conv.cliente}</TableCell>
                      <TableCell>{conv.atendente}</TableCell>
                      <TableCell>{new Date(conv.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja deletar esta conversa? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteConversation(conv.id)}>
                                Deletar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="analyses" className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Solução</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyses.map((anal) => (
                    <TableRow key={anal.id}>
                      <TableCell>{anal.resolucao_status || "N/A"}</TableCell>
                      <TableCell className="max-w-xs truncate">{anal.solucao_aplicada || "N/A"}</TableCell>
                      <TableCell>{new Date(anal.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja deletar esta análise? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteAnalysis(anal.id)}>
                                Deletar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="evidences" className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Nome do Arquivo</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evidences.map((evid) => (
                    <TableRow key={evid.id}>
                      <TableCell>{evid.tipo}</TableCell>
                      <TableCell>{evid.nome_arquivo || "N/A"}</TableCell>
                      <TableCell>{new Date(evid.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja deletar esta evidência? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteEvidence(evid.id)}>
                                Deletar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Ações Perigosas
                </CardTitle>
                <CardDescription>
                  Estas ações são irreversíveis. Use com extremo cuidado.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Limpar Todo o Banco de Dados
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-destructive">
                        ATENÇÃO: Ação Irreversível
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Você está prestes a deletar TODOS os dados do sistema (conversas, análises e evidências).
                        Esta ação NÃO PODE ser desfeita. Tem certeza absoluta?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={clearAllData} className="bg-destructive hover:bg-destructive/90">
                        Sim, limpar tudo
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DatabaseManager;
