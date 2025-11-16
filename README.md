# Sistema de Ponto Eletrônico - Versão Simplificada

Sistema web responsivo para registro de ponto eletrônico usando apenas **HTML, CSS, Bootstrap e JavaScript puro**.

**IMPORTANTE**: Este sistema armazena dados APENAS no Google Planilhas. A configuração do Google Apps Script é OBRIGATÓRIA.

## 📁 Estrutura de Arquivos

```
public-html/
├── index.html          # Estrutura HTML principal
├── style.css           # Estilos customizados
├── app.js              # Lógica JavaScript
└── README.md           # Este arquivo
```

## 🔧 Configuração OBRIGATÓRIA - Google Planilhas

### Passo 1: Criar a Planilha

1. Acesse [Google Drive](https://drive.google.com)
2. Crie uma nova **Planilha Google**
3. Renomeie para **"Ponto Eletrônico"**
4. Renomeie a primeira aba para **"Registros"**
5. Na **linha 1**, adicione os seguintes cabeçalhos:

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| Timestamp | Data | Entrada | Início Intervalo | Fim Intervalo | Saída | Tipo |

### Passo 2: Criar o Google Apps Script

1. Na planilha, clique em **Extensões** → **Apps Script**
2. **Apague todo o código** que aparece
3. **Cole o código abaixo**:

```javascript
const SHEET_NAME = 'Registros';

function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    // Remover cabeçalho
    const headers = data[0];
    const records = data.slice(1);
    
    // Converter para JSON
    const jsonData = records.map(row => ({
      timestamp: row[0],
      date: row[1],
      entryTime: row[2] || null,
      breakStartTime: row[3] || null,
      breakEndTime: row[4] || null,
      exitTime: row[5] || null,
      type: row[6] || 'automatic'
    }));
    
    // Filtrar registros do mês atual
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthRecords = jsonData.filter(record => {
      if (!record.timestamp) return false;
      const recordDate = new Date(record.timestamp);
      return recordDate.getMonth() === currentMonth && 
             recordDate.getFullYear() === currentYear;
    });
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        data: monthRecords,
        total: monthRecords.length 
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    
    // Parse dos dados recebidos
    const data = JSON.parse(e.postData.contents);
    
    // Validar dados obrigatórios
    if (!data.date) {
      throw new Error('Data é obrigatória');
    }
    
    // Preparar linha para inserção
    const timestamp = new Date();
    const row = [
      timestamp,
      data.date,
      data.entryTime || '',
      data.breakStartTime || '',
      data.breakEndTime || '',
      data.exitTime || '',
      data.type || 'automatic'
    ];
    
    // Adicionar nova linha
    sheet.appendRow(row);
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        message: 'Registro salvo com sucesso',
        timestamp: timestamp.toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

4. Clique em **Salvar** (ícone de disquete ou Ctrl+S)
5. Dê um nome ao projeto: **"API Ponto Eletrônico"**

### Passo 3: Publicar o Web App

1. No Apps Script, clique em **Implantar** → **Nova implantação**
2. Clique no ícone de **engrenagem ⚙️** ao lado de "Selecionar tipo"
3. Selecione **Aplicativo da Web**
4. Configure:
   - **Descrição**: "API do Sistema de Ponto Eletrônico"
   - **Executar como**: **Eu** (seu email)
   - **Quem tem acesso**: **Qualquer pessoa**
5. Clique em **Implantar**
6. **Autorize o aplicativo** quando solicitado (clique em "Autorizar acesso")
7. **COPIE A URL** que aparece (algo como: `https://script.google.com/macros/s/AKfycby...../exec`)

⚠️ **MUITO IMPORTANTE**: Guarde esta URL! Você vai precisar dela no próximo passo.

### Passo 4: Configurar a URL no Sistema

1. Abra o arquivo **`app.js`**
2. Na **linha 7**, cole a URL que você copiou:

```javascript
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/SEU_ID_AQUI/exec';
```

**Exemplo:**
```javascript
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/exec';
```

3. **Salve o arquivo**

### Passo 5: Testar

1. Abra o arquivo `index.html` no navegador
2. Clique em **"Registrar Entrada"**
3. Verifique se aparece a mensagem **"✅ Registro salvo com sucesso!"**
4. Abra a planilha do Google e verifique se os dados foram gravados

## 🚀 Hospedagem no GitHub Pages

Após configurar o Google Sheets:

1. **Crie um repositório no GitHub**
2. **Faça upload dos 3 arquivos**:
   - `index.html`
   - `style.css`
   - `app.js` (com a URL já configurada)
3. **Ative o GitHub Pages**:
   - Settings → Pages
   - Source: branch `main`, pasta `/ (root)`
   - Save
4. **Acesse** em `https://seu-usuario.github.io/nome-do-repositorio`

## 📱 Funcionalidades

### ✅ Registro Automático
- **Registrar Entrada**: Captura data/hora automaticamente
- **Registrar Intervalo**: Marca início do intervalo
- **Retorno Intervalo**: Marca fim do intervalo
- **Registrar Saída**: Marca saída e calcula horas trabalhadas

### ✏️ Registro Manual
- Preencha data e horários manualmente
- Útil para registros esquecidos
- Não precisa preencher todos os campos

### 📊 Visualização
- Registro do dia atual em destaque
- Lista de todos os registros do mês
- Cálculo automático de horas trabalhadas
- Diferenciação entre registros automáticos e manuais

## 🐛 Solução de Problemas

### ❌ "Configure a URL do Google Apps Script"

**Problema**: A URL não foi configurada no arquivo `app.js`

**Solução**:
1. Abra o arquivo `app.js`
2. Na linha 7, cole a URL do seu Web App
3. Salve o arquivo

### ❌ "Erro ao salvar no Google Sheets"

**Possíveis causas**:

1. **URL incorreta**
   - Verifique se copiou a URL completa
   - A URL deve terminar com `/exec`

2. **Permissões**
   - Verifique se autorizou o script
   - Verifique se "Quem tem acesso" está como "Qualquer pessoa"

3. **Nome da aba**
   - A aba da planilha DEVE se chamar "Registros"
   - Verifique se não tem espaços extras

### ❌ "Nenhum dado encontrado"

**Possíveis causas**:

1. **Planilha vazia**
   - Registre um ponto primeiro

2. **Cabeçalhos incorretos**
   - Verifique se os cabeçalhos estão exatamente como mostrado acima
   - Devem estar na linha 1

3. **Mês diferente**
   - O sistema mostra apenas registros do mês atual

### 🔍 Como Debugar

1. **Abra o Console do navegador** (F12 ou Ctrl+Shift+I)
2. Vá na aba **Console**
3. Clique em "Registrar Entrada"
4. Veja as mensagens que aparecem:
   - ✅ "Dados enviados" = Está funcionando
   - ❌ Erro = Copie a mensagem de erro

## 📊 Estrutura da Planilha

A planilha ficará assim:

| Timestamp | Data | Entrada | Início Intervalo | Fim Intervalo | Saída | Tipo |
|-----------|------|---------|------------------|---------------|-------|------|
| 16/11/2025 20:30:00 | 16/11/2025 | 08:00 | 12:00 | 13:00 | 17:00 | automatic |
| 15/11/2025 18:45:00 | 15/11/2025 | 08:15 | 12:15 | 13:15 | 17:30 | manual |

## 🎨 Personalização

### Alterar Cores

Edite `style.css`, linhas 2-8:

```css
:root {
    --primary-color: #4F7CFF;      /* Azul principal */
    --success-color: #4CAF50;      /* Verde */
    --danger-color: #EF5350;       /* Vermelho */
}
```

### Alterar Título

Edite `index.html`:
- Linha 7: `<title>Seu Título</title>`
- Linha 24: `<h1>Seu Título</h1>`

## 🔒 Segurança

⚠️ **Atenção**: Qualquer pessoa com a URL pode registrar pontos.

Para aumentar a segurança:
1. Não compartilhe a URL publicamente
2. Use apenas em rede interna da empresa
3. Adicione autenticação (requer programação adicional)

## 📞 Suporte

Se tiver problemas:
1. Leia a seção "Solução de Problemas"
2. Verifique o Console do navegador (F12)
3. Verifique se seguiu todos os passos
4. Teste com a planilha aberta para ver se os dados aparecem

## ✅ Checklist de Configuração

- [ ] Criei a planilha no Google Drive
- [ ] Renomeei a aba para "Registros"
- [ ] Adicionei os cabeçalhos na linha 1
- [ ] Criei o Google Apps Script
- [ ] Colei o código no Apps Script
- [ ] Salvei o projeto
- [ ] Implantei como Web App
- [ ] Autorizei o aplicativo
- [ ] Copiei a URL do Web App
- [ ] Colei a URL no arquivo app.js
- [ ] Salvei o arquivo app.js
- [ ] Testei registrando um ponto
- [ ] Verifiquei se os dados apareceram na planilha

Se todos os itens estiverem marcados, o sistema está funcionando! 🎉
