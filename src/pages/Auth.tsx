import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Building2 } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [codigoPin, setCodigoPin] = useState("");
  const [empresas, setEmpresas] = useState<Array<{ id: string; nome: string }>>([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState<string>("");
  const [novaEmpresa, setNovaEmpresa] = useState("");
  const [criarNovaEmpresa, setCriarNovaEmpresa] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkUser();

    // Carregar empresas
    const loadEmpresas = async () => {
      const { data, error } = await supabase
        .from("empresas")
        .select("id, nome")
        .order("nome");
      
      if (!error && data) {
        setEmpresas(data);
      }
    };
    loadEmpresas();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (codigoPin !== "9931") {
      toast.error("Código PIN inválido");
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (!criarNovaEmpresa && !empresaSelecionada) {
      toast.error("Selecione uma empresa ou crie uma nova");
      return;
    }

    if (criarNovaEmpresa && !novaEmpresa.trim()) {
      toast.error("Digite o nome da nova empresa");
      return;
    }

    setLoading(true);

    try {
      let empresaId = empresaSelecionada;

      // Criar nova empresa se necessário
      if (criarNovaEmpresa) {
        const { data: empresaData, error: empresaError } = await supabase
          .from("empresas")
          .insert([{ nome: novaEmpresa.trim() }])
          .select()
          .single();

        if (empresaError) {
          if (empresaError.message.includes("duplicate key")) {
            toast.error("Já existe uma empresa com este nome");
          } else {
            toast.error("Erro ao criar empresa: " + empresaError.message);
          }
          setLoading(false);
          return;
        }

        empresaId = empresaData.id;
      }

      // Criar usuário
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome_completo: nomeCompleto || email,
            empresa_id: empresaId
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          toast.error("Este email já está cadastrado");
        } else {
          toast.error("Erro ao cadastrar: " + authError.message);
        }
      } else if (authData.user) {
        // Atualizar perfil com empresa_id
        await supabase
          .from("profiles")
          .update({ empresa_id: empresaId })
          .eq("id", authData.user.id);

        toast.success("Cadastro realizado! Faça login para continuar.");
        setEmail("");
        setPassword("");
        setNomeCompleto("");
        setCodigoPin("");
        setEmpresaSelecionada("");
        setNovaEmpresa("");
        setCriarNovaEmpresa(false);
      }
    } catch (error: any) {
      toast.error("Erro ao cadastrar: " + error.message);
    }

    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Preencha email e senha");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error("Erro ao fazer login: " + error.message);
    } else {
      toast.success("Login realizado com sucesso!");
      navigate("/");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sistema de Atendimento</CardTitle>
          <CardDescription>
            Faça login ou cadastre-se para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="cadastro">Cadastro</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Entrar
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="cadastro">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-nome">Nome Completo (opcional)</Label>
                  <Input
                    id="signup-nome"
                    type="text"
                    placeholder="Seu nome"
                    value={nomeCompleto}
                    onChange={(e) => setNomeCompleto(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-pin">Código PIN</Label>
                  <Input
                    id="signup-pin"
                    type="text"
                    placeholder="Digite o código PIN"
                    value={codigoPin}
                    onChange={(e) => setCodigoPin(e.target.value)}
                    required
                  />
                </div>

                {/* Seleção de Empresa */}
                <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    <Label className="text-base font-semibold">Empresa</Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="empresa-existente"
                      name="tipo-empresa"
                      checked={!criarNovaEmpresa}
                      onChange={() => setCriarNovaEmpresa(false)}
                      className="cursor-pointer"
                    />
                    <Label htmlFor="empresa-existente" className="cursor-pointer">
                      Selecionar empresa existente
                    </Label>
                  </div>

                  {!criarNovaEmpresa && (
                    <Select
                      value={empresaSelecionada}
                      onValueChange={setEmpresaSelecionada}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        {empresas.map((empresa) => (
                          <SelectItem key={empresa.id} value={empresa.id}>
                            {empresa.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="empresa-nova"
                      name="tipo-empresa"
                      checked={criarNovaEmpresa}
                      onChange={() => setCriarNovaEmpresa(true)}
                      className="cursor-pointer"
                    />
                    <Label htmlFor="empresa-nova" className="cursor-pointer">
                      Criar nova empresa
                    </Label>
                  </div>

                  {criarNovaEmpresa && (
                    <Input
                      placeholder="Nome da nova empresa"
                      value={novaEmpresa}
                      onChange={(e) => setNovaEmpresa(e.target.value)}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Cadastrar
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground text-center">
          Sistema seguro de atendimento ao cliente
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
