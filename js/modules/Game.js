// js/modules/Game.js
import Player from './Player.js';
import Enemy from './Enemy.js';
import Level from './Level.js';
import Document from './Document.js';

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
        this.documents = [];
        this.currentLevel = 0;
        this.level = null;
        this.levels = [];
        this.gameState = 'playing'; // playing, detected, levelComplete, gameOver
        
        this.keys = {};
        this.detectionLevel = 0;
        this.isAlertMode = false;
        
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
                [50, 400, 150, 20],
                [500, 100, 20, 150],
                [600, 200, 150, 20]
            ],
            [
                // Враги: [x, y, patrolPath]
                [300, 200, [[300, 200], [500, 200]]],
                [150, 350, [[150, 350], [150, 450]]],
                [550, 150, [[550, 150], [550, 250]]]
            ],
            [700, 450], // Выход
            [50, 50], // Стартовая позиция игрока
            [
                // Документы: [x, y]
                [200, 150],
                [450, 300],
                [650, 400]
            ]
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
                [450, 150, 20, 150],
                [300, 250, 200, 20]
            ],
            [
                [200, 100, [[200, 100], [200, 300]]],
                [300, 100, [[300, 100], [500, 100]]],
                [500, 300, [[500, 300], [300, 300]]],
                [400, 200, [[400, 200], [400, 350]]]
            ],
            [650, 200],
            [150, 100],
            [
                [300, 150],
                [500, 150],
                [400, 300],
                [600, 300]
            ]
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
                [250, 250, 300, 20],
                [350, 100, 20, 100]
            ],
            [
                [200, 200, [[200, 200], [400, 200]]],
                [400, 200, [[400, 200], [400, 400]]],
                [500, 400, [[500, 400], [200, 400]]],
                [300, 300, [[300, 300], [500, 300]]],
                [400, 100, [[400, 100], [600, 100]]]
            ],
            [700, 400],
            [100, 100],
            [
                [200, 100],
                [500, 200],
                [300, 350],
                [600, 350],
                [400, 450]
            ]
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
        
        // Создание врагов
        this.enemies = this.level.enemies.map(data => 
            new Enemy(data[0], data[1], data[2], this.level.walls)
        );
        
        // Создание документов
        this.documents = this.level.documents.map(data => 
            new Document(data[0], data[1])
        );
        
        this.detectionLevel = 0;
        this.isAlertMode = false;
        this.gameState = 'playing';
        document.getElementById('levelDisplay').textContent = this.level.number;
        document.getElementById('documentsDisplay').textContent = 
            `0/${this.documents.length}`;
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
            
            // Устранение врага
            if (e.code === 'Space' && this.gameState === 'playing') {
                this.player.eliminateEnemy(this.enemies);
            }
            
            // Сброс игры при обнаружении
            if (this.gameState === 'gameOver' && e.code === 'Space') {
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
            if (!enemy.isEliminated) {
                enemy.update(this.player.x, this.player.y, this.isAlertMode);
                
                // Проверка обнаружения игрока
                if (enemy.detectPlayer(this.player.x, this.player.y, this.level.walls)) {
                    detected = true;
                    
                    // Если враг обнаружил игрока, переводим в режим тревоги
                    if (!this.isAlertMode) {
                        this.detectionLevel = Math.min(100, this.detectionLevel + 3);
                    }
                }
                
                // Проверка столкновения с игроком
                if (enemy.checkCollisionWithPlayer(this.player) && !enemy.isEliminated) {
                    this.gameOver();
                }
            }
        });
        
        // Обновление уровня обнаружения
        if (detected && !this.isAlertMode) {
            this.detectionLevel = Math.min(100, this.detectionLevel + 2);
        } else if (!this.isAlertMode) {
            this.detectionLevel = Math.max(0, this.detectionLevel - 1);
        }
        
        // Активация режима тревоги
        if (this.detectionLevel >= 100 && !this.isAlertMode) {
            this.activateAlertMode();
        }
        
        document.getElementById('detectionDisplay').textContent = `${this.detectionLevel}%`;
        
        // Проверка сбора документов
        this.documents.forEach(doc => {
            if (!doc.isCollected && doc.checkCollision(this.player)) {
                doc.collect();
                const collectedCount = this.documents.filter(d => d.isCollected).length;
                document.getElementById('documentsDisplay').textContent = 
                    `${collectedCount}/${this.documents.length}`;
            }
        });
        
        // Проверка достижения выхода
        const exit = this.level.exit;
        const distanceToExit = Math.sqrt(
            Math.pow(this.player.x - exit[0], 2) + 
            Math.pow(this.player.y - exit[1], 2)
        );
        
        if (distanceToExit < 20) {
            this.checkLevelCompletion();
        }
    }
    
    /**
     * Активация режима тревоги
     */
    activateAlertMode() {
        this.isAlertMode = true;
        this.detectionLevel = 100;
        
        // Все враги переходят в режим преследования
        this.enemies.forEach(enemy => {
            if (!enemy.isEliminated) {
                enemy.alert(this.player.x, this.player.y);
            }
        });
        
        document.getElementById('alertText').textContent = 'ТРЕВОГА!';
        document.getElementById('alert').style.display = 'block';
        
        // Скрываем предупреждение через 2 секунды
        setTimeout(() => {
            if (this.gameState === 'playing') {
                document.getElementById('alert').style.display = 'none';
            }
        }, 2000);
    }
    
    /**
     * Проверка завершения уровня
     */
    checkLevelCompletion() {
        // Проверяем, собраны ли все документы
        const allDocumentsCollected = this.documents.every(doc => doc.isCollected);
        
        if (allDocumentsCollected) {
            this.levelComplete();
        } else {
            document.getElementById('alertText').textContent = 'СОБЕРИТЕ ВСЕ ДОКУМЕНТЫ!';
            document.getElementById('alertText').style.color = '#ffcc00';
            document.getElementById('alert').style.display = 'block';
            
            // Скрываем предупреждение через 2 секунды
            setTimeout(() => {
                if (this.gameState === 'playing') {
                    document.getElementById('alert').style.display = 'none';
                }
            }, 2000);
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
        
        // Отрисовка документов
        this.documents.forEach(doc => doc.render(this.ctx));
        
        // Отрисовка врагов
        this.enemies.forEach(enemy => {
            if (!enemy.isEliminated) {
                enemy.render(this.ctx, this.isAlertMode);
            }
        });
        
        // Отрисовка игрока
        this.player.render(this.ctx);
        
        // Отрисовка индикатора обнаружения
        if (this.detectionLevel > 0) {
            const alpha = this.isAlertMode ? 0.3 : this.detectionLevel/200;
            this.ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
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
     * Конец игры
     */
    gameOver() {
        this.gameState = 'gameOver';
        document.getElementById('alertText').textContent = 'МИССИЯ ПРОВАЛЕНА!';
        document.getElementById('alertText').style.color = '#ff4444';
        document.getElementById('alert').style.display = 'block';
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
