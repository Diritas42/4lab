// js/modules/Document.js
/**
 * Класс секретного документа
 */
class Document {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 25;
        this.color = '#FFD700'; // Золотой цвет
        this.isCollected = false;
    }
    
    /**
     * Проверка коллизии с игроком
     * @param {Player} player - объект игрока
     * @returns {boolean} - есть ли коллизия
     */
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
    
    /**
     * Отрисовка документа
     * @param {CanvasRenderingContext2D} ctx - контекст canvas
     */
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

export default Document;
