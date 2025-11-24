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
        
        // Отрисовка выхода - исправлено смещение
        const exitSize = 20;
        const exitX = this.exit[0] - exitSize/2;
        const exitY = this.exit[1] - exitSize/2;
        
        ctx.fillStyle = '#2196F3';
        ctx.fillRect(exitX, exitY, exitSize, exitSize);
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ВЫХОД', this.exit[0], this.exit[1] - 15);
    }
}

export default Level;
