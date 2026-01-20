# Sistema de Controle Financeiro - Recife EPIs

Sistema completo de controle financeiro personalizado para a **Recife EPIs** com as cores da empresa (preto e amarelo).

## 🎨 Identidade Visual

- **Cores Principais**: Preto (#000000) e Amarelo (#FFC107)
- **Sidebar**: Fundo preto com texto amarelo
- **Botões de Ação**: Destaque em amarelo
- **Layout**: Profissional e moderno

## 🚀 Tecnologias Utilizadas

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Express + tRPC
- **Banco de Dados**: MySQL com Drizzle ORM
- **Estilização**: TailwindCSS 4 com cores personalizadas
- **UI Components**: Radix UI + shadcn/ui
- **Gráficos**: Recharts
- **Autenticação**: Sistema próprio com JWT

## 📦 Funcionalidades

### Dashboard
- Visão geral financeira
- Saldo atual total
- Entradas e saídas do período
- Detalhamento por conta bancária
- Exportação para Excel e PDF

### Relatórios
- Análise detalhada de movimentações
- Filtros por período
- Impressão de relatórios

### Analytics
- Gráficos e visualizações
- Tendências financeiras
- Análise de fluxo de caixa

### Configurações
- Gerenciamento de usuários (admin, viewer, operator)
- Personalização da marca
- Notificações
- Auditoria de ações
- Exportar/Importar dados JSON
- Backup automático Google Drive

## 🛠️ Instalação

### Pré-requisitos
- Node.js 22+
- MySQL 8+
- pnpm

### Passos

1. Instalar dependências:
```bash
pnpm install
```

2. Configurar variáveis de ambiente (.env):
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=mysql://root:password@localhost:3306/recife_epis
JWT_SECRET=recife-epis-secret-key-2024
```

3. Executar migrações do banco de dados:
```bash
pnpm db:push
```

4. Iniciar o servidor de desenvolvimento:
```bash
pnpm dev
```

5. Acessar o sistema:
```
http://localhost:3000
```

## 👤 Credenciais Padrão

- **Admin**: admin / 123
- **Visitante**: visitante / 123

## 📁 Estrutura do Projeto

```
recife-epis/
├── client/              # Frontend React
│   ├── src/
│   │   ├── components/  # Componentes reutilizáveis
│   │   ├── contexts/    # Contextos React
│   │   ├── pages/       # Páginas da aplicação
│   │   ├── lib/         # Utilitários
│   │   └── index.css    # Estilos com cores da Recife EPIs
│   └── index.html
├── server/              # Backend Express + tRPC
│   ├── _core/          # Core do servidor
│   └── routers.ts      # Rotas da API
├── drizzle/            # Schema e migrações do banco
└── shared/             # Código compartilhado
```

## 🎯 Recursos Principais

### Gestão Financeira
- Cadastro de contas bancárias
- Registro de entradas e saídas
- Cálculo automático de saldos
- Histórico de transações detalhadas
- Notas e observações por conta

### Segurança
- Autenticação com JWT
- Controle de acesso por perfil (roles)
- Auditoria completa de ações
- Proteção de rotas

### Exportação
- Excel (XLSX)
- PDF
- JSON (backup completo)

### Backup
- Exportação manual de dados
- Importação de dados
- Integração com Google Drive (em desenvolvimento)

## 🔧 Scripts Disponíveis

- `pnpm dev` - Inicia o servidor de desenvolvimento
- `pnpm build` - Compila para produção
- `pnpm start` - Inicia o servidor de produção
- `pnpm check` - Verifica tipos TypeScript
- `pnpm format` - Formata o código com Prettier
- `pnpm test` - Executa os testes
- `pnpm db:push` - Aplica migrações do banco de dados

## 📝 Licença

MIT

## 🏢 Sobre a Recife EPIs

Sistema desenvolvido especialmente para a **Recife EPIs**, empresa especializada em Equipamentos de Proteção Individual.

**Cores da Marca**: Preto e Amarelo
