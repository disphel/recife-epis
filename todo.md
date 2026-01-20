# Project TODO

## Completed Features
- [x] Sistema de controle financeiro básico
- [x] Gestão de contas e lançamentos
- [x] Sistema de auditoria
- [x] Exportar/Importar dados via JSON
- [x] Compartilhamento de acesso via WhatsApp
- [x] Botão "Mostrar Senha" no login e criação de usuários
- [x] Migrar dados financeiros do localStorage para banco de dados na nuvem
- [x] Criar APIs para operações financeiras (criar, editar, deletar lançamentos)
- [x] Implementar sincronização em tempo real (polling a cada 5 segundos)
- [x] Atualizar frontend para usar APIs em vez de localStorage
- [x] Adicionar notificação visual quando dados forem atualizados por outros usuários
- [x] Criar componente de compartilhamento de link do sistema
- [x] Adicionar botão para copiar link do sistema
- [x] Adicionar opção de compartilhar via WhatsApp
- [x] Integrar componente na tela de login e na página de Configurações
- [x] Corrigir problema de valores suprimidos na parte superior da aba Dashboard
- [x] CRÍTICO: Corrigir bug onde novos lançamentos substituem valores existentes ao invés de somar
- [x] Garantir que múltiplos lançamentos no mesmo dia sejam somados corretamente
- [x] Manter histórico detalhado de todos os lançamentos individuais

## Pending Features
- [ ] Remover código do Google Drive não utilizado
- [ ] Migrar sistema de autenticação do localStorage para banco de dados na nuvem
- [ ] Atualizar AuthContext para usar APIs de login/registro do servidor
- [ ] Testar login de diferentes dispositivos
- [x] Implementar funcionalidade de card expansível no card "Saldo Anterior"
- [x] Adicionar botão de expandir/colapsar no card
- [x] Ajustar layout para mostrar informações completas quando expandido
- [x] Reorganizar layout dos cards financeiros para 3 colunas
- [x] Empilhar cards de Entradas e Saídas verticalmente no meio
- [x] Manter tamanho cheio dos cards Saldo Atual Total e Saldo Anterior nas laterais
- [x] Corrigir overflow no card "Saldo Anterior" expandido (informações cortadas no lado direito)
- [x] Ajustar CSS para garantir que todo o conteúdo seja visível quando o card estiver expandido

## Simplificação da Interface
- [x] Remover calendários de seleção de data (Popover com Calendar)
- [x] Implementar navegação simplificada com botões de anterior/próximo dia
- [x] Manter botão "Hoje" para acesso rápido à data atual

## Ajuste do Seletor de Período
- [x] Restaurar seletor de período com calendários na parte superior do dashboard
- [x] Manter navegação simples (sem calendário) dentro do card Saldo Anterior
- [x] Restaurar funcionalidade de modo relatório por período (range mode)

## Correções na Página de Configurações de Marca
- [x] Corrigir funcionalidade de mudança de cor do sistema (não está aplicando)
- [x] Implementar upload de logomarca para S3 ao invés de usar URL de domínio
- [x] Adicionar preview da imagem após upload
- [x] Validar formato e tamanho da imagem

## Correção do Botão Salvar na Página de Marca
- [x] Adicionar botão "Salvar Alterações" visível na página de configurações de marca
- [x] Implementar funcionalidade de salvar nome do aplicativo, logo e cor primária
- [x] Adicionar feedback visual (toast) ao salvar com sucesso
- [x] Investigar por que botão não aparece para o usuário
- [x] Verificar se há problema de CSS ou renderização condicional
- [x] Confirmar botão presente e visível no DOM (problema de cache do navegador)

## Correção de Visibilidade do Botão Aplicar Alterações
- [x] Ajustar layout para que botão fique visível sem scroll
- [x] Reduzir espaçamentos ou reorganizar elementos
- [x] Testar em diferentes resoluções de tela

## Problema Crítico: Botão Não Aparece no Navegador do Usuário
- [x] Analisar vídeo do usuário mostrando que botão não aparece
- [x] Verificar se há problema de overflow ou height no card
- [x] Adicionar botão fixo no rodapé do card sempre visível (CardFooter)
- [x] Testar em resolução menor (como a do usuário)

## Correções no Botão Aplicar Alterações
- [x] Corrigir cor do texto do botão (está quase imperceptível)eptível)
- [x] Implementar funcionalidade de salvar que não está funcionando ao clicar
- [x] Adicionar feedback visual claro quando alterações forem salvas
- [x] Testar upload de logo e mudança de cor primária

## Manual de Duplicação de Projeto
- [x] Capturar screenshots da interface de gerenciamento
- [x] Criar manual passo a passo em Markdown
- [x] Adicionar anotações e setas nas imagens
- [x] Incluir diagramas explicativos
