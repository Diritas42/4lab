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
        this.massEliminationDetected = false;
        
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
                // Внешние стены
                [0, 0, 800, 20],
                [0, 0, 20, 500],
                [0, 480, 800, 20],
                [780, 0, 20, 500],
                // Внутренние стены
                [150, 100, 500, 20],
                [150, 100, 20, 150],
                [150, 250, 200, 20],
                [350, 250, 20, 150],
                [350, 400, 300, 20],
                [650, 150, 20, 250]
            ],
            [
                // Враги: [x, y, patrolPath]
                [250, 200, [[250, 200], [450, 200]]],
                [400, 350, [[400, 350], [400, 450]]],
                [600, 300, [[600, 300], [600, 200]]]
            ],
            [700, 50], // Выход
            [50, 50], // Стартовая позиция игрока
            [
                // Документы: [x, y]
                [200, 150],
                [500, 300],
                [650, 100]
            ]
        ));
        
        // Уровень 2 - Средний
        this.levels.push(new Level(
            2,
            [
                // Внешние стены
                [0, 0, 800, 20],
                [0, 0, 20, 500],
                [0, 480, 800, 20],
                [780, 0, 20, 500],
                // Внутренние стены
                [100, 100, 600, 20],
                [100, 100, 20, 150],
                [100, 250, 300, 20],
                [400, 250, 20, 150],
                [400, 400, 350, 20],
                [200, 350, 20, 100],
                [500, 150, 20, 150]
            ],
            [
                [200, 200, [[200, 200], [350, 200]]],
                [300, 300, [[300, 300], [300, 450]]],
                [450, 200, [[450, 200], [600, 200]]],
                [550, 350, [[550, 350], [700, 350]]]
            ],
            [700, 450],
            [150, 150],
            [
                [250, 150],
                [350, 300],
                [600, 250],
                [650, 400]
            ]
        ));
        
        // Уровень 3 - Сложный
        this.levels.push(new Level(
            3,
            [
                // Внешние стены
                [0, 0, 800, 20],
                [0, 0, 20, 500],
                [0, 480, 800, 20],
                [780, 0, 20, 500],
                // Внутренние стены
                [100, 100, 600, 20],
                [100, 100, 20, 300],
                [100, 400, 600, 20],
                [700, 100, 20, 300],
                [200, 200, 400, 20],
                [200, 200, 20, 150],
                [200, 350, 400, 20],
                [600, 200, 20, 150],
                [350, 250, 100, 20]
            ],
            [
                [150, 150, [[150, 150], [150, 300]]],
                [250, 250, [[250, 250], [450, 250]]],
                [350, 150, [[350, 150], [550, 150]]],
                [450, 350, [[450, 350], [650, 350]]],
                [550, 250, [[550, 250], [550, 400]]]
            ],
            [750, 250],
            [50, 450],
            [
                [150, 350],
                [300, 150],
                [500, 150],
                [400, 400],
                [650, 300]
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
        this.massEliminationDetected = false;
        this.gameState = 'playing';
        document.getElementById('levelDisplay').textContent = this.level.number;
        document.getElementById('documentsDisplay').textContent = 
            `0/${this.documents.length}`;
        document.getElementById('nextLevelBtn').style.display = 'none';
        document.getElementById('alert').style.display = 'none';
        document.getElementById('alertSubtext').style.display = 'none';
        
        // Сброс цвета текста алерта
        document.getElementById('alertText').style.color = '#ff4444';
    }
    
    /**
     * Настройка обработчиков событий
     */
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Перезапуск уровня по R
            if (e.code === 'KeyR') {
                this.restartLevel();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    /**
     * Проверка массового устранения врагов
     */
    checkMassElimination() {
        const totalEnemies = this.enemies.length;
        const eliminatedEnemies = this.enemies.filter(enemy => enemy.isEliminated).length;
        
        // Если устранено более 50% врагов
        if (eliminatedEnemies > totalEnemies / 2 && !this.massEliminationDetected) {
            this.massEliminationDetected = true;
            
            // Оповещение о массовом устранении
            document.getElementById('alertText').textContent = 'ОБНАРУЖЕНА АКТИВНОСТЬ АГЕНТА!';
            document.getElementById('alertText').style.color = '#ffcc00';
            document.getElementById('alert').style.display = 'block';
            
            // Усиление бдительности оставшихся врагов
            this.enemies.forEach(enemy => {
                if (!enemy.isEliminated) {
                    enemy.enhanceVigilance();
                }
            });
            
            // Скрываем предупреждение через 3 секунды
            setTimeout(() => {
                if (this.gameState === 'playing') {
                    document.getElementById('alert').style.display = 'none';
                }
            }, 3000);
        }
    }
    
    /**
     * Обновление состояния игры
     */
    update() {
        if (this.gameState !== 'playing') return;
        
        // Обновление игрока
        this.player.update(this.keys, this.level.walls);
        
        // Автоматическое устранение врагов
        this.autoEliminateEnemies();
        
        // Обновление врагов и проверка обнаружения
        let detected = false;
        let detectionMultiplier = this.massEliminationDetected ? 2 : 1;
        
        this.enemies.forEach(enemy => {
            if (!enemy.isEliminated) {
                enemy.update(this.player.x, this.player.y, this.isAlertMode, this.enemies);
                
                // Проверка обнаружения игрока
                if (enemy.detectPlayer(this.player.x, this.player.y, this.level.walls)) {
                    detected = true;
                    
                    // Если враг обнаружил игрока, переводим в режим тревоги
                    if (!this.isAlertMode) {
                        this.detectionLevel = Math.min(100, this.detectionLevel + 3 * detectionMultiplier);
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
            this.detectionLevel = Math.min(100, this.detectionLevel + 2 * detectionMultiplier);
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
     * Автоматическое устранение врагов при подходе сзади
     */
    autoEliminateEnemies() {
        this.enemies.forEach(enemy => {
            if (!enemy.isEliminated && enemy.canBeEliminated(this.player.x, this.player.y, this.player.direction)) {
                enemy.eliminate();
                this.checkMassElimination();
            }
        });
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
        document.getElementById('alertSubtext').style.display = 'block';
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
