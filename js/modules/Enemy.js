// js/modules/Enemy.js
/**
 * Класс врага
 */
class Enemy {
    constructor(x, y, patrolPath, walls, debugMode = false) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.patrolPath = patrolPath;
        this.currentTarget = 0;
        this.speed = 1;
        this.alertSpeed = 2.5;
        this.color = '#f44336';
        this.alertColor = '#ff6b6b';
        this.enhancedColor = '#ff4444';
        this.detectionRange = 150;
        this.detectionAngle = Math.PI / 3; // 60 градусов
        this.blindSpotAngle = Math.PI; // Увеличено до 180 градусов для полной задней полусферы
        this.direction = 0; // Направление взгляда
        this.isAlerted = false;
        this.isEliminated = false;
        this.isVigilanceEnhanced = false;
        this.walls = walls;
        this.chaseTarget = null;
        this.stuckCounter = 0;
        this.lastX = x;
        this.lastY = y;
        this.pathfindingAttempts = 0;
        this.debugMode = debugMode;
        this.collisionCount = 0;
        this.lastCollisionReport = 0;
        this.isStuck = false;
        this.stuckTime = 0;
    }
    
    /**
     * Обновление состояния врага
     * @param {number} playerX - координата X игрока
     * @param {number} playerY - координата Y игрока
     * @param {boolean} isGlobalAlert - глобальная тревога
     * @param {Array} allEnemies - все враги на уровне
     * @param {boolean} enableEnemyCollisions - включены ли коллизии между врагами
     */
    update(playerX, playerY, isGlobalAlert, allEnemies, enableEnemyCollisions = false) {
        if (this.isEliminated) return;
        
        // Проверка, не застрял ли враг
        if (Math.abs(this.x - this.lastX) < 0.1 && Math.abs(this.y - this.lastY) < 0.1) {
            this.stuckCounter++;
            if (this.stuckCounter > 60 && !this.isStuck) { // Застрял на 1 секунду
                this.isStuck = true;
                this.stuckTime = Date.now();
                if (this.debugMode) {
                    console.warn(`Враг застрял! Позиция: [${Math.round(this.x)}, ${Math.round(this.y)}]`);
                }
            }
        } else {
            this.stuckCounter = 0;
            this.pathfindingAttempts = 0;
            this.isStuck = false;
        }
        
        this.lastX = this.x;
        this.lastY = this.y;
        
        // Если враг застрял, попробовать другой путь
        if (this.isStuck) {
            const stuckDuration = Date.now() - this.stuckTime;
            if (stuckDuration > 2000) { // Если застрял более 2 секунд
                this.currentTarget = (this.currentTarget + 1) % this.patrolPath.length;
                this.isStuck = false;
                this.stuckCounter = 0;
                if (this.debugMode) {
                    console.log(`Враг сменил цель из-за застревания. Новая цель: ${this.currentTarget}`);
                }
            }
        }
        
        // Если глобальная тревога или враг уже был предупрежден
        if (isGlobalAlert || this.isAlerted) {
            this.chasePlayer(playerX, playerY);
        } else {
            this.patrol();
        }
        
        // Проверка коллизий с другими врагами только если включено
        if (enableEnemyCollisions) {
            this.checkEnemyCollisions(allEnemies);
        }
    }
    
    /**
     * Проверка коллизий с другими врагами
     * @param {Array} allEnemies - все враги на уровне
     */
    checkEnemyCollisions(allEnemies) {
        for (const enemy of allEnemies) {
            if (enemy !== this && !enemy.isEliminated && this.checkCollisionWithEnemy(enemy)) {
                // Отталкивание от другого врага
                const dx = this.x - enemy.x;
                const dy = this.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0) {
                    const pushForce = 0.8;
                    this.x += (dx / distance) * pushForce;
                    this.y += (dy / distance) * pushForce;
                    
                    // Проверка коллизий со стенами после отталкивания
                    for (const wall of this.walls) {
                        if (this.checkCollision(wall)) {
                            this.x -= (dx / distance) * pushForce;
                            this.y -= (dy / distance) * pushForce;
                            break;
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Проверка коллизии с другим врагом
     * @param {Enemy} enemy - другой враг
     * @returns {boolean} - есть ли коллизия
     */
    checkCollisionWithEnemy(enemy) {
        return (
            this.x < enemy.x + enemy.width &&
            this.x + this.width > enemy.x &&
            this.y < enemy.y + enemy.height &&
            this.y + this.height > enemy.y
        );
    }
    
    /**
     * Патрулирование
     */
    patrol() {
        if (this.patrolPath && this.patrolPath.length > 1) {
            const target = this.patrolPath[this.currentTarget];
            const dx = target[0] - this.x;
            const dy = target[1] - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 5) {
                this.currentTarget = (this.currentTarget + 1) % this.patrolPath.length;
                this.isStuck = false;
                this.stuckCounter = 0;
            } else {
                this.moveTowards(target[0], target[1], this.speed);
                
                // Обновление направления взгляда
                this.direction = Math.atan2(dy, dx);
            }
        }
    }
    
    /**
     * Преследование игрока
     * @param {number} playerX - координата X игрока
     * @param {number} playerY - координата Y игрока
     */
    chasePlayer(playerX, playerY) {
        this.isAlerted = true;
        this.moveTowards(playerX, playerY, this.alertSpeed);
        this.direction = Math.atan2(playerY - this.y, playerX - this.x);
    }
    
    /**
     * Движение к цели
     * @param {number} targetX - координата X цели
     * @param {number} targetY - координата Y цели
     * @param {number} speed - скорость движения
     */
    moveTowards(targetX, targetY, speed) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const moveX = (dx / distance) * speed;
            const moveY = (dy / distance) * speed;
            
            // Проверка коллизий при движении
            this.moveWithCollision(moveX, moveY);
        }
    }
    
    /**
     * Движение с проверкой коллизий
     * @param {number} moveX - перемещение по X
     * @param {number} moveY - перемещение по Y
     */
    moveWithCollision(moveX, moveY) {
        // Сохраняем исходные позиции
        const originalX = this.x;
        const originalY = this.y;
        
        // Пробуем двигаться по X
        this.x += moveX;
        let collisionX = false;
        
        for (const wall of this.walls) {
            if (this.checkCollision(wall)) {
                collisionX = true;
                this.x = originalX;
                this.reportCollision(wall, 'X');
                break;
            }
        }
        
        // Пробуем двигаться по Y
        this.y += moveY;
        let collisionY = false;
        
        for (const wall of this.walls) {
            if (this.checkCollision(wall)) {
                collisionY = true;
                this.y = originalY;
                this.reportCollision(wall, 'Y');
                break;
            }
        }
        
        // Если есть коллизия по обеим осям, враг останавливается
        if (collisionX && collisionY) {
            // Враг останавливается и не пытается двигаться дальше
            this.x = originalX;
            this.y = originalY;
            
            // Если враг застрял, меняем цель патрулирования
            if (!this.isStuck) {
                this.isStuck = true;
                this.stuckTime = Date.now();
                if (this.debugMode) {
                    console.warn(`Враг остановился из-за столкновения со стеной!`);
                }
            }
        }
        
        // Ограничение движения в пределах canvas
        this.x = Math.max(0, Math.min(this.x, 800 - this.width));
        this.y = Math.max(0, Math.min(this.y, 500 - this.height));
    }
    
    /**
     * Сообщение о столкновении (для отладки)
     */
    reportCollision(wall, axis) {
        this.collisionCount++;
        
        // Ограничиваем частоту сообщений чтобы не заспамить консоль
        const now = Date.now();
        if (now - this.lastCollisionReport > 2000) { // Не чаще чем раз в 2 секунды
            if (this.debugMode) {
                console.warn(`Столкновение врага со стеной!`);
                console.warn(`Позиция врага: [${Math.round(this.x)}, ${Math.round(this.y)}]`);
                console.warn(`Стена: [${wall}]`);
                console.warn(`Ось: ${axis}, Всего столкновений: ${this.collisionCount}`);
            }
            this.lastCollisionReport = now;
        }
    }
    
    /**
     * Проверка коллизии со стеной
     * @param {Array} wall - стена [x, y, width, height]
     * @returns {boolean} - есть ли коллизия
     */
    checkCollision(wall) {
        return (
            this.x < wall[0] + wall[2] &&
            this.x + this.width > wall[0] &&
            this.y < wall[1] + wall[3] &&
            this.y + this.height > wall[1]
        );
    }
    
    /**
     * Проверка обнаружения игрока
     * @param {number} playerX - координата X игрока
     * @param {number} playerY - координата Y игрока
     * @param {Array} walls - массив стен
     * @returns {boolean} - обнаружен ли игрок
     */
    detectPlayer(playerX, playerY, walls) {
        if (this.isEliminated) return false;
        
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Проверка расстояния
        if (distance > this.detectionRange) return false;
        
        // Проверка угла обзора
        const angleToPlayer = Math.atan2(dy, dx);
        const angleDiff = Math.abs(this.direction - angleToPlayer);
        const normalizedAngleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
        
        if (Math.abs(normalizedAngleDiff) > this.detectionAngle / 2) return false;
        
        // Проверка прямой видимости (нет стен между врагом и игроком)
        return this.hasLineOfSight(playerX, playerY, walls);
    }
    
    /**
     * Проверка прямой видимости игрока
     * @param {number} playerX - координата X игрока
     * @param {number} playerY - координата Y игрока
     * @param {Array} walls - массив стен
     * @returns {boolean} - есть ли прямая видимость
     */
    hasLineOfSight(playerX, playerY, walls) {
        // Упрощенная проверка прямой видимости
        for (const wall of walls) {
            if (this.lineIntersectsRect(this.x + this.width/2, this.y + this.height/2, 
                                       playerX + 10, playerY + 10, wall)) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * Проверка пересечения линии с прямоугольником
     * @param {number} x1 - начальная X координата линии
     * @param {number} y1 - начальная Y координата линии
     * @param {number} x2 - конечная X координата линии
     * @param {number} y2 - конечная Y координата линии
     * @param {Array} rect - прямоугольник [x, y, width, height]
     * @returns {boolean} - пересекает ли линия прямоугольник
     */
    lineIntersectsRect(x1, y1, x2, y2, rect) {
        const [rx, ry, rw, rh] = rect;
        
        // Проверка пересечения с каждой стороной прямоугольника
        return (
            this.lineIntersectsLine(x1, y1, x2, y2, rx, ry, rx + rw, ry) || // верх
            this.lineIntersectsLine(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh) || // право
            this.lineIntersectsLine(x1, y1, x2, y2, rx, ry + rh, rx + rw, ry + rh) || // низ
            this.lineIntersectsLine(x1, y1, x2, y2, rx, ry, rx, ry + rh) // лево
        );
    }
    
    /**
     * Проверка пересечения двух отрезков
     * @param {number} x1 - X первой точки первого отрезка
     * @param {number} y1 - Y первой точки первого отрезка
     * @param {number} x2 - X второй точки первого отрезка
     * @param {number} y2 - Y второй точки первого отрезка
     * @param {number} x3 - X первой точки второго отрезка
     * @param {number} y3 - Y первой точки второго отрезка
     * @param {number} x4 - X второй точки второго отрезка
     * @param {number} y4 - Y второй точки второго отрезка
     * @returns {boolean} - пересекаются ли отрезки
     */
    lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
        const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (den === 0) return false;
        
        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
        
        return t >= 0 && t <= 1 && u >= 0 && u <= 1;
    }
    
    /**
     * Проверка, может ли враг быть устранен
     * @param {number} playerX - координата X игрока
     * @param {number} playerY - координата Y игрока
     * @param {number} playerDirection - направление игрока
     * @returns {boolean} - может ли быть устранен
     */
    canBeEliminated(playerX, playerY, playerDirection) {
        if (this.isEliminated || this.isAlerted || this.isVigilanceEnhanced) return false;
        
        // Проверка расстояния - увеличена дистанция устранения
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Увеличена дистанция устранения до 40 пикселей
        if (distance > 40) return false;
        
        // Проверка, что игрок находится сзади врага
        // Используем полную заднюю полусферу (180 градусов)
        const angleToPlayer = Math.atan2(dy, dx);
        const angleDiff = Math.abs(this.direction - angleToPlayer);
        const normalizedAngleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
        
        // Упрощенная проверка - игрок должен быть в задней полусфере врага
        return Math.abs(normalizedAngleDiff) > Math.PI / 2;
    }
    
    /**
     * Проверка столкновения с игроком
     * @param {Player} player - объект игрока
     * @returns {boolean} - есть ли столкновение
     */
    checkCollisionWithPlayer(player) {
        return (
            this.x < player.x + player.width &&
            this.x + this.width > player.x &&
            this.y < player.y + player.height &&
            this.y + this.height > player.y
        );
    }
    
    /**
     * Устранение врага
     */
    eliminate() {
        this.isEliminated = true;
        if (this.debugMode) {
            console.log(`Враг устранен! Позиция: [${Math.round(this.x)}, ${Math.round(this.y)}]`);
        }
    }
    
    /**
     * Активация режима тревоги
     * @param {number} playerX - координата X игрока
     * @param {number} playerY - координата Y игрока
     */
    alert(playerX, playerY) {
        this.isAlerted = true;
        this.chaseTarget = { x: playerX, y: playerY };
    }
    
    /**
     * Усиление бдительности врага
     */
    enhanceVigilance() {
        this.isVigilanceEnhanced = true;
        this.detectionRange *= 1.2; // Увеличиваем дальность обнаружения
    }
    
    /**
     * Отрисовка врага
     * @param {CanvasRenderingContext2D} ctx - контекст canvas
     * @param {boolean} isAlertMode - режим тревоги
     */
    render(ctx, isAlertMode) {
        if (this.isEliminated) return;
        
        // Тело врага
        if (this.isVigilanceEnhanced) {
            ctx.fillStyle = this.enhancedColor;
        } else {
            ctx.fillStyle = this.isAlerted ? this.alertColor : this.color;
        }
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Область видимости (для отладки)
        if (!isAlertMode) {
            ctx.save();
            ctx.translate(this.x + this.width/2, this.y + this.height/2);
            ctx.rotate(this.direction);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, this.detectionRange, -this.detectionAngle/2, this.detectionAngle/2);
            ctx.closePath();
            ctx.fillStyle = this.isVigilanceEnhanced ? 'rgba(255, 100, 100, 0.2)' : 'rgba(255, 0, 0, 0.1)';
            ctx.fill();
            ctx.restore();
        }
        
        // Глаза (направление взгляда)
        ctx.fillStyle = '#000';
        const eyeX = this.x + this.width/2 + Math.cos(this.direction) * 8;
        const eyeY = this.y + this.height/2 + Math.sin(this.direction) * 8;
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Отображение состояния (тревога или усиленная бдительность)
        if (this.isAlerted) {
            ctx.fillStyle = '#ffcc00';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y - 10, 5, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.isVigilanceEnhanced) {
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y - 10, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Отладочная информация
        if (this.debugMode && this.collisionCount > 0) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px Consolas';
            ctx.fillText(`${this.collisionCount}`, this.x + this.width + 2, this.y + this.height/2);
            
            // Индикатор застревания
            if (this.isStuck) {
                ctx.fillStyle = '#ff0000';
                ctx.beginPath();
                ctx.arc(this.x + this.width/2, this.y - 15, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

export default Enemy;
