import { Player } from './Player.js';
import { Enemy } from './Enemy.js';
import { Level } from './Level.js';
import { Document } from './Document.js';

// Основной класс игры
export class Game {
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
        this.debugMode = false; // Включить режим отладки
        
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
        // Уровень 1 - Простой с препятствиями для обзора
        this.levels.push(new Level(
            1,
            [
                // Внешние стены
                [0, 0, 800, 15],
                [0, 0, 15, 500],
                [0, 485, 800, 15],
                [785, 0, 15, 500],
                
                // Внутренние препятствия
                [180, 100, 20, 150],
                [380, 200, 20, 120],
                [580, 150, 20, 100]
            ],
            [
                // Враги: [x, y, patrolPath]
                [250, 200, [[250, 200], [350, 200]]],
                [400, 350, [[400, 350], [400, 450]]],
                [600, 300, [[600, 300], [600, 250]]]
            ],
            [750, 50], // Выход
            [50, 50], // Стартовая позиция игрока
            [
                // Документы: [x, y]
                [220, 150],
                [500, 300],
                [650, 100]
            ]
        ));
        
        // Уровень 2 - Лабиринт с патрулирующими врагами
        this.levels.push(new Level(
            2,
            [
                // Внешние стены
                [0, 0, 800, 15],
                [0, 0, 15, 500],
                [0, 485, 800, 15],
                [785, 0, 15, 500],
                
                // Внутренние препятствия
                [100, 100, 20, 80],
                [100, 220, 20, 80],
                [200, 50, 100, 20],
                [200, 180, 100, 20],
                [200, 310, 100, 20],
                [200, 430, 100, 20],
                
                // Центральная перегородка
                [350, 150, 20, 200],
                
                // Правая сторона
                [500, 100, 20, 80],
                [500, 220, 20, 80],
                [600, 50, 100, 20],
                [600, 180, 100, 20],
                [600, 310, 100, 20],
                [600, 430, 100, 20]
            ],
            [
                // Враги с исправленными путями патрулирования
                [150, 150, [[150, 150], [150, 120], [180, 120], [180, 150]]],
                [150, 350, [[150, 350], [150, 380], [180, 380], [180, 350]]],
                [650, 150, [[650, 150], [650, 120], [620, 120], [620, 150]]],
                [650, 350, [[650, 350], [650, 380], [620, 380], [620, 350]]],
                [400, 250, [[400, 250], [400, 200], [370, 200], [370, 250]]]
            ],
            [750, 450], // Выход
            [50, 450],  // Старт
            [
                // Документы в безопасных местах
                [150, 80],
                [150, 400],
                [650, 80],
                [650, 400],
                [400, 400]
            ]
        ));
        
        // Уровень 3 - Сложный с большим количеством врагов
        this.levels.push(new Level(
            3,
            [
                // Внешние стены
                [0, 0, 800, 15],
                [0, 0, 15, 500],
                [0, 485, 800, 15],
                [785, 0, 15, 500],
                
                // Внутренние препятствия
                [100, 100, 20, 120],
                [300, 150, 20, 80],
                [500, 200, 20, 150],
                [200, 250, 100, 20],
                [400, 300, 120, 20],
                [600, 350, 20, 100],
                [250, 100, 20, 50],
                [450, 150, 20, 80],
                [650, 200, 20, 80]
            ],
            [
                // Враги: [x, y, patrolPath]
                [150, 150, [[150, 150], [150, 350]]],
                [270, 270, [[270, 270], [320, 270]]],
                [350, 150, [[350, 150], [430, 150]]],
                [450, 350, [[450, 350], [530, 350]]],
                [550, 250, [[550, 250], [550, 400]]]
            ],
            [750, 250], // Выход
            [50, 450],
            [
                // Документы: [x, y]
                [150, 300],
                [280, 150],
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
        this.player = new Player(this.level.startPosition[0], this.level.startPosition[1], this.debugMode);
        
        // Создание врагов
        this.enemies = this.level.enemies.map(data => 
            new Enemy(data[0], data[1], data[2], this.level.walls, this.debugMode)
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
        
        // Отладочная информация при старте уровня
        if (this.debugMode) {
            console.log(`\n=== ЗАПУСК УРОВНЯ ${this.level.number} ===`);
            console.log(`Стен: ${this.level.walls.length}`);
            console.log(`Врагов: ${this.enemies.length}`);
            console.log(`Документов: ${this.documents.length}`);
            
            // Проверка коллизий при старте
            this.validateLevelStart();
        }
    }
    
    /**
     * Проверка уровня на проблемы при старте
     */
    validateLevelStart() {
        console.log("=== ПРОВЕРКА УРОВНЯ НА ПРОБЛЕМЫ ===");
        
        // Проверка игрока
        let playerInWall = false;
        for (const wall of this.level.walls) {
            if (this.rectOverlap(this.player.x, this.player.y, this.player.width, this.player.height, 
                               wall[0], wall[1], wall[2], wall[3])) {
                playerInWall = true;
                console.error(`❌ Игрок в стене! Позиция: [${this.player.x}, ${this.player.y}]`);
                break;
            }
        }
        if (!playerInWall) {
            console.log(`✅ Игрок в правильном месте: [${this.player.x}, ${this.player.y}]`);
        }
        
        // Проверка документов
        this.documents.forEach((doc, index) => {
            let inWall = false;
            for (const wall of this.level.walls) {
                if (this.rectOverlap(doc.x, doc.y, doc.width, doc.height, 
                                   wall[0], wall[1], wall[2], wall[3])) {
                    inWall = true;
                    console.error(`❌ Документ ${index} в стене! Позиция: [${doc.x}, ${doc.y}]`);
                    break;
                }
            }
            if (!inWall) {
                console.log(`✅ Документ ${index} в правильном месте: [${doc.x}, ${doc.y}]`);
            }
        });
        
        // Проверка врагов
        this.enemies.forEach((enemy, index) => {
            let inWall = false;
            for (const wall of this.level.walls) {
                if (this.rectOverlap(enemy.x, enemy.y, enemy.width, enemy.height, 
                                   wall[0], wall[1], wall[2], wall[3])) {
                    inWall = true;
                    console.error(`❌ Враг ${index} в стене! Позиция: [${enemy.x}, ${enemy.y}]`);
                    break;
                }
            }
            if (!inWall) {
                console.log(`✅ Враг ${index} в правильном месте: [${enemy.x}, ${enemy.y}]`);
            }
            
            // Проверка путей патрулирования
            if (enemy.patrolPath) {
                enemy.patrolPath.forEach((point, pointIndex) => {
                    const [px, py] = point;
                    for (const wall of this.level.walls) {
                        if (this.pointInRect(px, py, wall)) {
                            console.error(`❌ Точка патрулирования ${pointIndex} врага ${index} в стене! Позиция: [${px}, ${py}]`);
                        }
                    }
                });
            }
        });
        
        console.log("=== ПРОВЕРКА ЗАВЕРШЕНА ===");
    }
    
    /**
     * Проверка точки в прямоугольнике
     */
    pointInRect(x, y, rect) {
        return x >= rect[0] && x <= rect[0] + rect[2] && 
               y >= rect[1] && y <= rect[1] + rect[3];
    }
    
    /**
     * Проверка пересечения прямоугольников
     */
    rectOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && x1 + w1 > x2 && 
               y1 < y2 + h2 && y1 + h1 > y2;
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
            
            // Переключение режима отладки по F3
            if (e.code === 'F3') {
                this.debugMode = !this.debugMode;
                
                if (this.player) {
                    this.player.debugMode = this.debugMode;
                }
                
                this.enemies.forEach(enemy => {
                    enemy.debugMode = this.debugMode;
                });
                
                console.log(`Режим отладки: ${this.debugMode ? 'ВКЛ' : 'ВЫКЛ'}`);
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
                enemy.update(this.player.x, this.player.y, this.isAlertMode, this.enemies, this.isAlertMode);
                
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
        const exitRect = [exit[0], exit[1], 20, 20];
        
        if (this.rectOverlap(this.player.x, this.player.y, this.player.width, this.player.height, 
                           exitRect[0], exitRect[1], exitRect[2], exitRect[3])) {
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
        
        // Отрисовка отладочной информации
        if (this.debugMode) {
            this.renderDebugInfo();
        }
    }
    
    /**
     * Отрисовка отладочной информации
     */
    renderDebugInfo() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Consolas';
        this.ctx.textAlign = 'left';
        
        // Информация об игроке
        this.ctx.fillText(`Игрок: [${Math.round(this.player.x)}, ${Math.round(this.player.y)}]`, 10, 20);
        this.ctx.fillText(`Направление: ${this.player.direction}`, 10, 35);
        this.ctx.fillText(`Столкновений: ${this.player.collisionCount}`, 10, 50);
        
        // Информация о врагах
        this.enemies.forEach((enemy, index) => {
            if (!enemy.isEliminated) {
                const yPos = 70 + index * 15;
                this.ctx.fillText(`Враг ${index}: [${Math.round(enemy.x)}, ${Math.round(enemy.y)}]`, 10, yPos);
                
                // Столкновения со стенами
                if (enemy.collisionCount > 0) {
                    this.ctx.fillStyle = '#ff4444';
                    this.ctx.fillText(`Столкновений: ${enemy.collisionCount}`, 150, yPos);
                    this.ctx.fillStyle = '#ffffff';
                }
            }
        });
        
        // Общая информация
        this.ctx.fillText(`Уровень: ${this.currentLevel + 1}`, 10, this.height - 30);
        this.ctx.fillText(`Режим отладки: ВКЛ (F3 для выключения)`, 10, this.height - 15);
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

