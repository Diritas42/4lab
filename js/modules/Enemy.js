// js/modules/Enemy.js
/**
 * Класс врага
 */
class Enemy {
    constructor(x, y, patrolPath) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.patrolPath = patrolPath;
        this.currentTarget = 0;
        this.speed = 1;
        this.color = '#f44336';
        this.detectionRange = 150;
        this.detectionAngle = Math.PI / 3; // 60 градусов
        this.direction = 0; // Направление взгляда
    }
    
    /**
     * Обновление состояния врага
     */
    update() {
        // Движение по патрульному маршруту
        if (this.patrolPath && this.patrolPath.length > 1) {
            const target = this.patrolPath[this.currentTarget];
            const dx = target[0] - this.x;
            const dy = target[1] - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 5) {
                this.currentTarget = (this.currentTarget + 1) % this.patrolPath.length;
            } else {
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
                
                // Обновление направления взгляда
                this.direction = Math.atan2(dy, dx);
            }
        }
    }
    
    /**
     * Проверка обнаружения игрока
     * @param {number} playerX - координата X игрока
     * @param {number} playerY - координата Y игрока
     * @param {Array} walls - массив стен
     * @returns {boolean} - обнаружен ли игрок
     */
    detectPlayer(playerX, playerY, walls) {
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
            if (this.lineIntersectsRect(this.x, this.y, playerX, playerY, wall)) {
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
     * Отрисовка врага
     * @param {CanvasRenderingContext2D} ctx - контекст canvas
     */
    render(ctx) {
        // Тело врага
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Область видимости (для отладки)
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
        
        // Глаза (направление взгляда)
        ctx.fillStyle = '#000';
        const eyeX = this.x + this.width/2 + Math.cos(this.direction) * 8;
        const eyeY = this.y + this.height/2 + Math.sin(this.direction) * 8;
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

export default Enemy;