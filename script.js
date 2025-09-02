// Variables globales del juego
let gameState = {
    level: 16,
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    totalPairs: 0,
    gameStarted: false,
    gameCompleted: false,
    startTime: null,
    timerInterval: null,
    showingPreview: false,
    previewTimeout: null
};

// Elementos del DOM
const elements = {
    levelSelection: document.getElementById('level-selection'),
    gameBoard: document.getElementById('game-board'),
    cardsContainer: document.getElementById('cards-container'),
    timer: document.getElementById('timer'),
    victoryModal: document.getElementById('victory-modal'),
    successModal: document.getElementById('success-modal'),
    finalTime: document.getElementById('final-time'),
    registrationForm: document.getElementById('registration-form'),
    topRankings: document.getElementById('top-rankings'),
    rankingsModal: document.getElementById('rankings-modal'),
    fullRankingsContent: document.getElementById('full-rankings-content')
};

// Event Listeners
document.addEventListener('DOMContentLoaded', initializeGame);

// Botones de nivel
document.getElementById('level-12').addEventListener('click', () => startGame(12));
document.getElementById('level-16').addEventListener('click', () => startGame(16));

// Botones de control
document.getElementById('new-game-btn').addEventListener('click', () => startGame(gameState.level));
document.getElementById('change-level-btn').addEventListener('click', showLevelSelection);

// Botones de modal
document.getElementById('play-again-btn').addEventListener('click', () => {
    hideModal();
    startGame(gameState.level);
});

document.getElementById('final-play-again-btn').addEventListener('click', () => {
    hideModal();
    showLevelSelection();
});

// Formulario de registro
elements.registrationForm.addEventListener('submit', handleRegistration);

// Botones de rankings
document.getElementById('view-full-rankings').addEventListener('click', showFullRankings);
document.getElementById('close-rankings').addEventListener('click', hideRankingsModal);
document.getElementById('rankings-tab-12').addEventListener('click', () => showRankingsTab(12));
document.getElementById('rankings-tab-16').addEventListener('click', () => showRankingsTab(16));
document.getElementById('export-csv').addEventListener('click', exportToCSV);

// Inicialización del juego
function initializeGame() {
    showLevelSelection();
    resetTimer();
    loadTopRankings();
}

// Mostrar selección de nivel
function showLevelSelection() {
    elements.levelSelection.classList.remove('hidden');
    elements.gameBoard.classList.add('hidden');
    resetGame();
}

// Iniciar juego con nivel específico
function startGame(level) {
    gameState.level = level;
    gameState.totalPairs = level / 2;
    
    elements.levelSelection.classList.add('hidden');
    elements.gameBoard.classList.remove('hidden');
    
    setupGameBoard();
    resetGame();
}

// Configurar el tablero de juego
function setupGameBoard() {
    const container = elements.cardsContainer;
    
    // Limpiar contenedor
    container.innerHTML = '';
    
    // Configurar grid según el nivel
    container.className = `cards-container grid-${gameState.level}`;
    
    // Crear cartas
    createCards();
    
    // Mostrar preview de 3 segundos
    showCardsPreview();
}

// Crear las cartas del juego
function createCards() {
    const pairs = gameState.totalPairs;
    const cardValues = [];
    
    // Crear pares de cartas
    for (let i = 1; i <= pairs; i++) {
        cardValues.push(i, i);
    }
    
    // Mezclar cartas
    shuffleArray(cardValues);
    
    // Crear elementos de carta
    gameState.cards = [];
    cardValues.forEach((value, index) => {
        const card = createCardElement(value, index);
        gameState.cards.push({
            element: card,
            value: value,
            isFlipped:  false,
            isMatched: false
        });
        elements.cardsContainer.appendChild(card);
    });
}

// Crear elemento de carta individual
function createCardElement(value, index) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.index = index;
    card.dataset.value = value;
    
    // Cara trasera
    const cardBack = document.createElement('div');
    cardBack.className = 'card-face card-back';
    
    // Cara frontal
    const cardFront = document.createElement('div');
    cardFront.className = 'card-face card-front';
    cardFront.style.backgroundImage = `url('images/ic_pair_${value}.png')`;
    
    card.appendChild(cardBack);
    card.appendChild(cardFront);
    
    // Event listener para voltear carta
    card.addEventListener('click', () => flipCard(index));
    
    return card;
}

// Mostrar preview de cartas por 3 segundos
function showCardsPreview() {
    gameState.showingPreview = true;
    
    // Asegurar que todas las cartas estén en estado inicial
    gameState.cards.forEach(cardData => {
        cardData.isFlipped = false;
        cardData.element.classList.remove('flipped');
    });
    
    // Pequeño delay para asegurar que las cartas estén en posición inicial
    setTimeout(() => {
        // Voltear todas las cartas para mostrar el contenido
        gameState.cards.forEach(cardData => {
            cardData.element.classList.add('flipped');
            cardData.isFlipped = true;
        });
        
        // Actualizar el cronómetro para mostrar "Memoriza!"
        elements.timer.textContent = 'Memoriza!';
        elements.timer.style.backgroundColor = '#7FB827';
        elements.timer.style.color = 'white';
        
        // Después de 3 segundos, ocultar las cartas y permitir el juego
        gameState.previewTimeout = setTimeout(() => {
            // Voltear todas las cartas de vuelta
            gameState.cards.forEach(cardData => {
                cardData.element.classList.remove('flipped');
                cardData.isFlipped = false;
            });
            
            // Restaurar el cronómetro
            elements.timer.textContent = '00:00';
            elements.timer.style.backgroundColor = 'rgba(249, 107, 1, 0.1)';
            elements.timer.style.color = '#F96B01';
            
            // Permitir el juego
            gameState.showingPreview = false;
            
            // Mostrar mensaje de "¡Comienza!"
            showStartMessage();
        }, 3000);
    }, 100);
}

// Mostrar mensaje de inicio
function showStartMessage() {
    elements.timer.textContent = '¡Comienza!';
    elements.timer.style.backgroundColor = '#F96B01';
    elements.timer.style.color = 'white';
    
    setTimeout(() => {
        elements.timer.textContent = '00:00';
        elements.timer.style.backgroundColor = 'rgba(249, 107, 1, 0.1)';
        elements.timer.style.color = '#F96B01';
    }, 1000);
}

// Voltear carta
function flipCard(index) {
    const cardData = gameState.cards[index];
    
    // No permitir clics durante el preview
    if (gameState.showingPreview) {
        return;
    }
    
    // Verificar si la carta puede ser volteada
    if (cardData.isFlipped || cardData.isMatched || gameState.flippedCards.length >= 2) {
        return;
    }
    
    // Iniciar cronómetro en el primer clic
    if (!gameState.gameStarted) {
        startTimer();
        gameState.gameStarted = true;
    }
    
    // Voltear carta
    cardData.isFlipped = true;
    cardData.element.classList.add('flipped');
    gameState.flippedCards.push(cardData);
    
    // Verificar si hay dos cartas volteadas - tiempo reducido para más competitividad
    if (gameState.flippedCards.length === 2) {
        setTimeout(checkMatch, 400); // Reducido de 1000ms a 600ms
    }
}

// Verificar coincidencia
function checkMatch() {
    const [card1, card2] = gameState.flippedCards;
    
    if (card1.value === card2.value) {
        // Coincidencia encontrada - las cartas quedan volteadas permanentemente
        card1.isMatched = true;
        card2.isMatched = true;
        card1.element.classList.add('matched');
        card2.element.classList.add('matched');
        
        // Las cartas matched mantienen la clase 'flipped' para mostrar la imagen
        // No removemos la clase 'flipped' para que sigan mostrando la imagen
        
        gameState.matchedPairs++;
        
        // Verificar si el juego está completo
        if (gameState.matchedPairs === gameState.totalPairs) {
            setTimeout(completeGame, 500); // Pequeño delay para mostrar la última pareja
        }
    } else {
        // No hay coincidencia, voltear cartas de vuelta más rápido
        card1.isFlipped = false;
        card2.isFlipped = false;
        card1.element.classList.remove('flipped');
        card2.element.classList.remove('flipped');
    }
    
    // Limpiar cartas volteadas
    gameState.flippedCards = [];
}

// Completar juego
function completeGame() {
    gameState.gameCompleted = true;
    stopTimer();
    
    // Mostrar tiempo final
    elements.finalTime.textContent = elements.timer.textContent;
    
    // Mostrar modal de victoria
    elements.victoryModal.classList.remove('hidden');
}

// Manejar registro de participante
function handleRegistration(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const participantData = {
        nombre: formData.get('nombre'),
        apellido: formData.get('apellido'),
        rut: formData.get('rut'),
        edad: formData.get('edad'),
        curso: formData.get('curso'),
        telefono: formData.get('telefono'),
        tiempo: elements.timer.textContent,
        nivel: gameState.level,
        fecha: new Date().toISOString()
    };
    
    // Validar RUT solo si se proporciona
    if (participantData.rut && participantData.rut.trim() !== '' && !validateRUT(participantData.rut)) {
        alert('Por favor, ingresa un RUT válido (formato: 12.345.678-9) o déjalo vacío');
        return;
    }
    
    // Guardar datos (en localStorage para esta demo)
    saveParticipantData(participantData);
    
    // Actualizar rankings
    loadTopRankings();
    
    // Mostrar mensaje de éxito
    elements.victoryModal.classList.add('hidden');
    elements.successModal.classList.remove('hidden');
    
    // Limpiar formulario
    event.target.reset();
}

// Validar RUT chileno
function validateRUT(rut) {
    // Remover puntos y guión
    const cleanRUT = rut.replace(/[.-]/g, '');
    
    // Verificar formato básico
    if (!/^\d{7,8}[0-9Kk]$/.test(cleanRUT)) {
        return false;
    }
    
    const body = cleanRUT.slice(0, -1);
    const dv = cleanRUT.slice(-1).toLowerCase();
    
    // Calcular dígito verificador
    let sum = 0;
    let multiplier = 2;
    
    for (let i = body.length - 1; i >= 0; i--) {
        sum += parseInt(body[i]) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    
    const remainder = sum % 11;
    const calculatedDV = remainder < 2 ? remainder.toString() : 'k';
    
    return dv === calculatedDV;
}

// Guardar datos del participante
function saveParticipantData(data) {
    try {
        let participants = JSON.parse(localStorage.getItem('memorice_participants') || '[]');
        participants.push(data);
        localStorage.setItem('memorice_participants', JSON.stringify(participants));
        
        console.log('Datos guardados:', data);
        console.log('Total participantes:', participants.length);
    } catch (error) {
        console.error('Error al guardar datos:', error);
    }
}

// Funciones del cronómetro
function startTimer() {
    gameState.startTime = Date.now();
    gameState.timerInterval = setInterval(updateTimer, 100);
}

function stopTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

function resetTimer() {
    stopTimer();
    elements.timer.textContent = '00:00';
    elements.timer.style.backgroundColor = 'rgba(249, 107, 1, 0.1)';
    elements.timer.style.color = '#F96B01';
    gameState.startTime = null;
}

function updateTimer() {
    if (!gameState.startTime) return;
    
    const elapsed = Date.now() - gameState.startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    elements.timer.textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Resetear juego
function resetGame() {
    gameState.flippedCards = [];
    gameState.matchedPairs = 0;
    gameState.gameStarted = false;
    gameState.gameCompleted = false;
    gameState.showingPreview = false;
    
    // Limpiar timeout del preview si existe
    if (gameState.previewTimeout) {
        clearTimeout(gameState.previewTimeout);
        gameState.previewTimeout = null;
    }
    
    // Asegurar que todas las cartas estén en estado inicial
    if (gameState.cards && gameState.cards.length > 0) {
        gameState.cards.forEach(cardData => {
            cardData.isFlipped = false;
            cardData.isMatched = false;
            cardData.element.classList.remove('flipped', 'matched');
        });
    }
    
    resetTimer();
}

// Ocultar modales
function hideModal() {
    elements.victoryModal.classList.add('hidden');
    elements.successModal.classList.add('hidden');
}

// Función para mezclar array (Fisher-Yates shuffle)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Función para obtener datos de participantes (para debugging)
function getParticipants() {
    try {
        return JSON.parse(localStorage.getItem('memorice_participants') || '[]');
    } catch (error) {
        console.error('Error al obtener participantes:', error);
        return [];
    }
}

// Función para limpiar datos (para debugging)
function clearParticipants() {
    localStorage.removeItem('memorice_participants');
    console.log('Datos de participantes eliminados');
}

// Funciones de Rankings
function loadTopRankings() {
    const participants = getParticipants();
    
    if (participants.length === 0) {
        elements.topRankings.innerHTML = '<div class="no-rankings">¡Sé el primero en jugar!</div>';
        return;
    }
    
    // Separar por nivel y ordenar por tiempo
    const level12 = participants.filter(p => p.nivel === 12).sort(compareTime);
    const level16 = participants.filter(p => p.nivel === 16).sort(compareTime);
    
    // Tomar los mejores 3 de cada nivel
    const topLevel12 = level12.slice(0, 3);
    const topLevel16 = level16.slice(0, 3);
    
    let rankingsHTML = '';
    
    // Mostrar mejores del nivel Fácil (12 cartas)
    if (topLevel12.length > 0) {
        rankingsHTML += '<div class="level-section"><h4 class="level-title">🟢 Nivel Fácil (12 cartas)</h4>';
        rankingsHTML += topLevel12.map((participant, index) => {
            const medal = getMedal(index + 1);
            
            return `
                <div class="ranking-item">
                    <div class="ranking-position">${index + 1}</div>
                    <div class="ranking-medal">${medal}</div>
                    <div class="ranking-info">
                        <div class="ranking-name">${participant.nombre} ${participant.apellido}</div>
                        <div class="ranking-details">${participant.curso}</div>
                    </div>
                    <div class="ranking-time">${participant.tiempo}</div>
                </div>
            `;
        }).join('');
        rankingsHTML += '</div>';
    }
    
    // Mostrar mejores del nivel Difícil (16 cartas)
    if (topLevel16.length > 0) {
        rankingsHTML += '<div class="level-section"><h4 class="level-title">🔴 Nivel Difícil (16 cartas)</h4>';
        rankingsHTML += topLevel16.map((participant, index) => {
            const medal = getMedal(index + 1);
            
            return `
                <div class="ranking-item">
                    <div class="ranking-position">${index + 1}</div>
                    <div class="ranking-medal">${medal}</div>
                    <div class="ranking-info">
                        <div class="ranking-name">${participant.nombre} ${participant.apellido}</div>
                        <div class="ranking-details">${participant.curso}</div>
                    </div>
                    <div class="ranking-time">${participant.tiempo}</div>
                </div>
            `;
        }).join('');
        rankingsHTML += '</div>';
    }
    
    if (rankingsHTML === '') {
        elements.topRankings.innerHTML = '<div class="no-rankings">¡Sé el primero en jugar!</div>';
    } else {
        elements.topRankings.innerHTML = rankingsHTML;
    }
}

function getMedal(position) {
    switch (position) {
        case 1: return '🥇';
        case 2: return '🥈';
        case 3: return '🥉';
        case 4: return '🏅';
        case 5: return '🎖️';
        default: return '🏆';
    }
}

function compareTime(a, b) {
    // Convertir tiempo MM:SS a segundos para comparar
    const timeToSeconds = (timeStr) => {
        const [minutes, seconds] = timeStr.split(':').map(Number);
        return minutes * 60 + seconds;
    };
    
    return timeToSeconds(a.tiempo) - timeToSeconds(b.tiempo);
}

function showFullRankings() {
    elements.rankingsModal.classList.remove('hidden');
    showRankingsTab(12); // Mostrar nivel fácil por defecto
}

function hideRankingsModal() {
    elements.rankingsModal.classList.add('hidden');
}

function showRankingsTab(level) {
    // Actualizar tabs activos
    document.querySelectorAll('.rankings-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(`rankings-tab-${level}`).classList.add('active');
    
    // Cargar datos del nivel seleccionado
    const participants = getParticipants().filter(p => p.nivel === level).sort(compareTime);
    
    if (participants.length === 0) {
        elements.fullRankingsContent.innerHTML = '<div class="no-rankings">No hay participantes en este nivel aún.</div>';
        return;
    }
    
    const tableHTML = `
        <table class="rankings-table">
            <thead>
                <tr>
                    <th class="table-position">Pos.</th>
                    <th class="table-medal">🏆</th>
                    <th>Participante</th>
                    <th class="table-time">Tiempo</th>
                    <th>Fecha</th>
                </tr>
            </thead>
            <tbody>
                ${participants.map((participant, index) => `
                    <tr>
                        <td class="table-position">${index + 1}</td>
                        <td class="table-medal">${getMedal(index + 1)}</td>
                        <td>
                            <div class="table-name">${participant.nombre} ${participant.apellido}</div>
                            <div class="table-course">${participant.curso}</div>
                        </td>
                        <td class="table-time">${participant.tiempo}</td>
                        <td>${new Date(participant.fecha).toLocaleDateString('es-CL')}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    elements.fullRankingsContent.innerHTML = tableHTML;
}

function exportToCSV() {
    const participants = getParticipants();
    if (participants.length === 0) {
        alert("No hay participantes para exportar.");
        return;
    }

    const headers = ["Nombre", "Apellido", "RUT", "Edad", "Curso", "Telefono", "Tiempo", "Nivel", "Fecha"];
    const csvRows = participants.map(p => [
        `"${p.nombre}"`, 
        `"${p.apellido}"`, 
        `"${p.rut}"`, 
        p.edad,
        `"${p.curso}"`, 
        `"${p.telefono}"`, 
        `"${p.tiempo}"`, 
        p.nivel,
        `"${new Date(p.fecha).toLocaleString('es-CL')}"`
    ].join(","));

    const csvContent = [headers.join(","), ...csvRows].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "participantes.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Exponer funciones útiles para debugging
window.memoriceDebug = {
    getParticipants,
    clearParticipants,
    gameState: () => gameState,
    loadTopRankings
};

// Manejar visibilidad de la página (pausar cronómetro si se cambia de pestaña)
document.addEventListener('visibilitychange', function() {
    if (document.hidden && gameState.gameStarted && !gameState.gameCompleted) {
        // Página oculta - pausar cronómetro
        stopTimer();
    } else if (!document.hidden && gameState.gameStarted && !gameState.gameCompleted) {
        // Página visible - reanudar cronómetro
        gameState.startTime = Date.now() - (gameState.startTime ? Date.now() - gameState.startTime : 0);
        startTimer();
    }
});