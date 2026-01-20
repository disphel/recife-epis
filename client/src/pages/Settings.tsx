import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAudit } from "@/contexts/AuditContext";
import { exportToExcel, exportToPDF } from "@/lib/exportUtils";
import { Trash2, UserPlus, FileText, Search, Share2, Copy, Check, Eye, EyeOff, FileSpreadsheet, Cloud, CloudOff, Download, Upload, ImageIcon, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { ShareLink } from "@/components/ShareLink";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { initializeGoogleDrive, authorizeGoogleDrive, isAuthorized, revokeGoogleDrive, uploadBackupToDrive, listBackupsFromDrive, downloadBackupFromDrive, deleteBackupFromDrive } from "@/lib/googleDrive";

export default function Settings() {
  const { brand, updateBrand } = useTheme();
  const { users, addUser, deleteUser, user: currentUser } = useAuth();
  const { logs, clearLogs, logAction } = useAudit();
  const [searchTerm, setSearchTerm] = useState("");
  
  const [settings, setSettings] = useState({
    darkMode: false,
    hideSensitive: false,
    companyName: "Disphel Distribuidora",
    cnpj: "",
    notifyInconsistency: true,
    notifyDailyReport: true
  });

  const [brandForm, setBrandForm] = useState(brand);
  const [isSaved, setIsSaved] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  
  const uploadLogoMutation = trpc.brand.uploadLogo.useMutation();
  const saveBrandMutation = trpc.brand.saveBrand.useMutation();
  
  // Google Drive states
  const [isDriveAuthorized, setIsDriveAuthorized] = useState(false);
  const [driveBackups, setDriveBackups] = useState<Array<{ id: string; name: string; createdTime: string }>>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);

  const generateShareMessage = (user: any) => {
    const url = window.location.origin;
    // Create a magic invite link with encoded credentials
    // Format: /login?invite=base64(username:password:name:role)
    const inviteData = btoa(`${user.username}:${user.password || '123'}:${user.name}:${user.role}`);
    const inviteLink = `${url}/login?invite=${inviteData}`;
    
    return `Olá ${user.name}, aqui está seu convite de acesso ao Sistema Financeiro:\n\n🔗 *Clique para entrar automaticamente:*\n${inviteLink}\n\n(Este link já configura seu acesso neste dispositivo)`;
  };

  const handleCopy = (user: any) => {
    const text = generateShareMessage(user);
    navigator.clipboard.writeText(text);
    setCopiedId(user.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleWhatsApp = (user: any) => {
    const text = generateShareMessage(user);
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };
  
  // New user form state
  const [newUser, setNewUser] = useState({ name: '', username: '', password: '', role: 'viewer' });
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);

  const handleAddUser = () => {
    if (newUser.name && newUser.username && newUser.password) {
      // Sanitize inputs: trim whitespace from username and password
      const sanitizedUser = {
        ...newUser,
        username: newUser.username.trim(),
        password: newUser.password.trim()
      };
      addUser(sanitizedUser as any);
      setNewUser({ name: '', username: '', password: '', role: 'viewer' });
      setShowNewUserPassword(false);
    }
  };
  
  // Google Drive functions
  const loadDriveBackups = async () => {
    try {
      setIsLoadingDrive(true);
      const backups = await listBackupsFromDrive();
      setDriveBackups(backups);
      setDriveError(null);
    } catch (error) {
      console.error('Failed to load backups:', error);
      setDriveError('Falha ao carregar backups');
    } finally {
      setIsLoadingDrive(false);
    }
  };
  
  const handleDriveAuthorize = async () => {
    try {
      setIsLoadingDrive(true);
      await authorizeGoogleDrive();
      setIsDriveAuthorized(true);
      await loadDriveBackups();
      logAction('create', 'Google Drive', 'Conectou ao Google Drive');
    } catch (error) {
      console.error('Authorization failed:', error);
      setDriveError('Falha na autorização');
    } finally {
      setIsLoadingDrive(false);
    }
  };
  
  const handleDriveRevoke = () => {
    revokeGoogleDrive();
    setIsDriveAuthorized(false);
    setDriveBackups([]);
    logAction('delete', 'Google Drive', 'Desconectou do Google Drive');
  };
  
  const handleManualBackup = async () => {
    try {
      setIsLoadingDrive(true);
      const dataToBackup = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        financialData: JSON.parse(localStorage.getItem('financial_data') || '[]'),
        users: JSON.parse(localStorage.getItem('users') || '[]').map((u: any) => ({
          username: u.username,
          name: u.name,
          role: u.role
        }))
      };
      
      await uploadBackupToDrive(dataToBackup);
      await loadDriveBackups();
      alert('✅ Backup realizado com sucesso!');
      logAction('create', 'Backup Google Drive', 'Realizou backup manual');
    } catch (error) {
      console.error('Backup failed:', error);
      alert('❌ Falha ao realizar backup');
    } finally {
      setIsLoadingDrive(false);
    }
  };
  
  const handleRestoreBackup = async (fileId: string) => {
    if (!confirm('⚠️ Isso vai substituir todos os dados atuais. Deseja continuar?')) {
      return;
    }
    
    try {
      setIsLoadingDrive(true);
      const backupData = await downloadBackupFromDrive(fileId);
      
      // Restore data
      if (backupData.financialData) {
        localStorage.setItem('financial_data', JSON.stringify(backupData.financialData));
      }
      if (backupData.users) {
        localStorage.setItem('users', JSON.stringify(backupData.users));
      }
      
      alert('✅ Dados restaurados com sucesso! A página será recarregada.');
      logAction('create', 'Restauração', 'Restaurou backup do Google Drive');
      window.location.reload();
    } catch (error) {
      console.error('Restore failed:', error);
      alert('❌ Falha ao restaurar backup');
    } finally {
      setIsLoadingDrive(false);
    }
  };
  
  const handleDeleteBackup = async (fileId: string) => {
    if (!confirm('Deseja realmente excluir este backup?')) {
      return;
    }
    
    try {
      setIsLoadingDrive(true);
      await deleteBackupFromDrive(fileId);
      await loadDriveBackups();
      alert('✅ Backup excluído');
    } catch (error) {
      console.error('Delete failed:', error);
      alert('❌ Falha ao excluir backup');
    } finally {
      setIsLoadingDrive(false);
    }
  };

  // Initialize Google Drive on component mount
  useEffect(() => {
    const initDrive = async () => {
      try {
        await initializeGoogleDrive();
        setIsDriveAuthorized(isAuthorized());
        if (isAuthorized()) {
          await loadDriveBackups();
        }
      } catch (error) {
        console.error('Failed to initialize Google Drive:', error);
        setDriveError('Falha ao inicializar Google Drive');
      }
    };
    initDrive();
  }, []);
  
  useEffect(() => {
    const savedSettings = localStorage.getItem('financial_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Sync local brand form with context when context changes (initial load)
  useEffect(() => {
    setBrandForm(brand);
  }, [brand]);

  const handleSave = async () => {
    try {
      // Save to backend
      await saveBrandMutation.mutateAsync(brandForm);
      
      // Update local context and localStorage
      localStorage.setItem('financial_settings', JSON.stringify(settings));
      updateBrand(brandForm);
      
      // Show success message
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save brand settings:', error);
      alert('Erro ao salvar alterações. Tente novamente.');
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-primary tracking-tight">Configurações</h2>
          <p className="text-muted-foreground">Gerencie suas preferências e configurações do sistema.</p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="branding">Marca</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="audit">Auditoria</TabsTrigger>
          </TabsList>
          
          <TabsContent value="branding" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Identidade Visual (White Label)</CardTitle>
                <CardDescription>Personalize o nome, logo e cores do aplicativo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid gap-1">
                  <Label htmlFor="appName">Nome do Aplicativo</Label>
                  <Input 
                    id="appName" 
                    value={brandForm.appName} 
                    onChange={(e) => setBrandForm(prev => ({ ...prev, appName: e.target.value }))}
                    placeholder="Ex: CapitalFlow"
                  />
                </div>
                
                <div className="grid gap-1">
                  <Label htmlFor="logoUpload">Logomarca</Label>
                  
                  {/* Logo Preview */}
                  {(logoPreview || brandForm.logoUrl) && (
                    <div className="relative w-32 h-32 border-2 border-dashed border-slate-200 rounded-lg overflow-hidden">
                      <img 
                        src={logoPreview || brandForm.logoUrl} 
                        alt="Logo preview" 
                        className="w-full h-full object-contain p-2"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setLogoPreview(null);
                          setBrandForm(prev => ({ ...prev, logoUrl: '' }));
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  
                  {/* Upload Button */}
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isUploadingLogo}
                      onClick={() => document.getElementById('logoUpload')?.click()}
                      className="flex items-center gap-2"
                    >
                      {isUploadingLogo ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          {brandForm.logoUrl ? 'Alterar Logo' : 'Fazer Upload do Logo'}
                        </>
                      )}
                    </Button>
                    <input
                      id="logoUpload"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        // Validate file size (max 2MB)
                        if (file.size > 2 * 1024 * 1024) {
                          alert('Arquivo muito grande! Tamanho máximo: 2MB');
                          return;
                        }
                        
                        // Validate file type
                        if (!['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'].includes(file.type)) {
                          alert('Formato inválido! Use PNG, JPG ou SVG');
                          return;
                        }
                        
                        try {
                          setIsUploadingLogo(true);
                          
                          // Convert to base64
                          const reader = new FileReader();
                          reader.onload = async (event) => {
                            const base64Data = event.target?.result as string;
                            setLogoPreview(base64Data);
                            
                            try {
                              // Upload to S3
                              const result = await uploadLogoMutation.mutateAsync({
                                base64Data,
                                fileName: file.name,
                                contentType: file.type
                              });
                              
                              // Update form with S3 URL
                              setBrandForm(prev => ({ ...prev, logoUrl: result.url }));
                              setLogoPreview(result.url);
                            } catch (error) {
                              console.error('Upload failed:', error);
                              alert('Falha ao fazer upload. Tente novamente.');
                              setLogoPreview(null);
                            } finally {
                              setIsUploadingLogo(false);
                            }
                          };
                          reader.readAsDataURL(file);
                        } catch (error) {
                          console.error('Error reading file:', error);
                          alert('Erro ao ler arquivo');
                          setIsUploadingLogo(false);
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="grid gap-1">
                  <Label htmlFor="primaryColor">Cor Primária</Label>
                  <div className="flex gap-2 items-center">
                    <Input 
                      id="primaryColor" 
                      type="color"
                      value={brandForm.primaryColor} 
                      onChange={(e) => setBrandForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input 
                      value={brandForm.primaryColor} 
                      onChange={(e) => setBrandForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="flex-1 font-mono"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 border-t flex items-center gap-4 py-4">
                <Button onClick={handleSave} size="lg" className="min-w-[180px] bg-primary text-white hover:bg-primary/90">
                  Aplicar Alterações
                </Button>
                {isSaved && (
                  <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium animate-in fade-in slide-in-from-left-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Alterações aplicadas com sucesso!
                  </div>
                )}
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="general" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preferências de Exibição</CardTitle>
                <CardDescription>Personalize como os dados são apresentados.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Modo Escuro</Label>
                    <p className="text-sm text-muted-foreground">Ativar tema escuro para o aplicativo.</p>
                  </div>
                  <Switch 
                    checked={settings.darkMode}
                    onCheckedChange={(checked) => {
                      updateSetting('darkMode', checked);
                      // Apply theme immediately if needed, or save for reload
                      if (checked) document.documentElement.classList.add('dark');
                      else document.documentElement.classList.remove('dark');
                      // Auto-save for immediate effect
                      localStorage.setItem('financial_settings', JSON.stringify({ ...settings, darkMode: checked }));
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Ocultar Valores Sensíveis</Label>
                    <p className="text-sm text-muted-foreground">Mascarar saldos na tela inicial.</p>
                  </div>
                  <Switch 
                    checked={settings.hideSensitive}
                    onCheckedChange={(checked) => updateSetting('hideSensitive', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dados da Empresa</CardTitle>
                <CardDescription>Informações utilizadas nos relatórios.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="company">Nome da Empresa</Label>
                  <Input 
                    id="company" 
                    value={settings.companyName} 
                    onChange={(e) => updateSetting('companyName', e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input 
                    id="cnpj" 
                    placeholder="00.000.000/0000-00" 
                    value={settings.cnpj}
                    onChange={(e) => updateSetting('cnpj', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <Button onClick={handleSave}>Salvar Alterações</Button>
                  {isSaved && <span className="text-sm text-emerald-600 font-medium animate-pulse">Configurações salvas!</span>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Exportar/Importar Dados</CardTitle>
                <CardDescription>Compartilhe seus dados financeiros com outros dispositivos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">📤 Exportar Dados</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Baixe todos os seus lançamentos financeiros em um arquivo JSON. 
                      Você pode enviar este arquivo para outras pessoas via WhatsApp, email, etc.
                    </p>
                    <Button 
                      onClick={() => {
                        const dataToExport = {
                          version: "1.0",
                          exportDate: new Date().toISOString(),
                          financialData: JSON.parse(localStorage.getItem('financial_data') || '[]'),
                          users: JSON.parse(localStorage.getItem('users') || '[]').map((u: any) => ({
                            username: u.username,
                            name: u.name,
                            role: u.role
                          }))
                        };
                        
                        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `disphel-controle-${new Date().toISOString().split('T')[0]}.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        
                        logAction('create', 'Exportação', 'Exportou todos os dados financeiros');
                      }}
                      className="w-full sm:w-auto"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Exportar Todos os Dados
                    </Button>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <h4 className="font-semibold text-emerald-900 mb-2">📥 Importar Dados</h4>
                    <p className="text-sm text-emerald-700 mb-3">
                      Carregue um arquivo JSON exportado anteriormente. 
                      Os dados serão mesclados com os existentes (sem duplicar datas).
                    </p>
                    <input
                      type="file"
                      accept=".json"
                      id="import-file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          try {
                            const imported = JSON.parse(event.target?.result as string);
                            
                            // Merge financial data
                            const existingData = JSON.parse(localStorage.getItem('financial_data') || '[]');
                            const existingDates = new Set(existingData.map((d: any) => d.date));
                            
                            const newData = imported.financialData.filter((d: any) => !existingDates.has(d.date));
                            const mergedData = [...existingData, ...newData];
                            
                            localStorage.setItem('financial_data', JSON.stringify(mergedData));
                            
                            // Merge users (avoid duplicates by username)
                            const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
                            const existingUsernames = new Set(existingUsers.map((u: any) => u.username));
                            
                            const newUsers = (imported.users || []).filter((u: any) => !existingUsernames.has(u.username));
                            const mergedUsers = [...existingUsers, ...newUsers];
                            
                            localStorage.setItem('users', JSON.stringify(mergedUsers));
                            
                            alert(`✅ Importação concluída!\n\n📊 ${newData.length} novos lançamentos adicionados\n👥 ${newUsers.length} novos usuários adicionados`);
                            
                            logAction('create', 'Importação', `Importou ${newData.length} lançamentos e ${newUsers.length} usuários`);
                            
                            // Reload page to reflect changes
                            window.location.reload();
                          } catch (error) {
                            alert('❌ Erro ao importar arquivo. Verifique se o formato está correto.');
                            console.error('Import error:', error);
                          }
                        };
                        reader.readAsText(file);
                        
                        // Reset input
                        e.target.value = '';
                      }}
                    />
                    <Button 
                      onClick={() => document.getElementById('import-file')?.click()}
                      variant="outline"
                      className="w-full sm:w-auto"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Selecionar Arquivo JSON
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Backup Automático - Google Drive</CardTitle>
                <CardDescription>Faça backup dos seus dados na nuvem e restaure quando necessário.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isDriveAuthorized ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-semibold text-amber-900 mb-2">🔒 Conexão Necessária</h4>
                    <p className="text-sm text-amber-700 mb-3">
                      Para usar o backup automático, conecte sua conta do Google Drive.
                      Seus dados serão salvos de forma segura na sua própria conta.
                    </p>
                    <Button 
                      onClick={handleDriveAuthorize}
                      disabled={isLoadingDrive}
                      className="w-full sm:w-auto"
                    >
                      <Cloud className="h-4 w-4 mr-2" />
                      {isLoadingDrive ? 'Conectando...' : 'Conectar ao Google Drive'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-emerald-900">✅ Google Drive Conectado</h4>
                          <p className="text-sm text-emerald-700">Seus dados estão sendo salvos na nuvem.</p>
                        </div>
                        <Button 
                          onClick={handleDriveRevoke}
                          variant="ghost"
                          size="sm"
                          className="text-emerald-700 hover:text-emerald-900"
                        >
                          <CloudOff className="h-4 w-4 mr-2" />
                          Desconectar
                        </Button>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleManualBackup}
                          disabled={isLoadingDrive}
                          size="sm"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {isLoadingDrive ? 'Salvando...' : 'Fazer Backup Agora'}
                        </Button>
                      </div>
                    </div>
                    
                    {driveError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                        {driveError}
                      </div>
                    )}
                    
                    <div className="border rounded-lg">
                      <div className="p-4 border-b bg-slate-50">
                        <h4 className="font-semibold text-slate-900">Backups Disponíveis</h4>
                        <p className="text-sm text-slate-600">Restaure seus dados de um backup anterior.</p>
                      </div>
                      
                      {isLoadingDrive ? (
                        <div className="p-8 text-center text-slate-500">
                          Carregando backups...
                        </div>
                      ) : driveBackups.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                          Nenhum backup encontrado. Clique em "Fazer Backup Agora" para criar o primeiro.
                        </div>
                      ) : (
                        <div className="divide-y">
                          {driveBackups.map((backup) => (
                            <div key={backup.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                              <div>
                                <p className="font-medium text-slate-900">{backup.name}</p>
                                <p className="text-sm text-slate-500">
                                  {new Date(backup.createdTime).toLocaleString('pt-BR')}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  onClick={() => handleRestoreBackup(backup.id)}
                                  size="sm"
                                  variant="outline"
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Restaurar
                                </Button>
                                <Button 
                                  onClick={() => handleDeleteBackup(backup.id)}
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Log de Auditoria</CardTitle>
                    <CardDescription>Histórico de ações realizadas no sistema.</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => exportToExcel(logs, 'auditoria_logs', 'Auditoria')}
                      title="Exportar para Excel"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Excel
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => exportToPDF(
                        'Relatório de Auditoria',
                        [
                          { header: 'Data/Hora', dataKey: 'timestamp' },
                          { header: 'Usuário', dataKey: 'username' },
                          { header: 'Ação', dataKey: 'action' },
                          { header: 'Alvo', dataKey: 'target' },
                          { header: 'Detalhes', dataKey: 'details' }
                        ],
                        logs.map(log => ({
                          ...log,
                          timestamp: new Date(log.timestamp).toLocaleString()
                        })),
                        'auditoria_relatorio'
                      )}
                      title="Exportar para PDF"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearLogs} className="text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                      Limpar Logs
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Filtrar logs..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="rounded-md border">
                  <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                      <thead className="[&_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Data/Hora</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Usuário</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Ação</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Alvo</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Detalhes</th>
                        </tr>
                      </thead>
                      <tbody className="[&_tr:last-child]:border-0">
                        {logs
                          .filter(log => 
                            log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            log.details?.toLowerCase().includes(searchTerm.toLowerCase())
                          )
                          .map((log) => (
                          <tr key={log.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <td className="p-4 align-middle font-mono text-xs text-muted-foreground">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="p-4 align-middle font-medium">
                              {log.username}
                            </td>
                            <td className="p-4 align-middle">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                                log.action === 'create' ? 'bg-emerald-100 text-emerald-800' :
                                log.action === 'update' ? 'bg-blue-100 text-blue-800' :
                                log.action === 'delete' ? 'bg-rose-100 text-rose-800' :
                                'bg-slate-100 text-slate-800'
                              }`}>
                                {log.action === 'create' ? 'Criação' :
                                 log.action === 'update' ? 'Edição' :
                                 log.action === 'delete' ? 'Exclusão' : 'Login'}
                              </span>
                            </td>
                            <td className="p-4 align-middle">{log.target}</td>
                            <td className="p-4 align-middle text-muted-foreground max-w-[300px] truncate" title={log.details}>
                              {log.details || '-'}
                            </td>
                          </tr>
                        ))}
                        {logs.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-muted-foreground">
                              Nenhum registro encontrado.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gestão de Usuários</CardTitle>
                    <CardDescription>Adicione ou remova usuários do sistema.</CardDescription>
                  </div>
                  <ShareLink />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add User Form */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end border-b pb-6">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input 
                      placeholder="Nome completo" 
                      value={newUser.name}
                      onChange={e => setNewUser({...newUser, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Usuário</Label>
                    <Input 
                      placeholder="Login" 
                      value={newUser.username}
                      onChange={e => setNewUser({...newUser, username: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Senha</Label>
                    <div className="relative">
                      <Input 
                        type={showNewUserPassword ? "text" : "password"} 
                        placeholder="Senha" 
                        value={newUser.password}
                        onChange={e => setNewUser({...newUser, password: e.target.value})}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showNewUserPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Permissão</Label>
                    <Select 
                      value={newUser.role} 
                      onValueChange={val => setNewUser({...newUser, role: val})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="viewer">Visualizador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddUser} className="w-full md:w-auto">
                    <UserPlus className="w-4 h-4 mr-2" /> Adicionar
                  </Button>
                </div>

                {/* Users List */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Usuários Cadastrados</h3>
                  <div className="space-y-2">
                    {users.map((u: any) => (
                      <div key={u.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-slate-200 text-slate-600'}`}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{u.name}</p>
                            <p className="text-xs text-muted-foreground">@{u.username} • {u.role === 'admin' ? 'Administrador' : 'Visualizador'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-500 hover:text-primary hover:bg-primary/10"
                            onClick={() => handleCopy(u)}
                            title="Copiar dados de acesso"
                          >
                            {copiedId === u.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                            onClick={() => handleWhatsApp(u)}
                            title="Enviar via WhatsApp"
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                          {u.username !== 'admin' && u.id !== currentUser?.id && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                              onClick={() => deleteUser(u.id)}
                              title="Excluir usuário"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Alertas e Notificações</CardTitle>
                <CardDescription>Configure quando você deseja ser notificado.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Inconsistências de Saldo</Label>
                    <p className="text-sm text-muted-foreground">Notificar quando houver divergência nos cálculos.</p>
                  </div>
                  <Switch 
                    checked={settings.notifyInconsistency}
                    onCheckedChange={(checked) => updateSetting('notifyInconsistency', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Relatório Diário</Label>
                    <p className="text-sm text-muted-foreground">Receber resumo financeiro por e-mail.</p>
                  </div>
                  <Switch 
                    checked={settings.notifyDailyReport}
                    onCheckedChange={(checked) => updateSetting('notifyDailyReport', checked)}
                  />
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <Button onClick={handleSave}>Salvar Preferências</Button>
                  {isSaved && <span className="text-sm text-emerald-600 font-medium animate-pulse">Salvo!</span>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
