export class Document {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 15;
        this.height = 20;
        this.color = '#FFD700';
        this.isCollected = false;
    }
    

    checkCollision(player) {
        return (
            this.x < player.x + player.width &&
            this.x + this.width > player.x &&
            this.y < player.y + player.height &&
            this.y + this.height > player.y
        );
    }
    
    /**
     * Сбор документа
     */
    collect() {
        this.isCollected = true;
    }
    

    render(ctx) {
        if (this.isCollected) return;
        
        // Основной прямоугольник документа
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Текст на документе
        ctx.fillStyle = '#000';
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('DOC', this.x + this.width/2, this.y + this.height/2 + 3);
        
        // Блеск
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(this.x + 2, this.y + 2, 5, 3);
    }
}
