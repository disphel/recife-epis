# Brainstorming de Design - Sistema de Controle Financeiro (Identidade Disphel)

## <response>
<text>
### <idea>
**Design Movement**: Corporate Clean (Disphel Identity)
**Core Principles**:
1. **Identidade Visual Forte**: Uso predominante do Azul Disphel para reforçar a marca.
2. **Profissionalismo**: Layout sóbrio e direto, transmitindo confiança e seriedade.
3. **Foco em Dados**: O design deve servir aos dados, não o contrário.
4. **Acessibilidade**: Alto contraste entre texto e fundo para facilitar a leitura.

**Color Philosophy**:
- **Primária (Disphel Blue)**: `#003366` (Azul Marinho Profundo) - Usado em cabeçalhos, sidebar e botões primários.
- **Secundária (Disphel Light Blue)**: `#0055AA` (Azul Médio) - Usado em destaques e estados de hover.
- **Acento (Disphel Green)**: `#4CAF50` (Verde) - Usado para saldos positivos e confirmações (similar ao verde do logo "Safety Clean").
- **Fundo**: `#F8FAFC` (Slate 50) - Fundo claro para manter a limpeza visual.
- **Texto**: `#1E293B` (Slate 800) - Cinza escuro para legibilidade, evitando preto puro.

**Layout Paradigm**:
- **Sidebar Escura**: Menu lateral na cor primária (`#003366`) com logo branco, criando uma âncora visual forte.
- **Cards Brancos**: Conteúdo em cards brancos com bordas sutis (`border-slate-200`) e sombras leves (`shadow-sm`).
- **Cabeçalhos Claros**: Títulos de seção em azul escuro, com linhas divisórias discretas.

**Signature Elements**:
1. **Logo Disphel em Destaque**: No topo da sidebar.
2. **Botões Sólidos**: Botões com cantos levemente arredondados (`rounded-md`) e cor sólida.
3. **Tabelas Zebradas**: Linhas alternadas em cinza muito claro para facilitar a leitura de linhas longas.

**Interaction Philosophy**:
- Feedback visual claro em botões e links.
- Transições rápidas e diretas.
- Tooltips informativos em ícones de alerta.

**Animation**:
- Mínima, focada apenas em feedback de ação (ex: clique de botão).

**Typography System**:
- **Fonte**: 'Inter' ou 'Roboto' - Fontes corporativas padrão, limpas e legíveis.
- **Pesos**: Bold para cabeçalhos, Regular para dados.
</idea>
</text>
<probability>1.0</probability>
</response>

## Escolha Final

Seguirei o estilo **Corporate Clean (Disphel Identity)**.

**Cores Extraídas (Aproximadas do Site/Logo)**:
- **Azul Escuro (Nav/Header)**: `#0B1E3D` (Baseado no azul profundo do site)
- **Azul Vibrante (Destaques)**: `#0056D2` (Baseado em botões/links)
- **Verde (Detalhes/Logo)**: `#4ADE80` (Verde claro do ícone "D" e detalhes de segurança)
- **Branco**: `#FFFFFF`

**Ajustes no Tailwind**:
- Configurar `primary` para o Azul Escuro.
- Configurar `secondary` para o Azul Vibrante.
- Configurar `accent` para o Verde Disphel.
