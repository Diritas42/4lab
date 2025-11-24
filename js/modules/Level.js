// js/modules/Level.js
/**
 * Класс уровня игры
 */
class Level {
    constructor(number, walls, enemies, exit, startPosition, documents) {
        this.number = number;
        this.walls = walls;
        this.enemies = enemies;
        this.exit = exit;
        this.startPosition = startPosition;
        this.documents = documents;
    }
    
    /**
     * Отрисовка уровня
     * @param {CanvasRenderingContext2D} ctx - контекст canvas
     */
    render(ctx) {
        // Отрисовка стен
        ctx.fillStyle = '#555';
        this.walls.forEach(wall => {
            ctx.fillRect(wall[0], wall[1], wall[2], wall[3]);
        });
        
        // Отрисовка выхода (центрированный)
        ctx.fillStyle = '#2196F3';
        ctx.fillRect(this.exit[0] - 15, this.exit[1] - 15, 30, 30);
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ВЫХОД', this.exit[0], this.exit[1] - 20);
    }
}

export default Level;
