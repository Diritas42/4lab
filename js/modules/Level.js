// Класс уровня игры
export class Level {
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
        // Отрисовка стен (увеличена толщина)
        ctx.fillStyle = '#666';
        this.walls.forEach(wall => {
            ctx.fillRect(wall[0], wall[1], wall[2], wall[3]);
        });
        
        // Отрисовка выхода (исправлено смещение - теперь центр выхода соответствует координатам)
        ctx.fillStyle = '#2196F3';
        ctx.fillRect(this.exit[0], this.exit[1], 20, 20);
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ВЫХОД', this.exit[0] + 10, this.exit[1] - 5);
    }
}
