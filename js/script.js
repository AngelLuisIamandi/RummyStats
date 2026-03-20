
let players = JSON.parse(localStorage.getItem("players")) || [];

function savePlayers() {
    localStorage.setItem("players", JSON.stringify(players));
}

if (document.getElementById("players")) {
    function renderPlayers() {
        const container = document.getElementById("players");
        container.innerHTML = "";
        const maxScore = players.length > 0 ? Math.max(...players.map(p => p.score)) : 0;

        players.forEach((player, index) => {
            const isLeader = player.score === maxScore && maxScore > 0;
            const starClass = player.starActive ? 'btn-warning' : 'btn-outline-secondary';
            const doubleClass = player.doubleActive ? 'btn-info text-white' : 'btn-outline-secondary';

            container.innerHTML += `
    <div class="col">
        <div class="card h-100 shadow-sm ${isLeader ? 'highlight' : ''}">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5 class="fw-bold mb-0 text-truncate" style="max-width: 150px;">${player.name}</h5>
                    <i class="bi bi-clock-history text-primary fs-4" role="button" onclick="showHistory(${index})"></i>
                </div>
                <div class="text-center mb-3">
                    <span class="display-5 fw-bold text-primary">${player.score}</span>
                </div>
                
                <div class="input-group">
                    <button class="btn ${starClass}" onclick="toggleModifier(${index}, 'star')">
                        <i class="bi ${player.starActive ? 'bi-star-fill' : 'bi-star'}"></i>
                    </button>
                    <button class="btn ${doubleClass} fw-bold" onclick="toggleModifier(${index}, 'double')">
                        x2
                    </button>
                    
                    <input type="number" id="input-${index}" class="form-control" placeholder="Pts">
                    
                    <button class="btn btn-primary" onclick="changeScore(${index})">
                        <i class="bi bi-check-lg"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>`;
        });
    }

    window.toggleModifier = function (index, type) {
        const currentInput = document.getElementById(`input-${index}`);
        const tempValue = currentInput ? currentInput.value : "";

        if (type === 'star') {
            players[index].starActive = !players[index].starActive;
        } else if (type === 'double') {
            players[index].doubleActive = !players[index].doubleActive;
        }

        renderPlayers();

        const newInput = document.getElementById(`input-${index}`);
        if (newInput) {
            newInput.value = tempValue;
            newInput.focus();
        }
    };

    window.changeScore = function (index) {
        const input = document.getElementById(`input-${index}`);
        let val = parseInt(input.value) || 0;

        if (input.value === "" && !players[index].starActive) return;

        if (players[index].starActive) {
            val = val + 50;
        }

        if (players[index].doubleActive) {
            val = val * 2;
        }

        players[index].score += val;

        let historyEntry = `${val >= 0 ? '+' : ''}${val}`;
        if (players[index].starActive) historyEntry += " ⭐";
        if (players[index].doubleActive) historyEntry += " ⚡";

        players[index].history.unshift(historyEntry);

        players[index].starActive = false;
        players[index].doubleActive = false;
        input.value = "";

        savePlayers();
        renderPlayers();
    };

    window.addPlayer = function () {
        const input = document.getElementById("playerName");
        const name = input.value.trim();
        if (name) {
            players.push({
                name,
                score: 0,
                history: [],
                starActive: false,
                doubleActive: false
            });
            input.value = "";
            savePlayers();
            renderPlayers();
        }
    };


    window.showHistory = function (index) {
        const list = document.getElementById("historyList");
        list.innerHTML = players[index].history.map(h =>
            `<li class="list-group-item d-flex justify-content-between ${h.includes('+') ? 'text-success' : 'text-danger'}">
                ${h.includes('+') ? 'Suma' : 'Resta'} <span>${h}</span>
            </li>`).join('') || '<li class="list-group-item text-muted">Sin datos</li>';
        new bootstrap.Modal(document.getElementById("historyModal")).show();
    };

    document.getElementById("confirmNewGame").onclick = () => {
        players = [];
        localStorage.removeItem("players");
        renderPlayers();
        bootstrap.Modal.getInstance(document.getElementById('newGameModal')).hide();
    };

    document.addEventListener('keypress', function (e) {
        if (e.key === 'Enter' && e.target.id.startsWith('input-')) {
            const index = e.target.id.split('-')[1];
            window.changeScore(index);
        }
    });

    renderPlayers();

}

if (document.getElementById("lineChart")) {
    const ctxLine = document.getElementById('lineChart').getContext('2d');
    const ctxBar = document.getElementById('barChart').getContext('2d');

    const maxRounds = Math.max(...players.map(p => p.history.length), 0);
    const labels = Array.from({ length: maxRounds + 1 }, (_, i) => `R ${i}`);

    const datasets = players.map((p, i) => {
        let sum = 0;
        const historyData = [0, ...[...p.history].reverse().map(v => sum += parseInt(v))];
        const color = `hsl(${i * (360 / players.length)}, 70%, 50%)`;
        return {
            label: p.name,
            data: historyData,
            borderColor: color,
            tension: 0.3,
            fill: false
        };
    });

    new Chart(ctxLine, {
        type: 'line',
        data: { labels, datasets },
        options: { responsive: true, maintainAspectRatio: false }
    });

    new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: players.map(p => p.name),
            datasets: [{
                label: 'Puntos Totales',
                data: players.map(p => p.score),
                backgroundColor: players.map((_, i) => `hsl(${i * (360 / players.length)}, 70%, 60%)`)
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}