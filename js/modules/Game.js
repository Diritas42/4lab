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
        this.debugMode = true; // Включить режим отладки
        
        this.initLevels();
    }
    
    /**
     * Инициализация игры
     */
    init() {
        this.setupEventListeners();
        this.startLevel(this.currentLevel);
        this.gameLoop();
        
        // Отладочная информация
        if (this.debugMode) {
            console.log("=== ДЕБАГ РЕЖИМ ВКЛЮЧЕН ===");
            console.log("Столкновения врагов и документов со стенами будут выводиться в консоль");
        }
    }
    
    /**
     * Создание уровней игры
     */
    initLevels() {
        // Уровень 1 - Простой (полностью перестроен)
        this.levels.push(new Level(
            1,
            [
                // Внешние стены
                [0, 0, 800, 10],
                [0, 0, 10, 500],
                [0, 490, 800, 10],
                [790, 0, 10, 500],
                // Внутренние стены - только крупные препятствия с зазорами
                [150, 100, 200, 10],
                [450, 150, 10, 200],
                [200, 350, 300, 10],
                [100, 400, 150, 10],
                [500, 100, 10, 150],
                [600, 200, 150, 10]
            ],
            [
                // Враги: [x, y, patrolPath] - гарантированно в свободном пространстве
                [300, 200, [[300, 200], [500, 200]]],
                [200, 300, [[200, 300], [200, 450]]],
                [550, 150, [[550, 150], [700, 150]]]
            ],
            [750, 450], // Выход
            [50, 50], // Стартовая позиция игрока
            [
                // Документы: [x, y] - гарантированно в свободном пространстве
                [200, 150],
                [450, 300],
                [650, 400]
            ]
        ));
        
        // Уровень 2 - Средний (полностью перестроен)
        this.levels.push(new Level(
            2,
            [
                // Внешние стены
                [0, 0, 800, 10],
                [0, 0, 10, 500],
                [0, 490, 800, 10],
                [790, 0, 10, 500],
                // Внутренние стены
                [100, 100, 600, 10],
                [100, 100, 10, 150],
                [100, 250, 200, 10],
                [300, 250, 10, 150],
                [300, 400, 450, 10],
                [500, 150, 10, 100],
                [600, 250, 150, 10]
            ],
            [
                [200, 150, [[200, 150], [200, 300]]],
                [400, 200, [[400, 200], [600, 200]]],
                [550, 300, [[550, 300], [550, 450]]],
                [250, 350, [[250, 350], [450, 350]]]
            ],
            [700, 50],
            [150, 450],
            [
                [150, 200],
                [350, 150],
                [500, 300],
                [650, 200]
            ]
        ));
        
        // Уровень 3 - Сложный (полностью перестроен)
        this.levels.push(new Level(
            3,
            [
                // Внешние стены
                [0, 0, 800, 10],
                [0, 0, 10, 500],
                [0, 490, 800, 10],
                [790, 0, 10, 500],
                // Внутренние стены
                [100, 100, 600, 10],
                [100, 100, 10, 300],
                [100, 400, 600, 10],
                [700, 100, 10, 300],
                [200, 200, 400, 10],
                [200, 200, 10, 100],
                [600, 200, 10, 100],
                [300, 300, 200, 10]
            ],
            [
                [150, 150, [[150, 150], [150, 350]]],
                [250, 250, [[250, 250], [450, 250]]],
                [350, 150, [[350, 150], [550, 150]]],
                [450, 350, [[450, 350], [650, 350]]],
                [550, 250, [[550, 250], [550, 400]]]
            ],
            [750, 250],
            [50, 250],
            [
                [150, 300],
                [300, 150],
                [500, 150],
                [400, 400],
                [650, 300]
            ]
        ));
        
        // Проверка уровней на проблемы
        this.validateLevels();
    }
    
    /**
     * Проверка уровней на проблемы с размещением
     */
    validateLevels() {
        if (!this.debugMode) return;
        
        console.log("=== ПРОВЕРКА УРОВНЕЙ НА ПРОБЛЕМЫ ===");
        
        this.levels.forEach((level, index) => {
            console.log(`\n--- Уровень ${index + 1} ---`);
            
            // Проверка документов
            level.documents.forEach((docPos, docIndex) => {
                const [x, y] = docPos;
                let inWall = false;
                
                for (const wall of level.walls) {
                    if (this.pointInRect(x, y, wall)) {
                        inWall = true;
                        console.error(`❌ Документ ${docIndex} в стене! Позиция: [${x}, ${y}], Стена: [${wall}]`);
                        break;
                    }
                }
                
                if (!inWall) {
                    console.log(`✅ Документ ${docIndex} в правильном месте: [${x}, ${y}]`);
                }
            });
            
            // Проверка врагов
            level.enemies.forEach((enemyData, enemyIndex) => {
                const [x, y] = enemyData;
                let inWall = false;
                
                for (const wall of level.walls) {
                    if (this.rectOverlap(x - 10, y - 10, 20, 20, wall[0], wall[1], wall[2], wall[3])) {
                        inWall = true;
                        console.error(`❌ Враг ${enemyIndex} в стене! Позиция: [${x}, ${y}], Стена: [${wall}]`);
                        break;
                    }
                }
                
                // Проверка маршрута патрулирования
                const patrolPath = enemyData[2];
                if (patrolPath) {
                    patrolPath.forEach((point, pointIndex) => {
                        const [px, py] = point;
                        for (const wall of level.walls) {
                            if (this.pointInRect(px, py, wall)) {
                                console.error(`❌ Точка патрулирования ${pointIndex} врага ${enemyIndex} в стене! Позиция: [${px}, ${py}], Стена: [${wall}]`);
                            }
                        }
                    });
                }
                
                if (!inWall) {
                    console.log(`✅ Враг ${enemyIndex} в правильном месте: [${x}, ${y}]`);
                }
            });
            
            // Проверка выхода
            const [exitX, exitY] = level.exit;
            let exitInWall = false;
            for (const wall of level.walls) {
                if (this.pointInRect(exitX, exitY, wall)) {
                    exitInWall = true;
                    console.error(`❌ Выход в стене! Позиция: [${exitX}, ${exitY}], Стена: [${wall}]`);
                    break;
                }
            }
            if (!exitInWall) {
                console.log(`✅ Выход в правильном месте: [${exitX}, ${exitY}]`);
            }
            
            // Проверка стартовой позиции
            const [startX, startY] = level.startPosition;
            let startInWall = false;
            for (const wall of level.walls) {
                if (this.pointInRect(startX, startY, wall)) {
                    startInWall = true;
                    console.error(`❌ Стартовая позиция в стене! Позиция: [${startX}, ${startY}], Стена: [${wall}]`);
                    break;
                }
            }
            if (!startInWall) {
                console.log(`✅ Стартовая позиция в правильном месте: [${startX}, ${startY}]`);
            }
        });
        
        console.log("\n=== ПРОВЕРКА ЗАВЕРШЕНА ===");
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
     * Запуск уровня
     * @param {number} levelIndex - индекс уровня
     */
    startLevel(levelIndex) {
        this.currentLevel = levelIndex;
        this.level = this.levels[levelIndex];
        this.player = new Player(this.level.startPosition[0], this.level.startPosition[1]);
        
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
        }
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
        
        // Информация о врагах
        this.enemies.forEach((enemy, index) => {
            if (!enemy.isEliminated) {
                const yPos = 55 + index * 15;
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

export default Game;
