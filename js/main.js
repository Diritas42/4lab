import { Game } from './modules/Game.js';

// Инициализация игры после полной загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const game = new Game(canvas);
    game.init();
    
    // Обработчики кнопок
    document.getElementById('restartBtn').addEventListener('click', () => {
        game.restartLevel();
    });
    
    document.getElementById('nextLevelBtn').addEventListener('click', () => {
        game.nextLevel();
    });
});
