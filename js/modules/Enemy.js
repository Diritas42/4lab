// js/modules/Enemy.js
/**
 * Класс врага
 */
class Enemy {
    constructor(x, y, patrolPath, walls) {
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
        this.highAlertColor = '#ffcc00';
        this.detectionRange = 150;
        this.detectionAngle = Math.PI / 3; // 60 градусов
        this.blindSpotAngle = Math.PI / 6; // 30 градусов сзади
        this.direction = 0; // Направление взгляда
        this.isAlerted = false;
        this.isHighAlert = false;
        this.isEliminated = false;
        this.walls = walls;
        this.chaseTarget = null;
        this.stuckCounter = 0;
        this.lastX = x;
        this.lastY = y;
    }
    
    /**
     * Обновление состояния врага
     * @param {number} playerX - координата X игрока
     * @param {number} playerY - координата Y игрока
     * @param {boolean} isAlertMode - режим тревоги
     * @param {boolean} isHighAlertMode - режим повышенной готовности
     * @param {Array} enemies - массив всех врагов
     */
    update(playerX, playerY, isAlertMode, isHighAlertMode, enemies) {
        if (this.isEliminated) return;
        
        // Проверка, не застрял ли враг
        if (Math.abs(this.x - this.lastX) < 0.1 && Math.abs(this.y - this.lastY) < 0.1) {
            this.stuckCounter++;
        } else {
            this.stuckCounter = 0;
        }
        
        this.lastX = this.x;
        this.lastY = this.y;
        
        // Если враг застрял, попробовать другой путь
        if (this.stuckCounter > 60) { // Застрял на 1 секунду
            this.currentTarget = (this.currentTarget + 1) % this.patrolPath.length;
            this.stuckCounter = 0;
        }
        
        // Если глобальная тревога или враг уже был предупрежден
        if (isAlertMode || this.isAlerted) {
            this.chasePlayer(playerX, playerY);
        } else if (this.isHighAlert) {
            // В режиме повышенной готовности враги продолжают патрулировать, но с повышенной бдительностью
            this.patrol();
        } else {
            this.patrol();
        }
        
        // Проверка коллизий с другими врагами
        this.resolveEnemyCollisions(enemies);
    }
    
    /**
     * Разрешение коллизий с другими врагами
     * @param {Array} enemies - массив всех врагов
     */
    resolveEnemyCollisions(enemies) {
        for (const enemy of enemies) {
            if (enemy !== this && !enemy.isEliminated && this.checkCollisionWithEnemy(enemy)) {
                // Вычисляем вектор от текущего врага к другому
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance === 0) continue; // Избегаем деления на ноль
                
                // Минимальное расстояние, при котором коллизии нет
                const minDistance = this.width;
                
                // Если враги слишком близко, отталкиваем их друг от друга
                if (distance < minDistance) {
                    const pushForce = (minDistance - distance) / distance;
                    const pushX = dx * pushForce * 0.5;
                    const pushY = dy * pushForce * 0.5;
                    
                    // Сдвигаем текущего врага
                    this.x -= pushX;
                    this.y -= pushY;
                    
                    // Сдвигаем другого врага
                    enemy.x += pushX;
                    enemy.y += pushY;
                    
                    // Ограничиваем позиции в пределах canvas
                    this.x = Math.max(0, Math.min(this.x, 800 - this.width));
                    this.y = Math.max(0, Math.min(this.y, 500 - this.height));
                    enemy.x = Math.max(0, Math.min(enemy.x, 800 - enemy.width));
                    enemy.y = Math.max(0, Math.min(enemy.y, 500 - enemy.height));
                }
            }
        }
    }
    
    /**
     * Проверка коллизии с другим врагом
     * @param {Enemy} otherEnemy - другой враг
     * @returns {boolean} - есть ли коллизия
     */
    checkCollisionWithEnemy(otherEnemy) {
        return (
            this.x < otherEnemy.x + otherEnemy.width &&
            this.x + this.width > otherEnemy.x &&
            this.y < otherEnemy.y + otherEnemy.height &&
            this.y + this.height > otherEnemy.y
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
                break;
            }
        }
        
        // Если есть коллизия по обеим осям, пробуем двигаться по диагонали
        if (collisionX && collisionY) {
            // Пробуем двигаться только по X
            this.x = originalX + moveX;
            this.y = originalY;
            
            let canMoveX = true;
            for (const wall of this.walls) {
                if (this.checkCollision(wall)) {
                    canMoveX = false;
                    break;
                }
            }
            
            // Пробуем двигаться только по Y
            this.x = originalX;
            this.y = originalY + moveY;
            
            let canMoveY = true;
            for (const wall of this.walls) {
                if (this.checkCollision(wall)) {
                    canMoveY = false;
                    break;
                }
            }
            
            // Если можем двигаться только по одной оси, делаем это
            if (canMoveX && !canMoveY) {
                this.x = originalX + moveX;
                this.y = originalY;
            } else if (!canMoveX && canMoveY) {
                this.x = originalX;
                this.y = originalY + moveY;
            } else {
                // Не можем двигаться ни по одной оси
                this.x = originalX;
                this.y = originalY;
            }
        }
        
        // Ограничение движения в пределах canvas
        this.x = Math.max(0, Math.min(this.x, 800 - this.width));
        this.y = Math.max(0, Math.min(this.y, 500 - this.height));
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
     * @param {boolean} isHighAlertMode - режим повышенной готовности
     * @returns {Object} - результат обнаружения
     */
    detectPlayer(playerX, playerY, walls, isHighAlertMode) {
        if (this.isEliminated) return { detected: false, instant: false };
        
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Проверка расстояния
        if (distance > this.detectionRange) return { detected: false, instant: false };
        
        // Проверка угла обзора
        const angleToPlayer = Math.atan2(dy, dx);
        const angleDiff = Math.abs(this.direction - angleToPlayer);
        const normalizedAngleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
        
        if (Math.abs(normalizedAngleDiff) > this.detectionAngle / 2) return { detected: false, instant: false };
        
        // Проверка прямой видимости (нет стен между врагом и игроком)
        const hasLineOfSight = this.hasLineOfSight(playerX, playerY, walls);
        
        // В режиме повышенной готовности обнаружение мгновенное
        if (hasLineOfSight && (this.isHighAlert || isHighAlertMode)) {
            return { detected: true, instant: true };
        }
        
        return { detected: hasLineOfSight, instant: false };
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
        if (this.isEliminated || this.isAlerted || this.isHighAlert) return false;
        
        // Проверка расстояния
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 30) return false;
        
        // Проверка, что игрок находится сзади врага
        const angleToPlayer = Math.atan2(dy, dx);
        const angleDiff = Math.abs(this.direction - angleToPlayer);
        const normalizedAngleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
        
        return Math.abs(normalizedAngleDiff) > Math.PI - this.blindSpotAngle / 2;
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
     * Активация режима повышенной готовности
     */
    highAlert() {
        this.isHighAlert = true;
        // В режиме повышенной готовности враги не могут быть устранены
        // и имеют мгновенное обнаружение
    }
    
    /**
     * Отрисовка врага
     * @param {CanvasRenderingContext2D} ctx - контекст canvas
     * @param {boolean} isAlertMode - режим тревоги
     * @param {boolean} isHighAlertMode - режим повышенной готовности
     */
    render(ctx, isAlertMode, isHighAlertMode) {
        if (this.isEliminated) return;
        
        // Тело врага
        if (this.isHighAlert || isHighAlertMode) {
            ctx.fillStyle = this.highAlertColor;
        } else if (this.isAlerted) {
            ctx.fillStyle = this.alertColor;
        } else {
            ctx.fillStyle = this.color;
        }
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Область видимости (для отладки)
        if (!isAlertMode && !isHighAlertMode) {
            ctx.save();
            ctx.translate(this.x + this.width/2, this.y + this.height/2);
            ctx.rotate(this.direction);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, this.detectionRange, -this.detectionAngle/2, this.detectionAngle/2);
            ctx.closePath();
            ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
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
        
        // Отображение состояния (тревога или повышенная готовность)
        if (this.isAlerted) {
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y - 10, 5, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.isHighAlert || isHighAlertMode) {
            ctx.fillStyle = '#ffcc00';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y - 10, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

export default Enemy;
