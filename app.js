// ========================================
// CONFIGURAÇÃO
// ========================================

// URL do Google Apps Script (OBRIGATÓRIA - configure antes de usar)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwasgAgTaqGLE9GwBggZCQLrwVdnT-ct0ZUPCduyn1AQPxzpGG4fcchLZqNMjXIoWq0/exec'; // Cole aqui a URL do seu Web App do Google Apps Script

// ========================================
// ESTADO DA APLICAÇÃO
// ========================================

let todayRecord = null;
let monthRecords = [];

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    initializeClock();
    
    // Verificar se a URL do Google Sheets foi configurada
    if (!GOOGLE_SCRIPT_URL) {
        showToast('⚠️ Configure a URL do Google Apps Script no arquivo app.js', 'error');
        console.error('GOOGLE_SCRIPT_URL não configurada!');
    } else {
        // Carregar dados do Google Sheets
        loadFromGoogleSheets();
    }
});

// ========================================
// RELÓGIO
// ========================================

function initializeClock() {
    updateClock();
    setInterval(updateClock, 1000);
}

function updateClock() {
    const now = new Date();
    
    // Atualizar data
    const dateOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    document.getElementById('currentDate').textContent = 
        now.toLocaleDateString('pt-BR', dateOptions);
    
    // Atualizar hora
    document.getElementById('currentTime').textContent = 
        now.toLocaleTimeString('pt-BR');
    
    // Atualizar mês atual
    const monthOptions = { month: 'long', year: 'numeric' };
    document.getElementById('currentMonth').textContent = 
        now.toLocaleDateString('pt-BR', monthOptions);
}

// ========================================
// REGISTRO AUTOMÁTICO
// ========================================

function registerEntry() {
    const { date, time } = getCurrentDateTime();
    
    todayRecord = {
        id: Date.now().toString(),
        date: date,
        entryTime: time,
        type: 'automatic'
    };
    
    updateUI();
    saveToGoogleSheets(todayRecord);
}

function registerBreakStart() {
    if (!todayRecord || !todayRecord.entryTime) {
        showToast('Registre a entrada primeiro', 'error');
        return;
    }
    
    const { time } = getCurrentDateTime();
    todayRecord.breakStartTime = time;
    
    updateUI();
    saveToGoogleSheets(todayRecord);
}

function registerBreakEnd() {
    if (!todayRecord || !todayRecord.breakStartTime) {
        showToast('Registre o início do intervalo primeiro', 'error');
        return;
    }
    
    const { time } = getCurrentDateTime();
    todayRecord.breakEndTime = time;
    
    updateUI();
    saveToGoogleSheets(todayRecord);
}

function registerExit() {
    if (!todayRecord || !todayRecord.entryTime) {
        showToast('Registre a entrada primeiro', 'error');
        return;
    }
    
    const { time } = getCurrentDateTime();
    todayRecord.exitTime = time;
    
    updateUI();
    saveToGoogleSheets(todayRecord);
    
    // Após salvar a saída, recarregar dados para atualizar a lista
    setTimeout(() => {
        loadFromGoogleSheets();
    }, 2000);
}

// ========================================
// REGISTRO MANUAL
// ========================================

function handleManualSubmit(event) {
    event.preventDefault();
    
    const dateInput = document.getElementById('manualDate').value;
    const entryTime = document.getElementById('manualEntry').value;
    const breakStartTime = document.getElementById('manualBreakStart').value;
    const breakEndTime = document.getElementById('manualBreakEnd').value;
    const exitTime = document.getElementById('manualExit').value;
    
    if (!dateInput) {
        showToast('Data é obrigatória', 'error');
        return;
    }
    
    if (!entryTime && !breakStartTime && !breakEndTime && !exitTime) {
        showToast('Preencha pelo menos um horário', 'error');
        return;
    }
    
    // Converter data do input para formato brasileiro
    const [year, month, day] = dateInput.split('-');
    const formattedDate = `${day}/${month}/${year}`;
    
    const manualRecord = {
        id: Date.now().toString(),
        date: formattedDate,
        entryTime: entryTime || null,
        breakStartTime: breakStartTime || null,
        breakEndTime: breakEndTime || null,
        exitTime: exitTime || null,
        type: 'manual'
    };
    
    // Limpar formulário
    document.getElementById('manualForm').reset();
    
    // Salvar no Google Sheets
    saveToGoogleSheets(manualRecord);
    
    // Recarregar dados após 2 segundos
    setTimeout(() => {
        loadFromGoogleSheets();
    }, 2000);
}

// ========================================
// ATUALIZAÇÃO DA INTERFACE
// ========================================

function updateUI() {
    updateButtons();
    updateTodayRecord();
    updateMonthRecords();
}

function updateButtons() {
    const btnEntry = document.getElementById('btnEntry');
    const btnBreakStart = document.getElementById('btnBreakStart');
    const btnBreakEnd = document.getElementById('btnBreakEnd');
    const btnExit = document.getElementById('btnExit');
    
    // Botão de entrada
    btnEntry.disabled = todayRecord && todayRecord.entryTime;
    
    // Botão de intervalo
    btnBreakStart.disabled = !todayRecord || !todayRecord.entryTime || todayRecord.breakStartTime;
    
    // Botão de retorno
    btnBreakEnd.disabled = !todayRecord || !todayRecord.breakStartTime || todayRecord.breakEndTime;
    
    // Botão de saída
    btnExit.disabled = !todayRecord || !todayRecord.entryTime || todayRecord.exitTime;
}

function updateTodayRecord() {
    const card = document.getElementById('todayRecordCard');
    const content = document.getElementById('todayRecordContent');
    const dateElement = document.getElementById('todayRecordDate');
    const totalElement = document.getElementById('todayRecordTotal');
    const totalHours = document.getElementById('totalHours');
    
    if (!todayRecord || !todayRecord.entryTime) {
        card.classList.add('d-none');
        return;
    }
    
    card.classList.remove('d-none');
    card.classList.add('fade-in');
    dateElement.textContent = todayRecord.date;
    
    let html = '';
    
    if (todayRecord.entryTime) {
        html += createTimeRecordItem('Entrada', todayRecord.entryTime);
    }
    if (todayRecord.breakStartTime) {
        html += createTimeRecordItem('Início Intervalo', todayRecord.breakStartTime);
    }
    if (todayRecord.breakEndTime) {
        html += createTimeRecordItem('Fim Intervalo', todayRecord.breakEndTime);
    }
    if (todayRecord.exitTime) {
        html += createTimeRecordItem('Saída', todayRecord.exitTime);
    }
    
    content.innerHTML = html;
    
    // Mostrar total se tiver entrada e saída
    if (todayRecord.entryTime && todayRecord.exitTime) {
        totalElement.classList.remove('d-none');
        totalHours.textContent = calculateWorkHours(todayRecord);
    } else {
        totalElement.classList.add('d-none');
    }
}

function createTimeRecordItem(label, time) {
    return `
        <div class="col-6">
            <div class="time-record-item">
                <div class="time-record-label">${label}</div>
                <div class="time-record-value">${time}</div>
            </div>
        </div>
    `;
}

function updateMonthRecords() {
    const container = document.getElementById('monthRecordsList');
    
    if (monthRecords.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="bi bi-calendar3 fs-1 opacity-50"></i>
                <p class="mt-3">Nenhum registro encontrado neste mês</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    monthRecords.forEach(record => {
        html += createMonthRecordCard(record);
    });
    
    container.innerHTML = html;
}

function createMonthRecordCard(record) {
    const badgeClass = record.type === 'manual' ? 'record-badge-manual' : 'record-badge-auto';
    const badgeText = record.type === 'manual' ? 'Manual' : 'Automático';
    const workHours = calculateWorkHours(record);
    
    return `
        <div class="month-record-card fade-in">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <div>
                    <h6 class="mb-1">${record.date}</h6>
                    <span class="record-badge ${badgeClass}">${badgeText}</span>
                </div>
                <div class="text-end">
                    <div class="fw-bold text-primary">${workHours}</div>
                </div>
            </div>
            <div class="row g-2 mt-2">
                ${record.entryTime ? `
                    <div class="col-6 col-md-3">
                        <small class="text-muted d-block">Entrada</small>
                        <span class="fw-semibold">${record.entryTime}</span>
                    </div>
                ` : ''}
                ${record.breakStartTime ? `
                    <div class="col-6 col-md-3">
                        <small class="text-muted d-block">Intervalo</small>
                        <span class="fw-semibold">${record.breakStartTime}</span>
                    </div>
                ` : ''}
                ${record.breakEndTime ? `
                    <div class="col-6 col-md-3">
                        <small class="text-muted d-block">Retorno</small>
                        <span class="fw-semibold">${record.breakEndTime}</span>
                    </div>
                ` : ''}
                ${record.exitTime ? `
                    <div class="col-6 col-md-3">
                        <small class="text-muted d-block">Saída</small>
                        <span class="fw-semibold">${record.exitTime}</span>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// ========================================
// CÁLCULOS
// ========================================

function calculateWorkHours(record) {
    if (!record.entryTime || !record.exitTime) {
        return '-';
    }
    
    const [entryHour, entryMin] = record.entryTime.split(':').map(Number);
    const [exitHour, exitMin] = record.exitTime.split(':').map(Number);
    
    let totalMinutes = (exitHour * 60 + exitMin) - (entryHour * 60 + entryMin);
    
    // Subtrair intervalo se houver
    if (record.breakStartTime && record.breakEndTime) {
        const [breakStartHour, breakStartMin] = record.breakStartTime.split(':').map(Number);
        const [breakEndHour, breakEndMin] = record.breakEndTime.split(':').map(Number);
        const breakMinutes = (breakEndHour * 60 + breakEndMin) - (breakStartHour * 60 + breakStartMin);
        totalMinutes -= breakMinutes;
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours}h ${minutes}min`;
}

// ========================================
// UTILITÁRIOS
// ========================================

function getCurrentDateTime() {
    const now = new Date();
    const date = now.toLocaleDateString('pt-BR');
    const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return { date, time };
}

function showToast(message, type = 'success') {
    const toastElement = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    
    // Remover classes anteriores
    toastElement.classList.remove('error');
    
    // Adicionar classe de erro se necessário
    if (type === 'error') {
        toastElement.classList.add('error');
    }
    
    const toast = new bootstrap.Toast(toastElement, {
        delay: 4000
    });
    toast.show();
}

function parseDate(dateString) {
    // Converter DD/MM/YYYY para Date
    const [day, month, year] = dateString.split('/').map(Number);
    return new Date(year, month - 1, day);
}

// ========================================
// INTEGRAÇÃO GOOGLE SHEETS
// ========================================

function saveToGoogleSheets(record) {
    if (!GOOGLE_SCRIPT_URL) {
        showToast('Configure a URL do Google Apps Script primeiro!', 'error');
        console.error('GOOGLE_SCRIPT_URL não configurada');
        return;
    }
    
    try {
        showToast('Salvando...', 'success');
        
        // Criar um formulário invisível para enviar dados (evita CORS)
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = GOOGLE_SCRIPT_URL;
        form.target = 'hidden_iframe';
        form.style.display = 'none';
        
        // Adicionar campos
        const fields = {
            date: record.date,
            entryTime: record.entryTime || '',
            breakStartTime: record.breakStartTime || '',
            breakEndTime: record.breakEndTime || '',
            exitTime: record.exitTime || '',
            type: record.type
        };
        
        for (const [key, value] of Object.entries(fields)) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = value;
            form.appendChild(input);
        }
        
        // Criar iframe invisível para receber resposta
        let iframe = document.getElementById('hidden_iframe');
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.id = 'hidden_iframe';
            iframe.name = 'hidden_iframe';
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
        }
        
        // Adicionar form ao body e enviar
        document.body.appendChild(form);
        form.submit();
        
        // Remover form após envio
        setTimeout(() => {
            document.body.removeChild(form);
            showToast('✅ Registro salvo com sucesso!', 'success');
        }, 1000);
        
        console.log('Dados enviados para Google Sheets:', fields);
        
    } catch (error) {
        showToast('❌ Erro ao salvar', 'error');
        console.error('Erro ao salvar:', error);
    }
}

async function loadFromGoogleSheets() {
    if (!GOOGLE_SCRIPT_URL) {
        console.warn('GOOGLE_SCRIPT_URL não configurada');
        return;
    }
    
    try {
        showToast('Carregando dados...', 'success');
        
        const response = await fetch(GOOGLE_SCRIPT_URL + '?action=get', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Erro na resposta do servidor');
        }
        
        const result = await response.json();
        console.log('Dados recebidos:', result);
        
        if (result.success && result.data) {
            // Processar dados recebidos
            monthRecords = result.data.map(item => ({
                id: item.timestamp || Date.now().toString(),
                date: item.date,
                entryTime: item.entryTime || null,
                breakStartTime: item.breakStartTime || null,
                breakEndTime: item.breakEndTime || null,
                exitTime: item.exitTime || null,
                type: item.type || 'automatic'
            }));
            
            // Verificar se existe registro de hoje
            const today = new Date().toLocaleDateString('pt-BR');
            const todayData = monthRecords.find(r => r.date === today);
            
            if (todayData) {
                todayRecord = todayData;
            } else {
                todayRecord = null;
            }
            
            updateUI();
            showToast('✅ Dados carregados!', 'success');
            console.log('Total de registros:', monthRecords.length);
        } else {
            showToast('⚠️ Nenhum dado encontrado', 'error');
            console.warn('Resposta sem dados:', result);
        }
        
    } catch (error) {
        showToast('❌ Erro ao carregar dados', 'error');
        console.error('Erro ao carregar:', error);
    }
}
