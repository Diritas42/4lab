// js/modules/Game.js
import Player from './Player.js';
import Enemy from './Enemy.js';
import Level from './Level.js';

/**
 * Основной класс игры, управляющий игровым процессом
 */
class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        this.player = null;
        this.enemies = [];
        this.currentLevel = 0;
        this.level = null;
        this.levels = [];
        this.gameState = 'playing'; // playing, detected, levelComplete
        
        this.keys = {};
        this.detectionLevel = 0;
        
        this.initLevels();
    }
    
    /**
     * Инициализация игры
     */
    init() {
        this.setupEventListeners();
        this.startLevel(this.currentLevel);
        this.gameLoop();
    }
    
    /**
     * Создание уровней игры
     */
    initLevels() {
        // Уровень 1 - Простой
        this.levels.push(new Level(
            1,
            [
                // Стены: [x, y, width, height]
                [100, 100, 200, 20],
                [400, 150, 20, 200],
                [200, 300, 300, 20],
                [50, 400, 150, 20]
            ],
            [
                // Враги: [x, y, patrolPath]
                [300, 200, [[300, 200], [500, 200]]],
                [150, 350, [[150, 350], [150, 450]]]
            ],
            [700, 450], // Выход
            [50, 50] // Стартовая позиция игрока
        ));
        
        // Уровень 2 - Средний
        this.levels.push(new Level(
            2,
            [
                [100, 50, 600, 20],
                [100, 50, 20, 300],
                [100, 350, 600, 20],
                [680, 50, 20, 300],
                [250, 150, 20, 150],
                [450, 150, 20, 150]
            ],
            [
                [200, 100, [[200, 100], [200, 300]]],
                [300, 100, [[300, 100], [500, 100]]],
                [500, 300, [[500, 300], [300, 300]]]
            ],
            [650, 200],
            [150, 100]
        ));
        
        // Уровень 3 - Сложный
        this.levels.push(new Level(
            3,
            [
                [50, 50, 700, 20],
                [50, 50, 20, 400],
                [50, 450, 700, 20],
                [730, 50, 20, 400],
                [150, 150, 500, 20],
                [150, 150, 20, 150],
                [150, 300, 500, 20],
                [630, 150, 20, 150],
                [250, 250, 300, 20]
            ],
            [
                [200, 200, [[200, 200], [400, 200]]],
                [400, 200, [[400, 200], [400, 400]]],
                [500, 400, [[500, 400], [200, 400]]],
                [300, 300, [[300, 300], [500, 300]]]
            ],
            [700, 400],
            [100, 100]
        ));
    }
    
    /**
     * Запуск уровня
     * @param {number} levelIndex - индекс уровня
     */
    startLevel(levelIndex) {
        this.currentLevel = levelIndex;
        this.level = this.levels[levelIndex];
        this.player = new Player(this.level.startPosition[0], this.level.startPosition[1]);
        this.enemies = this.level.enemies.map(data => new Enemy(data[0], data[1], data[2]));
        this.detectionLevel = 0;
        this.gameState = 'playing';
        document.getElementById('levelDisplay').textContent = this.level.number;
        document.getElementById('nextLevelBtn').style.display = 'none';
        document.getElementById('alert').style.display = 'none';
        
        // Сброс цвета текста алерта
        document.getElementById('alertText').style.color = '#ff4444';
    }
    
    /**
     * Настройка обработчиков событий
     */
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Сброс игры при обнаружении
            if (this.gameState === 'detected' && e.code === 'Space') {
                this.restartLevel();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    /**
     * Обновление состояния игры
     */
    update() {
        if (this.gameState !== 'playing') return;
        
        // Обновление игрока
        this.player.update(this.keys, this.level.walls);
        
        // Обновление врагов и проверка обнаружения
        let detected = false;
        this.enemies.forEach(enemy => {
            enemy.update();
            if (enemy.detectPlayer(this.player.x, this.player.y, this.level.walls)) {
                detected = true;
            }
        });
        
        // Обновление уровня обнаружения
        if (detected) {
            this.detectionLevel = Math.min(100, this.detectionLevel + 2);
        } else {
            this.detectionLevel = Math.max(0, this.detectionLevel - 1);
        }
        
        document.getElementById('detectionDisplay').textContent = `${this.detectionLevel}%`;
        
        // Проверка полного обнаружения
        if (this.detectionLevel >= 100) {
            this.gameState = 'detected';
            document.getElementById('alertText').textContent = 'ОБНАРУЖЕН!';
            document.getElementById('alert').style.display = 'block';
        }
        
        // Проверка достижения выхода
        const exit = this.level.exit;
        const distanceToExit = Math.sqrt(
            Math.pow(this.player.x - exit[0], 2) + 
            Math.pow(this.player.y - exit[1], 2)
        );
        
        if (distanceToExit < 20) {
            this.levelComplete();
        }
    }
    
    /**
     * Отрисовка игрового состояния
     */
    render() {
        // Очистка canvas
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Отрисовка уровня
        this.level.render(this.ctx);
        
        // Отрисовка врагов
        this.enemies.forEach(enemy => enemy.render(this.ctx));
        
        // Отрисовка игрока
        this.player.render(this.ctx);
        
        // Отрисовка индикатора обнаружения
        if (this.detectionLevel > 0) {
            this.ctx.fillStyle = `rgba(255, 0, 0, ${this.detectionLevel/200})`;
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
    }
    
    /**
     * Главный игровой цикл
     */
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    /**
     * Завершение уровня
     */
    levelComplete() {
        this.gameState = 'levelComplete';
        
        if (this.currentLevel < this.levels.length - 1) {
            document.getElementById('nextLevelBtn').style.display = 'inline-block';
        } else {
            // Игра завершена
            document.getElementById('alertText').textContent = 'МИССИЯ ВЫПОЛНЕНА!';
            document.getElementById('alertText').style.color = '#4CAF50';
            document.getElementById('alert').style.display = 'block';
        }
    }
    
    /**
     * Перезапуск текущего уровня
     */
    restartLevel() {
        this.startLevel(this.currentLevel);
    }
    
    /**
     * Переход на следующий уровень
     */
    nextLevel() {
        if (this.currentLevel < this.levels.length - 1) {
            this.startLevel(this.currentLevel + 1);
        }
    }
}

export default Game;