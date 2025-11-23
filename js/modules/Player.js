// js/modules/Player.js
/**
 * Класс игрока
 */
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.speed = 2;
        this.runSpeed = 4;
        this.color = '#4CAF50';
        this.direction = 0; // 0: вправо, 1: влево, 2: вверх, 3: вниз
        this.eliminationCooldown = 0;
    }
    
    /**
     * Обновление состояния игрока
     * @param {Object} keys - объект с состояниями клавиш
     * @param {Array} walls - массив стен
     */
    update(keys, walls) {
        let moveX = 0;
        let moveY = 0;
        const speed = keys['ShiftLeft'] ? this.runSpeed : this.speed;
        
        if (keys['KeyW'] || keys['ArrowUp']) {
            moveY = -speed;
            this.direction = 2;
        }
        if (keys['KeyS'] || keys['ArrowDown']) {
            moveY = speed;
            this.direction = 3;
        }
        if (keys['KeyA'] || keys['ArrowLeft']) {
            moveX = -speed;
            this.direction = 1;
        }
        if (keys['KeyD'] || keys['ArrowRight']) {
            moveX = speed;
            this.direction = 0;
        }
        
        // Обновление кулдауна устранения
        if (this.eliminationCooldown > 0) {
            this.eliminationCooldown--;
        }
        
        // Применение движения с проверкой коллизий
        this.moveWithCollision(moveX, moveY, walls);
    }
    
    /**
     * Движение с проверкой коллизий
     * @param {number} moveX - перемещение по X
     * @param {number} moveY - перемещение по Y
     * @param {Array} walls - массив стен
     */
    moveWithCollision(moveX, moveY, walls) {
        // Проверка коллизий по X
        this.x += moveX;
        for (const wall of walls) {
            if (this.checkCollision(wall)) {
                this.x -= moveX;
                break;
            }
        }
        
        // Проверка коллизий по Y
        this.y += moveY;
        for (const wall of walls) {
            if (this.checkCollision(wall)) {
                this.y -= moveY;
                break;
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
     * Устранение врага
     * @param {Array} enemies - массив врагов
     */
    eliminateEnemy(enemies) {
        if (this.eliminationCooldown > 0) return;
        
        for (const enemy of enemies) {
            if (!enemy.isEliminated && enemy.canBeEliminated(this.x, this.y, this.direction)) {
                enemy.eliminate();
                this.eliminationCooldown = 30; // 0.5 секунды кулдауна
                break;
            }
        }
    }
    
    /**
     * Отрисовка игрока
     * @param {CanvasRenderingContext2D} ctx - контекст canvas
     */
    render(ctx) {
        // Тело игрока
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Голова (показывает направление)
        ctx.fillStyle = '#2E7D32';
        switch(this.direction) {
            case 0: // вправо
                ctx.fillRect(this.x + this.width - 5, this.y + 5, 5, 10);
                break;
            case 1: // влево
                ctx.fillRect(this.x, this.y + 5, 5, 10);
                break;
            case 2: // вверх
                ctx.fillRect(this.x + 5, this.y, 10, 5);
                break;
            case 3: // вниз
                ctx.fillRect(this.x + 5, this.y + this.height - 5, 10, 5);
                break;
        }
    }
}

export default Player;
