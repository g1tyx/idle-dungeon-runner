// ==========================================
// IDLE DUNGEON RUNNER - Complete Game
// ==========================================

// === GAME CONFIGURATION ===
// Centralized configuration for easy tuning and maintenance
const CONFIG = {
    // Timing & Performance
    TICK_RATE: 16.67,           // ms per game tick (~60 FPS)
    AUTOSAVE_INTERVAL: 30000,   // ms between autosaves
    OFFLINE_MAX_HOURS: 8,       // max hours for offline progress

    // Grid & Display
    MIN_GRID_SIZE: 8,
    MAX_GRID_SIZE: 50,
    BASE_TILE_SIZE: 14,
    GRID_GROWTH_RATE: 0.25,     // tiles per floor

    // Combat
    PLAYER_MOVE_DELAY: 0.75,    // seconds between moves
    MONSTER_CHASE_RANGE: 10,    // tiles before monster chases
    MONSTER_ATTACK_RANGE: 1,    // melee range
    BASE_CRIT_DAMAGE: 150,      // percentage
    MAX_EVASION: 75,            // percentage cap
    MAX_CRIT_CHANCE: 100,       // percentage cap

    // Progression
    XP_BASE: 50,
    XP_SCALING: 1.5,            // exponential growth
    ELITE_SPAWN_CHANCE: 0.10,   // 10%
    BOSS_FLOOR_INTERVAL: 10,
    MINI_BOSS_FLOOR_INTERVAL: 5,

    // Economy
    UPGRADE_COST_SCALING: {
        maxHp: 1.15,
        attack: 1.18,
        defense: 1.18,
        speed: 1.20,
        evasion: 1.20,
        critChance: 1.25
    },

    // Dungeon Generation
    CAVE_WALL_CHANCE: 0.45,     // cellular automata initial fill
    CAVE_ITERATIONS: 4,         // smoothing passes
    CHEST_DENSITY: 0.01,        // per floor tile
    TRAP_DENSITY: 0.02,
    SECRET_ROOM_BASE_CHANCE: 0.08,
    SECRET_ROOM_FLOOR_BONUS: 0.002,
    NPC_SPAWN_CHANCE: 0.10,

    // Visual Effects
    LIGHT_RADIUS_TILES: 8,
    LIGHT_MIN_INTENSITY: 0.3,
    SCREEN_SHAKE_DECAY: 20,     // per second
    PARTICLE_POOL_SIZE: 100,

    // Combo System
    COMBO_TIMEOUT: 3.0,         // seconds to maintain combo

    // Paths
    SPRITE_BASE_PATH: 'assets/dcss'  // Actual asset location
};

// === UTILITY FUNCTIONS ===

/**
 * Converts a hex color to RGB string format
 * @param {string} hex - Hex color code (with or without #)
 * @returns {string} RGB values as comma-separated string
 */
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '74, 158, 255';
}

/**
 * Clamps a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum bound
 * @param {number} max - Maximum bound
 * @returns {number} Clamped value
 */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation between two values
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
function lerp(a, b, t) {
    return a + (b - a) * clamp(t, 0, 1);
}

/**
 * Returns a random element from an array
 * @param {Array} arr - Array to pick from
 * @returns {*} Random element
 */
function randomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Checks if a random roll succeeds based on chance
 * @param {number} chance - Probability (0-1)
 * @returns {boolean} True if roll succeeds
 */
function rollChance(chance) {
    return Math.random() < chance;
}

// === PROCEDURAL CHARACTER GRAPHICS ===
// High-quality pixel-art style character rendering

/**
 * Draws a pixel-art style player character
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - Center X position
 * @param {number} y - Center Y position
 * @param {number} size - Character size
 * @param {string} playerClass - Class name (warrior, mage, rogue)
 * @param {string} color - Primary color
 * @param {number} time - Animation time
 */
function drawProceduralPlayer(ctx, x, y, size, playerClass, color, time) {
    const s = size * 0.8; // Scale factor
    const bounce = Math.sin(time * 4) * 2;
    const breathe = 1 + Math.sin(time * 2) * 0.03;

    ctx.save();
    ctx.translate(x, y + bounce);
    ctx.scale(breathe, breathe);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.8, s * 0.6, s * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    const skinColor = '#FFD5B5';
    const darkColor = shadeColor(color, -40);
    const lightColor = shadeColor(color, 30);

    if (playerClass === 'warrior') {
        // Legs
        ctx.fillStyle = '#555';
        ctx.fillRect(-s * 0.25, s * 0.2, s * 0.2, s * 0.5);
        ctx.fillRect(s * 0.05, s * 0.2, s * 0.2, s * 0.5);

        // Body armor
        ctx.fillStyle = darkColor;
        ctx.beginPath();
        ctx.moveTo(-s * 0.4, -s * 0.1);
        ctx.lineTo(s * 0.4, -s * 0.1);
        ctx.lineTo(s * 0.35, s * 0.3);
        ctx.lineTo(-s * 0.35, s * 0.3);
        ctx.closePath();
        ctx.fill();

        // Armor highlight
        ctx.fillStyle = lightColor;
        ctx.beginPath();
        ctx.moveTo(-s * 0.3, -s * 0.05);
        ctx.lineTo(s * 0.1, -s * 0.05);
        ctx.lineTo(s * 0.05, s * 0.15);
        ctx.lineTo(-s * 0.25, s * 0.15);
        ctx.closePath();
        ctx.fill();

        // Head
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(0, -s * 0.35, s * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // Helmet
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.arc(0, -s * 0.4, s * 0.28, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#666';
        ctx.fillRect(-s * 0.28, -s * 0.42, s * 0.56, s * 0.08);

        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(-s * 0.12, -s * 0.35, s * 0.06, s * 0.06);
        ctx.fillRect(s * 0.06, -s * 0.35, s * 0.06, s * 0.06);

        // Sword
        ctx.fillStyle = '#AAA';
        ctx.fillRect(s * 0.4, -s * 0.5, s * 0.08, s * 0.7);
        ctx.fillStyle = '#654321';
        ctx.fillRect(s * 0.35, -s * 0.05, s * 0.18, s * 0.12);
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(s * 0.44, -s * 0.5, s * 0.06, 0, Math.PI * 2);
        ctx.fill();

        // Shield
        ctx.fillStyle = darkColor;
        ctx.beginPath();
        ctx.moveTo(-s * 0.5, -s * 0.2);
        ctx.lineTo(-s * 0.3, -s * 0.2);
        ctx.lineTo(-s * 0.3, s * 0.2);
        ctx.lineTo(-s * 0.4, s * 0.3);
        ctx.lineTo(-s * 0.5, s * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = lightColor;
        ctx.beginPath();
        ctx.arc(-s * 0.4, 0, s * 0.08, 0, Math.PI * 2);
        ctx.fill();

    } else if (playerClass === 'mage') {
        // Robe bottom
        ctx.fillStyle = darkColor;
        ctx.beginPath();
        ctx.moveTo(-s * 0.35, 0);
        ctx.lineTo(s * 0.35, 0);
        ctx.lineTo(s * 0.45, s * 0.7);
        ctx.lineTo(-s * 0.45, s * 0.7);
        ctx.closePath();
        ctx.fill();

        // Robe body
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(-s * 0.35, -s * 0.2);
        ctx.lineTo(s * 0.35, -s * 0.2);
        ctx.lineTo(s * 0.35, s * 0.1);
        ctx.lineTo(-s * 0.35, s * 0.1);
        ctx.closePath();
        ctx.fill();

        // Robe trim
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(-s * 0.38, -s * 0.22, s * 0.76, s * 0.05);
        ctx.fillRect(-s * 0.05, -s * 0.2, s * 0.1, s * 0.3);

        // Head
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(0, -s * 0.4, s * 0.22, 0, Math.PI * 2);
        ctx.fill();

        // Wizard hat
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.9);
        ctx.lineTo(s * 0.3, -s * 0.35);
        ctx.lineTo(-s * 0.3, -s * 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(-s * 0.32, -s * 0.38, s * 0.64, s * 0.06);

        // Eyes
        ctx.fillStyle = '#00FFFF';
        ctx.beginPath();
        ctx.arc(-s * 0.08, -s * 0.4, s * 0.05, 0, Math.PI * 2);
        ctx.arc(s * 0.08, -s * 0.4, s * 0.05, 0, Math.PI * 2);
        ctx.fill();

        // Staff
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(s * 0.35, -s * 0.7, s * 0.06, s * 1.2);
        // Crystal orb
        const orbGlow = 0.5 + Math.sin(time * 4) * 0.3;
        ctx.fillStyle = `rgba(0, 255, 255, ${orbGlow})`;
        ctx.beginPath();
        ctx.arc(s * 0.38, -s * 0.75, s * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#00FFFF';
        ctx.beginPath();
        ctx.arc(s * 0.38, -s * 0.75, s * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(s * 0.34, -s * 0.79, s * 0.03, 0, Math.PI * 2);
        ctx.fill();

    } else if (playerClass === 'rogue') {
        // Legs
        ctx.fillStyle = '#333';
        ctx.fillRect(-s * 0.2, s * 0.15, s * 0.15, s * 0.5);
        ctx.fillRect(s * 0.05, s * 0.15, s * 0.15, s * 0.5);

        // Body
        ctx.fillStyle = darkColor;
        ctx.beginPath();
        ctx.moveTo(-s * 0.3, -s * 0.15);
        ctx.lineTo(s * 0.3, -s * 0.15);
        ctx.lineTo(s * 0.25, s * 0.25);
        ctx.lineTo(-s * 0.25, s * 0.25);
        ctx.closePath();
        ctx.fill();

        // Cape
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(-s * 0.25, -s * 0.1);
        ctx.lineTo(-s * 0.4, s * 0.5);
        ctx.lineTo(-s * 0.1, s * 0.4);
        ctx.closePath();
        ctx.fill();

        // Hood/Head
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, -s * 0.35, s * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // Face shadow
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(0, -s * 0.3, s * 0.18, 0, Math.PI);
        ctx.fill();

        // Eyes (glowing in shadow)
        ctx.fillStyle = '#FF4444';
        ctx.beginPath();
        ctx.arc(-s * 0.08, -s * 0.35, s * 0.04, 0, Math.PI * 2);
        ctx.arc(s * 0.08, -s * 0.35, s * 0.04, 0, Math.PI * 2);
        ctx.fill();

        // Daggers
        ctx.fillStyle = '#AAA';
        ctx.save();
        ctx.translate(s * 0.35, -s * 0.1);
        ctx.rotate(0.3);
        ctx.fillRect(0, 0, s * 0.05, s * 0.35);
        ctx.fillStyle = '#654321';
        ctx.fillRect(-s * 0.03, s * 0.25, s * 0.11, s * 0.08);
        ctx.restore();

        ctx.fillStyle = '#AAA';
        ctx.save();
        ctx.translate(-s * 0.4, -s * 0.1);
        ctx.rotate(-0.3);
        ctx.fillRect(0, 0, s * 0.05, s * 0.35);
        ctx.fillStyle = '#654321';
        ctx.fillRect(-s * 0.03, s * 0.25, s * 0.11, s * 0.08);
        ctx.restore();
    }

    ctx.restore();
}

/**
 * Draws a pixel-art style monster
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - Center X position
 * @param {number} y - Center Y position
 * @param {number} size - Monster size
 * @param {Object} monster - Monster data
 * @param {number} time - Animation time
 */
function drawProceduralMonster(ctx, x, y, size, monster, time) {
    if (!monster || !ctx) return;

    try {
        const s = size * 0.7;
        const bounce = Math.sin(time * 5 + (monster.x || 0)) * 1.5;
        const color = monster.color || '#FF0000';
        const darkColor = shadeColor(color, -30);
        const lightColor = shadeColor(color, 40);

        ctx.save();
        ctx.translate(x, y + bounce);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.7, s * 0.5, s * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Get monster type for shape selection
    const name = (monster.name || '').toLowerCase();

    if (name.includes('slime')) {
        // Blob shape
        const squish = 1 + Math.sin(time * 6) * 0.1;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(0, s * 0.1, s * 0.5 * squish, s * 0.4 / squish, 0, 0, Math.PI * 2);
        ctx.fill();
        // Highlight
        ctx.fillStyle = lightColor;
        ctx.beginPath();
        ctx.ellipse(-s * 0.15, -s * 0.1, s * 0.15, s * 0.1, -0.3, 0, Math.PI * 2);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(-s * 0.15, -s * 0.05, s * 0.1, 0, Math.PI * 2);
        ctx.arc(s * 0.15, -s * 0.05, s * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-s * 0.12, -s * 0.03, s * 0.05, 0, Math.PI * 2);
        ctx.arc(s * 0.18, -s * 0.03, s * 0.05, 0, Math.PI * 2);
        ctx.fill();

    } else if (name.includes('skeleton') || name.includes('zombie')) {
        // Undead humanoid
        const boneColor = name.includes('skeleton') ? '#E8E8E8' : '#6B8E6B';
        const eyeColor = name.includes('skeleton') ? '#FF0000' : '#FFFF00';

        // Body
        ctx.fillStyle = boneColor;
        ctx.fillRect(-s * 0.2, -s * 0.1, s * 0.4, s * 0.5);
        // Ribs
        ctx.fillStyle = shadeColor(boneColor, -20);
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(-s * 0.18, s * 0.05 + i * s * 0.12, s * 0.36, s * 0.04);
        }
        // Head
        ctx.fillStyle = boneColor;
        ctx.beginPath();
        ctx.arc(0, -s * 0.35, s * 0.25, 0, Math.PI * 2);
        ctx.fill();
        // Eye sockets
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-s * 0.1, -s * 0.38, s * 0.08, 0, Math.PI * 2);
        ctx.arc(s * 0.1, -s * 0.38, s * 0.08, 0, Math.PI * 2);
        ctx.fill();
        // Glowing eyes
        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        ctx.arc(-s * 0.1, -s * 0.38, s * 0.04, 0, Math.PI * 2);
        ctx.arc(s * 0.1, -s * 0.38, s * 0.04, 0, Math.PI * 2);
        ctx.fill();
        // Jaw
        ctx.fillStyle = boneColor;
        ctx.fillRect(-s * 0.12, -s * 0.2, s * 0.24, s * 0.08);
        // Arms
        ctx.fillRect(-s * 0.4, -s * 0.05, s * 0.2, s * 0.08);
        ctx.fillRect(s * 0.2, -s * 0.05, s * 0.2, s * 0.08);

    } else if (name.includes('goblin') || name.includes('orc')) {
        const skinTone = name.includes('orc') ? '#5D8A5D' : '#7CB342';
        // Body
        ctx.fillStyle = skinTone;
        ctx.beginPath();
        ctx.ellipse(0, s * 0.1, s * 0.3, s * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        // Head
        ctx.beginPath();
        ctx.ellipse(0, -s * 0.35, s * 0.28, s * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        // Ears
        ctx.beginPath();
        ctx.ellipse(-s * 0.35, -s * 0.3, s * 0.12, s * 0.08, -0.5, 0, Math.PI * 2);
        ctx.ellipse(s * 0.35, -s * 0.3, s * 0.12, s * 0.08, 0.5, 0, Math.PI * 2);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.arc(-s * 0.1, -s * 0.38, s * 0.07, 0, Math.PI * 2);
        ctx.arc(s * 0.1, -s * 0.38, s * 0.07, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-s * 0.1, -s * 0.38, s * 0.03, 0, Math.PI * 2);
        ctx.arc(s * 0.1, -s * 0.38, s * 0.03, 0, Math.PI * 2);
        ctx.fill();
        // Mouth with teeth
        ctx.fillStyle = '#000';
        ctx.fillRect(-s * 0.12, -s * 0.22, s * 0.24, s * 0.08);
        ctx.fillStyle = '#FFF';
        ctx.fillRect(-s * 0.1, -s * 0.22, s * 0.05, s * 0.05);
        ctx.fillRect(s * 0.05, -s * 0.22, s * 0.05, s * 0.05);

    } else if (name.includes('bat') || name.includes('vampire')) {
        // Bat/vampire
        ctx.fillStyle = color;
        // Wings
        ctx.beginPath();
        ctx.moveTo(-s * 0.6, -s * 0.2);
        ctx.quadraticCurveTo(-s * 0.4, -s * 0.5, 0, -s * 0.1);
        ctx.quadraticCurveTo(s * 0.4, -s * 0.5, s * 0.6, -s * 0.2);
        ctx.quadraticCurveTo(s * 0.3, 0, 0, s * 0.1);
        ctx.quadraticCurveTo(-s * 0.3, 0, -s * 0.6, -s * 0.2);
        ctx.fill();
        // Body
        ctx.beginPath();
        ctx.ellipse(0, s * 0.1, s * 0.2, s * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        // Head
        ctx.beginPath();
        ctx.arc(0, -s * 0.15, s * 0.18, 0, Math.PI * 2);
        ctx.fill();
        // Ears
        ctx.beginPath();
        ctx.moveTo(-s * 0.15, -s * 0.25);
        ctx.lineTo(-s * 0.25, -s * 0.45);
        ctx.lineTo(-s * 0.05, -s * 0.25);
        ctx.moveTo(s * 0.15, -s * 0.25);
        ctx.lineTo(s * 0.25, -s * 0.45);
        ctx.lineTo(s * 0.05, -s * 0.25);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(-s * 0.07, -s * 0.18, s * 0.04, 0, Math.PI * 2);
        ctx.arc(s * 0.07, -s * 0.18, s * 0.04, 0, Math.PI * 2);
        ctx.fill();

    } else if (name.includes('spider')) {
        // Spider
        ctx.fillStyle = color;
        // Body segments
        ctx.beginPath();
        ctx.ellipse(0, s * 0.15, s * 0.25, s * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(0, -s * 0.15, s * 0.18, s * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        // Legs
        ctx.strokeStyle = color;
        ctx.lineWidth = s * 0.05;
        for (let i = 0; i < 4; i++) {
            const angle = (i - 1.5) * 0.4;
            ctx.beginPath();
            ctx.moveTo(-s * 0.2, s * 0.05);
            ctx.quadraticCurveTo(-s * 0.5, -s * 0.2 + i * s * 0.15, -s * 0.6, s * 0.3 + i * s * 0.05);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(s * 0.2, s * 0.05);
            ctx.quadraticCurveTo(s * 0.5, -s * 0.2 + i * s * 0.15, s * 0.6, s * 0.3 + i * s * 0.05);
            ctx.stroke();
        }
        // Eyes (multiple)
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(-s * 0.08, -s * 0.2, s * 0.04, 0, Math.PI * 2);
        ctx.arc(s * 0.08, -s * 0.2, s * 0.04, 0, Math.PI * 2);
        ctx.arc(-s * 0.04, -s * 0.28, s * 0.03, 0, Math.PI * 2);
        ctx.arc(s * 0.04, -s * 0.28, s * 0.03, 0, Math.PI * 2);
        ctx.fill();

    } else if (name.includes('demon') || name.includes('devil')) {
        // Demon
        ctx.fillStyle = color;
        // Body
        ctx.beginPath();
        ctx.ellipse(0, s * 0.1, s * 0.35, s * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        // Head
        ctx.beginPath();
        ctx.arc(0, -s * 0.35, s * 0.28, 0, Math.PI * 2);
        ctx.fill();
        // Horns
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.moveTo(-s * 0.2, -s * 0.5);
        ctx.lineTo(-s * 0.35, -s * 0.8);
        ctx.lineTo(-s * 0.1, -s * 0.55);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(s * 0.2, -s * 0.5);
        ctx.lineTo(s * 0.35, -s * 0.8);
        ctx.lineTo(s * 0.1, -s * 0.55);
        ctx.fill();
        // Glowing eyes
        ctx.fillStyle = '#FFFF00';
        ctx.shadowColor = '#FFFF00';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(-s * 0.1, -s * 0.38, s * 0.06, 0, Math.PI * 2);
        ctx.arc(s * 0.1, -s * 0.38, s * 0.06, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Evil grin
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(0, -s * 0.22, s * 0.12, 0.2, Math.PI - 0.2);
        ctx.fill();
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.moveTo(-s * 0.08, -s * 0.2);
        ctx.lineTo(-s * 0.04, -s * 0.12);
        ctx.lineTo(0, -s * 0.2);
        ctx.lineTo(s * 0.04, -s * 0.12);
        ctx.lineTo(s * 0.08, -s * 0.2);
        ctx.fill();

    } else if (name.includes('wolf') || name.includes('rat') || name.includes('snake')) {
        // Beast
        ctx.fillStyle = color;
        // Body (horizontal)
        ctx.beginPath();
        ctx.ellipse(0, s * 0.1, s * 0.4, s * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        // Head
        ctx.beginPath();
        ctx.ellipse(-s * 0.35, -s * 0.05, s * 0.2, s * 0.18, -0.3, 0, Math.PI * 2);
        ctx.fill();
        // Snout
        ctx.beginPath();
        ctx.ellipse(-s * 0.5, 0, s * 0.12, s * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
        // Ear
        ctx.beginPath();
        ctx.moveTo(-s * 0.3, -s * 0.2);
        ctx.lineTo(-s * 0.4, -s * 0.4);
        ctx.lineTo(-s * 0.2, -s * 0.15);
        ctx.fill();
        // Eye
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.arc(-s * 0.38, -s * 0.1, s * 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-s * 0.38, -s * 0.1, s * 0.025, 0, Math.PI * 2);
        ctx.fill();
        // Tail
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(s * 0.35, s * 0.05);
        ctx.quadraticCurveTo(s * 0.6, -s * 0.1, s * 0.55, -s * 0.3);
        ctx.quadraticCurveTo(s * 0.5, -s * 0.1, s * 0.35, s * 0.15);
        ctx.fill();

    } else if (name.includes('golem')) {
        // Stone golem
        ctx.fillStyle = '#777';
        // Body
        ctx.fillRect(-s * 0.35, -s * 0.2, s * 0.7, s * 0.7);
        // Head
        ctx.fillRect(-s * 0.25, -s * 0.5, s * 0.5, s * 0.35);
        // Cracks
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-s * 0.2, -s * 0.4);
        ctx.lineTo(-s * 0.1, -s * 0.1);
        ctx.lineTo(-s * 0.25, s * 0.2);
        ctx.stroke();
        // Glowing eyes
        ctx.fillStyle = '#00FF00';
        ctx.shadowColor = '#00FF00';
        ctx.shadowBlur = 8;
        ctx.fillRect(-s * 0.18, -s * 0.42, s * 0.12, s * 0.06);
        ctx.fillRect(s * 0.06, -s * 0.42, s * 0.12, s * 0.06);
        ctx.shadowBlur = 0;
        // Arms
        ctx.fillStyle = '#666';
        ctx.fillRect(-s * 0.55, -s * 0.1, s * 0.25, s * 0.15);
        ctx.fillRect(s * 0.3, -s * 0.1, s * 0.25, s * 0.15);

    } else {
        // Default humanoid monster
        ctx.fillStyle = color;
        // Body
        ctx.beginPath();
        ctx.ellipse(0, s * 0.1, s * 0.3, s * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        // Head
        ctx.beginPath();
        ctx.arc(0, -s * 0.35, s * 0.25, 0, Math.PI * 2);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(-s * 0.1, -s * 0.38, s * 0.08, 0, Math.PI * 2);
        ctx.arc(s * 0.1, -s * 0.38, s * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-s * 0.08, -s * 0.36, s * 0.04, 0, Math.PI * 2);
        ctx.arc(s * 0.12, -s * 0.36, s * 0.04, 0, Math.PI * 2);
        ctx.fill();
        // Angry mouth
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -s * 0.2, s * 0.1, 0.2, Math.PI - 0.2);
        ctx.stroke();
    }

    // Boss crown
    if (monster.isBoss) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(-s * 0.25, -s * 0.7);
        ctx.lineTo(-s * 0.3, -s * 0.55);
        ctx.lineTo(-s * 0.15, -s * 0.6);
        ctx.lineTo(0, -s * 0.5);
        ctx.lineTo(s * 0.15, -s * 0.6);
        ctx.lineTo(s * 0.3, -s * 0.55);
        ctx.lineTo(s * 0.25, -s * 0.7);
        ctx.closePath();
        ctx.fill();
        // Gems
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(0, -s * 0.62, s * 0.05, 0, Math.PI * 2);
        ctx.fill();
    }

    // Elite glow
    if (monster.isElite && !monster.isBoss) {
        ctx.strokeStyle = '#9B59B6';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#9B59B6';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    // Mini-boss aura
    if (monster.isMiniBoss) {
        ctx.strokeStyle = '#E74C3C';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#E74C3C';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.65, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

        ctx.restore();
    } catch (e) {
        ctx.restore();
        console.error('Error drawing monster:', e);
    }
}

// === SPRITE SYSTEM ===
// Uses individual sprite images from Dungeon Crawl Stone Soup (CC0 license)
const SPRITES_ENABLED = true; // Set to false to use procedural graphics

// Individual sprite image references
const sprites = {
    // Dungeon tiles
    floor: [], // Array of floor variations
    wall: [],  // Array of wall variations
    chest: null,
    chestOpen: null,
    fountain: null,
    // Monsters
    monsters: {},
    // Player classes
    player: {},
    // Pets (reuse monster sprites for now)
    pets: {}
};

// Track loading state
let spritesLoaded = false;
let spriteLoadAttempted = false;
let spritesLoadedCount = 0;
let spritesToLoad = 0;

// Load a single sprite image
function loadSprite(path) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            spritesLoadedCount++;
            resolve(img);
        };
        img.onerror = () => {
            console.warn(`Failed to load sprite: ${path}`);
            spritesLoadedCount++;
            resolve(null);
        };
        img.src = path;
    });
}

/**
 * Initialize sprite system - loads individual images from DCSS assets
 * @returns {Promise<boolean>} True if sprites loaded successfully
 */
async function initSprites() {
    if (spriteLoadAttempted) return spritesLoaded;
    spriteLoadAttempted = true;

    if (!SPRITES_ENABLED) {
        console.log('Sprites disabled, using procedural graphics');
        return false;
    }

    const basePath = CONFIG.SPRITE_BASE_PATH;

    try {
        // Load floor variations
        const floorPromises = [1, 2, 3, 4].map(i => loadSprite(`${basePath}/dungeon/floor${i}.png`));
        sprites.floor = await Promise.all(floorPromises);

        // Load wall variations
        const wallPromises = [1, 2, 3, 4].map(i => loadSprite(`${basePath}/dungeon/wall${i}.png`));
        sprites.wall = await Promise.all(wallPromises);

        // Load dungeon objects
        sprites.chest = await loadSprite(`${basePath}/dungeon/chest.png`);
        sprites.chestOpen = await loadSprite(`${basePath}/dungeon/chest_open.png`);
        sprites.fountain = await loadSprite(`${basePath}/dungeon/fountain.png`);

        // Load monster sprites
        const monsterTypes = ['slime', 'goblin', 'skeleton', 'orc', 'dark_elf', 'troll', 'demon', 'wraith', 'boss'];
        for (const type of monsterTypes) {
            sprites.monsters[type] = await loadSprite(`${basePath}/monsters/${type}.png`);
        }

        // Load player class sprites
        const playerClasses = ['warrior', 'mage', 'rogue'];
        for (const cls of playerClasses) {
            sprites.player[cls] = await loadSprite(`${basePath}/player/${cls}.png`);
        }

        // Check if essential sprites loaded
        const hasFloors = sprites.floor.some(s => s !== null);
        const hasMonsters = Object.values(sprites.monsters).some(s => s !== null);
        const hasPlayer = Object.values(sprites.player).some(s => s !== null);

        spritesLoaded = hasFloors || hasMonsters || hasPlayer;

        if (spritesLoaded) {
            console.log('Sprites loaded successfully!');
        } else {
            console.log('No sprites found, using procedural graphics');
        }

        return spritesLoaded;
    } catch (e) {
        console.warn('Error loading sprites:', e);
        return false;
    }
}

// Draw an individual sprite image
function drawSpriteImage(ctx, img, x, y, width, height, options = {}) {
    if (!img) return false;

    const { flipX = false, alpha = 1, tint = null } = options;

    ctx.save();
    ctx.globalAlpha = alpha;

    if (flipX) {
        ctx.translate(x + width, y);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0, width, height);
    } else {
        ctx.drawImage(img, x, y, width, height);
    }

    // Apply tint if specified
    if (tint) {
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = tint;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(flipX ? 0 : x, flipX ? 0 : y, width, height);
    }

    ctx.restore();
    return true;
}


// Get animation frame based on time
function getAnimFrame(frameCount = 2, speed = 500) {
    return Math.floor(Date.now() / speed) % frameCount;
}

// Render a tile using individual sprites (returns false if sprites not available)
function renderTileSprite(ctx, tile, x, y, tileSize, options = {}) {
    if (!spritesLoaded) return false;

    const px = x * tileSize, py = y * tileSize;
    let img = null;

    switch (tile) {
        case TILE.FLOOR:
            const floorVar = (x * 7 + y * 13) % 4;
            img = sprites.floor[floorVar];
            break;
        case TILE.WALL:
            const wallVar = (x + y) % 4;
            img = sprites.wall[wallVar];
            break;
        case TILE.CHEST:
            img = options.opened ? sprites.chestOpen : sprites.chest;
            break;
        case TILE.FOUNTAIN:
            img = sprites.fountain;
            break;
        case TILE.TRAP:
        case TILE.NPC:
        case TILE.SHRINE:
        case TILE.ALTAR:
            return false; // Use procedural for these
        default:
            return false;
    }

    if (!img) return false;

    return drawSpriteImage(ctx, img, px, py, tileSize, tileSize, {
        alpha: options.alpha || 1
    });
}

// Render a monster using individual sprites (returns false if sprites not available)
function renderMonsterSprite(ctx, monster, x, y, size, options = {}) {
    if (!spritesLoaded) return false;

    // Map monster type to sprite key
    const typeMap = {
        'Slime': 'slime', 'Goblin': 'goblin', 'Skeleton': 'skeleton',
        'Orc': 'orc', 'Dark Elf': 'dark_elf', 'Troll': 'troll',
        'Demon': 'demon', 'Wraith': 'wraith'
    };

    let spriteKey = typeMap[monster.type] || 'slime';
    if (monster.isBoss || monster.isMiniBoss) {
        spriteKey = 'boss';
    }

    const img = sprites.monsters[spriteKey];
    if (!img) return false;

    return drawSpriteImage(ctx, img, x - size/2, y - size/2, size, size, {
        alpha: options.alpha || 1,
        tint: monster.isElite ? '#ffd700' : (monster.isMiniBoss ? '#ff6b6b' : null),
        flipX: options.flipX
    });
}

// Render the player using individual sprites (returns false if sprites not available)
function renderPlayerSprite(ctx, x, y, size, playerClass, options = {}) {
    if (!spritesLoaded) return false;

    const img = sprites.player[playerClass];
    if (!img) return false;

    return drawSpriteImage(ctx, img, x - size/2, y - size/2, size, size, {
        alpha: options.alpha || 1,
        flipX: options.flipX
    });
}

// Render a pet using sprites (returns false if sprites not available)
function renderPetSprite(ctx, petId, x, y, size, options = {}) {
    // For now, pets use procedural graphics (no sprites loaded for them)
    return false;
}

// === CONSTANTS ===
// Dynamic grid size - starts small and grows with floors
let GRID_WIDTH = 10, GRID_HEIGHT = 10;
let TILE_SIZE = CONFIG.BASE_TILE_SIZE;

// Grid size limits (kept as standalone for backward compatibility)
const MIN_GRID_SIZE = CONFIG.MIN_GRID_SIZE;
const MAX_GRID_SIZE = CONFIG.MAX_GRID_SIZE;

// Tile type enum for grid cells
const TILE = Object.freeze({
    FLOOR: 0,
    WALL: 1,
    CHEST: 2,
    TRAP: 3,
    NPC: 4,
    SECRET: 5,
    SHRINE: 6,
    FOUNTAIN: 7,
    ALTAR: 8,
    EXIT: 9
});

/**
 * Calculate grid size based on current floor
 * Grid grows with floor progression for increased challenge
 * @param {number} floor - Current floor number
 * @returns {number} Grid dimension (used for both width and height base)
 */
function calculateGridSize(floor) {
    // Start at 8x8, grow slowly
    // Floor 1: 8x8, Floor 10: ~12x12, Floor 25: ~18x18, Floor 50: ~25x25, Floor 100: ~35x35
    const baseSize = CONFIG.MIN_GRID_SIZE;
    const size = Math.floor(baseSize + Math.sqrt(floor) * 2.5 + floor * CONFIG.GRID_GROWTH_RATE);
    return clamp(size, CONFIG.MIN_GRID_SIZE, CONFIG.MAX_GRID_SIZE);
}

// Calculate optimal tile size to fill the available space
function calculateTileSize() {
    const isMobile = window.innerWidth <= 600;
    let maxWidth, maxHeight;

    if (isMobile) {
        maxWidth = window.innerWidth - 10;
        maxHeight = window.innerHeight - 140;
    } else {
        // Desktop: fill as much space as possible
        // Only leave minimal room for header bar
        maxWidth = window.innerWidth - 20;
        maxHeight = window.innerHeight - 80;
    }

    // Calculate tile size to fill the space completely
    const tileSizeW = Math.floor(maxWidth / GRID_WIDTH);
    const tileSizeH = Math.floor(maxHeight / GRID_HEIGHT);
    const optimalSize = Math.min(tileSizeW, tileSizeH);

    // Allow larger tiles, no upper limit for full screen fill
    return Math.max(12, optimalSize);
}

// Biomes by floor range
const BIOMES = [
    { name: 'Dungeon Depths', floors: [1, 20], floorColor: '#1a1a2e', wallColor: '#2d2d4a' },
    { name: 'Frozen Caverns', floors: [21, 40], floorColor: '#1a2a3e', wallColor: '#2d4a5a' },
    { name: 'Volcanic Halls', floors: [41, 60], floorColor: '#2e1a1a', wallColor: '#4a2d2d' },
    { name: 'Shadow Realm', floors: [61, 80], floorColor: '#1a1a1a', wallColor: '#2a2a3a' },
    { name: 'Celestial Tower', floors: [81, 100], floorColor: '#1e1e3e', wallColor: '#3d3d6a' }
];

// Classes with attack properties
const CLASSES = {
    warrior: {
        name: 'Warrior', hpMult: 1.2, atkMult: 1.0, defMult: 1.15, spdMult: 1.0, evaMult: 1.0, critMult: 1.0,
        color: '#c0392b', skill: 'whirlwind', icon: '⚔️',
        attackRange: 1, // Melee range
        multiTarget: false, // Single target attacks
        attackType: 'melee'
    },
    mage: {
        name: 'Mage', hpMult: 0.9, atkMult: 1.25, defMult: 0.9, spdMult: 1.0, evaMult: 1.0, critMult: 1.1,
        color: '#9b59b6', skill: 'fireball', icon: '🔮',
        attackRange: 5, // Long range magic attacks
        multiTarget: true, // Can hit multiple targets with chain lightning
        maxTargets: 3, // Max targets for multi-attack
        chainDamageFalloff: 0.7, // Each chain does 70% of previous
        attackType: 'magic',
        projectileColor: '#9b59b6',
        projectileParticle: 'magic'
    },
    rogue: {
        name: 'Rogue', hpMult: 0.95, atkMult: 1.1, defMult: 0.95, spdMult: 1.3, evaMult: 1.15, critMult: 1.05,
        color: '#27ae60', skill: 'shadowstep', icon: '🗡️',
        attackRange: 3, // Throwing knives range
        multiTarget: true, // Fan of knives
        maxTargets: 2, // Can hit 2 targets
        chainDamageFalloff: 0.8, // Secondary targets take 80% damage
        attackType: 'ranged',
        projectileColor: '#27ae60',
        projectileParticle: 'trail'
    }
};

// Base Stats
const BASE_STATS = { maxHp: 100, attack: 10, defense: 5, speed: 1.0, evasion: 5, critChance: 5, critDamage: 150 };

// Upgrade Config
const UPGRADE_CONFIG = {
    maxHp: { baseCost: 10, mult: 1.15, value: 10 },
    attack: { baseCost: 10, mult: 1.18, value: 2 },
    defense: { baseCost: 10, mult: 1.18, value: 1 },
    speed: { baseCost: 15, mult: 1.20, value: 0.05 },
    evasion: { baseCost: 15, mult: 1.20, value: 1 },
    critChance: { baseCost: 20, mult: 1.25, value: 1 }
};

// Special Items
const SPECIAL_ITEMS = {
    lifeCrystal: { cost: 500, stat: 'maxHp', mult: 0.10 },
    warriorsBlade: { cost: 750, stat: 'attack', mult: 0.15 },
    guardianShield: { cost: 750, stat: 'defense', mult: 0.15 },
    swiftBoots: { cost: 1000, stat: 'speed', mult: 0.20 },
    shadowCloak: { cost: 1000, stat: 'evasion', mult: 0.10 }
};

// Skills
const SKILLS = {
    // Universal Skills (available to all classes)
    heal: { name: 'Heal', cooldown: 10, effect: 'heal', value: 0.3, unlocked: true, icon: '💚', desc: 'Restore 30% HP', levelReq: 1 },
    dash: { name: 'Dash', cooldown: 8, effect: 'dash', value: 5, unlocked: true, icon: '💨', desc: 'Quickly move away from danger', levelReq: 1 },

    // Warrior Skills
    whirlwind: { name: 'Whirlwind', cooldown: 12, effect: 'aoe', value: 1.5, unlocked: false, class: 'warrior', icon: '🌀', desc: 'Hit all nearby enemies for 150% damage', levelReq: 3 },
    shieldBash: { name: 'Shield Bash', cooldown: 15, effect: 'stun', value: 3, unlocked: false, class: 'warrior', icon: '🛡️', desc: 'Stun target for 3 seconds', levelReq: 6 },
    battleCry: { name: 'Battle Cry', cooldown: 20, effect: 'buff', stat: 'attack', value: 0.5, duration: 10, unlocked: false, class: 'warrior', icon: '📢', desc: '+50% Attack for 10 seconds', levelReq: 10 },
    berserkerRage: { name: 'Berserker', cooldown: 30, effect: 'berserk', value: 2.0, duration: 8, unlocked: false, class: 'warrior', icon: '😤', desc: 'Double damage but take 50% more', levelReq: 15 },

    // Mage Skills
    fireball: { name: 'Fireball', cooldown: 10, effect: 'projectile', value: 2.0, status: 'burn', unlocked: false, class: 'mage', icon: '🔥', desc: 'Deal 200% damage and burn enemy', levelReq: 3 },
    iceSpike: { name: 'Ice Spike', cooldown: 12, effect: 'projectile', value: 1.5, status: 'freeze', unlocked: false, class: 'mage', icon: '🧊', desc: 'Deal 150% damage and freeze enemy', levelReq: 6 },
    lightning: { name: 'Lightning', cooldown: 8, effect: 'projectile', value: 2.5, unlocked: false, class: 'mage', icon: '⚡', desc: 'Deal 250% instant damage', levelReq: 10 },
    arcaneShield: { name: 'Arcane Shield', cooldown: 25, effect: 'shield', value: 0.3, duration: 8, unlocked: false, class: 'mage', icon: '🔮', desc: 'Absorb 30% max HP in damage', levelReq: 15 },

    // Rogue Skills
    shadowstep: { name: 'Shadow Step', cooldown: 6, effect: 'teleport', value: 10, unlocked: false, class: 'rogue', icon: '👤', desc: 'Teleport behind enemy', levelReq: 3 },
    backstab: { name: 'Backstab', cooldown: 10, effect: 'crit', value: 3.0, unlocked: false, class: 'rogue', icon: '🗡️', desc: 'Guaranteed critical hit for 300% damage', levelReq: 6 },
    poisonBlade: { name: 'Poison Blade', cooldown: 14, effect: 'projectile', value: 1.0, status: 'poison', unlocked: false, class: 'rogue', icon: '🧪', desc: 'Attack that applies deadly poison', levelReq: 10 },
    smokeBomb: { name: 'Smoke Bomb', cooldown: 20, effect: 'buff', stat: 'evasion', value: 50, duration: 6, unlocked: false, class: 'rogue', icon: '💨', desc: '+50% Evasion for 6 seconds', levelReq: 15 }
};

// Helper to check if a skill is available
function isSkillAvailable(skillKey) {
    const skill = SKILLS[skillKey];
    if (!skill) return false;
    const playerLevel = gameState.run?.level || 0;
    const playerClass = gameState.selectedClass;
    // Check class requirement
    if (skill.class && skill.class !== playerClass) return false;
    // Check level requirement
    if (skill.levelReq && playerLevel < skill.levelReq) return false;
    return true;
}

// Status Effects
const STATUS_EFFECTS = {
    poison: { name: 'Poison', duration: 5, tickDamage: 0.05, color: '#28a745' },
    burn: { name: 'Burn', duration: 4, tickDamage: 0.08, color: '#fd7e14' },
    freeze: { name: 'Freeze', duration: 3, speedMult: 0.5, color: '#17a2b8' },
    stun: { name: 'Stun', duration: 2, canAct: false, color: '#ffc107' }
};

// Monster Types with emoji icons
const MONSTER_TYPES = [
    { name: 'Slime', color: '#5a8a5a', hpMult: 1, atkMult: 1, defMult: 0.8, icon: '🟢', shape: 'blob' },
    { name: 'Goblin', color: '#8a8a5a', hpMult: 0.9, atkMult: 1.2, defMult: 0.9, icon: '👺', shape: 'humanoid' },
    { name: 'Skeleton', color: '#c0c0c0', hpMult: 0.8, atkMult: 1.1, defMult: 1.0, icon: '💀', shape: 'humanoid' },
    { name: 'Orc', color: '#5a7a5a', hpMult: 1.3, atkMult: 1.0, defMult: 1.1, icon: '👹', shape: 'humanoid' },
    { name: 'Dark Elf', color: '#6a5a8a', hpMult: 0.9, atkMult: 1.3, defMult: 0.9, icon: '🧝', shape: 'humanoid' },
    { name: 'Troll', color: '#5a6a5a', hpMult: 1.5, atkMult: 0.9, defMult: 1.2, icon: '🧌', shape: 'humanoid' },
    { name: 'Demon', color: '#8a5a5a', hpMult: 1.2, atkMult: 1.2, defMult: 1.0, icon: '👿', shape: 'humanoid' },
    { name: 'Wraith', color: '#4a4a6a', hpMult: 0.7, atkMult: 1.4, defMult: 0.7, canPoison: true, icon: '👻', shape: 'ghost' },
    { name: 'Spider', color: '#3a3a3a', hpMult: 0.6, atkMult: 1.5, defMult: 0.6, canPoison: true, icon: '🕷️', shape: 'spider' },
    { name: 'Bat', color: '#5a4a4a', hpMult: 0.5, atkMult: 1.1, defMult: 0.5, icon: '🦇', shape: 'flying' },
    { name: 'Rat', color: '#6a5a4a', hpMult: 0.4, atkMult: 0.8, defMult: 0.4, icon: '🐀', shape: 'small' },
    { name: 'Snake', color: '#4a6a4a', hpMult: 0.5, atkMult: 1.3, defMult: 0.5, canPoison: true, icon: '🐍', shape: 'snake' },
    { name: 'Wolf', color: '#7a7a7a', hpMult: 0.8, atkMult: 1.2, defMult: 0.7, icon: '🐺', shape: 'beast' },
    { name: 'Zombie', color: '#5a6a5a', hpMult: 1.2, atkMult: 0.9, defMult: 1.0, icon: '🧟', shape: 'humanoid' },
    { name: 'Vampire', color: '#4a3a4a', hpMult: 1.0, atkMult: 1.3, defMult: 0.9, icon: '🧛', shape: 'humanoid' },
    { name: 'Golem', color: '#8a7a6a', hpMult: 2.0, atkMult: 0.8, defMult: 1.5, icon: '🗿', shape: 'golem' }
];

const BOSS_TYPES = [
    { name: 'Slime King', icon: '👑', baseType: 'Slime' },
    { name: 'Goblin Chief', icon: '⚔️', baseType: 'Goblin' },
    { name: 'Bone Lord', icon: '☠️', baseType: 'Skeleton' },
    { name: 'Orc Warlord', icon: '🪓', baseType: 'Orc' },
    { name: 'Shadow Assassin', icon: '🗡️', baseType: 'Dark Elf' },
    { name: 'Troll King', icon: '🔨', baseType: 'Troll' },
    { name: 'Demon Prince', icon: '🔥', baseType: 'Demon' },
    { name: 'Ancient Dragon', icon: '🐉', baseType: 'Dragon' },
    { name: 'Lich', icon: '💀', baseType: 'Wraith' },
    { name: 'Spider Queen', icon: '🕸️', baseType: 'Spider' }
];

const BOSS_NAMES = BOSS_TYPES.map(b => b.name);

// Equipment Rarities
const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const RARITY_COLORS = { common: '#aaa', uncommon: '#28a745', rare: '#4a9eff', epic: '#9b59b6', legendary: '#ffd700' };
const RARITY_MULT = { common: 1, uncommon: 1.3, rare: 1.6, epic: 2, legendary: 3 };

// Equipment Types with icons
const EQUIPMENT_BASES = {
    weapon: [
        { name: 'Sword', atk: 5, icon: '⚔️' },
        { name: 'Axe', atk: 7, spd: -0.1, icon: '🪓' },
        { name: 'Dagger', atk: 3, crit: 3, icon: '🗡️' },
        { name: 'Staff', atk: 4, critDmg: 20, icon: '🪄' },
        { name: 'Bow', atk: 4, crit: 2, icon: '🏹' },
        { name: 'Hammer', atk: 8, spd: -0.15, icon: '🔨' },
        { name: 'Spear', atk: 5, crit: 1, icon: '🔱' }
    ],
    armor: [
        { name: 'Leather', def: 3, eva: 2, icon: '🥋' },
        { name: 'Chainmail', def: 5, spd: -0.05, icon: '⛓️' },
        { name: 'Plate', def: 8, spd: -0.15, icon: '🛡️' },
        { name: 'Robes', def: 2, hp: 20, icon: '👘' },
        { name: 'Scale', def: 6, eva: -1, icon: '🐉' }
    ],
    accessory: [
        { name: 'Ring', crit: 2, critDmg: 10, icon: '💍' },
        { name: 'Amulet', hp: 30, icon: '📿' },
        { name: 'Cloak', eva: 5, icon: '🧥' },
        { name: 'Belt', def: 2, hp: 15, icon: '🎗️' },
        { name: 'Bracelet', atk: 2, crit: 1, icon: '⌚' },
        { name: 'Crown', hp: 15, critDmg: 15, icon: '👑' }
    ]
};

// Equipment slot icons
const EQUIPMENT_SLOT_ICONS = {
    weapon: '⚔️',
    armor: '🛡️',
    accessory: '💍'
};

// Achievements
const ACHIEVEMENTS = [
    // Kill achievements
    { id: 'first_kill', name: 'First Blood', desc: 'Kill your first monster', check: s => s.stats.monstersKilled >= 1, reward: 10 },
    { id: 'kill_100', name: 'Monster Slayer', desc: 'Kill 100 monsters', check: s => s.stats.monstersKilled >= 100, reward: 100 },
    { id: 'kill_1000', name: 'Exterminator', desc: 'Kill 1000 monsters', check: s => s.stats.monstersKilled >= 1000, reward: 500 },
    { id: 'kill_5000', name: 'Death Incarnate', desc: 'Kill 5000 monsters', check: s => s.stats.monstersKilled >= 5000, reward: 1500 },
    { id: 'kill_10000', name: 'Apocalypse', desc: 'Kill 10000 monsters', check: s => s.stats.monstersKilled >= 10000, reward: 5000 },

    // Floor achievements
    { id: 'floor_10', name: 'Getting Started', desc: 'Reach floor 10', check: s => s.bestFloor >= 10, reward: 50 },
    { id: 'floor_50', name: 'Dungeon Explorer', desc: 'Reach floor 50', check: s => s.bestFloor >= 50, reward: 200 },
    { id: 'floor_100', name: 'Dungeon Master', desc: 'Reach floor 100', check: s => s.bestFloor >= 100, reward: 1000 },
    { id: 'floor_200', name: 'Deep Delver', desc: 'Reach floor 200', check: s => s.bestFloor >= 200, reward: 2500 },
    { id: 'floor_500', name: 'Abyss Walker', desc: 'Reach floor 500', check: s => s.bestFloor >= 500, reward: 10000 },
    { id: 'floor_1000', name: 'Legend of the Dungeon', desc: 'Reach floor 1000', check: s => s.bestFloor >= 1000, reward: 50000 },

    // Boss & Elite achievements
    { id: 'boss_kill', name: 'Boss Slayer', desc: 'Defeat a boss', check: s => s.stats.bossesKilled >= 1, reward: 100 },
    { id: 'boss_10', name: 'Boss Hunter', desc: 'Defeat 10 bosses', check: s => s.stats.bossesKilled >= 10, reward: 500 },
    { id: 'boss_50', name: 'Boss Destroyer', desc: 'Defeat 50 bosses', check: s => s.stats.bossesKilled >= 50, reward: 2000 },
    { id: 'elite_kill', name: 'Elite Hunter', desc: 'Defeat an elite monster', check: s => s.stats.elitesKilled >= 1, reward: 75 },
    { id: 'elite_25', name: 'Elite Slayer', desc: 'Defeat 25 elites', check: s => s.stats.elitesKilled >= 25, reward: 400 },
    { id: 'elite_100', name: 'Elite Eradicator', desc: 'Defeat 100 elites', check: s => s.stats.elitesKilled >= 100, reward: 1500 },

    // Chest achievements
    { id: 'chest_10', name: 'Treasure Hunter', desc: 'Open 10 chests', check: s => s.stats.chestsOpened >= 10, reward: 50 },
    { id: 'chest_50', name: 'Treasure Seeker', desc: 'Open 50 chests', check: s => s.stats.chestsOpened >= 50, reward: 200 },
    { id: 'chest_200', name: 'Treasure Master', desc: 'Open 200 chests', check: s => s.stats.chestsOpened >= 200, reward: 750 },
    { id: 'chest_500', name: 'Hoarder', desc: 'Open 500 chests', check: s => s.stats.chestsOpened >= 500, reward: 2000 },

    // Prestige achievements
    { id: 'prestige_1', name: 'Ascended', desc: 'Prestige for the first time', check: s => s.prestigeLevel >= 1, reward: 200 },
    { id: 'prestige_5', name: 'Reborn', desc: 'Prestige 5 times', check: s => s.prestigeLevel >= 5, reward: 1000 },
    { id: 'prestige_10', name: 'Eternal', desc: 'Prestige 10 times', check: s => s.prestigeLevel >= 10, reward: 3000 },
    { id: 'prestige_25', name: 'Transcendent', desc: 'Prestige 25 times', check: s => s.prestigeLevel >= 25, reward: 10000 },

    // Legendary achievements
    { id: 'legendary', name: 'Legendary Find', desc: 'Find a legendary item', check: s => s.stats.legendariesFound >= 1, reward: 300 },
    { id: 'legendary_5', name: 'Legendary Collector', desc: 'Find 5 legendary items', check: s => s.stats.legendariesFound >= 5, reward: 1000 },
    { id: 'legendary_20', name: 'Artifact Hoarder', desc: 'Find 20 legendary items', check: s => s.stats.legendariesFound >= 20, reward: 5000 },

    // Souls earned achievements (separate from total souls which includes prestige rewards)
    { id: 'souls_earned_1000', name: 'Soul Saver', desc: 'Earn 1000 souls from chests', check: s => (s.stats.soulsEarned || 0) >= 1000, reward: 100 },
    { id: 'souls_earned_10000', name: 'Soul Banker', desc: 'Earn 10000 souls from chests', check: s => (s.stats.soulsEarned || 0) >= 10000, reward: 500 },
    { id: 'souls_earned_100000', name: 'Soul Vault', desc: 'Earn 100000 souls from chests', check: s => (s.stats.soulsEarned || 0) >= 100000, reward: 2500 },
    { id: 'souls_earned_1000000', name: 'Soul Treasury', desc: 'Earn 1000000 souls total', check: s => (s.stats.soulsEarned || 0) >= 1000000, reward: 15000 },

    // Death/Run achievements
    { id: 'death_1', name: 'First Death', desc: 'Die for the first time', check: s => (s.stats.deaths || 0) >= 1, reward: 25 },
    { id: 'death_10', name: 'Persistent', desc: 'Die 10 times', check: s => (s.stats.deaths || 0) >= 10, reward: 100 },
    { id: 'death_50', name: 'Never Give Up', desc: 'Die 50 times', check: s => (s.stats.deaths || 0) >= 50, reward: 500 },
    { id: 'death_100', name: 'Undying Spirit', desc: 'Die 100 times', check: s => (s.stats.deaths || 0) >= 100, reward: 1500 },


    // Pet achievements
    { id: 'pet_unlock', name: 'Pet Owner', desc: 'Unlock your first pet', check: s => (s.pets || []).length >= 1, reward: 150 },
    { id: 'pet_all', name: 'Pet Collector', desc: 'Unlock all pets', check: s => (s.pets || []).length >= 5, reward: 3000 },

    // NPC achievements
    { id: 'npc_merchant', name: 'Shopaholic', desc: 'Buy 10 items from merchants', check: s => (s.stats.merchantPurchases || 0) >= 10, reward: 200 },
    { id: 'npc_healer', name: 'Frequent Patient', desc: 'Get healed 10 times', check: s => (s.stats.healerVisits || 0) >= 10, reward: 200 },
    { id: 'npc_blacksmith', name: 'Forged in Fire', desc: 'Upgrade weapons 10 times', check: s => (s.stats.blacksmithUpgrades || 0) >= 10, reward: 200 },

    // Speed achievements
    { id: 'speed_floor_10', name: 'Speed Runner', desc: 'Reach floor 10 in under 3 minutes', check: s => (s.stats.fastestFloor10 || Infinity) < 180, reward: 500 },
    { id: 'speed_floor_25', name: 'Quick Descent', desc: 'Reach floor 25 in under 10 minutes', check: s => (s.stats.fastestFloor25 || Infinity) < 600, reward: 1500 },

    // Miscellaneous achievements
    { id: 'trap_10', name: 'Trap Survivor', desc: 'Trigger 10 traps and survive', check: s => (s.stats.trapsTriggered || 0) >= 10, reward: 150 },
    { id: 'trap_50', name: 'Trap Veteran', desc: 'Trigger 50 traps and survive', check: s => (s.stats.trapsTriggered || 0) >= 50, reward: 600 },
    { id: 'shrine_10', name: 'Blessed', desc: 'Use 10 shrines', check: s => (s.stats.shrinesUsed || 0) >= 10, reward: 250 },
    { id: 'fountain_10', name: 'Refreshed', desc: 'Use 10 fountains', check: s => (s.stats.fountainsUsed || 0) >= 10, reward: 250 },
    { id: 'altar_10', name: 'Gambler', desc: 'Use 10 altars', check: s => (s.stats.altarsUsed || 0) >= 10, reward: 250 },
    { id: 'crit_100', name: 'Critical Mass', desc: 'Land 100 critical hits', check: s => (s.stats.criticalHits || 0) >= 100, reward: 300 },
    { id: 'crit_1000', name: 'Critical Master', desc: 'Land 1000 critical hits', check: s => (s.stats.criticalHits || 0) >= 1000, reward: 1500 },
    { id: 'damage_100000', name: 'Damage Dealer', desc: 'Deal 100000 total damage', check: s => (s.stats.totalDamageDealt || 0) >= 100000, reward: 750 },
    { id: 'damage_1000000', name: 'Devastator', desc: 'Deal 1000000 total damage', check: s => (s.stats.totalDamageDealt || 0) >= 1000000, reward: 5000 }
];

// NPC Types
const NPC_TYPES = [
    { type: 'merchant', name: 'Traveling Merchant', dialog: 'Want to buy something?', portrait: '#4a9eff' },
    { type: 'healer', name: 'Wandering Healer', dialog: 'Let me heal your wounds.', portrait: '#28a745' },
    { type: 'blacksmith', name: 'Dungeon Blacksmith', dialog: 'I can upgrade your gear!', portrait: '#fd7e14' }
];

// Room Events
const ROOM_EVENTS = {
    shrine: {
        name: 'Ancient Shrine',
        effects: [
            { type: 'buff', stat: 'attack', value: 0.2, duration: 60, desc: '+20% Attack for 60s' },
            { type: 'buff', stat: 'defense', value: 0.2, duration: 60, desc: '+20% Defense for 60s' },
            { type: 'buff', stat: 'speed', value: 0.3, duration: 60, desc: '+30% Speed for 60s' },
            { type: 'buff', stat: 'critChance', value: 10, duration: 60, desc: '+10% Crit Chance for 60s' }
        ],
        color: '#9b59b6'
    },
    fountain: {
        name: 'Healing Fountain',
        effects: [
            { type: 'heal', value: 0.5, desc: 'Restore 50% HP' },
            { type: 'fullHeal', desc: 'Restore to full HP' },
            { type: 'maxHpUp', value: 20, desc: '+20 Max HP this run' }
        ],
        color: '#17a2b8'
    },
    altar: {
        name: 'Cursed Altar',
        effects: [
            { type: 'gamble', good: { souls: 50 }, bad: { damage: 0.3 }, desc: 'Risk 30% HP for 50 Souls' },
            { type: 'sacrifice', cost: 0.2, reward: { attack: 10 }, desc: 'Sacrifice 20% HP for +10 ATK' },
            { type: 'curse', debuff: { defense: -5 }, reward: { critDamage: 30 }, desc: '-5 DEF, +30% Crit DMG' }
        ],
        color: '#6c1d45'
    }
};

// Mini-boss Types (appear every 5 floors that aren't boss floors)
const MINI_BOSS_TYPES = [
    { name: 'Berserker', color: '#c0392b', ability: 'enrage', abilityDesc: 'Gains attack when low HP', hpMult: 2, atkMult: 1.3 },
    { name: 'Guardian', color: '#3498db', ability: 'shield', abilityDesc: 'Periodically gains damage shield', hpMult: 2.5, atkMult: 1 },
    { name: 'Assassin', color: '#1abc9c', ability: 'shadowStrike', abilityDesc: 'Teleports and crits', hpMult: 1.5, atkMult: 1.5 },
    { name: 'Necromancer', color: '#8e44ad', ability: 'summon', abilityDesc: 'Summons undead minions', hpMult: 1.8, atkMult: 1.2 },
    { name: 'Vampire', color: '#e74c3c', ability: 'lifesteal', abilityDesc: 'Heals on hit', hpMult: 1.7, atkMult: 1.3 }
];

// Pets
const PET_TYPES = [
    { id: 'wolf', name: 'Shadow Wolf', color: '#5a6a7a', atkBonus: 0.1, desc: '+10% Attack', unlockCost: 500, icon: '🐺' },
    { id: 'owl', name: 'Mystic Owl', color: '#9b7b3a', critBonus: 5, desc: '+5% Crit Chance', unlockCost: 750, icon: '🦉' },
    { id: 'turtle', name: 'Ancient Turtle', color: '#2e7d32', defBonus: 0.15, desc: '+15% Defense', unlockCost: 750, icon: '🐢' },
    { id: 'phoenix', name: 'Baby Phoenix', color: '#ff6b35', healBonus: 0.02, desc: 'Regen 2% HP/sec', unlockCost: 1000, icon: '🔥' },
    { id: 'dragon', name: 'Drake Hatchling', color: '#9c27b0', allBonus: 0.05, desc: '+5% All Stats', unlockCost: 2000, icon: '🐲' }
];

// === NEW FEATURE: SYNERGY SYSTEM ===
const SYNERGIES = [
    { id: 'frost_assassin', name: 'Frost Assassin', requires: { class: 'rogue', equipment: 'freeze' },
      effect: { critDamage: 50 }, desc: 'Frozen enemies take +50% crit damage' },
    { id: 'berserker_rage', name: 'Berserker Rage', requires: { class: 'warrior', hpBelow: 0.3 },
      effect: { attack: 0.5 }, desc: '+50% ATK when below 30% HP' },
    { id: 'arcane_overload', name: 'Arcane Overload', requires: { class: 'mage', kills: 10 },
      effect: { critChance: 20 }, desc: '+20% crit after 10 kills this floor' },
    { id: 'soul_harvester', name: 'Soul Harvester', requires: { pet: 'wolf', kills: 5 },
      effect: { soulBonus: 0.25 }, desc: '+25% souls after 5 kills with Wolf' },
    { id: 'phoenix_rebirth', name: 'Phoenix Rebirth', requires: { pet: 'phoenix', hpBelow: 0.2 },
      effect: { healBurst: 0.3 }, desc: 'Heal 30% HP when dropping below 20%' },
    { id: 'dragon_fury', name: 'Dragon Fury', requires: { pet: 'dragon', floor: 50 },
      effect: { allStats: 0.1 }, desc: '+10% all stats after floor 50' },
    { id: 'turtle_fortress', name: 'Turtle Fortress', requires: { pet: 'turtle', defense: 50 },
      effect: { thorns: 0.2 }, desc: 'Reflect 20% damage when DEF > 50' },
    { id: 'legendary_hunter', name: 'Legendary Hunter', requires: { legendaries: 3 },
      effect: { dropRate: 0.1 }, desc: '+10% legendary drop rate with 3+ legendaries' }
];

// === NEW FEATURE: CHALLENGE MODES ===
const CHALLENGE_MODES = [
    { id: 'speed_run', name: 'Speed Run', desc: 'Reach floor 20 in 5 minutes',
      condition: { floor: 20, timeLimit: 300 }, rewards: { souls: 500, relic: 'chrono_shard' } },
    { id: 'glass_cannon', name: 'Glass Cannon', desc: '3x damage, 1 HP',
      modifiers: { damage: 3, maxHp: 1 }, rewards: { souls: 750 } },
    { id: 'boss_rush', name: 'Boss Rush', desc: 'Fight 10 bosses in a row',
      condition: { bossesOnly: true, count: 10 }, rewards: { souls: 1000, relic: 'boss_trophy' } },
    { id: 'pacifist', name: 'Pacifist', desc: 'Reach floor 10 without attacking',
      modifiers: { noAttack: true }, condition: { floor: 10 }, rewards: { souls: 600 } },
    { id: 'elite_hunter', name: 'Elite Hunter', desc: 'Kill 20 elite monsters',
      condition: { elites: 20 }, rewards: { souls: 800, relic: 'elite_mark' } },
    { id: 'no_heal', name: 'Iron Will', desc: 'Reach floor 15 without healing',
      modifiers: { noHeal: true }, condition: { floor: 15 }, rewards: { souls: 700 } },
    { id: 'naked_run', name: 'Naked Run', desc: 'Reach floor 25 without equipment',
      modifiers: { noEquipment: true }, condition: { floor: 25 }, rewards: { souls: 1200 } }
];

// === NEW FEATURE: ASCENSION TIERS ===
const ASCENSION_TIERS = [
    { tier: 1, name: 'Novice', requirement: 1000, bonus: { soulMult: 1.1, statMult: 1.05 }, unlocks: ['relic_slot_1'] },
    { tier: 2, name: 'Apprentice', requirement: 5000, bonus: { soulMult: 1.25, statMult: 1.1 }, unlocks: ['challenge_modes', 'relic_slot_2'] },
    { tier: 3, name: 'Journeyman', requirement: 15000, bonus: { soulMult: 1.5, statMult: 1.2 }, unlocks: ['new_class_paladin', 'relic_slot_3'] },
    { tier: 4, name: 'Expert', requirement: 50000, bonus: { soulMult: 2.0, statMult: 1.35 }, unlocks: ['endless_mode'] },
    { tier: 5, name: 'Master', requirement: 150000, bonus: { soulMult: 3.0, statMult: 1.5 }, unlocks: ['prestige_shop'] },
    { tier: 6, name: 'Grandmaster', requirement: 500000, bonus: { soulMult: 5.0, statMult: 2.0 }, unlocks: ['ultimate_skills'] },
    { tier: 7, name: 'Legend', requirement: 1500000, bonus: { soulMult: 10.0, statMult: 3.0 }, unlocks: ['mythic_gear'] }
];

// === NEW FEATURE: RELIC SYSTEM ===
const RELICS = [
    { id: 'chrono_shard', name: 'Chrono Shard', tier: 'rare', effect: { speedBonus: 0.15 }, desc: '+15% game speed' },
    { id: 'soul_gem', name: 'Soul Gem', tier: 'epic', effect: { soulBonus: 0.2 }, desc: '+20% soul points' },
    { id: 'blood_ruby', name: 'Blood Ruby', tier: 'rare', effect: { lifesteal: 0.05 }, desc: '5% lifesteal on hit' },
    { id: 'storm_crystal', name: 'Storm Crystal', tier: 'epic', effect: { chainLightning: 0.1 }, desc: '10% chance to chain lightning' },
    { id: 'void_essence', name: 'Void Essence', tier: 'legendary', effect: { critMultiplier: 0.5 }, desc: '+50% crit damage' },
    { id: 'phoenix_feather', name: 'Phoenix Feather', tier: 'legendary', effect: { revive: 1 }, desc: 'Revive once per run with 50% HP' },
    { id: 'dragon_scale', name: 'Dragon Scale', tier: 'epic', effect: { damageReduction: 0.1 }, desc: '10% damage reduction' },
    { id: 'lucky_coin', name: 'Lucky Coin', tier: 'rare', effect: { luckBonus: 0.15 }, desc: '+15% drop rates' },
    { id: 'ancient_tome', name: 'Ancient Tome', tier: 'epic', effect: { xpBonus: 0.25 }, desc: '+25% XP gained' },
    { id: 'boss_trophy', name: 'Boss Trophy', tier: 'legendary', effect: { bossDamage: 0.3 }, desc: '+30% damage to bosses' },
    { id: 'elite_mark', name: 'Elite Mark', tier: 'rare', effect: { eliteBonus: 0.2 }, desc: '+20% damage to elites' },
    { id: 'eternal_flame', name: 'Eternal Flame', tier: 'mythic', effect: { burnDamage: 0.1, allStats: 0.1 }, desc: 'Burns enemies, +10% all stats' }
];

// === NEW FEATURE: DAILY REWARDS ===
const DAILY_REWARDS = [
    { day: 1, reward: { souls: 50 }, desc: '50 Soul Points' },
    { day: 2, reward: { souls: 75 }, desc: '75 Soul Points' },
    { day: 3, reward: { souls: 100, item: 'random_equipment' }, desc: '100 SP + Equipment' },
    { day: 4, reward: { souls: 125 }, desc: '125 Soul Points' },
    { day: 5, reward: { souls: 150, relic: 'lucky_coin' }, desc: '150 SP + Lucky Coin' },
    { day: 6, reward: { souls: 200 }, desc: '200 Soul Points' },
    { day: 7, reward: { souls: 500, item: 'legendary_chest' }, desc: '500 SP + Legendary Chest!' }
];

// === NEW FEATURE: MILESTONE UNLOCKS ===
const MILESTONES = [
    { id: 'unlock_pet_wolf', condition: { floor: 10 }, unlock: 'pet_wolf_discount', reward: { discount: 0.5 }, desc: 'Wolf pet 50% off at Floor 10' },
    { id: 'unlock_challenge', condition: { floor: 25 }, unlock: 'challenge_modes', desc: 'Unlock Challenge Modes at Floor 25' },
    { id: 'unlock_relic_slot', condition: { floor: 50 }, unlock: 'relic_slot_2', desc: 'Unlock 2nd Relic Slot at Floor 50' },
    { id: 'unlock_endless', condition: { floor: 100 }, unlock: 'endless_mode', desc: 'Unlock Endless Mode at Floor 100' },
    { id: 'kill_milestone_1', condition: { kills: 500 }, unlock: 'elite_spawn_boost', desc: 'More Elite spawns at 500 kills' },
    { id: 'kill_milestone_2', condition: { kills: 2000 }, unlock: 'legendary_boost', desc: '+5% Legendary drops at 2000 kills' },
    { id: 'boss_milestone', condition: { bosses: 25 }, unlock: 'boss_loot_boost', desc: 'Better Boss loot at 25 boss kills' },
    { id: 'prestige_milestone', condition: { prestige: 5 }, unlock: 'ascension_ready', desc: 'Unlock Ascension at Prestige 5' },
    { id: 'time_milestone', condition: { timePlayed: 3600000 }, unlock: 'veteran_bonus', desc: 'Veteran Bonus after 1 hour played' }
];

// === NEW FEATURE: TOOLTIP DATA ===
const TOOLTIPS = {
    maxHp: 'Maximum Health Points. Increases survivability.',
    attack: 'Attack Power. Determines damage dealt to enemies.',
    defense: 'Defense. Reduces incoming damage.',
    speed: 'Attack Speed. How fast you attack and move.',
    evasion: 'Evasion Chance. Chance to dodge attacks (max 75%).',
    critChance: 'Critical Hit Chance. Chance to deal critical damage.',
    critDamage: 'Critical Damage Multiplier. Bonus damage on crits.',
    soulPoints: 'Soul Points. Permanent currency for upgrades.',
    prestige: 'Prestige Level. Resets progress for permanent bonuses.',
    synergy: 'Active synergies provide powerful bonuses when conditions are met.',
    relic: 'Relics are rare artifacts that provide permanent passive bonuses.',
    challenge: 'Challenge modes offer special modifiers and rewards.',
    ascension: 'Ascension tiers unlock new content and provide massive bonuses.'
};

// === NEW FEATURE: TUTORIAL STEPS ===
const TUTORIAL_STEPS = [
    { id: 'welcome', title: 'Welcome!', text: 'Welcome to Idle Dungeon Runner! Your hero automatically fights monsters and explores dungeons.', highlight: null },
    { id: 'movement', title: 'Auto-Combat', text: 'Your hero moves and attacks automatically. Watch them clear the floor!', highlight: 'game-canvas' },
    { id: 'souls', title: 'Soul Points', text: 'When you die, you earn Soul Points based on your progress. Use them to buy permanent upgrades!', highlight: 'soul-points' },
    { id: 'upgrades', title: 'Upgrades', text: 'Open the Shop to spend Soul Points on permanent stat upgrades.', highlight: 'upgrades-panel' },
    { id: 'skills', title: 'Skills', text: 'Use skills (keys 1-4) to heal, dash, or deal extra damage!', highlight: 'skills-panel' },
    { id: 'equipment', title: 'Equipment', text: 'Monsters drop equipment. Better gear means better stats!', highlight: 'equipment-panel' },
    { id: 'prestige', title: 'Prestige', text: 'Prestige resets your run but gives permanent multipliers. The more souls, the bigger the bonus!', highlight: 'shop-prestige' },
    { id: 'complete', title: 'Good Luck!', text: 'Die. Upgrade. Repeat. How far can you go?', highlight: null }
];

// === NEW FEATURE: TRAP VARIETY ===
const TRAP_TYPES = [
    { id: 'spike', name: 'Spike Trap', damage: 0.15, color: '#8b4513', icon: '⬆️', desc: 'Sharp spikes deal 15% HP damage' },
    { id: 'poison_gas', name: 'Poison Gas', damage: 0.05, duration: 5, status: 'poison', color: '#32cd32', icon: '☠️', desc: 'Releases poison gas for 5 seconds' },
    { id: 'fire', name: 'Fire Trap', damage: 0.20, status: 'burn', color: '#ff4500', icon: '🔥', desc: 'Burns for 20% HP and applies burn' },
    { id: 'ice', name: 'Ice Trap', damage: 0.10, status: 'freeze', color: '#00bfff', icon: '❄️', desc: 'Slows movement by 50% for 3s' },
    { id: 'teleporter', name: 'Teleporter', damage: 0, special: 'teleport', color: '#9400d3', icon: '🌀', desc: 'Teleports to random location' },
    { id: 'alarm', name: 'Alarm Trap', damage: 0, special: 'spawn', color: '#ffd700', icon: '🔔', desc: 'Spawns additional monsters' },
    { id: 'web', name: 'Spider Web', damage: 0, duration: 3, special: 'root', color: '#dcdcdc', icon: '🕸️', desc: 'Immobilizes for 3 seconds' },
    { id: 'boulder', name: 'Boulder Trap', damage: 0.30, special: 'knockback', color: '#696969', icon: '🪨', desc: 'Massive damage and knockback' }
];

// === NEW FEATURE: SECRET ROOMS ===
const SECRET_ROOM_TYPES = [
    { id: 'treasure', name: 'Hidden Treasury', rewards: { gold: 100, chests: 2 }, icon: '💰', desc: 'A room filled with treasure chests' },
    { id: 'armory', name: 'Secret Armory', rewards: { equipment: 'rare' }, icon: '⚔️', desc: 'Guaranteed rare+ equipment drop' },
    { id: 'shrine', name: 'Ancient Shrine', rewards: { buff: { allStats: 0.2, duration: 120 } }, icon: '⛩️', desc: '+20% all stats for 2 minutes' },
    { id: 'library', name: 'Forgotten Library', rewards: { skillPoints: 1 }, icon: '📚', desc: 'Gain a free skill point' },
    { id: 'garden', name: 'Mystical Garden', rewards: { heal: 1.0, buff: { regen: 0.02, duration: 60 } }, icon: '🌿', desc: 'Full heal + regen for 1 minute' },
    { id: 'forge', name: 'Dwarven Forge', rewards: { upgrade: true }, icon: '🔨', desc: 'Upgrade equipped weapon by 1 tier' },
    { id: 'alchemy', name: 'Alchemy Lab', rewards: { potions: 3 }, icon: '⚗️', desc: 'Gain 3 random potions' },
    { id: 'portal', name: 'Dimensional Rift', rewards: { skipFloors: 5 }, icon: '🌌', desc: 'Skip ahead 5 floors' }
];

// === NEW FEATURE: COMBO SYSTEM ===
const COMBO_THRESHOLDS = [
    { count: 5, name: 'Good!', bonus: 1.1, color: '#4CAF50' },
    { count: 10, name: 'Great!', bonus: 1.25, color: '#2196F3' },
    { count: 20, name: 'Awesome!', bonus: 1.5, color: '#9C27B0' },
    { count: 35, name: 'Amazing!', bonus: 1.75, color: '#FF9800' },
    { count: 50, name: 'Incredible!', bonus: 2.0, color: '#F44336' },
    { count: 75, name: 'LEGENDARY!', bonus: 2.5, color: '#FFD700' },
    { count: 100, name: 'GODLIKE!!!', bonus: 3.0, color: '#FF00FF' }
];

// === NEW FEATURE: DODGE MECHANIC ===
const DODGE_CONFIG = {
    baseCooldown: 2.0,      // Seconds between dodges
    iFrameDuration: 0.3,    // Invincibility frames duration
    dashDistance: 3,        // Tiles to dash
    staminaCost: 20,        // Stamina cost per dodge
    maxStamina: 100,        // Maximum stamina
    staminaRegen: 15,       // Stamina regen per second
    perfectDodgeWindow: 0.15, // Perfect dodge timing window
    perfectDodgeBonus: 1.5   // Damage bonus after perfect dodge
};

// === NEW FEATURE: CRAFTING SYSTEM ===
const CRAFTING_MATERIALS = [
    { id: 'iron_ore', name: 'Iron Ore', tier: 1, icon: '🪨', color: '#808080' },
    { id: 'silver_ore', name: 'Silver Ore', tier: 2, icon: '⬜', color: '#C0C0C0' },
    { id: 'gold_ore', name: 'Gold Ore', tier: 3, icon: '🟡', color: '#FFD700' },
    { id: 'mythril', name: 'Mythril', tier: 4, icon: '💎', color: '#00CED1' },
    { id: 'adamantite', name: 'Adamantite', tier: 5, icon: '🔷', color: '#8A2BE2' },
    { id: 'monster_essence', name: 'Monster Essence', tier: 1, icon: '💧', color: '#32CD32' },
    { id: 'boss_core', name: 'Boss Core', tier: 3, icon: '❤️', color: '#DC143C' },
    { id: 'dragon_scale', name: 'Dragon Scale', tier: 4, icon: '🐲', color: '#228B22' },
    { id: 'void_shard', name: 'Void Shard', tier: 5, icon: '🖤', color: '#4B0082' },
    { id: 'celestial_dust', name: 'Celestial Dust', tier: 5, icon: '✨', color: '#F0E68C' }
];

const CRAFTING_RECIPES = [
    { id: 'iron_sword', name: 'Iron Sword', type: 'weapon', materials: { iron_ore: 5, monster_essence: 2 }, result: { base: 'Sword', rarity: 'uncommon' } },
    { id: 'silver_blade', name: 'Silver Blade', type: 'weapon', materials: { silver_ore: 8, monster_essence: 5 }, result: { base: 'Sword', rarity: 'rare' } },
    { id: 'gold_scepter', name: 'Gold Scepter', type: 'weapon', materials: { gold_ore: 10, boss_core: 1 }, result: { base: 'Staff', rarity: 'epic' } },
    { id: 'mythril_dagger', name: 'Mythril Dagger', type: 'weapon', materials: { mythril: 8, void_shard: 2 }, result: { base: 'Dagger', rarity: 'epic' } },
    { id: 'adamantite_hammer', name: 'Adamantite Hammer', type: 'weapon', materials: { adamantite: 15, dragon_scale: 3, boss_core: 2 }, result: { base: 'Hammer', rarity: 'legendary' } },
    { id: 'leather_vest', name: 'Reinforced Leather', type: 'armor', materials: { iron_ore: 3, monster_essence: 3 }, result: { base: 'Leather', rarity: 'uncommon' } },
    { id: 'silver_mail', name: 'Silver Chainmail', type: 'armor', materials: { silver_ore: 10, iron_ore: 5 }, result: { base: 'Chainmail', rarity: 'rare' } },
    { id: 'dragon_plate', name: 'Dragon Plate', type: 'armor', materials: { adamantite: 12, dragon_scale: 5 }, result: { base: 'Plate', rarity: 'legendary' } },
    { id: 'void_ring', name: 'Void Ring', type: 'accessory', materials: { void_shard: 5, celestial_dust: 3 }, result: { base: 'Ring', rarity: 'legendary' } },
    { id: 'celestial_amulet', name: 'Celestial Amulet', type: 'accessory', materials: { celestial_dust: 8, boss_core: 3 }, result: { base: 'Amulet', rarity: 'legendary' } }
];

// === NEW FEATURE: ENCHANTING SYSTEM ===
const ENCHANTMENT_TYPES = [
    { id: 'fire', name: 'Flame', effect: { burnChance: 0.15, burnDamage: 0.1 }, icon: '🔥', color: '#FF4500', desc: '15% chance to burn enemies' },
    { id: 'ice', name: 'Frost', effect: { freezeChance: 0.10, slowAmount: 0.3 }, icon: '❄️', color: '#00BFFF', desc: '10% chance to freeze enemies' },
    { id: 'lightning', name: 'Storm', effect: { chainChance: 0.08, chainDamage: 0.5 }, icon: '⚡', color: '#FFD700', desc: '8% chance to chain lightning' },
    { id: 'vampire', name: 'Vampiric', effect: { lifesteal: 0.08 }, icon: '🩸', color: '#8B0000', desc: '8% lifesteal on attacks' },
    { id: 'thorns', name: 'Thorns', effect: { reflectDamage: 0.15 }, icon: '🌹', color: '#228B22', desc: 'Reflect 15% damage taken' },
    { id: 'speed', name: 'Haste', effect: { speedBonus: 0.20 }, icon: '💨', color: '#87CEEB', desc: '+20% attack speed' },
    { id: 'fortune', name: 'Fortune', effect: { luckBonus: 0.25 }, icon: '🍀', color: '#32CD32', desc: '+25% drop rates' },
    { id: 'wisdom', name: 'Wisdom', effect: { soulBonus: 0.20 }, icon: '📖', color: '#9370DB', desc: '+20% soul points' },
    { id: 'protection', name: 'Protection', effect: { damageReduction: 0.12 }, icon: '🛡️', color: '#4682B4', desc: '12% damage reduction' },
    { id: 'berserker', name: 'Berserker', effect: { lowHpDamage: 0.50, hpThreshold: 0.3 }, icon: '😤', color: '#DC143C', desc: '+50% damage below 30% HP' }
];

const ENCHANTING_COSTS = {
    common: { souls: 50, materials: { monster_essence: 2 } },
    uncommon: { souls: 100, materials: { monster_essence: 5, iron_ore: 3 } },
    rare: { souls: 250, materials: { monster_essence: 10, silver_ore: 5 } },
    epic: { souls: 500, materials: { boss_core: 1, gold_ore: 8 } },
    legendary: { souls: 1000, materials: { boss_core: 3, mythril: 5, void_shard: 2 } }
};

// === NEW FEATURE: PET EVOLUTION ===
const PET_EVOLUTION = {
    wolf: {
        stages: [
            { level: 1, name: 'Shadow Pup', icon: '🐕', stats: { atkBonus: 0.05 } },
            { level: 5, name: 'Shadow Wolf', icon: '🐺', stats: { atkBonus: 0.10, critBonus: 2 } },
            { level: 10, name: 'Dire Wolf', icon: '🐺', stats: { atkBonus: 0.15, critBonus: 5, ability: 'pack_howl' } },
            { level: 20, name: 'Alpha Wolf', icon: '🐺', stats: { atkBonus: 0.25, critBonus: 8, ability: 'frenzy' } }
        ],
        abilities: {
            pack_howl: { name: 'Pack Howl', effect: 'Boosts attack by 30% for 10s', cooldown: 60 },
            frenzy: { name: 'Frenzy', effect: 'Attack speed +50% for 8s', cooldown: 45 }
        }
    },
    owl: {
        stages: [
            { level: 1, name: 'Owlet', icon: '🦉', stats: { critBonus: 2 } },
            { level: 5, name: 'Mystic Owl', icon: '🦉', stats: { critBonus: 5, evaBonus: 3 } },
            { level: 10, name: 'Sage Owl', icon: '🦉', stats: { critBonus: 8, evaBonus: 5, ability: 'true_sight' } },
            { level: 20, name: 'Grand Owl', icon: '🦉', stats: { critBonus: 12, evaBonus: 8, ability: 'wisdom_aura' } }
        ],
        abilities: {
            true_sight: { name: 'True Sight', effect: 'Reveals secret rooms on floor', cooldown: 120 },
            wisdom_aura: { name: 'Wisdom Aura', effect: '+50% soul points for 30s', cooldown: 90 }
        }
    },
    turtle: {
        stages: [
            { level: 1, name: 'Baby Turtle', icon: '🐢', stats: { defBonus: 0.08 } },
            { level: 5, name: 'Ancient Turtle', icon: '🐢', stats: { defBonus: 0.15, hpBonus: 0.05 } },
            { level: 10, name: 'Fortress Turtle', icon: '🐢', stats: { defBonus: 0.20, hpBonus: 0.10, ability: 'shell_shield' } },
            { level: 20, name: 'Titan Turtle', icon: '🐢', stats: { defBonus: 0.30, hpBonus: 0.15, ability: 'earthquake' } }
        ],
        abilities: {
            shell_shield: { name: 'Shell Shield', effect: 'Block next 3 attacks', cooldown: 30 },
            earthquake: { name: 'Earthquake', effect: 'Stun all enemies for 2s', cooldown: 60 }
        }
    },
    phoenix: {
        stages: [
            { level: 1, name: 'Ember', icon: '🔥', stats: { healBonus: 0.01 } },
            { level: 5, name: 'Baby Phoenix', icon: '🔥', stats: { healBonus: 0.02, burnChance: 0.05 } },
            { level: 10, name: 'Phoenix', icon: '🔥', stats: { healBonus: 0.03, burnChance: 0.10, ability: 'rebirth' } },
            { level: 20, name: 'Eternal Phoenix', icon: '🔥', stats: { healBonus: 0.05, burnChance: 0.15, ability: 'inferno' } }
        ],
        abilities: {
            rebirth: { name: 'Rebirth', effect: 'Revive with 30% HP once per run', cooldown: 0 },
            inferno: { name: 'Inferno', effect: 'Burn all enemies for 5s', cooldown: 45 }
        }
    },
    dragon: {
        stages: [
            { level: 1, name: 'Whelpling', icon: '🐉', stats: { allBonus: 0.02 } },
            { level: 5, name: 'Drake', icon: '🐉', stats: { allBonus: 0.05 } },
            { level: 10, name: 'Dragon', icon: '🐉', stats: { allBonus: 0.08, ability: 'dragon_breath' } },
            { level: 20, name: 'Elder Dragon', icon: '🐉', stats: { allBonus: 0.12, ability: 'dragon_rage' } }
        ],
        abilities: {
            dragon_breath: { name: 'Dragon Breath', effect: 'Deal 200% ATK to all enemies', cooldown: 30 },
            dragon_rage: { name: 'Dragon Rage', effect: '+100% damage for 10s', cooldown: 60 }
        }
    }
};

// === NEW FEATURE: WEATHER EFFECTS ===
const WEATHER_TYPES = [
    { id: 'clear', name: 'Clear', effect: null, particles: 0, color: null, desc: 'Normal conditions' },
    { id: 'rain', name: 'Rain', effect: { speed: -0.1 }, particles: 50, color: '#4A90D9', desc: 'Slows movement by 10%' },
    { id: 'storm', name: 'Thunderstorm', effect: { speed: -0.15, lightningChance: 0.02 }, particles: 80, color: '#2C3E50', desc: 'Slower + random lightning strikes' },
    { id: 'snow', name: 'Snowfall', effect: { speed: -0.20, defense: 0.1 }, particles: 40, color: '#E8F4F8', desc: 'Slower but +10% defense' },
    { id: 'fog', name: 'Dense Fog', effect: { visibility: 0.5, evasion: 10 }, particles: 20, color: '#95A5A6', desc: 'Reduced visibility, +10% evasion' },
    { id: 'sandstorm', name: 'Sandstorm', effect: { accuracy: -15, dotDamage: 0.01 }, particles: 60, color: '#D4A574', desc: '-15% accuracy, minor damage over time' },
    { id: 'volcanic', name: 'Volcanic Ash', effect: { dotDamage: 0.02, fireDamage: 0.2 }, particles: 45, color: '#8B0000', desc: 'Constant damage, +20% fire damage' },
    { id: 'magical', name: 'Arcane Storm', effect: { critChance: 15, cooldownReduction: 0.2 }, particles: 35, color: '#9B59B6', desc: '+15% crit, -20% cooldowns' }
];

// === NEW FEATURE: DAY/NIGHT CYCLE ===
const DAY_NIGHT_CYCLE = {
    cycleDuration: 300, // 5 minutes per full cycle (in seconds)
    phases: [
        { id: 'dawn', name: 'Dawn', start: 0, end: 0.15, brightness: 0.7, tint: '#FFD700', effect: { healing: 1.2 } },
        { id: 'morning', name: 'Morning', start: 0.15, end: 0.35, brightness: 0.9, tint: '#FFFACD', effect: { speed: 1.1 } },
        { id: 'noon', name: 'Noon', start: 0.35, end: 0.5, brightness: 1.0, tint: null, effect: { attack: 1.1 } },
        { id: 'afternoon', name: 'Afternoon', start: 0.5, end: 0.65, brightness: 0.95, tint: '#FFA500', effect: { critChance: 5 } },
        { id: 'dusk', name: 'Dusk', start: 0.65, end: 0.75, brightness: 0.7, tint: '#FF6347', effect: { evasion: 5 } },
        { id: 'evening', name: 'Evening', start: 0.75, end: 0.85, brightness: 0.5, tint: '#4B0082', effect: { defense: 1.1 } },
        { id: 'night', name: 'Night', start: 0.85, end: 0.95, brightness: 0.3, tint: '#191970', effect: { critDamage: 1.2 } },
        { id: 'midnight', name: 'Midnight', start: 0.95, end: 1.0, brightness: 0.2, tint: '#0D0D0D', effect: { soulBonus: 1.3 } }
    ]
};

// === NEW FEATURE: GAME MODES ===
const GAME_MODES = {
    normal: { name: 'Normal', desc: 'Standard dungeon crawling experience', modifiers: {} },
    endless: { name: 'Endless', desc: 'Infinite floors, scaling difficulty', modifiers: { noFloorCap: true, scalingDifficulty: 1.05 }, unlockFloor: 100 },
    bossRush: { name: 'Boss Rush', desc: 'Fight bosses back-to-back', modifiers: { bossesOnly: true, noHeal: true, bossRewards: 2 }, unlockBosses: 25 },
    daily: { name: 'Daily Challenge', desc: 'Daily seed with special modifiers', modifiers: { seeded: true, noRetry: true, bonusRewards: 1.5 } },
    hardcore: { name: 'Hardcore', desc: 'Permadeath - lose all progress on death', modifiers: { permadeath: true, rewardMult: 3 }, unlockFloor: 50 },
    speedrun: { name: 'Speedrun', desc: 'Reach floor 50 as fast as possible', modifiers: { timer: true, targetFloor: 50, bonusPerSecond: -1 } },
    nightmare: { name: 'Nightmare', desc: 'Extreme difficulty, extreme rewards', modifiers: { enemyHp: 2, enemyDamage: 1.5, rewardMult: 5 }, unlockFloor: 200 }
};

// === NEW FEATURE: MINIMAP CONFIG ===
const MINIMAP_CONFIG = {
    size: 150,           // Minimap size in pixels
    scale: 3,            // Pixels per tile
    opacity: 0.8,        // Minimap opacity
    colors: {
        wall: '#333333',
        floor: '#666666',
        player: '#00FF00',
        monster: '#FF0000',
        boss: '#FF00FF',
        chest: '#FFD700',
        exit: '#00FFFF',
        secret: '#9400D3',
        trap: '#FF4500',
        pet: '#87CEEB'
    },
    showEnemies: true,
    showItems: true,
    showTraps: false,    // Traps hidden until revealed
    fogOfWar: true       // Unexplored areas hidden
};

// === NEW FEATURE: DAMAGE STATISTICS ===
const DAMAGE_STATS_CONFIG = {
    trackWindow: 10,     // Seconds to track DPS
    showFloatingDamage: true,
    showDPSMeter: true,
    categories: ['player', 'pet', 'skill', 'dot', 'reflected']
};

// === GAME STATE ===
let gameState = {
    // Permanent (persisted across runs)
    soulPoints: 0,
    totalRuns: 0,
    bestFloor: 0,
    prestigeLevel: 0,
    prestigeMultiplier: 1,
    selectedClass: null,
    upgrades: { maxHp: 0, attack: 0, defense: 0, speed: 0, evasion: 0, critChance: 0 },
    specialItems: { lifeCrystal: false, warriorsBlade: false, guardianShield: false, swiftBoots: false, shadowCloak: false },
    achievements: {},
    skillTree: {},
    settings: { musicVolume: 50, sfxVolume: 50, showDamage: true, showLog: true, autoLoot: false, showParticles: true, tutorialComplete: false },
    stats: { monstersKilled: 0, bossesKilled: 0, elitesKilled: 0, miniBossesKilled: 0, chestsOpened: 0, totalDamage: 0, timePlayed: 0, legendariesFound: 0, shrinesUsed: 0, fountainsUsed: 0, altarsUsed: 0, totalSoulsEarned: 0, highestDamage: 0, longestStreak: 0, totalHealing: 0 },
    lastSaveTime: Date.now(),
    pets: {},
    activePet: null,

    // Permanent - New Features
    relics: [],
    equippedRelics: [],
    ascensionTier: 0,
    totalSoulsSpentOnAscension: 0,
    challengesCompleted: {},
    dailyRewards: { lastClaim: null, streak: 0 },
    milestonesUnlocked: {},
    activeSynergies: [],
    tutorialStep: 0,

    // Run-specific
    run: null,
    monsters: [],
    grid: [],
    player: { x: 0, y: 0 },
    pet: { x: 0, y: 0 },
    chests: [],
    traps: [],
    npcs: [],
    roomEvents: [],
    gameRunning: false,
    gameSpeed: 1,
    skillCooldowns: {
        heal: 0, dash: 0,
        whirlwind: 0, shieldBash: 0, battleCry: 0, berserkerRage: 0,
        fireball: 0, iceSpike: 0, lightning: 0, arcaneShield: 0,
        shadowstep: 0, backstab: 0, poisonBlade: 0, smokeBomb: 0
    },
    visualEffects: [],
    screenShake: 0,
    screenFlashes: [],
    hitFlashes: [],
    runBuffs: [],

    // Run-specific - New Features
    activeChallenge: null,
    challengeTimer: 0,
    phoenixRebirthUsed: false,
    floorKills: 0,
    particles: [],

    // Floor progression
    exitSpawned: false,
    exitPosition: null,
    chestsCollected: 0,
    totalChestsOnFloor: 0,

    // Combo system
    comboCount: 0,
    comboTimer: 0,
    comboMaxTime: 3.0,
    bestCombo: 0,
    comboBonus: 1.0,

    // Dodge/stamina
    stamina: 100,
    maxStamina: 100,
    dodgeCooldown: 0,
    isInvincible: false,
    invincibilityTimer: 0,
    perfectDodgeActive: false,
    perfectDodgeTimer: 0,

    // Crafting & Pets
    craftingMaterials: {},
    petLevels: {},
    petExperience: {},
    petAbilityCooldowns: {},

    // Weather & Time
    currentWeather: 'clear',
    weatherTimer: 0,
    weatherDuration: 120,
    dayNightTime: 0,
    currentPhase: 'noon',

    // Game mode
    currentGameMode: 'normal',
    gameModeTimer: 0,

    // Minimap
    exploredTiles: [],
    secretRoomsFound: [],

    // Damage tracking
    damageLog: [],
    sessionDamage: { player: 0, pet: 0, skill: 0, dot: 0, reflected: 0 },
    dpsHistory: [],
    currentDPS: 0
};

// Modal auto-close timer system
let modalTimers = {};

function startModalTimer(modalId, seconds, callback) {
    // Clear any existing timer for this modal
    if (modalTimers[modalId]) {
        clearInterval(modalTimers[modalId].interval);
    }

    const timerDisplay = document.createElement('div');
    timerDisplay.className = 'modal-timer';
    timerDisplay.id = `${modalId}-timer`;

    const modal = document.getElementById(modalId);
    if (!modal) return;

    // Remove existing timer display if any
    const existingTimer = modal.querySelector('.modal-timer');
    if (existingTimer) existingTimer.remove();

    // Add timer to modal
    const modalContent = modal.querySelector('.modal-content') || modal;
    modalContent.appendChild(timerDisplay);

    let remaining = seconds;
    timerDisplay.textContent = `Auto-continue in ${remaining}s`;

    modalTimers[modalId] = {
        interval: setInterval(() => {
            remaining--;
            if (remaining <= 0) {
                clearInterval(modalTimers[modalId].interval);
                timerDisplay.remove();
                delete modalTimers[modalId];
                if (callback) callback();
            } else {
                timerDisplay.textContent = `Auto-continue in ${remaining}s`;
            }
        }, 1000),
        callback
    };
}

function clearModalTimer(modalId) {
    if (modalTimers[modalId]) {
        clearInterval(modalTimers[modalId].interval);
        const timerDisplay = document.getElementById(`${modalId}-timer`);
        if (timerDisplay) timerDisplay.remove();
        delete modalTimers[modalId];
    }
}

// Visual effect types
function addVisualEffect(type, x, y, duration = 0.5, data = {}) {
    gameState.visualEffects.push({
        type, x, y, duration, maxDuration: duration, ...data
    });
}

function updateVisualEffects(dt) {
    gameState.visualEffects = gameState.visualEffects.filter(e => {
        e.duration -= dt;
        return e.duration > 0;
    });
    if (gameState.screenShake > 0) {
        gameState.screenShake -= dt * 20;
        if (gameState.screenShake < 0) gameState.screenShake = 0;
    }
}

// === DOM CACHE ===
const DOM = {};
let canvas, ctx;

// === PANELS ===
const panels = { stats: false, skills: false, equipment: false, upgrades: false, achievements: false, settings: false, log: false };

// ==========================================
// INITIALIZATION
// ==========================================

function initDOM() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');

    // Calculate and apply tile size
    TILE_SIZE = calculateTileSize();
    canvas.width = GRID_WIDTH * TILE_SIZE;
    canvas.height = GRID_HEIGHT * TILE_SIZE;

    // Update floating UI dimensions
    updateCanvasDimensions();

    // Cache all DOM elements
    const ids = ['soul-points', 'current-floor', 'player-level', 'best-floor', 'prestige-level',
        'class-icon', 'class-name', 'stat-hp', 'stat-attack', 'stat-defense', 'stat-speed', 'stat-evasion', 'stat-crit-chance', 'stat-crit-damage',
        'xp-bar', 'xp-current', 'xp-needed', 'player-status-effects', 'player-health-float', 'player-health-bar',
        'damage-container', 'combat-log', 'floor-type', 'monsters-remaining', 'biome-indicator',
        'chests-collected', 'chests-total', 'exit-status', 'objective-chests', 'objective-monsters', 'objective-exit',
        'death-modal', 'death-floor', 'death-level', 'death-kills', 'death-souls', 'death-loot', 'restart-btn',
        'class-modal', 'npc-modal', 'npc-name', 'npc-dialog', 'npc-options', 'npc-portrait', 'close-npc',
        'chest-modal', 'chest-contents', 'close-chest', 'achievement-popup', 'achievement-popup-name',
        'save-modal', 'save-modal-title', 'save-textarea', 'copy-save', 'close-save-modal',
        'slot-weapon', 'slot-armor', 'slot-accessory', 'inventory-grid', 'achievements-list', 'achievements-unlocked', 'achievements-total',
        'prestige-mult', 'prestige-souls', 'prestige-new-mult', 'prestige-btn',
        'stats-runs', 'stats-kills', 'stats-damage', 'stats-chests', 'stats-time',
        'heal-cooldown', 'dash-cooldown', 'whirlwind-cooldown', 'fireball-cooldown',
        'stats-panel', 'skills-panel', 'equipment-panel', 'upgrades-panel', 'achievements-panel', 'settings-panel', 'log-panel',
        'shop-stats', 'shop-items', 'shop-prestige', 'skill-tree', 'export-save', 'import-save', 'reset-save', 'log-toggle'
    ];
    ids.forEach(id => DOM[id.replace(/-/g, '_')] = document.getElementById(id));
}

function setupEventListeners() {
    // Restart
    DOM.restart_btn?.addEventListener('click', () => { DOM.death_modal.classList.remove('active'); startNewRun(); });

    // Class selection
    document.querySelectorAll('.class-option').forEach(el => {
        el.addEventListener('click', () => selectClass(el.dataset.class));
    });

    // Menu toggles
    document.querySelectorAll('.menu-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => togglePanel(btn.dataset.menu));
    });

    // Close panels
    document.querySelectorAll('.close-panel-btn').forEach(btn => {
        btn.addEventListener('click', () => closePanel(btn.dataset.panel));
    });

    // Speed controls
    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.addEventListener('click', () => setGameSpeed(parseInt(btn.dataset.speed)));
    });

    // Shop tabs
    document.querySelectorAll('.shop-tab').forEach(tab => {
        tab.addEventListener('click', () => switchShopTab(tab.dataset.tab));
    });

    // Upgrades
    document.querySelectorAll('.upgrade-btn').forEach(btn => {
        btn.addEventListener('click', () => purchaseUpgrade(btn.dataset.upgrade));
    });

    // Special items
    document.querySelectorAll('.item-btn').forEach(btn => {
        btn.addEventListener('click', () => purchaseSpecialItem(btn.dataset.item));
    });

    // Skills
    document.querySelectorAll('.skill-slot').forEach(slot => {
        slot.addEventListener('click', () => useSkill(slot.dataset.skill));
    });

    // Prestige
    DOM.prestige_btn?.addEventListener('click', doPrestige);

    // NPC/Chest close
    DOM.close_npc?.addEventListener('click', closeNPCModal);
    DOM.close_chest?.addEventListener('click', closeChestModal);

    // Save/Load
    DOM.export_save?.addEventListener('click', exportSave);
    DOM.import_save?.addEventListener('click', importSave);
    DOM.reset_save?.addEventListener('click', resetSave);
    DOM.copy_save?.addEventListener('click', () => { DOM.save_textarea.select(); document.execCommand('copy'); });
    DOM.close_save_modal?.addEventListener('click', () => DOM.save_modal.classList.remove('active'));

    // Log toggle
    DOM.log_toggle?.addEventListener('click', () => togglePanel('log'));

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);

    // Mobile skill buttons
    document.querySelectorAll('.mobile-skill-btn[data-skill]').forEach(btn => {
        btn.addEventListener('click', () => useSkill(btn.dataset.skill));
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); useSkill(btn.dataset.skill); });
    });

    // Mobile speed toggle
    const mobileSpeed = document.getElementById('mobile-speed');
    if (mobileSpeed) {
        mobileSpeed.addEventListener('click', cycleSpeed);
        mobileSpeed.addEventListener('touchstart', (e) => { e.preventDefault(); cycleSpeed(); });
    }

    // Mobile navigation
    document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const panel = btn.dataset.panel;
            // Close all panels first on mobile
            Object.keys(panels).forEach(p => panels[p] = false);
            panels[panel] = true;
            updatePanels();
            updateMobileNav(panel);
        });
    });

    // Auto-loot toggle
    const autoLootToggle = document.getElementById('auto-loot-toggle');
    if (autoLootToggle) {
        autoLootToggle.addEventListener('click', () => {
            gameState.settings.autoLoot = !gameState.settings.autoLoot;
            autoLootToggle.classList.toggle('active', gameState.settings.autoLoot);
            saveGame();
        });
    }

    // Bulk upgrade (hold to buy) - improved for mobile
    document.querySelectorAll('.upgrade-btn').forEach(btn => {
        let holdInterval = null;
        let holdTimeout = null;
        let didHold = false;

        const startHold = () => {
            didHold = false;
            holdTimeout = setTimeout(() => {
                didHold = true;
                holdInterval = setInterval(() => {
                    purchaseUpgrade(btn.dataset.upgrade);
                }, 80); // Faster repeat rate
                btn.classList.add('buying');
            }, 250); // Slightly shorter hold delay
        };

        const stopHold = () => {
            if (holdTimeout) clearTimeout(holdTimeout);
            if (holdInterval) clearInterval(holdInterval);
            holdInterval = null;
            holdTimeout = null;
            btn.classList.remove('buying');
        };

        btn.addEventListener('mousedown', startHold);
        btn.addEventListener('mouseup', stopHold);
        btn.addEventListener('mouseleave', stopHold);

        // Mobile touch handling - use passive: false to allow preventDefault
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startHold();
        }, { passive: false });

        btn.addEventListener('touchend', (e) => {
            // If it was a quick tap (not a hold), trigger single purchase
            if (!didHold && holdTimeout) {
                purchaseUpgrade(btn.dataset.upgrade);
            }
            stopHold();
        }, { passive: true });

        btn.addEventListener('touchcancel', stopHold, { passive: true });
    });

    // Settings checkboxes
    const showParticles = document.getElementById('show-particles');
    if (showParticles) {
        showParticles.checked = gameState.settings.showParticles;
        showParticles.addEventListener('change', () => {
            gameState.settings.showParticles = showParticles.checked;
            saveGame();
        });
    }

    const showDamage = document.getElementById('show-damage');
    if (showDamage) {
        showDamage.checked = gameState.settings.showDamage;
        showDamage.addEventListener('change', () => {
            gameState.settings.showDamage = showDamage.checked;
            saveGame();
        });
    }

    const showLog = document.getElementById('show-log');
    if (showLog) {
        showLog.checked = gameState.settings.showLog;
        showLog.addEventListener('change', () => {
            gameState.settings.showLog = showLog.checked;
            saveGame();
        });
    }

    // Audio volume controls
    const musicVolume = document.getElementById('music-volume');
    if (musicVolume) {
        musicVolume.value = gameState.settings.musicVolume;
        musicVolume.addEventListener('input', () => {
            gameState.settings.musicVolume = parseInt(musicVolume.value);
            updateMusicVolume();
            if (gameState.settings.musicVolume > 0 && !currentMusic && gameState.gameRunning) {
                const biome = getCurrentBiome();
                playBackgroundMusic(biome.name);
            } else if (gameState.settings.musicVolume === 0) {
                stopBackgroundMusic();
            }
            saveGame();
        });
    }

    const sfxVolume = document.getElementById('sfx-volume');
    if (sfxVolume) {
        sfxVolume.value = gameState.settings.sfxVolume;
        sfxVolume.addEventListener('input', () => {
            gameState.settings.sfxVolume = parseInt(sfxVolume.value);
            playSound('click'); // Test sound
            saveGame();
        });
    }

    // Initialize music system
    initMusicSystem();

    // Responsive canvas
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
}

function handleKeyboard(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const key = e.key.toLowerCase();

    // Number keys 1-9 for skills
    if (key >= '1' && key <= '9') {
        const skillIndex = parseInt(key) - 1;
        const playerClass = gameState.selectedClass;
        const availableSkills = Object.keys(SKILLS).filter(skillKey => {
            const skill = SKILLS[skillKey];
            return !skill.class || skill.class === playerClass;
        });
        if (skillIndex < availableSkills.length) {
            useSkill(availableSkills[skillIndex]);
        }
    }
    else if (key === 'q') togglePanel('stats');
    else if (key === 'w') togglePanel('skills');
    else if (key === 'e') togglePanel('equipment');
    else if (key === 'r') togglePanel('upgrades');
    else if (key === ' ') { e.preventDefault(); cycleSpeed(); }
    // Dodge mechanic - Shift key or D key
    else if (key === 'd' || key === 'shift') {
        e.preventDefault();
        performDodge();
    }
    // Pet ability - F key
    else if (key === 'f') {
        if (gameState.activePet) {
            usePetAbility(gameState.activePet);
        }
    }
}

function cycleSpeed() {
    const speeds = [1, 2, 5];
    const idx = speeds.indexOf(gameState.gameSpeed);
    setGameSpeed(speeds[(idx + 1) % speeds.length]);
}

function setGameSpeed(speed) {
    gameState.gameSpeed = speed;
    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.speed) === speed);
    });
    // Update mobile speed button
    const mobileSpeedText = document.querySelector('#mobile-speed .speed-text');
    if (mobileSpeedText) mobileSpeedText.textContent = speed + 'x';
}

function updateMobileNav(activePanel) {
    document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.panel === activePanel);
    });
}

function updateCanvasDimensions() {
    const floatingUI = document.querySelector('.floating-ui');
    const damageContainer = document.querySelector('.damage-container');
    const canvasWidth = GRID_WIDTH * TILE_SIZE;
    const canvasHeight = GRID_HEIGHT * TILE_SIZE;

    if (floatingUI) {
        floatingUI.style.width = canvasWidth + 'px';
        floatingUI.style.height = canvasHeight + 'px';
    }
    if (damageContainer) {
        damageContainer.style.width = canvasWidth + 'px';
        damageContainer.style.height = canvasHeight + 'px';
    }
}

function resizeCanvas() {
    if (!canvas) return;
    const container = document.querySelector('.grid-wrapper');
    const floatingUI = document.querySelector('.floating-ui');
    const damageContainer = document.querySelector('.damage-container');
    if (!container) return;

    // Always update canvas dimensions based on current grid size
    const canvasWidth = GRID_WIDTH * TILE_SIZE;
    const canvasHeight = GRID_HEIGHT * TILE_SIZE;

    // Only resize if dimensions changed
    if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        updateCanvasDimensions();
    }

    const isMobile = window.innerWidth <= 600;

    if (isMobile) {
        const maxWidth = window.innerWidth - 20;
        const maxHeight = window.innerHeight - 220;
        const scale = Math.min(1, Math.min(maxWidth / canvasWidth, maxHeight / canvasHeight));

        canvas.style.transform = `scale(${scale})`;
        canvas.style.transformOrigin = 'top left';

        if (floatingUI) {
            floatingUI.style.transform = `scale(${scale})`;
        }
        if (damageContainer) {
            damageContainer.style.transform = `scale(${scale})`;
            damageContainer.style.transformOrigin = 'top left';
        }

        container.style.width = (canvasWidth * scale) + 'px';
        container.style.height = (canvasHeight * scale) + 'px';
    } else {
        canvas.style.transform = '';
        container.style.width = canvasWidth + 'px';
        container.style.height = canvasHeight + 'px';
        if (floatingUI) floatingUI.style.transform = '';
        if (damageContainer) damageContainer.style.transform = '';
    }
}

// ==========================================
// PANEL MANAGEMENT
// ==========================================

function togglePanel(name) {
    const leftPanels = ['stats', 'skills'];
    const rightPanels = ['equipment', 'upgrades', 'achievements', 'settings'];

    if (leftPanels.includes(name)) {
        leftPanels.forEach(p => { if (p !== name) panels[p] = false; });
        panels[name] = !panels[name];
    } else if (rightPanels.includes(name)) {
        rightPanels.forEach(p => { if (p !== name) panels[p] = false; });
        panels[name] = !panels[name];
    } else {
        panels[name] = !panels[name];
    }
    updatePanels();
}

function closePanel(name) {
    panels[name] = false;
    updatePanels();
}

function updatePanels() {
    Object.keys(panels).forEach(name => {
        const panel = DOM[name + '_panel'];
        if (panel) panel.classList.toggle('open', panels[name]);
    });
    document.querySelectorAll('.menu-toggle-btn').forEach(btn => {
        btn.classList.toggle('active', panels[btn.dataset.menu]);
    });
}

function switchShopTab(tab) {
    document.querySelectorAll('.shop-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    DOM.shop_stats?.classList.toggle('hidden', tab !== 'stats');
    DOM.shop_items?.classList.toggle('hidden', tab !== 'items');
    DOM.shop_prestige?.classList.toggle('hidden', tab !== 'prestige');
    document.getElementById('shop-pets')?.classList.toggle('hidden', tab !== 'pets');
    document.getElementById('shop-relics')?.classList.toggle('hidden', tab !== 'relics');
    document.getElementById('shop-synergies')?.classList.toggle('hidden', tab !== 'synergies');
    document.getElementById('shop-challenges')?.classList.toggle('hidden', tab !== 'challenges');
    document.getElementById('shop-ascension')?.classList.toggle('hidden', tab !== 'ascension');
    if (tab === 'prestige') updatePrestigeUI();
    if (tab === 'pets') updatePetsUI();
    if (tab === 'relics') updateRelicsUI();
    if (tab === 'synergies') updateSynergiesUI();
    if (tab === 'challenges') updateChallengesUI();
    if (tab === 'ascension') updateAscensionUI();
}

// ==========================================
// CLASS SELECTION
// ==========================================

function selectClass(className) {
    gameState.selectedClass = className;
    DOM.class_modal.classList.remove('active');

    // Unlock all class-specific skills for this class
    Object.entries(SKILLS).forEach(([, skill]) => {
        if (skill.class === className) {
            skill.unlocked = true;
        }
    });

    // Update skills UI to show class-specific skills
    updateActiveSkillsUI();
    updateSkillTreeUI();

    startNewRun();
}

// ==========================================
// DUNGEON GENERATION
// ==========================================

function generateDungeon() {
    // Calculate dynamic grid size based on current floor
    const floor = gameState.run?.floor || 1;
    const newSize = calculateGridSize(floor);

    // Add some variance - not always square
    const widthVariance = Math.floor(Math.random() * 5) - 2; // -2 to +2
    const heightVariance = Math.floor(Math.random() * 5) - 2;

    GRID_WIDTH = Math.max(MIN_GRID_SIZE, Math.min(MAX_GRID_SIZE, newSize + widthVariance));
    GRID_HEIGHT = Math.max(MIN_GRID_SIZE, Math.min(MAX_GRID_SIZE, newSize + heightVariance));

    // Recalculate tile size to fill available space
    TILE_SIZE = calculateTileSize();
    resizeCanvas();

    // Generate irregular cave-like dungeon
    const grid = generateIrregularCave(GRID_WIDTH, GRID_HEIGHT, floor);

    gameState.grid = grid;
    gameState.chests = [];
    gameState.traps = [];
    gameState.npcs = [];
    gameState.roomEvents = [];

    // Reset floor progression state
    gameState.exitSpawned = false;
    gameState.exitPosition = null;
    gameState.chestsCollected = 0;

    // Scale object counts with map size
    const mapArea = countFloorTiles(grid);
    const density = mapArea / 100; // Base density factor

    // Add chests (scales with map size)
    const chestCount = Math.max(1, Math.floor(density * (1 + Math.random())));
    for (let i = 0; i < chestCount; i++) {
        const pos = findValidPosition();
        if (pos) {
            grid[pos.y][pos.x] = TILE.CHEST;
            gameState.chests.push({ x: pos.x, y: pos.y, opened: false });
        }
    }
    gameState.totalChestsOnFloor = gameState.chests.length;

    // Add traps with variety (scales with map size)
    const trapCount = Math.max(1, Math.floor(density * (1 + Math.random() * 2)));
    for (let i = 0; i < trapCount; i++) {
        const pos = findValidPosition();
        if (pos) {
            grid[pos.y][pos.x] = TILE.TRAP;
            const trapType = getRandomTrapType();
            gameState.traps.push({ x: pos.x, y: pos.y, triggered: false, trapType: trapType });
        }
    }

    // Add secret rooms (8% base chance, increases with floor)
    gameState.secretRoomsFound = [];
    const secretChance = 0.08 + (floor * 0.002);
    if (Math.random() < secretChance) {
        const pos = findValidPosition();
        if (pos) {
            grid[pos.y][pos.x] = TILE.SECRET;
            const secretRoom = generateSecretRoom();
            secretRoom.x = pos.x;
            secretRoom.y = pos.y;
            gameState.secretRoomsFound.push(secretRoom);
        }
    }

    // Reset explored tiles for minimap
    gameState.exploredTiles = [];

    // Add NPC (10% chance, higher on larger maps)
    if (Math.random() < 0.1 + density * 0.02) {
        const pos = findValidPosition();
        if (pos) {
            grid[pos.y][pos.x] = TILE.NPC;
            const npcType = NPC_TYPES[Math.floor(Math.random() * NPC_TYPES.length)];
            gameState.npcs.push({ ...npcType, x: pos.x, y: pos.y });
        }
    }

    // Room Events scale with map size
    // Shrine
    if (Math.random() < 0.15 + density * 0.01) {
        const pos = findValidPosition();
        if (pos) {
            grid[pos.y][pos.x] = TILE.SHRINE;
            const effect = ROOM_EVENTS.shrine.effects[Math.floor(Math.random() * ROOM_EVENTS.shrine.effects.length)];
            gameState.roomEvents.push({ type: 'shrine', x: pos.x, y: pos.y, used: false, effect });
        }
    }
    // Fountain
    if (Math.random() < 0.12 + density * 0.01) {
        const pos = findValidPosition();
        if (pos) {
            grid[pos.y][pos.x] = TILE.FOUNTAIN;
            const effect = ROOM_EVENTS.fountain.effects[Math.floor(Math.random() * ROOM_EVENTS.fountain.effects.length)];
            gameState.roomEvents.push({ type: 'fountain', x: pos.x, y: pos.y, used: false, effect });
        }
    }
    // Cursed Altar (rarer, higher floors)
    if (gameState.run && gameState.run.floor >= 5 && Math.random() < 0.1) {
        const pos = findValidPosition();
        if (pos) {
            grid[pos.y][pos.x] = TILE.ALTAR;
            const effect = ROOM_EVENTS.altar.effects[Math.floor(Math.random() * ROOM_EVENTS.altar.effects.length)];
            gameState.roomEvents.push({ type: 'altar', x: pos.x, y: pos.y, used: false, effect });
        }
    }

    return [];
}

// Count floor tiles for density calculations
function countFloorTiles(grid) {
    let count = 0;
    for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[0].length; x++) {
            if (grid[y][x] === TILE.FLOOR) count++;
        }
    }
    return count;
}

// Generate irregular cave-like dungeon using cellular automata
function generateIrregularCave(width, height, floor) {
    // Initialize grid with walls
    let grid = Array(height).fill(null).map(() => Array(width).fill(TILE.WALL));

    // Choose generation method based on floor (variety)
    const method = floor % 3; // Cycle through 3 methods

    if (method === 0) {
        // Method 1: Cellular automata cave
        grid = generateCellularCave(grid, width, height);
    } else if (method === 1) {
        // Method 2: Blob/organic rooms
        grid = generateBlobRooms(grid, width, height, floor);
    } else {
        // Method 3: Winding tunnels
        grid = generateWindingTunnels(grid, width, height);
    }

    // Ensure connectivity
    ensureConnectivity(grid, width, height);

    // Clean up isolated walls and small gaps
    cleanupDungeon(grid, width, height);

    return grid;
}

// Method 1: Cellular automata for natural cave shapes
function generateCellularCave(grid, width, height) {
    // Initial random fill (45% walls)
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            grid[y][x] = Math.random() < 0.45 ? TILE.WALL : TILE.FLOOR;
        }
    }

    // Run cellular automata iterations
    for (let i = 0; i < 4; i++) {
        const newGrid = grid.map(row => [...row]);
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const neighbors = countWallNeighbors(grid, x, y);
                // If more than 4 wall neighbors, become wall. If less than 4, become floor
                newGrid[y][x] = neighbors > 4 ? TILE.WALL : TILE.FLOOR;
            }
        }
        grid = newGrid;
    }

    return grid;
}

// Method 2: Generate organic blob-shaped rooms
function generateBlobRooms(grid, width, height, floor) {
    // Number of blobs scales with map size
    const numBlobs = 2 + Math.floor(Math.sqrt(width * height) / 4);

    for (let i = 0; i < numBlobs; i++) {
        // Random center point (avoid edges)
        const cx = 2 + Math.floor(Math.random() * (width - 4));
        const cy = 2 + Math.floor(Math.random() * (height - 4));

        // Random blob size
        const blobSize = 2 + Math.floor(Math.random() * Math.min(width, height) / 3);

        // Generate irregular blob using random walk + radius
        generateBlob(grid, cx, cy, blobSize, width, height);
    }

    // Connect all blobs with winding paths
    const centers = findFloorCenters(grid, width, height);
    for (let i = 1; i < centers.length; i++) {
        carveWindingPath(grid, centers[i - 1], centers[i], width, height);
    }

    return grid;
}

// Generate a single organic blob
function generateBlob(grid, cx, cy, size, width, height) {
    // Use noise-based approach for organic shape
    const points = [];

    // Generate points around center
    for (let i = 0; i < 360; i += 15) {
        const angle = (i * Math.PI) / 180;
        const variance = 0.5 + Math.random() * 0.8; // 0.5 to 1.3
        const dist = size * variance;
        const px = Math.floor(cx + Math.cos(angle) * dist);
        const py = Math.floor(cy + Math.sin(angle) * dist);
        points.push({ x: px, y: py });
    }

    // Fill the blob using flood fill from center
    for (let y = Math.max(1, cy - size - 2); y < Math.min(height - 1, cy + size + 2); y++) {
        for (let x = Math.max(1, cx - size - 2); x < Math.min(width - 1, cx + size + 2); x++) {
            if (isPointInBlob(x, y, cx, cy, points)) {
                grid[y][x] = TILE.FLOOR;
            }
        }
    }
}

// Check if point is inside blob polygon
function isPointInBlob(x, y, cx, cy, points) {
    const dx = x - cx;
    const dy = y - cy;
    const angle = Math.atan2(dy, dx);
    const normalizedAngle = angle < 0 ? angle + Math.PI * 2 : angle;
    const segmentIndex = Math.floor((normalizedAngle / (Math.PI * 2)) * points.length);
    const nextIndex = (segmentIndex + 1) % points.length;

    const p1 = points[segmentIndex];
    const p2 = points[nextIndex];

    // Interpolate max distance at this angle
    const t = (normalizedAngle - (segmentIndex / points.length) * Math.PI * 2) / ((1 / points.length) * Math.PI * 2);
    const maxDistX = p1.x + (p2.x - p1.x) * t - cx;
    const maxDistY = p1.y + (p2.y - p1.y) * t - cy;
    const maxDist = Math.sqrt(maxDistX * maxDistX + maxDistY * maxDistY);
    const dist = Math.sqrt(dx * dx + dy * dy);

    return dist <= maxDist;
}

// Method 3: Winding tunnel system
function generateWindingTunnels(grid, width, height) {
    // Start with a few seed points
    const numSeeds = 3 + Math.floor(Math.random() * 3);
    const seeds = [];

    for (let i = 0; i < numSeeds; i++) {
        seeds.push({
            x: 2 + Math.floor(Math.random() * (width - 4)),
            y: 2 + Math.floor(Math.random() * (height - 4))
        });
    }

    // Carve winding paths between seeds
    for (let i = 0; i < seeds.length; i++) {
        for (let j = i + 1; j < seeds.length; j++) {
            carveWindingPath(grid, seeds[i], seeds[j], width, height);
        }
    }

    // Add small rooms at seeds
    seeds.forEach(seed => {
        const roomSize = 2 + Math.floor(Math.random() * 2);
        for (let dy = -roomSize; dy <= roomSize; dy++) {
            for (let dx = -roomSize; dx <= roomSize; dx++) {
                const nx = seed.x + dx;
                const ny = seed.y + dy;
                if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1) {
                    // Circular room
                    if (dx * dx + dy * dy <= roomSize * roomSize) {
                        grid[ny][nx] = TILE.FLOOR;
                    }
                }
            }
        }
    });

    return grid;
}

// Carve a winding path between two points
function carveWindingPath(grid, start, end, width, height) {
    let x = start.x;
    let y = start.y;
    const tunnelWidth = 1 + Math.floor(Math.random() * 2); // 1-2 tile wide tunnels

    while (x !== end.x || y !== end.y) {
        // Carve current position with tunnel width
        for (let dy = -tunnelWidth + 1; dy < tunnelWidth; dy++) {
            for (let dx = -tunnelWidth + 1; dx < tunnelWidth; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1) {
                    grid[ny][nx] = TILE.FLOOR;
                }
            }
        }

        // Move towards target with some randomness
        const moveX = Math.random() < 0.7 || y === end.y;
        const moveY = Math.random() < 0.7 || x === end.x;

        if (moveX && x !== end.x) {
            x += x < end.x ? 1 : -1;
            // Random wiggle
            if (Math.random() < 0.3 && y > 1 && y < height - 2) {
                y += Math.random() < 0.5 ? 1 : -1;
            }
        }
        if (moveY && y !== end.y) {
            y += y < end.y ? 1 : -1;
            // Random wiggle
            if (Math.random() < 0.3 && x > 1 && x < width - 2) {
                x += Math.random() < 0.5 ? 1 : -1;
            }
        }

        // Safety bound
        x = Math.max(1, Math.min(width - 2, x));
        y = Math.max(1, Math.min(height - 2, y));
    }
}

// Find centers of floor regions
function findFloorCenters(grid, width, height) {
    const centers = [];
    const visited = Array(height).fill(null).map(() => Array(width).fill(false));

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            if (grid[y][x] === TILE.FLOOR && !visited[y][x]) {
                // Flood fill to find region
                const region = [];
                const queue = [{ x, y }];
                while (queue.length > 0) {
                    const p = queue.shift();
                    if (p.x < 1 || p.x >= width - 1 || p.y < 1 || p.y >= height - 1) continue;
                    if (visited[p.y][p.x] || grid[p.y][p.x] !== TILE.FLOOR) continue;
                    visited[p.y][p.x] = true;
                    region.push(p);
                    queue.push({ x: p.x + 1, y: p.y });
                    queue.push({ x: p.x - 1, y: p.y });
                    queue.push({ x: p.x, y: p.y + 1 });
                    queue.push({ x: p.x, y: p.y - 1 });
                }
                if (region.length > 0) {
                    // Find center of region
                    const cx = Math.floor(region.reduce((s, p) => s + p.x, 0) / region.length);
                    const cy = Math.floor(region.reduce((s, p) => s + p.y, 0) / region.length);
                    centers.push({ x: cx, y: cy });
                }
            }
        }
    }
    return centers;
}

// Count wall neighbors for cellular automata
function countWallNeighbors(grid, x, y) {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (ny < 0 || ny >= grid.length || nx < 0 || nx >= grid[0].length || grid[ny][nx] === TILE.WALL) {
                count++;
            }
        }
    }
    return count;
}

// Ensure all floor tiles are connected
function ensureConnectivity(grid, width, height) {
    const regions = [];
    const visited = Array(height).fill(null).map(() => Array(width).fill(false));

    // Find all disconnected regions
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            if (grid[y][x] === TILE.FLOOR && !visited[y][x]) {
                const region = [];
                const queue = [{ x, y }];
                while (queue.length > 0) {
                    const p = queue.shift();
                    if (p.x < 1 || p.x >= width - 1 || p.y < 1 || p.y >= height - 1) continue;
                    if (visited[p.y][p.x] || grid[p.y][p.x] !== TILE.FLOOR) continue;
                    visited[p.y][p.x] = true;
                    region.push(p);
                    queue.push({ x: p.x + 1, y: p.y });
                    queue.push({ x: p.x - 1, y: p.y });
                    queue.push({ x: p.x, y: p.y + 1 });
                    queue.push({ x: p.x, y: p.y - 1 });
                }
                if (region.length > 0) regions.push(region);
            }
        }
    }

    // Connect all regions to the largest one
    if (regions.length > 1) {
        regions.sort((a, b) => b.length - a.length);
        const mainRegion = regions[0];

        for (let i = 1; i < regions.length; i++) {
            // Find closest points between regions
            let minDist = Infinity;
            let closest = null;
            for (const p1 of mainRegion) {
                for (const p2 of regions[i]) {
                    const dist = Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
                    if (dist < minDist) {
                        minDist = dist;
                        closest = { from: p1, to: p2 };
                    }
                }
            }
            if (closest) {
                carveWindingPath(grid, closest.from, closest.to, width, height);
            }
        }
    }

    // If no floor tiles at all, create a small starting area
    if (regions.length === 0) {
        const cx = Math.floor(width / 2);
        const cy = Math.floor(height / 2);
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                if (cx + dx > 0 && cx + dx < width - 1 && cy + dy > 0 && cy + dy < height - 1) {
                    grid[cy + dy][cx + dx] = TILE.FLOOR;
                }
            }
        }
    }
}

// Clean up isolated single walls and tiny gaps
function cleanupDungeon(grid, width, height) {
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            // Remove isolated single walls (walls surrounded by floors)
            if (grid[y][x] === TILE.WALL) {
                const floorCount = 8 - countWallNeighbors(grid, x, y);
                if (floorCount >= 7) {
                    grid[y][x] = TILE.FLOOR;
                }
            }
            // Fill tiny single-tile gaps
            if (grid[y][x] === TILE.FLOOR) {
                const wallCount = countWallNeighbors(grid, x, y);
                if (wallCount >= 7) {
                    grid[y][x] = TILE.WALL;
                }
            }
        }
    }
}

/**
 * Connects two rooms by carving a corridor between their centers
 * @param {Array<Array<number>>} grid - The dungeon grid
 * @param {{cx: number, cy: number}} r1 - First room with center coordinates
 * @param {{cx: number, cy: number}} r2 - Second room with center coordinates
 */
function connectRooms(grid, r1, r2) {
    let x = r1.cx, y = r1.cy;
    while (x !== r2.cx) {
        if (isInBounds(x, y, 1)) {
            grid[y][x] = TILE.FLOOR;
            if (y + 1 < GRID_HEIGHT - 1) grid[y + 1][x] = TILE.FLOOR;
        }
        x += (r2.cx > x) ? 1 : -1;
    }
    while (y !== r2.cy) {
        if (isInBounds(x, y, 1)) {
            grid[y][x] = TILE.FLOOR;
            if (x + 1 < GRID_WIDTH - 1) grid[y][x + 1] = TILE.FLOOR;
        }
        y += (r2.cy > y) ? 1 : -1;
    }
}

/**
 * Checks if coordinates are within grid bounds with optional margin
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} [margin=0] - Margin from edges
 * @returns {boolean} True if position is within bounds
 */
function isInBounds(x, y, margin = 0) {
    return x >= margin && x < GRID_WIDTH - margin &&
           y >= margin && y < GRID_HEIGHT - margin;
}

/**
 * Checks if a grid position is occupied by any entity
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {boolean} True if position is occupied
 */
function isPositionOccupied(x, y) {
    const { player, monsters, chests, npcs, traps, roomEvents, exitPosition } = gameState;

    // Check player
    if (player?.x === x && player?.y === y) return true;

    // Check entities using helper
    const hasEntityAt = (arr, checkFn = () => true) =>
        arr?.some(e => e.x === x && e.y === y && checkFn(e)) ?? false;

    if (hasEntityAt(monsters)) return true;
    if (hasEntityAt(chests, c => !c.opened)) return true;
    if (hasEntityAt(npcs)) return true;
    if (hasEntityAt(traps, t => !t.triggered)) return true;
    if (hasEntityAt(roomEvents, e => !e.used)) return true;
    if (exitPosition?.x === x && exitPosition?.y === y) return true;

    return false;
}

/**
 * Finds a random valid (floor, unoccupied) position on the grid
 * @returns {{x: number, y: number}|null} Valid position or null if none found
 */
function findValidPosition() {
    const valid = [];
    for (let y = 1; y < GRID_HEIGHT - 1; y++) {
        for (let x = 1; x < GRID_WIDTH - 1; x++) {
            if (gameState.grid[y][x] === TILE.FLOOR && !isPositionOccupied(x, y)) {
                valid.push({ x, y });
            }
        }
    }
    return valid.length ? randomElement(valid) : null;
}

/**
 * Finds a valid position at least minDist tiles away from a point
 * @param {number} fromX - Origin X coordinate
 * @param {number} fromY - Origin Y coordinate
 * @param {number} minDist - Minimum Manhattan distance from origin
 * @returns {{x: number, y: number}|null} Valid distant position
 */
function findDistantPosition(fromX, fromY, minDist) {
    const valid = [];
    for (let y = 1; y < GRID_HEIGHT - 1; y++) {
        for (let x = 1; x < GRID_WIDTH - 1; x++) {
            if (gameState.grid[y][x] === TILE.FLOOR && !isPositionOccupied(x, y)) {
                const d = heuristic(x, y, fromX, fromY);
                if (d >= minDist) valid.push({ x, y, d });
            }
        }
    }
    if (!valid.length) return findValidPosition();
    valid.sort((a, b) => b.d - a.d);
    // Pick randomly from the 10 most distant positions
    return randomElement(valid.slice(0, 10));
}

// ==========================================
// PATHFINDING
// ==========================================

/**
 * A* pathfinding algorithm to find shortest path between two points
 * @param {number} sx - Start X coordinate
 * @param {number} sy - Start Y coordinate
 * @param {number} ex - End X coordinate
 * @param {number} ey - End Y coordinate
 * @returns {Array<{x: number, y: number}>} Array of path coordinates (empty if no path)
 */
function findPath(sx, sy, ex, ey) {
    const open = [{ x: sx, y: sy, g: 0, f: heuristic(sx, sy, ex, ey) }];
    const closed = new Set();
    const cameFrom = new Map();
    const gScore = new Map();
    gScore.set(`${sx},${sy}`, 0);

    while (open.length) {
        open.sort((a, b) => a.f - b.f);
        const curr = open.shift();
        const key = `${curr.x},${curr.y}`;

        if (curr.x === ex && curr.y === ey) {
            const path = [];
            let k = `${ex},${ey}`;
            while (cameFrom.has(k)) {
                const [px, py] = k.split(',').map(Number);
                path.unshift({ x: px, y: py });
                k = cameFrom.get(k);
            }
            return path;
        }

        closed.add(key);
        const neighbors = [{ x: curr.x + 1, y: curr.y }, { x: curr.x - 1, y: curr.y }, { x: curr.x, y: curr.y + 1 }, { x: curr.x, y: curr.y - 1 }];

        for (const n of neighbors) {
            const nk = `${n.x},${n.y}`;
            if (n.x < 0 || n.x >= GRID_WIDTH || n.y < 0 || n.y >= GRID_HEIGHT) continue;
            if (gameState.grid[n.y][n.x] === TILE.WALL) continue;
            if (closed.has(nk)) continue;

            const tg = gScore.get(key) + 1;
            if (!gScore.has(nk) || tg < gScore.get(nk)) {
                cameFrom.set(nk, key);
                gScore.set(nk, tg);
                const f = tg + heuristic(n.x, n.y, ex, ey);
                if (!open.find(o => o.x === n.x && o.y === n.y)) {
                    open.push({ x: n.x, y: n.y, g: tg, f });
                }
            }
        }
    }
    return [];
}

/**
 * Manhattan distance heuristic for pathfinding
 * @param {number} x1 - First point X
 * @param {number} y1 - First point Y
 * @param {number} x2 - Second point X
 * @param {number} y2 - Second point Y
 * @returns {number} Manhattan distance between points
 */
function heuristic(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

// ==========================================
// MONSTER GENERATION
// ==========================================

/**
 * Initializes a monster with default movement/combat properties
 * @param {Object} monster - Monster object to initialize
 * @param {{x: number, y: number}} pos - Spawn position
 * @returns {Object} Initialized monster
 */
function initializeMonsterState(monster, pos) {
    return {
        ...monster,
        x: pos.x,
        y: pos.y,
        targetX: pos.x,
        targetY: pos.y,
        path: [],
        moveTimer: 0,
        attackTimer: 0,
        statusEffects: [],
        state: 'patrol',
        patrolTarget: null
    };
}

/**
 * Spawns monsters for the current floor based on floor type and map size
 * Handles boss floors (every 10), mini-boss floors (every 5), and regular floors
 */
function spawnMonsters() {
    const floor = gameState.run.floor;
    const isBoss = floor % CONFIG.BOSS_FLOOR_INTERVAL === 0;
    const isMiniBoss = !isBoss && floor % CONFIG.MINI_BOSS_FLOOR_INTERVAL === 0 && floor > 0;

    // Scale monster count with map area
    const mapArea = countFloorTiles(gameState.grid);
    const densityFactor = Math.max(1, mapArea / 50);
    const baseCount = Math.min(2 + Math.floor(floor / 10), 5);
    const count = isBoss ? 1 : (isMiniBoss ? 1 : Math.max(1, Math.floor(baseCount * Math.sqrt(densityFactor))));

    gameState.monsters = [];

    for (let i = 0; i < count; i++) {
        const pos = findDistantPosition(gameState.player.x, gameState.player.y, CONFIG.MONSTER_CHASE_RANGE);
        if (!pos) continue;

        let monster;
        if (isBoss && i === 0) {
            monster = generateMonster(floor, true, false);
        } else if (isMiniBoss && i === 0) {
            monster = generateMiniBoss(floor);
        } else {
            const isElite = !isBoss && rollChance(CONFIG.ELITE_SPAWN_CHANCE);
            monster = generateMonster(floor, false, isElite);
        }

        gameState.monsters.push(initializeMonsterState(monster, pos));
    }

    // Add extra regular monsters with mini-boss (scales with map size)
    if (isMiniBoss) {
        const baseExtra = 2 + Math.floor(floor / 20);
        const extraCount = Math.floor(baseExtra * Math.sqrt(densityFactor));
        for (let i = 0; i < extraCount; i++) {
            const pos = findDistantPosition(gameState.player.x, gameState.player.y, 8);
            if (!pos) continue;
            const monster = generateMonster(floor, false, false);
            gameState.monsters.push(initializeMonsterState(monster, pos));
        }
    }

    updateMonstersUI();
}

/**
 * Generates a mini-boss monster with special abilities
 * @param {number} floor - Current floor number for stat scaling
 * @returns {Object} Mini-boss monster object
 */
function generateMiniBoss(floor) {
    const type = randomElement(MINI_BOSS_TYPES);
    const baseHp = 40 + floor * 8;
    const baseAtk = 5 + floor * 2;
    const baseDef = 2 + Math.floor(floor * 0.8);
    const baseSpd = 0.8 + floor * 0.02;

    return {
        name: type.name,
        maxHp: Math.floor(baseHp * type.hpMult),
        currentHp: Math.floor(baseHp * type.hpMult),
        attack: Math.floor(baseAtk * type.atkMult),
        defense: Math.floor(baseDef * 1.2),
        speed: baseSpd * 1.1,
        isBoss: false,
        isElite: false,
        isMiniBoss: true,
        miniBossType: type.ability,
        xpReward: Math.floor(30 + floor * 5),
        color: type.color,
        abilityTimer: 0,
        shield: 0 // for Guardian type
    };
}

function generateMonster(floor, isBoss, isElite) {
    const baseHp = 40 + floor * 8;
    const baseAtk = 5 + floor * 2;
    const baseDef = 2 + Math.floor(floor * 0.8);
    const baseSpd = 0.8 + floor * 0.02;

    if (isBoss) {
        const idx = Math.min(Math.floor(floor / 10) - 1, BOSS_TYPES.length - 1);
        const bossType = BOSS_TYPES[idx];
        const baseMonster = MONSTER_TYPES.find(m => m.name === bossType.baseType) || MONSTER_TYPES[0];
        return {
            name: bossType.name,
            maxHp: Math.floor(baseHp * 3),
            currentHp: Math.floor(baseHp * 3),
            attack: Math.floor(baseAtk * 1.8),
            defense: Math.floor(baseDef * 1.5),
            speed: baseSpd * 0.8,
            isBoss: true,
            isElite: false,
            xpReward: Math.floor(50 + floor * 8),
            color: '#8a2a2a',
            icon: bossType.icon,
            baseIcon: baseMonster.icon,
            shape: baseMonster.shape || 'humanoid',
            abilities: getBossAbilities(floor)
        };
    }

    const type = MONSTER_TYPES[Math.floor(Math.random() * MONSTER_TYPES.length)];
    const mult = isElite ? 1.5 : 1;

    return {
        name: (isElite ? 'Elite ' : '') + type.name,
        maxHp: Math.floor(baseHp * type.hpMult * mult),
        currentHp: Math.floor(baseHp * type.hpMult * mult),
        attack: Math.floor(baseAtk * type.atkMult * mult),
        defense: Math.floor(baseDef * type.defMult * mult),
        speed: baseSpd,
        isBoss: false,
        isElite,
        xpReward: Math.floor((10 + floor * 2) * mult),
        color: isElite ? '#9b59b6' : type.color,
        icon: type.icon,
        shape: type.shape || 'humanoid',
        canPoison: type.canPoison
    };
}

function getBossAbilities(floor) {
    const abilities = [];
    if (floor >= 10) abilities.push({ type: 'aoe', damage: 0.3, cooldown: 8, timer: 0 });
    if (floor >= 20) abilities.push({ type: 'summon', count: 2, cooldown: 15, timer: 0 });
    if (floor >= 30) abilities.push({ type: 'heal', amount: 0.1, cooldown: 12, timer: 0 });
    return abilities;
}

// ==========================================
// STAT CALCULATIONS
// ==========================================

function calculatePlayerStats() {
    const r = gameState.run || { level: 1, equipment: null };
    const u = gameState.upgrades;
    const items = gameState.specialItems;
    const classData = CLASSES[gameState.selectedClass] || { hpMult: 1, atkMult: 1, defMult: 1, spdMult: 1, evaMult: 1, critMult: 1 };
    const pm = gameState.prestigeMultiplier;
    const ascension = getAscensionTier();
    const ascMult = ascension.bonus?.statMult || 1;

    let s = {
        maxHp: (BASE_STATS.maxHp + u.maxHp * UPGRADE_CONFIG.maxHp.value) * classData.hpMult * pm * ascMult,
        attack: (BASE_STATS.attack + u.attack * UPGRADE_CONFIG.attack.value) * classData.atkMult * pm * ascMult,
        defense: (BASE_STATS.defense + u.defense * UPGRADE_CONFIG.defense.value) * classData.defMult * pm * ascMult,
        speed: (BASE_STATS.speed + u.speed * UPGRADE_CONFIG.speed.value) * classData.spdMult,
        evasion: (BASE_STATS.evasion + u.evasion * UPGRADE_CONFIG.evasion.value) * classData.evaMult,
        critChance: (BASE_STATS.critChance + u.critChance * UPGRADE_CONFIG.critChance.value) * classData.critMult,
        critDamage: BASE_STATS.critDamage
    };

    // Relic bonuses
    const relicBonuses = getRelicBonuses();
    if (relicBonuses.allStats > 0) {
        s.maxHp *= (1 + relicBonuses.allStats);
        s.attack *= (1 + relicBonuses.allStats);
        s.defense *= (1 + relicBonuses.allStats);
    }
    if (relicBonuses.critMultiplier) s.critDamage += relicBonuses.critMultiplier * 100;

    // Synergy bonuses
    const synergyBonuses = getSynergyBonuses();
    if (synergyBonuses.attack > 0) s.attack *= (1 + synergyBonuses.attack);
    if (synergyBonuses.defense > 0) s.defense *= (1 + synergyBonuses.defense);
    if (synergyBonuses.critChance > 0) s.critChance += synergyBonuses.critChance;
    if (synergyBonuses.critDamage > 0) s.critDamage += synergyBonuses.critDamage;
    if (synergyBonuses.allStats > 0) {
        s.maxHp *= (1 + synergyBonuses.allStats);
        s.attack *= (1 + synergyBonuses.allStats);
        s.defense *= (1 + synergyBonuses.allStats);
    }

    // Level bonuses
    const lvl = (r.level || 1) - 1;
    s.maxHp += lvl * 10;
    s.attack += lvl * 2;
    s.defense += lvl * 1;

    // Special items
    if (items.lifeCrystal) s.maxHp *= 1.1;
    if (items.warriorsBlade) s.attack *= 1.15;
    if (items.guardianShield) s.defense *= 1.15;
    if (items.swiftBoots) s.speed *= 1.2;
    if (items.shadowCloak) s.evasion *= 1.1;

    // Equipment
    if (r && r.equipment) {
        Object.values(r.equipment).forEach(eq => {
            if (eq) {
                if (eq.hp) s.maxHp += eq.hp;
                if (eq.atk) s.attack += eq.atk;
                if (eq.def) s.defense += eq.def;
                if (eq.spd) s.speed += eq.spd;
                if (eq.eva) s.evasion += eq.eva;
                if (eq.crit) s.critChance += eq.crit;
                if (eq.critDmg) s.critDamage += eq.critDmg;
            }
        });
    }

    // Pet bonuses
    if (gameState.activePet) {
        const pet = PET_TYPES.find(p => p.id === gameState.activePet);
        if (pet) {
            if (pet.atkBonus) s.attack *= (1 + pet.atkBonus);
            if (pet.defBonus) s.defense *= (1 + pet.defBonus);
            if (pet.critBonus) s.critChance += pet.critBonus;
            if (pet.allBonus) {
                s.maxHp *= (1 + pet.allBonus);
                s.attack *= (1 + pet.allBonus);
                s.defense *= (1 + pet.allBonus);
                s.speed *= (1 + pet.allBonus);
            }
        }
    }

    // Run buffs from shrines/altars
    if (gameState.runBuffs) {
        gameState.runBuffs.forEach(buff => {
            if (buff.stat === 'attack') s.attack *= (1 + buff.value);
            else if (buff.stat === 'defense') s.defense *= (1 + buff.value);
            else if (buff.stat === 'speed') s.speed *= (1 + buff.value);
            else if (buff.stat === 'critChance') s.critChance += buff.value;
            else if (buff.stat === 'critDamage') s.critDamage += buff.value;
            else if (buff.stat === 'maxHp') s.maxHp += buff.value;
        });
    }

    s.maxHp = Math.floor(s.maxHp);
    s.attack = Math.floor(s.attack);
    s.defense = Math.floor(s.defense);
    s.speed = Math.round(s.speed * 100) / 100;
    s.evasion = Math.min(75, Math.floor(s.evasion));
    s.critChance = Math.min(100, Math.floor(s.critChance));
    s.critDamage = Math.floor(s.critDamage);

    return s;
}

function getXpNeeded(level) {
    return Math.floor(50 * Math.pow(1.5, level - 1));
}

function getUpgradeCost(type) {
    const c = UPGRADE_CONFIG[type];
    return Math.floor(c.baseCost * Math.pow(c.mult, gameState.upgrades[type]));
}

// ==========================================
// COMBAT SYSTEM
// ==========================================

function calculateDamage(attacker, defender, isCrit) {
    let dmg = attacker.attack * (100 / (100 + defender.defense));
    if (isCrit) dmg *= (attacker.critDamage || 150) / 100;
    return Math.max(1, Math.floor(dmg));
}

function checkEvasion(defender) {
    return Math.random() * 100 < (defender.evasion || 0);
}

function playerAttack(monster) {
    if (!monster || monster.currentHp <= 0) return;

    // Check stun
    const stunned = gameState.run.statusEffects.find(e => e.type === 'stun');
    if (stunned) return;

    if (checkEvasion(monster)) {
        showDamageNumber(monster.x, monster.y, 'DODGE', 'dodge', false);
        addLog(`${monster.name} dodged your attack!`, 'dodge');
        return;
    }

    const isCrit = Math.random() * 100 < gameState.run.critChance;
    let dmg = calculateDamage(gameState.run, monster, isCrit);

    // Handle Guardian shield
    if (monster.shield && monster.shield > 0) {
        const shieldDmg = Math.min(monster.shield, dmg);
        monster.shield -= shieldDmg;
        dmg -= shieldDmg;
        if (shieldDmg > 0) {
            showDamageNumber(monster.x, monster.y, shieldDmg, 'status', false);
            if (monster.shield <= 0) {
                addLog(`${monster.name}'s shield broke!`, 'player-action');
            }
        }
    }

    if (dmg > 0) {
        monster.currentHp -= dmg;
        gameState.stats.totalDamage += dmg;
        gameState.stats.totalDamageDealt = (gameState.stats.totalDamageDealt || 0) + dmg;
        if (isCrit) gameState.stats.criticalHits = (gameState.stats.criticalHits || 0) + 1;
        if (dmg > gameState.stats.highestDamage) gameState.stats.highestDamage = dmg;
        showDamageNumber(monster.x, monster.y, dmg, 'monster-damage', isCrit);
        addLog(isCrit ? `CRIT! You hit ${monster.name} for ${dmg}!` : `You hit ${monster.name} for ${dmg}.`, isCrit ? 'crit' : 'player-action');

        // Log damage for DPS meter
        logDamage(dmg, 'player');

        // Lifesteal from relics
        const relicBonuses = getRelicBonuses();
        if (relicBonuses.lifesteal > 0) {
            const healAmt = Math.floor(dmg * relicBonuses.lifesteal);
            if (healAmt > 0) {
                gameState.run.currentHp = Math.min(gameState.run.maxHp, gameState.run.currentHp + healAmt);
                gameState.stats.totalHealing += healAmt;
            }
        }
    }

    // Visual effects
    const mx = monster.x * TILE_SIZE + TILE_SIZE / 2;
    const my = monster.y * TILE_SIZE + TILE_SIZE / 2;
    addVisualEffect('attack', mx, my, 0.3, { radius: TILE_SIZE * 0.6, color: isCrit ? '#ff4444' : '#ffd700' });
    addVisualEffect('hit', mx, my, 0.4, { radius: TILE_SIZE, color: '#ffd700', angle: Math.random() * Math.PI * 2 });

    // Hit flash effect
    addHitFlash(monster.x * TILE_SIZE, monster.y * TILE_SIZE, isCrit ? '#ff4444' : '#ffffff', TILE_SIZE);

    // Sound effects and particles
    playSound(isCrit ? 'crit' : 'hit');
    spawnParticles(mx, my, isCrit ? 'fire' : 'blood', isCrit ? 12 : 6);

    // Extra particles for crits
    if (isCrit) {
        spawnParticles(mx, my, 'sparkle', 8);
    }

    // Poison chance for certain attacks
    if (gameState.selectedClass === 'rogue' && Math.random() < 0.15) {
        applyStatus(monster, 'poison');
    }

    if (monster.currentHp <= 0) {
        monsterDefeated(monster);
    }
}

// Attack with damage multiplier (for multi-target and ranged attacks)
function playerAttackWithMult(monster, damageMult = 1.0, classData = null, isSecondaryTarget = false) {
    if (!monster || monster.currentHp <= 0) return;

    // Check stun
    const stunned = gameState.run.statusEffects.find(e => e.type === 'stun');
    if (stunned) return;

    if (!classData) classData = CLASSES[gameState.selectedClass] || CLASSES.warrior;

    // Ranged attacks have lower evasion chance (harder to dodge)
    const evasionMod = classData.attackType === 'magic' ? 0.5 : (classData.attackType === 'ranged' ? 0.7 : 1.0);
    if (Math.random() < (monster.evasion || 0) / 100 * evasionMod) {
        showDamageNumber(monster.x, monster.y, 'DODGE', 'dodge', false);
        addLog(`${monster.name} dodged your attack!`, 'dodge');
        return;
    }

    const isCrit = Math.random() * 100 < gameState.run.critChance;
    let dmg = Math.floor(calculateDamage(gameState.run, monster, isCrit) * damageMult);

    // Handle Guardian shield
    if (monster.shield && monster.shield > 0) {
        const shieldDmg = Math.min(monster.shield, dmg);
        monster.shield -= shieldDmg;
        dmg -= shieldDmg;
        if (shieldDmg > 0) {
            showDamageNumber(monster.x, monster.y, shieldDmg, 'status', false);
            if (monster.shield <= 0) {
                addLog(`${monster.name}'s shield broke!`, 'player-action');
            }
        }
    }

    // Player position
    const px = gameState.player.x * TILE_SIZE + TILE_SIZE / 2;
    const py = gameState.player.y * TILE_SIZE + TILE_SIZE / 2;

    // Monster position
    const mx = monster.x * TILE_SIZE + TILE_SIZE / 2;
    const my = monster.y * TILE_SIZE + TILE_SIZE / 2;

    // Create projectile effect for ranged/magic attacks
    if (classData.attackType === 'magic' || classData.attackType === 'ranged') {
        createProjectileEffect(px, py, mx, my, classData);
    }

    if (dmg > 0) {
        monster.currentHp -= dmg;
        gameState.stats.totalDamage += dmg;
        gameState.stats.totalDamageDealt = (gameState.stats.totalDamageDealt || 0) + dmg;
        if (isCrit) gameState.stats.criticalHits = (gameState.stats.criticalHits || 0) + 1;
        if (dmg > gameState.stats.highestDamage) gameState.stats.highestDamage = dmg;

        // Log damage for DPS meter
        logDamage(dmg, 'player');

        showDamageNumber(monster.x, monster.y, dmg, 'monster-damage', isCrit);

        if (!isSecondaryTarget) {
            addLog(isCrit ? `CRIT! ${classData.attackType === 'magic' ? 'Magic blast' : 'You hit'} ${monster.name} for ${dmg}!` : `${classData.attackType === 'magic' ? 'Magic blast hits' : 'You hit'} ${monster.name} for ${dmg}.`, isCrit ? 'crit' : 'player-action');
        }

        // Lifesteal from relics
        const relicBonuses = getRelicBonuses();
        if (relicBonuses.lifesteal > 0) {
            const healAmt = Math.floor(dmg * relicBonuses.lifesteal);
            if (healAmt > 0) {
                gameState.run.currentHp = Math.min(gameState.run.maxHp, gameState.run.currentHp + healAmt);
                gameState.stats.totalHealing += healAmt;
            }
        }
    }

    // Visual effects based on attack type
    if (classData.attackType === 'magic') {
        addVisualEffect('attack', mx, my, 0.3, { radius: TILE_SIZE * 0.6, color: classData.projectileColor || '#9b59b6' });
        spawnParticles(mx, my, 'magic', isCrit ? 15 : 8);
        if (isCrit) {
            spawnParticles(mx, my, 'lightning', 10);
            addScreenFlash(classData.projectileColor || '#9b59b6', 0.15, 0.1);
        }
    } else if (classData.attackType === 'ranged') {
        addVisualEffect('attack', mx, my, 0.3, { radius: TILE_SIZE * 0.5, color: classData.projectileColor || '#27ae60' });
        spawnParticles(mx, my, isCrit ? 'blood' : 'trail', isCrit ? 12 : 6);
        if (isCrit) spawnParticles(mx, my, 'sparkle', 6);
    } else {
        // Melee effects (fallback)
        addVisualEffect('attack', mx, my, 0.3, { radius: TILE_SIZE * 0.6, color: isCrit ? '#ff4444' : '#ffd700' });
        spawnParticles(mx, my, isCrit ? 'fire' : 'blood', isCrit ? 12 : 6);
    }

    addHitFlash(monster.x * TILE_SIZE, monster.y * TILE_SIZE, isCrit ? '#ff4444' : (classData.projectileColor || '#ffffff'), TILE_SIZE);
    addVisualEffect('hit', mx, my, 0.4, { radius: TILE_SIZE, color: classData.projectileColor || '#ffd700', angle: Math.random() * Math.PI * 2 });

    // Sound effects
    playSound(isCrit ? 'crit' : 'hit');

    // Poison chance for rogues
    if (gameState.selectedClass === 'rogue' && Math.random() < 0.2) {
        applyStatus(monster, 'poison');
        spawnParticles(mx, my, 'poison', 5);
    }

    if (monster.currentHp <= 0) {
        monsterDefeated(monster);
    }
}

// Create projectile visual effect
function createProjectileEffect(fromX, fromY, toX, toY, classData) {
    const projectileCount = classData.attackType === 'magic' ? 1 : 3; // Magic: 1 orb, Ranged: 3 knives

    for (let i = 0; i < projectileCount; i++) {
        const spreadAngle = (i - (projectileCount - 1) / 2) * 0.15; // Spread for multiple projectiles
        const dx = toX - fromX;
        const dy = toY - fromY;
        const angle = Math.atan2(dy, dx) + spreadAngle;

        // Add visual effect for projectile
        gameState.visualEffects.push({
            type: 'projectile',
            x: fromX,
            y: fromY,
            targetX: toX + Math.sin(spreadAngle) * 20,
            targetY: toY + Math.cos(spreadAngle) * 20,
            duration: 0.2,
            maxDuration: 0.2,
            color: classData.projectileColor || '#ffffff',
            particleType: classData.projectileParticle || 'magic',
            attackType: classData.attackType,
            angle: angle
        });
    }

    // Trail particles along the path
    const steps = 5;
    for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const trailX = fromX + (toX - fromX) * t;
        const trailY = fromY + (toY - fromY) * t;
        setTimeout(() => {
            spawnParticles(trailX, trailY, classData.projectileParticle || 'magic', 2);
        }, i * 30);
    }
}

function monsterAttack(monster) {
    if (!monster || monster.currentHp <= 0 || !gameState.gameRunning) return;

    // Check freeze/stun
    const frozen = monster.statusEffects?.find(e => e.type === 'freeze');
    const stunned = monster.statusEffects?.find(e => e.type === 'stun');
    if (stunned) return;

    const speedMod = frozen ? 0.5 : 1;
    if (Math.random() > speedMod) return; // Slowed

    if (checkEvasion(gameState.run)) {
        showDamageNumber(gameState.player.x, gameState.player.y, 'DODGE', 'dodge', false);
        addLog(`You dodged ${monster.name}'s attack!`, 'dodge');
        return;
    }

    const dmg = calculateDamage(monster, gameState.run, false);
    gameState.run.currentHp -= dmg;

    // Visual effects - screen shake and hit effect
    gameState.screenShake = Math.min(8, gameState.screenShake + 4);
    const px = gameState.player.x * TILE_SIZE + TILE_SIZE / 2;
    const py = gameState.player.y * TILE_SIZE + TILE_SIZE / 2;
    addVisualEffect('hit', px, py, 0.3, { radius: TILE_SIZE * 0.8, color: '#ff4444', angle: Math.random() * Math.PI * 2 });

    // Red flash when taking damage (intensity based on damage percentage)
    const dmgPercent = dmg / gameState.run.maxHp;
    addScreenFlash('#ff0000', Math.min(0.4, 0.1 + dmgPercent * 0.5), 0.15);
    spawnParticles(px, py, 'blood', 6);

    showDamageNumber(gameState.player.x, gameState.player.y, dmg, 'player-damage', false);
    addLog(`${monster.name} hits you for ${dmg}!`, 'monster-action');

    // Vampire lifesteal
    if (monster.hasLifesteal) {
        const healAmt = Math.floor(dmg * 0.5);
        monster.currentHp = Math.min(monster.maxHp, monster.currentHp + healAmt);
        showDamageNumber(monster.x, monster.y, healAmt, 'heal', false);
    }

    // Monster poison
    if (monster.canPoison && Math.random() < 0.2) {
        applyStatus(gameState.run, 'poison');
    }

    updatePlayerHealthBar();

    if (gameState.run.currentHp <= 0) {
        playerDefeated();
    }
}

function applyStatus(target, type) {
    const effect = { ...STATUS_EFFECTS[type], type, timer: STATUS_EFFECTS[type].duration };
    if (!target.statusEffects) target.statusEffects = [];

    const existing = target.statusEffects.find(e => e.type === type);
    if (existing) {
        existing.timer = effect.duration;
    } else {
        target.statusEffects.push(effect);
        addLog(`${target.name || 'You'} is ${type}ed!`, 'status');
    }
}

function processStatusEffects(target, dt) {
    if (!target.statusEffects) return;

    target.statusEffects = target.statusEffects.filter(effect => {
        effect.timer -= dt;
        if (effect.tickDamage) {
            const dmg = Math.floor(target.maxHp * effect.tickDamage * dt);
            if (dmg > 0) {
                target.currentHp -= dmg;
                if (target === gameState.run) {
                    showDamageNumber(gameState.player.x, gameState.player.y, dmg, 'status', false);
                } else {
                    showDamageNumber(target.x, target.y, dmg, 'status', false);
                    // Log DOT damage for DPS meter (only for monsters, not player)
                    logDamage(dmg, 'player');
                }
            }
        }
        return effect.timer > 0;
    });
}

function monsterDefeated(monster) {
    // XP bonus from relics
    const relicBonuses = getRelicBonuses();
    const xpGained = Math.floor(monster.xpReward * (1 + relicBonuses.xpBonus));

    gameState.run.xp += xpGained;
    gameState.run.killsThisRun++;
    gameState.floorKills++;
    gameState.stats.monstersKilled++;
    if (monster.isBoss) gameState.stats.bossesKilled++;
    if (monster.isElite) gameState.stats.elitesKilled++;
    if (monster.isMiniBoss) gameState.stats.miniBossesKilled++;

    // Add combo kill
    addComboKill();

    // Drop crafting materials
    dropCraftingMaterial();

    // Give pet experience
    if (gameState.activePet) {
        const petXP = monster.isBoss ? 50 : (monster.isElite || monster.isMiniBoss ? 20 : 5);
        addPetExperience(gameState.activePet, petXP);
    }

    addLog(`${monster.name} defeated! +${xpGained} XP`, 'floor-clear');
    checkLevelUp();

    // Enhanced death effects
    const mx = monster.x * TILE_SIZE + TILE_SIZE / 2;
    const my = monster.y * TILE_SIZE + TILE_SIZE / 2;

    // Death explosion effect based on monster type
    if (monster.isBoss) {
        // Epic boss death
        spawnParticles(mx, my, 'explosion', 30);
        spawnParticles(mx, my, 'soul', 20);
        spawnParticles(mx, my, 'sparkle', 15);
        gameState.screenShake = 15;
        addScreenFlash('#ff4400', 0.4);
    } else if (monster.isMiniBoss || monster.isElite) {
        spawnParticles(mx, my, 'explosion', 15);
        spawnParticles(mx, my, 'soul', 12);
        gameState.screenShake = 8;
        addScreenFlash('#ffaa00', 0.2);
    } else {
        // Normal death
        spawnParticles(mx, my, 'death', 12);
        spawnParticles(mx, my, 'soul', 8);
    }

    // Add smoke for all deaths
    spawnParticles(mx, my, 'smoke', 5);

    // Remove from array
    gameState.monsters = gameState.monsters.filter(m => m !== monster);

    // Drop equipment chance (mini-bosses have good drop rate)
    let dropChance = monster.isBoss ? 0.8 : (monster.isMiniBoss ? 0.6 : (monster.isElite ? 0.4 : 0.15));
    dropChance += relicBonuses.luckBonus;
    dropChance += getSynergyBonuses().dropRate;
    const bonusRarity = monster.isBoss ? 2 : (monster.isMiniBoss ? 1 : (monster.isElite ? 1 : 0));
    if (Math.random() < dropChance) {
        const item = generateEquipment(gameState.run.floor, bonusRarity);
        addToInventory(item);
        addLog(`${monster.name} dropped ${item.name}!`, 'level-up');
        playSound('pickup');
        spawnParticles(mx, my, 'gold', 10);
    }

    // Check milestones and challenges
    checkMilestones();
    checkChallengeConditions();

    updateMonstersUI();
    updateSynergiesUI();

    // Check floor clear
    if (gameState.monsters.length === 0) {
        floorCleared();
    }
}

function floorCleared() {
    // All monsters defeated - spawn exit portal
    if (gameState.exitSpawned) return; // Already spawned

    gameState.exitSpawned = true;

    // Find a valid position for the exit (preferably far from player)
    let bestPos = null;
    let bestDist = 0;

    for (let attempts = 0; attempts < 50; attempts++) {
        const pos = findValidPosition();
        if (pos) {
            const dist = Math.abs(pos.x - gameState.player.x) + Math.abs(pos.y - gameState.player.y);
            if (dist > bestDist) {
                bestDist = dist;
                bestPos = pos;
            }
        }
    }

    if (bestPos) {
        gameState.exitPosition = bestPos;
        gameState.grid[bestPos.y][bestPos.x] = TILE.EXIT;
        addLog('All monsters defeated! An exit portal has appeared!', 'floor-clear');
        playSound('powerup');
        spawnParticles(bestPos.x * TILE_SIZE + TILE_SIZE/2, bestPos.y * TILE_SIZE + TILE_SIZE/2, 'magic', 20);
    }

    updateAllUI();
}

function advanceToNextFloor() {
    const r = gameState.run;

    // Heal on floor completion
    const heal = Math.floor(r.maxHp * 0.1);
    r.currentHp = Math.min(r.maxHp, r.currentHp + heal);
    gameState.stats.totalHealing += heal;
    showDamageNumber(gameState.player.x, gameState.player.y, heal, 'heal', false);
    spawnParticles(gameState.player.x * TILE_SIZE + TILE_SIZE/2, gameState.player.y * TILE_SIZE + TILE_SIZE/2, 'heal', 8);

    r.floor++;
    gameState.floorKills = 0; // Reset floor kills for synergies
    if (r.floor > gameState.bestFloor) gameState.bestFloor = r.floor;

    // Reset floor state
    gameState.exitSpawned = false;
    gameState.exitPosition = null;
    gameState.chestsCollected = 0;
    gameState.totalChestsOnFloor = 0;

    addLog(`Advancing to Floor ${r.floor}...`, 'floor-clear');
    playSound('levelup');

    // Generate new dungeon
    generateDungeon();
    const pos = findValidPosition();
    gameState.player.x = pos.x;
    gameState.player.y = pos.y;

    // Spawn new monsters
    setTimeout(() => {
        if (gameState.gameRunning) spawnMonsters();
    }, 500);

    updateAllUI();
    checkAchievements();
    checkMilestones();
    checkChallengeConditions();
}

function checkLevelUp() {
    const r = gameState.run;
    let needed = getXpNeeded(r.level);

    while (r.xp >= needed) {
        r.xp -= needed;
        r.level++;

        const newStats = calculatePlayerStats();
        const hpDiff = newStats.maxHp - r.maxHp;
        r.currentHp += hpDiff;

        Object.assign(r, newStats);

        // Level up visual effect
        const px = gameState.player.x * TILE_SIZE + TILE_SIZE / 2;
        const py = gameState.player.y * TILE_SIZE + TILE_SIZE / 2;
        addVisualEffect('levelup', px, py, 1.0);
        playSound('levelup');

        // Enhanced level up effects
        spawnParticles(px, py, 'levelup', 25);
        spawnParticles(px, py, 'sparkle', 15);
        addScreenFlash('#ffdd00', 0.4, 0.3);
        gameState.screenShake = 4;

        addLog(`LEVEL UP! You are now level ${r.level}!`, 'level-up');
        needed = getXpNeeded(r.level);
    }
}

function playerDefeated() {
    // Check for Phoenix Feather relic revive
    const relicBonuses = getRelicBonuses();
    if (relicBonuses.revive && !gameState.phoenixRebirthUsed) {
        gameState.phoenixRebirthUsed = true;
        gameState.run.currentHp = Math.floor(gameState.run.maxHp * 0.5);
        addLog('Phoenix Feather activates! Revived with 50% HP!', 'level-up');
        playSound('heal');
        spawnParticles(gameState.player.x * TILE_SIZE + TILE_SIZE/2, gameState.player.y * TILE_SIZE + TILE_SIZE/2, 'fire', 25);
        return; // Don't die
    }

    gameState.gameRunning = false;
    playSound('death');

    // Stop music and ambient sounds
    stopBackgroundMusic();
    stopAmbientSounds();

    const souls = calculateSoulPoints();
    gameState.soulPoints += souls;
    gameState.stats.totalSoulsEarned += souls;
    gameState.stats.soulsEarned = (gameState.stats.soulsEarned || 0) + souls;
    gameState.stats.deaths = (gameState.stats.deaths || 0) + 1;
    gameState.totalRuns++;

    // Fail active challenge
    if (gameState.activeChallenge) {
        addLog(`Challenge failed: ${gameState.activeChallenge.name}`, 'monster-action');
        gameState.activeChallenge = null;
    }

    addLog(`You have fallen on Floor ${gameState.run.floor}...`, 'monster-action');

    DOM.death_floor.textContent = gameState.run.floor;
    DOM.death_level.textContent = gameState.run.level;
    DOM.death_kills.textContent = gameState.run.killsThisRun || 0;
    DOM.death_souls.textContent = souls;
    DOM.death_modal.classList.add('active');

    // Auto-restart after 5 seconds
    startModalTimer('death-modal', 5, () => {
        DOM.death_modal.classList.remove('active');
        startNewRun();
    });

    saveGame();
    checkAchievements();
    checkMilestones();
}

function calculateSoulPoints() {
    const r = gameState.run;
    let souls = Math.floor(r.floor * 1.5 + r.level * 2);
    souls += Math.floor((r.floor - 1) / 10) * 10; // Boss bonus
    souls = Math.floor(souls * gameState.prestigeMultiplier);

    // Ascension bonus
    const ascension = getAscensionTier();
    souls = Math.floor(souls * (ascension.bonus?.soulMult || 1));

    // Relic bonus
    const relicBonuses = getRelicBonuses();
    souls = Math.floor(souls * (1 + relicBonuses.soulBonus));

    // Synergy bonus
    const synergyBonuses = getSynergyBonuses();
    souls = Math.floor(souls * (1 + synergyBonuses.soulBonus));

    return souls;
}

// ==========================================
// SKILLS SYSTEM
// ==========================================

function useSkill(skillName) {
    const skill = SKILLS[skillName];
    if (!skill || !skill.unlocked) return;
    if (gameState.skillCooldowns[skillName] > 0) return;
    if (!gameState.gameRunning) return;

    gameState.skillCooldowns[skillName] = skill.cooldown;

    const px = gameState.player.x * TILE_SIZE + TILE_SIZE / 2;
    const py = gameState.player.y * TILE_SIZE + TILE_SIZE / 2;

    switch (skill.effect) {
        case 'heal':
            const healAmt = Math.floor(gameState.run.maxHp * skill.value);
            gameState.run.currentHp = Math.min(gameState.run.maxHp, gameState.run.currentHp + healAmt);
            showDamageNumber(gameState.player.x, gameState.player.y, healAmt, 'heal', false);
            addLog(`Healed for ${healAmt} HP!`, 'floor-clear');
            playSound('heal');
            spawnParticles(px, py, 'heal', 15);
            break;

        case 'dash':
            // Move away from nearest monster (escape)
            if (gameState.monsters.length) {
                const nearest = gameState.monsters.reduce((a, b) =>
                    heuristic(gameState.player.x, gameState.player.y, a.x, a.y) <
                    heuristic(gameState.player.x, gameState.player.y, b.x, b.y) ? a : b
                );
                // Store start position for trail
                const startX = gameState.player.x;
                const startY = gameState.player.y;

                // Move away from the monster
                const dx = gameState.player.x - nearest.x;
                const dy = gameState.player.y - nearest.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const targetX = Math.round(gameState.player.x + (dx / dist) * skill.value);
                const targetY = Math.round(gameState.player.y + (dy / dist) * skill.value);
                const clampedX = Math.max(0, Math.min(GRID_WIDTH - 1, targetX));
                const clampedY = Math.max(0, Math.min(GRID_HEIGHT - 1, targetY));
                if (gameState.grid[clampedY] && gameState.grid[clampedY][clampedX] === TILE.FLOOR) {
                    gameState.player.x = clampedX;
                    gameState.player.y = clampedY;

                    // Create trail effect along the dash path
                    const trailSteps = 8;
                    for (let i = 0; i < trailSteps; i++) {
                        const t = i / trailSteps;
                        const trailX = (startX + (clampedX - startX) * t) * TILE_SIZE + TILE_SIZE / 2;
                        const trailY = (startY + (clampedY - startY) * t) * TILE_SIZE + TILE_SIZE / 2;
                        spawnParticles(trailX, trailY, 'trail', 3);
                    }
                }
                addLog('Dashed away!', 'player-action');
                spawnParticles(px, py, 'smoke', 8);

                // Particles at destination
                const destX = gameState.player.x * TILE_SIZE + TILE_SIZE / 2;
                const destY = gameState.player.y * TILE_SIZE + TILE_SIZE / 2;
                spawnParticles(destX, destY, 'magic', 12);
            }
            break;

        case 'aoe':
            let aoeHits = 0;
            gameState.monsters.forEach(m => {
                const dist = heuristic(gameState.player.x, gameState.player.y, m.x, m.y);
                if (dist <= 3) {
                    const dmg = Math.floor(gameState.run.attack * skill.value);
                    m.currentHp -= dmg;
                    showDamageNumber(m.x, m.y, dmg, 'monster-damage', false);
                    gameState.stats.totalDamageDealt = (gameState.stats.totalDamageDealt || 0) + dmg;
                    logDamage(dmg, 'player');
                    aoeHits++;
                    if (m.currentHp <= 0) monsterDefeated(m);
                }
            });
            addLog(`Whirlwind hits ${aoeHits} enemies!`, 'player-action');
            playSound('hit');
            spawnParticles(px, py, 'blood', 20);
            break;

        case 'projectile':
            if (gameState.monsters.length) {
                const target = gameState.monsters.reduce((a, b) =>
                    heuristic(gameState.player.x, gameState.player.y, a.x, a.y) <
                    heuristic(gameState.player.x, gameState.player.y, b.x, b.y) ? a : b
                );
                const dmg = Math.floor(gameState.run.attack * skill.value);
                target.currentHp -= dmg;
                gameState.stats.totalDamageDealt = (gameState.stats.totalDamageDealt || 0) + dmg;
                logDamage(dmg, 'player');
                showDamageNumber(target.x, target.y, dmg, 'monster-damage', true);
                if (skill.status) applyStatus(target, skill.status);
                addLog(`${skill.name} hits ${target.name} for ${dmg}!`, 'crit');
                playSound('crit');

                const mx = target.x * TILE_SIZE + TILE_SIZE / 2;
                const my = target.y * TILE_SIZE + TILE_SIZE / 2;

                // Enhanced projectile effects based on skill type
                if (skillName === 'lightning') {
                    // Lightning bolt effect
                    spawnParticles(mx, my, 'lightning', 20);
                    spawnParticles(mx, my, 'sparkle', 10);
                    addScreenFlash('#00ffff', 0.3, 0.1);
                    addHitFlash(target.x * TILE_SIZE, target.y * TILE_SIZE, '#00ffff', TILE_SIZE);
                    gameState.screenShake = 6;
                } else if (skill.status === 'burn') {
                    spawnParticles(mx, my, 'fire', 20);
                    spawnParticles(mx, my, 'explosion', 8);
                    addScreenFlash('#ff4400', 0.2, 0.15);
                } else if (skill.status === 'freeze') {
                    spawnParticles(mx, my, 'ice', 20);
                    spawnParticles(mx, my, 'sparkle', 8);
                    addScreenFlash('#00ccff', 0.2, 0.15);
                } else if (skill.status === 'poison') {
                    spawnParticles(mx, my, 'poison', 15);
                    spawnParticles(mx, my, 'smoke', 5);
                } else {
                    spawnParticles(mx, my, 'blood', 15);
                }

                addHitFlash(target.x * TILE_SIZE, target.y * TILE_SIZE, skill.status === 'burn' ? '#ff4400' : '#ffffff', TILE_SIZE);
                if (target.currentHp <= 0) monsterDefeated(target);
            }
            break;

        case 'teleport':
            // Teleport behind nearest monster
            if (gameState.monsters.length) {
                const target = gameState.monsters.reduce((a, b) =>
                    heuristic(gameState.player.x, gameState.player.y, a.x, a.y) <
                    heuristic(gameState.player.x, gameState.player.y, b.x, b.y) ? a : b
                );
                const positions = [
                    { x: target.x + 1, y: target.y },
                    { x: target.x - 1, y: target.y },
                    { x: target.x, y: target.y + 1 },
                    { x: target.x, y: target.y - 1 }
                ].filter(p => p.x >= 0 && p.x < GRID_WIDTH && p.y >= 0 && p.y < GRID_HEIGHT && gameState.grid[p.y][p.x] === TILE.FLOOR);
                if (positions.length) {
                    const pos = positions[Math.floor(Math.random() * positions.length)];

                    // Disappear effect at origin
                    spawnParticles(px, py, 'smoke', 12);
                    spawnParticles(px, py, 'magic', 8);
                    addScreenFlash('#6633aa', 0.2, 0.1);

                    // Teleport
                    gameState.player.x = pos.x;
                    gameState.player.y = pos.y;

                    // Appear effect at destination
                    const destX = pos.x * TILE_SIZE + TILE_SIZE / 2;
                    const destY = pos.y * TILE_SIZE + TILE_SIZE / 2;
                    spawnParticles(destX, destY, 'magic', 15);
                    spawnParticles(destX, destY, 'sparkle', 10);

                    addLog('Shadow Step!', 'player-action');
                }
            }
            break;

        case 'stun':
            // Stun nearest monster
            if (gameState.monsters.length) {
                const target = gameState.monsters.reduce((a, b) =>
                    heuristic(gameState.player.x, gameState.player.y, a.x, a.y) <
                    heuristic(gameState.player.x, gameState.player.y, b.x, b.y) ? a : b
                );
                applyStatus(target, 'stun');
                const dmg = Math.floor(gameState.run.attack * 0.5);
                target.currentHp -= dmg;
                gameState.stats.totalDamageDealt = (gameState.stats.totalDamageDealt || 0) + dmg;
                logDamage(dmg, 'player');
                showDamageNumber(target.x, target.y, dmg, 'monster-damage', false);
                addLog(`Shield Bash stuns ${target.name}!`, 'player-action');
                playSound('hit');

                // Stun visual effects
                const stunX = target.x * TILE_SIZE + TILE_SIZE / 2;
                const stunY = target.y * TILE_SIZE + TILE_SIZE / 2;
                spawnParticles(stunX, stunY, 'stun', 10);
                addHitFlash(target.x * TILE_SIZE, target.y * TILE_SIZE, '#ffff00', TILE_SIZE);
                gameState.screenShake = 5;

                if (target.currentHp <= 0) monsterDefeated(target);
            }
            break;

        case 'buff':
            // Apply temporary buff to player
            if (!gameState.runBuffs) gameState.runBuffs = [];
            gameState.runBuffs.push({
                stat: skill.stat,
                value: skill.value,
                duration: skill.duration,
                timer: skill.duration
            });
            addLog(`${skill.name} activated! +${Math.round(skill.value * 100)}% ${skill.stat} for ${skill.duration}s`, 'level-up');
            playSound('powerup');
            spawnParticles(px, py, 'gold', 15);
            break;

        case 'berserk':
            // Double damage but take more damage
            if (!gameState.runBuffs) gameState.runBuffs = [];
            gameState.runBuffs.push({
                stat: 'attack',
                value: skill.value - 1,
                duration: skill.duration,
                timer: skill.duration
            });
            gameState.runBuffs.push({
                stat: 'berserk',
                value: 0.5, // 50% more damage taken
                duration: skill.duration,
                timer: skill.duration
            });
            addLog(`Berserker Rage! Double damage for ${skill.duration}s!`, 'crit');
            playSound('powerup');
            spawnParticles(px, py, 'fire', 20);
            break;

        case 'shield':
            // Create damage absorbing shield
            const shieldAmount = Math.floor(gameState.run.maxHp * skill.value);
            gameState.run.shield = (gameState.run.shield || 0) + shieldAmount;
            if (!gameState.runBuffs) gameState.runBuffs = [];
            gameState.runBuffs.push({
                stat: 'shield',
                value: shieldAmount,
                duration: skill.duration,
                timer: skill.duration
            });
            addLog(`Arcane Shield absorbs ${shieldAmount} damage!`, 'level-up');
            playSound('powerup');
            spawnParticles(px, py, 'magic', 20);
            break;

        case 'crit':
            // Guaranteed critical hit
            if (gameState.monsters.length) {
                const target = gameState.monsters.reduce((a, b) =>
                    heuristic(gameState.player.x, gameState.player.y, a.x, a.y) <
                    heuristic(gameState.player.x, gameState.player.y, b.x, b.y) ? a : b
                );
                const dmg = Math.floor(gameState.run.attack * skill.value * (gameState.run.critDamage / 100));
                target.currentHp -= dmg;
                gameState.stats.totalDamageDealt = (gameState.stats.totalDamageDealt || 0) + dmg;
                gameState.stats.criticalHits = (gameState.stats.criticalHits || 0) + 1;
                logDamage(dmg, 'player');
                showDamageNumber(target.x, target.y, dmg, 'monster-damage', true);
                addLog(`Backstab! Critical hit for ${dmg}!`, 'crit');
                playSound('crit');
                const mx = target.x * TILE_SIZE + TILE_SIZE / 2;
                const my = target.y * TILE_SIZE + TILE_SIZE / 2;
                spawnParticles(mx, my, 'blood', 15);
                if (target.currentHp <= 0) monsterDefeated(target);
            }
            break;
    }

    updateSkillCooldownsUI();
}

function updateSkillCooldowns(dt) {
    Object.keys(gameState.skillCooldowns).forEach(skill => {
        if (gameState.skillCooldowns[skill] > 0) {
            gameState.skillCooldowns[skill] = Math.max(0, gameState.skillCooldowns[skill] - dt);
        }
    });
}

function updateActiveSkillsUI() {
    const container = document.getElementById('active-skills');
    if (!container) return;

    const playerClass = gameState.selectedClass;

    // Get skills available to this class (universal + class-specific)
    const availableSkills = Object.entries(SKILLS).filter(([, skill]) => {
        return !skill.class || skill.class === playerClass;
    });

    container.innerHTML = availableSkills.map(([skillKey, skill], index) => {
        const keyNum = index + 1;
        const isLocked = !skill.unlocked;
        return `
            <div class="skill-slot ${isLocked ? 'locked' : ''}" data-skill="${skillKey}" onclick="useSkill('${skillKey}')" title="${skill.desc || ''}">
                <div class="skill-icon">${skill.icon}</div>
                <span class="skill-name">${skill.name}</span>
                <div class="skill-cooldown" id="${skillKey}-cooldown"></div>
                ${keyNum <= 9 ? `<span class="skill-key">[${keyNum}]</span>` : ''}
                ${isLocked ? '<span class="skill-locked">🔒</span>' : ''}
            </div>
        `;
    }).join('');
}

function updateSkillTreeUI() {
    const container = document.getElementById('skill-tree');
    if (!container) return;

    const playerClass = gameState.selectedClass;

    // Group skills by class
    const skillGroups = {
        universal: [],
        warrior: [],
        mage: [],
        rogue: []
    };

    Object.entries(SKILLS).forEach(([key, skill]) => {
        const group = skill.class || 'universal';
        skillGroups[group].push({ key, ...skill });
    });

    let html = '';

    // Show current class skills first, then others
    const classOrder = ['universal', playerClass, ...Object.keys(skillGroups).filter(c => c !== 'universal' && c !== playerClass)];

    classOrder.forEach(className => {
        const skills = skillGroups[className];
        if (!skills.length) return;

        const isCurrentClass = className === playerClass || className === 'universal';
        const classLabel = className === 'universal' ? 'Universal' : CLASSES[className]?.name || className;

        html += `<div class="skill-tree-class ${isCurrentClass ? '' : 'other-class'}">
            <h4>${classLabel} ${className !== 'universal' ? CLASSES[className]?.icon || '' : '⚔️'}</h4>
            <div class="skill-tree-skills">`;

        skills.forEach(skill => {
            const canUse = isCurrentClass;
            const isUnlocked = skill.unlocked;
            html += `
                <div class="skill-tree-node ${isUnlocked ? 'unlocked' : ''} ${!canUse ? 'other-class-skill' : ''}" title="${skill.desc}">
                    <span class="skill-tree-icon">${skill.icon}</span>
                    <span class="skill-tree-name">${skill.name}</span>
                </div>`;
        });

        html += `</div></div>`;
    });

    container.innerHTML = html;
}

function updateSkillCooldownsUI() {
    const playerLevel = gameState.run?.level || 0;
    const playerClass = gameState.selectedClass;

    Object.keys(SKILLS).forEach(skillKey => {
        const skill = SKILLS[skillKey];
        const cd = gameState.skillCooldowns[skillKey];
        const el = document.getElementById(`${skillKey}-cooldown`);
        const slot = document.querySelector(`.skill-slot[data-skill="${skillKey}"]`);

        // Check availability
        const isClassMatch = !skill.class || skill.class === playerClass;
        const meetsLevel = playerLevel >= (skill.levelReq || 1);
        const isAvailable = isClassMatch && meetsLevel;

        // Desktop skill slots
        if (el && slot) {
            if (cd > 0 && isAvailable) {
                el.textContent = Math.ceil(cd);
                slot.classList.add('on-cooldown');
            } else {
                el.textContent = '';
                slot.classList.remove('on-cooldown');
            }
            slot.classList.toggle('locked', !isAvailable);

            // Show level requirement if locked due to level
            if (!meetsLevel && isClassMatch) {
                el.textContent = `Lv${skill.levelReq}`;
            }
        }

        // Mobile skill buttons
        const mobileBtn = document.getElementById(`mobile-${skillKey}`);
        const mobileCd = document.getElementById(`mobile-${skillKey}-cd`);
        if (mobileBtn) {
            const isLocked = !isAvailable;
            mobileBtn.classList.toggle('locked', isLocked);
            mobileBtn.classList.toggle('wrong-class', !isClassMatch);

            if (cd > 0 && isAvailable) {
                mobileBtn.classList.add('on-cooldown');
                if (mobileCd) mobileCd.textContent = Math.ceil(cd);
            } else {
                mobileBtn.classList.remove('on-cooldown');
                if (mobileCd) {
                    // Show level requirement if locked
                    if (!meetsLevel && isClassMatch) {
                        mobileCd.textContent = `Lv${skill.levelReq}`;
                        mobileCd.style.fontSize = '0.7rem';
                    } else if (!isClassMatch) {
                        mobileCd.textContent = '';
                    } else {
                        mobileCd.textContent = '';
                        mobileCd.style.fontSize = '';
                    }
                }
            }
        }
    });
}

// ==========================================
// EQUIPMENT SYSTEM
// ==========================================

function generateEquipment(floor, bonusRarity = 0) {
    const types = ['weapon', 'armor', 'accessory'];
    const type = types[Math.floor(Math.random() * types.length)];
    const bases = EQUIPMENT_BASES[type];
    const base = bases[Math.floor(Math.random() * bases.length)];

    // Determine rarity
    let rarityIdx = Math.floor(Math.random() * 100);
    if (rarityIdx < 50) rarityIdx = 0;
    else if (rarityIdx < 80) rarityIdx = 1;
    else if (rarityIdx < 93) rarityIdx = 2;
    else if (rarityIdx < 99) rarityIdx = 3;
    else rarityIdx = 4;
    rarityIdx = Math.min(4, rarityIdx + bonusRarity);

    const rarity = RARITIES[rarityIdx];
    const mult = RARITY_MULT[rarity] * (1 + floor * 0.05);

    const item = {
        name: `${rarity.charAt(0).toUpperCase() + rarity.slice(1)} ${base.name}`,
        baseName: base.name,
        type,
        rarity,
        level: floor,
        icon: base.icon || EQUIPMENT_SLOT_ICONS[type]
    };

    // Apply base stats with multiplier
    if (base.atk) item.atk = Math.floor(base.atk * mult);
    if (base.def) item.def = Math.floor(base.def * mult);
    if (base.hp) item.hp = Math.floor(base.hp * mult);
    if (base.spd) item.spd = Math.round(base.spd * mult * 100) / 100;
    if (base.eva) item.eva = Math.floor(base.eva * mult);
    if (base.crit) item.crit = Math.floor(base.crit * mult);
    if (base.critDmg) item.critDmg = Math.floor(base.critDmg * mult);

    if (rarity === 'legendary') gameState.stats.legendariesFound++;

    return item;
}

function addToInventory(item) {
    if (!gameState.run.inventory) gameState.run.inventory = [];

    // Auto-equip if enabled and item is better
    if (gameState.settings.autoLoot) {
        const current = gameState.run.equipment[item.type];
        if (!current || isItemBetter(item, current)) {
            equipItem(item);
            addLog(`Auto-equipped ${item.name}!`, 'level-up');
            return;
        }
    }

    if (gameState.run.inventory.length < 20) {
        gameState.run.inventory.push(item);
        updateInventoryUI();
    }
}

function isItemBetter(newItem, currentItem) {
    // Calculate total stat value for comparison
    const getItemValue = (item) => {
        let value = 0;
        if (item.atk) value += item.atk * 2;
        if (item.def) value += item.def * 2;
        if (item.hp) value += item.hp * 0.5;
        if (item.spd) value += item.spd * 10;
        if (item.eva) value += item.eva * 1.5;
        if (item.crit) value += item.crit * 2;
        if (item.critDmg) value += item.critDmg * 0.2;
        // Rarity bonus
        const rarityBonus = { common: 0, uncommon: 5, rare: 15, epic: 30, legendary: 50 };
        value += rarityBonus[item.rarity] || 0;
        return value;
    };
    return getItemValue(newItem) > getItemValue(currentItem);
}

function equipItem(item) {
    const current = gameState.run.equipment[item.type];
    gameState.run.equipment[item.type] = item;

    // Remove from inventory
    gameState.run.inventory = gameState.run.inventory.filter(i => i !== item);

    // Add old item to inventory
    if (current) addToInventory(current);

    // Recalculate stats
    const newStats = calculatePlayerStats();
    Object.assign(gameState.run, newStats);

    updateEquipmentUI();
    updateInventoryUI();
    updateAllUI();
}

function equipBestItems() {
    if (!gameState.run || !gameState.run.inventory) return;

    let equipped = 0;
    ['weapon', 'armor', 'accessory'].forEach(slot => {
        const itemsOfType = gameState.run.inventory.filter(i => i.type === slot);
        if (itemsOfType.length === 0) return;

        // Find best item of this type
        let best = itemsOfType[0];
        itemsOfType.forEach(item => {
            if (isItemBetter(item, best)) best = item;
        });

        // Compare with current
        const current = gameState.run.equipment[slot];
        if (!current || isItemBetter(best, current)) {
            equipItem(best);
            equipped++;
        }
    });

    if (equipped > 0) {
        addLog(`Auto-equipped ${equipped} item(s)!`, 'level-up');
        playSound('pickup');
    } else {
        addLog('No better items to equip.', 'player-action');
    }
}

function sellAllCommon() {
    if (!gameState.run || !gameState.run.inventory) return;

    const commonItems = gameState.run.inventory.filter(i => i.rarity === 'common');
    if (commonItems.length === 0) {
        addLog('No common items to sell.', 'player-action');
        return;
    }

    // Calculate soul value (5 souls per common item)
    const soulsGained = commonItems.length * 5;
    gameState.soulPoints += soulsGained;
    gameState.stats.soulsEarned = (gameState.stats.soulsEarned || 0) + soulsGained;

    // Remove common items
    gameState.run.inventory = gameState.run.inventory.filter(i => i.rarity !== 'common');

    addLog(`Sold ${commonItems.length} common item(s) for ${soulsGained} souls!`, 'level-up');
    playSound('pickup');

    updateInventoryUI();
    updateAllUI();
    checkAchievements();
}

function updateEquipmentUI() {
    if (!gameState.run) return;
    ['weapon', 'armor', 'accessory'].forEach(slot => {
        const el = DOM[`slot_${slot}`];
        const item = gameState.run.equipment?.[slot];
        if (el) {
            // Remove old event listeners by cloning
            const newEl = el.cloneNode(false);
            el.parentNode.replaceChild(newEl, el);
            DOM[`slot_${slot}`] = newEl;

            if (item) {
                newEl.innerHTML = `<span class="slot-icon">${item.icon || EQUIPMENT_SLOT_ICONS[slot]}</span><span class="slot-name">${item.name}</span>`;
                newEl.className = `slot-item has-item ${item.rarity}`;

                const tooltipText = `${item.name} (${item.rarity})\n${getItemStatsText(item)}\n[Tap to unequip]`;
                newEl.addEventListener('mouseenter', (e) => showTooltip(e, tooltipText));
                newEl.addEventListener('mouseleave', hideTooltip);
                newEl.addEventListener('touchstart', (e) => showTooltip(e, tooltipText), { passive: true });
                newEl.addEventListener('touchend', () => setTimeout(hideTooltip, 1500), { passive: true });
            } else {
                newEl.innerHTML = `<span class="slot-icon">${EQUIPMENT_SLOT_ICONS[slot]}</span><span class="slot-name">Empty</span>`;
                newEl.className = 'slot-item';

                const tooltipText = `No ${slot} equipped`;
                newEl.addEventListener('mouseenter', (e) => showTooltip(e, tooltipText));
                newEl.addEventListener('mouseleave', hideTooltip);
                newEl.addEventListener('touchstart', (e) => showTooltip(e, tooltipText), { passive: true });
                newEl.addEventListener('touchend', () => setTimeout(hideTooltip, 1500), { passive: true });
            }
        }
    });
}

function updateInventoryUI() {
    if (!DOM.inventory_grid || !gameState.run) return;
    DOM.inventory_grid.innerHTML = '';
    const inv = gameState.run.inventory || [];
    for (let i = 0; i < 20; i++) {
        const div = document.createElement('div');
        div.className = 'inventory-item';
        if (inv[i]) {
            const item = inv[i];
            div.innerHTML = `<span class="item-emoji">${item.icon || EQUIPMENT_SLOT_ICONS[item.type] || '📦'}</span>`;
            div.style.borderColor = RARITY_COLORS[item.rarity];
            div.style.background = `linear-gradient(135deg, rgba(${hexToRgb(RARITY_COLORS[item.rarity])}, 0.2) 0%, transparent 100%)`;

            // Create tooltip text
            const tooltipText = `${item.name} (${item.rarity})\n${getItemStatsText(item)}\n[Tap to equip]`;

            // Desktop hover
            div.addEventListener('mouseenter', (e) => showTooltip(e, tooltipText));
            div.addEventListener('mouseleave', hideTooltip);

            // Mobile long-press for tooltip, tap for equip
            let touchTimer = null;
            div.addEventListener('touchstart', (e) => {
                touchTimer = setTimeout(() => {
                    showTooltip(e, tooltipText);
                    touchTimer = null;
                }, 400);
            }, { passive: true });
            div.addEventListener('touchend', (e) => {
                if (touchTimer) {
                    clearTimeout(touchTimer);
                    equipItem(item);
                }
                setTimeout(hideTooltip, 1500);
            }, { passive: true });
            div.addEventListener('touchcancel', () => {
                if (touchTimer) clearTimeout(touchTimer);
                hideTooltip();
            }, { passive: true });

            // Desktop click
            div.addEventListener('click', () => equipItem(item));
        }
        DOM.inventory_grid.appendChild(div);
    }
}

function getItemStatsText(item) {
    const stats = [];
    if (item.atk) stats.push(`ATK +${item.atk}`);
    if (item.def) stats.push(`DEF +${item.def}`);
    if (item.hp) stats.push(`HP +${item.hp}`);
    if (item.spd) stats.push(`SPD ${item.spd > 0 ? '+' : ''}${item.spd}`);
    if (item.eva) stats.push(`EVA +${item.eva}`);
    if (item.crit) stats.push(`CRIT +${item.crit}%`);
    if (item.critDmg) stats.push(`CRIT DMG +${item.critDmg}%`);
    return stats.join(', ');
}

// ==========================================
// PRESTIGE SYSTEM
// ==========================================

function updatePrestigeUI() {
    const currentMult = gameState.prestigeMultiplier;
    const souls = gameState.soulPoints;
    const newMult = 1 + Math.sqrt(souls / 1000) * 0.1;

    if (DOM.prestige_mult) DOM.prestige_mult.textContent = currentMult.toFixed(2);
    if (DOM.prestige_souls) DOM.prestige_souls.textContent = souls;
    if (DOM.prestige_new_mult) DOM.prestige_new_mult.textContent = newMult.toFixed(2);
    if (DOM.prestige_btn) DOM.prestige_btn.disabled = souls < 100;
}

function doPrestige() {
    if (gameState.soulPoints < 100) return;

    gameState.prestigeLevel++;
    gameState.prestigeMultiplier = 1 + Math.sqrt(gameState.soulPoints / 1000) * 0.1;
    gameState.soulPoints = 0;

    // Reset run-specific things but keep upgrades
    addLog(`PRESTIGE! New multiplier: ${gameState.prestigeMultiplier.toFixed(2)}x`, 'level-up');

    saveGame();
    checkAchievements();
    startNewRun();
}

// ==========================================
// ACHIEVEMENTS
// ==========================================

function checkAchievements() {
    ACHIEVEMENTS.forEach(ach => {
        if (!gameState.achievements[ach.id] && ach.check(gameState)) {
            gameState.achievements[ach.id] = true;
            gameState.soulPoints += ach.reward;
            showAchievementPopup(ach.name);
            addLog(`Achievement: ${ach.name}! +${ach.reward} SP`, 'level-up');
        }
    });
    updateAchievementsUI();
}

function showAchievementPopup(name) {
    if (DOM.achievement_popup_name) DOM.achievement_popup_name.textContent = name;
    const popup = document.getElementById('achievement-popup');
    if (popup) {
        popup.classList.add('show');
        setTimeout(() => popup.classList.remove('show'), 3000);
    }
}

function updateAchievementsUI() {
    if (!DOM.achievements_list) return;
    DOM.achievements_list.innerHTML = '';
    let unlocked = 0;

    ACHIEVEMENTS.forEach(ach => {
        const isUnlocked = gameState.achievements[ach.id];
        if (isUnlocked) unlocked++;

        const div = document.createElement('div');
        div.className = `achievement-item${isUnlocked ? ' unlocked' : ''}`;
        div.innerHTML = `
            <div class="achievement-item-icon"></div>
            <div class="achievement-item-info">
                <span class="achievement-item-name">${ach.name}</span>
                <span class="achievement-item-desc">${ach.desc}</span>
                <span class="achievement-item-reward">+${ach.reward} SP</span>
            </div>
        `;
        DOM.achievements_list.appendChild(div);
    });

    if (DOM.achievements_unlocked) DOM.achievements_unlocked.textContent = unlocked;
    if (DOM.achievements_total) DOM.achievements_total.textContent = ACHIEVEMENTS.length;
}

// ==========================================
// CHESTS & TRAPS & NPCs
// ==========================================

function checkTileInteraction() {
    const px = gameState.player.x, py = gameState.player.y;

    // Check chests
    const chest = gameState.chests.find(c => c.x === px && c.y === py && !c.opened);
    if (chest) openChest(chest);

    // Check traps
    const trap = gameState.traps.find(t => t.x === px && t.y === py && !t.triggered);
    if (trap) triggerTrap(trap);

    // Check NPCs
    const npc = gameState.npcs.find(n => Math.abs(n.x - px) <= 1 && Math.abs(n.y - py) <= 1);
    if (npc) openNPCDialog(npc);

    // Check room events
    const roomEvent = gameState.roomEvents.find(e => e.x === px && e.y === py && !e.used);
    if (roomEvent) openRoomEventModal(roomEvent);

    // Check secret rooms
    const secretRoom = gameState.secretRoomsFound.find(s => s.x === px && s.y === py && !s.claimed);
    if (secretRoom) {
        discoverSecretRoom(px, py);
        claimSecretRoomReward(secretRoom);
        gameState.grid[py][px] = TILE.FLOOR; // Clear the secret room tile
    }

    // Check exit portal
    if (gameState.exitSpawned && gameState.exitPosition &&
        px === gameState.exitPosition.x && py === gameState.exitPosition.y) {
        advanceToNextFloor();
    }
}

function openRoomEventModal(event) {
    const eventData = ROOM_EVENTS[event.type];
    const modal = document.getElementById('room-event-modal');
    const title = document.getElementById('room-event-name');
    const desc = document.getElementById('room-event-desc');
    const btn = document.getElementById('room-event-activate');

    if (!modal || !title || !desc || !btn) return;

    title.textContent = eventData.name;
    title.style.color = eventData.color;
    desc.textContent = event.effect.desc;

    btn.onclick = () => {
        clearModalTimer('room-event-modal');
        activateRoomEvent(event);
    };
    modal.classList.add('active');

    // Auto-skip after 5 seconds (player didn't choose to activate)
    startModalTimer('room-event-modal', 5, () => {
        modal.classList.remove('active');
        addLog(`Skipped ${eventData.name}`, 'player-action');
    });
}

function activateRoomEvent(event) {
    event.used = true;
    gameState.grid[event.y][event.x] = TILE.FLOOR;

    const effect = event.effect;

    switch (effect.type) {
        case 'buff':
            gameState.runBuffs.push({
                stat: effect.stat,
                value: effect.value,
                duration: effect.duration,
                timer: effect.duration
            });
            addLog(`${ROOM_EVENTS[event.type].name}: ${effect.desc}`, 'level-up');
            gameState.stats.shrinesUsed++;
            break;

        case 'heal':
            const healAmt = Math.floor(gameState.run.maxHp * effect.value);
            gameState.run.currentHp = Math.min(gameState.run.maxHp, gameState.run.currentHp + healAmt);
            showDamageNumber(gameState.player.x, gameState.player.y, healAmt, 'heal', false);
            addLog(`Fountain healed you for ${healAmt} HP!`, 'floor-clear');
            gameState.stats.fountainsUsed++;
            break;

        case 'fullHeal':
            gameState.run.currentHp = gameState.run.maxHp;
            showDamageNumber(gameState.player.x, gameState.player.y, 'FULL', 'heal', true);
            addLog('Fountain fully restored your health!', 'floor-clear');
            gameState.stats.fountainsUsed++;
            break;

        case 'maxHpUp':
            gameState.runBuffs.push({ stat: 'maxHp', value: effect.value, permanent: true });
            const newStats = calculatePlayerStats();
            gameState.run.currentHp += effect.value;
            Object.assign(gameState.run, newStats);
            addLog(`Fountain increased your Max HP by ${effect.value}!`, 'level-up');
            gameState.stats.fountainsUsed++;
            break;

        case 'gamble':
            if (Math.random() < 0.5) {
                gameState.soulPoints += effect.good.souls;
                addLog(`The altar rewards you with ${effect.good.souls} Soul Points!`, 'level-up');
            } else {
                const dmg = Math.floor(gameState.run.maxHp * effect.bad.damage);
                gameState.run.currentHp -= dmg;
                showDamageNumber(gameState.player.x, gameState.player.y, dmg, 'player-damage', false);
                addLog(`The altar's curse damages you for ${dmg}!`, 'monster-action');
                if (gameState.run.currentHp <= 0) playerDefeated();
            }
            gameState.stats.altarsUsed++;
            break;

        case 'sacrifice':
            const sacrificeDmg = Math.floor(gameState.run.maxHp * effect.cost);
            gameState.run.currentHp -= sacrificeDmg;
            gameState.runBuffs.push({ stat: 'attack', value: effect.reward.attack, permanent: true });
            showDamageNumber(gameState.player.x, gameState.player.y, sacrificeDmg, 'player-damage', false);
            addLog(`Sacrificed ${sacrificeDmg} HP for +${effect.reward.attack} Attack!`, 'level-up');
            if (gameState.run.currentHp <= 0) playerDefeated();
            gameState.stats.altarsUsed++;
            break;

        case 'curse':
            gameState.runBuffs.push({ stat: 'defense', value: effect.debuff.defense, permanent: true });
            gameState.runBuffs.push({ stat: 'critDamage', value: effect.reward.critDamage, permanent: true });
            addLog(`Cursed! ${effect.debuff.defense} DEF, +${effect.reward.critDamage}% Crit DMG`, 'status');
            gameState.stats.altarsUsed++;
            break;
    }

    // Recalculate stats
    const newStats = calculatePlayerStats();
    Object.assign(gameState.run, newStats);
    updateAllUI();
    updatePlayerHealthBar();

    document.getElementById('room-event-modal')?.classList.remove('active');
}

function openChest(chest) {
    chest.opened = true;
    gameState.stats.chestsOpened++;
    gameState.chestsCollected++;
    gameState.grid[chest.y][chest.x] = TILE.FLOOR;

    const contents = [];
    // Soul points
    const souls = Math.floor(10 + gameState.run.floor * 2 + Math.random() * 20);
    gameState.soulPoints += souls;
    gameState.stats.soulsEarned = (gameState.stats.soulsEarned || 0) + souls;
    contents.push(`${souls} Soul Points`);

    // Equipment chance
    if (Math.random() < 0.5) {
        const item = generateEquipment(gameState.run.floor, 1);
        addToInventory(item);
        contents.push(item.name);
    }

    DOM.chest_contents.innerHTML = contents.map(c => `<div class="chest-item">${c}</div>`).join('');
    DOM.chest_modal.classList.add('active');

    // Auto-close after 5 seconds
    startModalTimer('chest-modal', 5, closeChestModal);

    addLog(`Opened chest! Found ${contents.join(', ')}`, 'level-up');
    checkAchievements();
}

function closeChestModal() {
    clearModalTimer('chest-modal');
    DOM.chest_modal.classList.remove('active');
}

function triggerTrap(trap) {
    gameState.grid[trap.y][trap.x] = TILE.FLOOR;

    // Use trap variety system
    const trapType = trap.trapType || getRandomTrapType();

    // Apply trap effects using the new system
    handleTrapEffect(trap, trapType);

    addLog(`Triggered ${trapType.name}! ${trapType.desc}`, 'monster-action');

    updatePlayerHealthBar();
    if (gameState.run.currentHp <= 0) {
        playerDefeated();
    } else {
        // Only count if survived
        gameState.stats.trapsTriggered = (gameState.stats.trapsTriggered || 0) + 1;
    }
}

function openNPCDialog(npc) {
    DOM.npc_name.textContent = npc.name;
    DOM.npc_dialog.textContent = npc.dialog;
    DOM.npc_portrait.style.background = npc.portrait;
    DOM.npc_options.innerHTML = '';

    if (npc.type === 'healer') {
        const btn = document.createElement('button');
        btn.className = 'npc-option-btn';
        const cost = Math.floor(gameState.run.floor * 5);
        btn.textContent = `Heal to full (${cost} SP)`;
        btn.disabled = gameState.soulPoints < cost;
        btn.onclick = () => {
            if (gameState.soulPoints >= cost) {
                gameState.soulPoints -= cost;
                gameState.run.currentHp = gameState.run.maxHp;
                gameState.stats.healerVisits = (gameState.stats.healerVisits || 0) + 1;
                updateAllUI();
                closeNPCModal();
                addLog('Healed to full health!', 'floor-clear');
            }
        };
        DOM.npc_options.appendChild(btn);
    } else if (npc.type === 'merchant') {
        // Merchant sells random buffs
        const items = [
            { name: 'Attack Potion (+25% ATK, 60s)', cost: 20, effect: () => { gameState.runBuffs.push({ stat: 'attack', value: 0.25, duration: 60, timer: 60 }); }},
            { name: 'Defense Potion (+25% DEF, 60s)', cost: 20, effect: () => { gameState.runBuffs.push({ stat: 'defense', value: 0.25, duration: 60, timer: 60 }); }},
            { name: 'Speed Potion (+30% SPD, 60s)', cost: 15, effect: () => { gameState.runBuffs.push({ stat: 'speed', value: 0.3, duration: 60, timer: 60 }); }},
            { name: 'Health Potion (Heal 30%)', cost: 10, effect: () => { gameState.run.currentHp = Math.min(gameState.run.maxHp, gameState.run.currentHp + Math.floor(gameState.run.maxHp * 0.3)); }}
        ];
        items.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'npc-option-btn';
            btn.textContent = `${item.name} - ${item.cost} SP`;
            btn.disabled = gameState.soulPoints < item.cost;
            btn.onclick = () => {
                if (gameState.soulPoints >= item.cost) {
                    gameState.soulPoints -= item.cost;
                    item.effect();
                    gameState.stats.merchantPurchases = (gameState.stats.merchantPurchases || 0) + 1;
                    updateAllUI();
                    closeNPCModal();
                    addLog(`Bought ${item.name}!`, 'level-up');
                }
            };
            DOM.npc_options.appendChild(btn);
        });
    } else if (npc.type === 'blacksmith') {
        // Blacksmith can upgrade equipped gear
        const upgradeCost = Math.floor(15 + gameState.run.floor * 2);
        const btn = document.createElement('button');
        btn.className = 'npc-option-btn';
        btn.textContent = `Upgrade Weapon (+10% ATK) - ${upgradeCost} SP`;
        btn.disabled = gameState.soulPoints < upgradeCost || !gameState.run.equipment.weapon;
        btn.onclick = () => {
            if (gameState.soulPoints >= upgradeCost && gameState.run.equipment.weapon) {
                gameState.soulPoints -= upgradeCost;
                gameState.run.equipment.weapon.attack = Math.floor((gameState.run.equipment.weapon.attack || 0) * 1.1) + 1;
                gameState.stats.blacksmithUpgrades = (gameState.stats.blacksmithUpgrades || 0) + 1;
                calculatePlayerStats();
                updateAllUI();
                closeNPCModal();
                addLog('Weapon upgraded!', 'level-up');
            }
        };
        DOM.npc_options.appendChild(btn);
    }

    DOM.npc_modal.classList.add('active');

    // Auto-close after 5 seconds (skip NPC)
    startModalTimer('npc-modal', 5, closeNPCModal);
}

function closeNPCModal() {
    clearModalTimer('npc-modal');
    DOM.npc_modal.classList.remove('active');
}

// ==========================================
// GAME LOOP
// ==========================================

const TICK_RATE = 50;
let lastTick = 0, lastTime = 0;

function gameLoop(timestamp) {
    if (!lastTick) lastTick = timestamp;
    if (!lastTime) lastTime = timestamp;

    const delta = timestamp - lastTick;
    const realDelta = timestamp - lastTime;
    lastTime = timestamp;

    // Track play time
    if (gameState.gameRunning) {
        gameState.stats.timePlayed += realDelta;
    }

    if (delta >= TICK_RATE) {
        lastTick = timestamp;
        if (gameState.gameRunning) {
            const dt = (TICK_RATE / 1000) * gameState.gameSpeed;
            update(dt);
        }
    }

    render();
    requestAnimationFrame(gameLoop);
}

function update(dt) {
    const r = gameState.run;
    if (!r) return;

    // Update visual effects
    updateVisualEffects(dt);

    // Update particles
    updateParticles(dt);

    // Update screen effects (flashes, etc.)
    updateScreenEffects(dt);

    // Update skill cooldowns
    updateSkillCooldowns(dt);

    // Update run buffs (decay timed buffs)
    updateRunBuffs(dt);

    // Update challenge timer
    if (gameState.activeChallenge) {
        gameState.challengeTimer += dt;
    }

    // Update new systems
    updateComboSystem(dt);
    updateDodgeSystem(dt);
    updateWeatherSystem(dt);
    updateDayNightCycle(dt);
    updatePetAbilityCooldowns(dt);
    updateExploredTiles();

    // Add weather particles
    renderWeatherParticles();

    // Pet regeneration (Phoenix pet heals over time)
    if (gameState.activePet === 'phoenix') {
        const pet = PET_TYPES.find(p => p.id === 'phoenix');
        if (pet && pet.healBonus) {
            const healAmount = Math.floor(r.maxHp * pet.healBonus * dt);
            if (healAmount > 0 && r.currentHp < r.maxHp) {
                r.currentHp = Math.min(r.maxHp, r.currentHp + healAmount);
            }
        }
    }

    // Update pet position (follows player)
    if (gameState.activePet) {
        updatePetPosition(dt);
    }

    // Process player status effects
    processStatusEffects(r, dt);
    if (r.currentHp <= 0) {
        playerDefeated();
        return;
    }

    // Check if all monsters defeated
    if (gameState.monsters.length === 0) {
        // If exit exists, move towards it
        if (gameState.exitSpawned && gameState.exitPosition) {
            const exitDist = heuristic(gameState.player.x, gameState.player.y, gameState.exitPosition.x, gameState.exitPosition.y);
            if (exitDist > 0) {
                r.moveTimer = (r.moveTimer || 0) + dt * r.speed;
                if (r.moveTimer >= 0.75) {
                    r.moveTimer = 0;
                    const path = findPath(gameState.player.x, gameState.player.y, gameState.exitPosition.x, gameState.exitPosition.y);
                    if (path.length > 0) {
                        gameState.player.x = path[0].x;
                        gameState.player.y = path[0].y;
                        checkTileInteraction();
                    }
                }
            }
            return;
        } else {
            // No monsters and no exit - spawn monsters for this floor
            spawnMonsters();
            return;
        }
    }

    // Find closest monster (needed for combat)
    let closestMonster = null;
    let closestDist = Infinity;
    gameState.monsters.forEach(m => {
        const d = heuristic(gameState.player.x, gameState.player.y, m.x, m.y);
        if (d < closestDist) {
            closestDist = d;
            closestMonster = m;
        }
    });

    // Determine movement target - collect chests if no monsters nearby
    let moveTarget = null;
    let moveTargetDist = Infinity;

    // If not in combat range, look for chests to collect
    if (closestDist > 2) {
        const unopenedChests = gameState.chests.filter(c => !c.opened);
        unopenedChests.forEach(c => {
            const d = heuristic(gameState.player.x, gameState.player.y, c.x, c.y);
            if (d < moveTargetDist) {
                moveTargetDist = d;
                moveTarget = c;
            }
        });
    }

    // If no chest target or monster is closer, target the monster
    if (closestMonster && (moveTarget === null || closestDist <= moveTargetDist)) {
        moveTarget = closestMonster;
        moveTargetDist = closestDist;
    }

    // Player movement towards target
    if (moveTarget && moveTargetDist > 1) {
        r.moveTimer = (r.moveTimer || 0) + dt * r.speed;
        if (r.moveTimer >= 0.75) {
            r.moveTimer = 0;
            let path = findPath(gameState.player.x, gameState.player.y, moveTarget.x, moveTarget.y);

            // If no path found, try to find any reachable monster
            if (path.length === 0) {
                for (const m of gameState.monsters) {
                    if (m !== moveTarget && m.currentHp > 0) {
                        path = findPath(gameState.player.x, gameState.player.y, m.x, m.y);
                        if (path.length > 0) break;
                    }
                }
            }

            // If still no path, try direct movement toward nearest walkable tile
            if (path.length === 0) {
                const px = gameState.player.x;
                const py = gameState.player.y;
                const tx = moveTarget.x;
                const ty = moveTarget.y;

                // Try moving in the general direction of the target
                const dirs = [];
                if (tx > px) dirs.push({ x: px + 1, y: py });
                if (tx < px) dirs.push({ x: px - 1, y: py });
                if (ty > py) dirs.push({ x: px, y: py + 1 });
                if (ty < py) dirs.push({ x: px, y: py - 1 });
                // Add perpendicular moves as fallback
                dirs.push({ x: px + 1, y: py }, { x: px - 1, y: py }, { x: px, y: py + 1 }, { x: px, y: py - 1 });

                for (const dir of dirs) {
                    if (dir.x >= 0 && dir.x < GRID_WIDTH && dir.y >= 0 && dir.y < GRID_HEIGHT) {
                        if (gameState.grid[dir.y][dir.x] !== TILE.WALL) {
                            gameState.player.x = dir.x;
                            gameState.player.y = dir.y;
                            checkTileInteraction();
                            break;
                        }
                    }
                }
            } else {
                gameState.player.x = path[0].x;
                gameState.player.y = path[0].y;
                checkTileInteraction();
            }
        }
    }

    // Update monsters
    gameState.monsters.forEach(m => {
        processStatusEffects(m, dt);
        if (m.currentHp <= 0) {
            monsterDefeated(m);
            return;
        }

        const distToPlayer = heuristic(m.x, m.y, gameState.player.x, gameState.player.y);

        // Monster AI
        if (distToPlayer <= 1) {
            // Combat
            m.attackTimer = (m.attackTimer || 0) + dt * m.speed;
            if (m.attackTimer >= 1) {
                m.attackTimer = 0;
                monsterAttack(m);
            }
        } else if (distToPlayer <= 10) {
            // Chase - same speed as player
            m.moveTimer = (m.moveTimer || 0) + dt * m.speed;
            if (m.moveTimer >= 0.75) {
                m.moveTimer = 0;
                const path = findPath(m.x, m.y, gameState.player.x, gameState.player.y);
                if (path.length > 0) {
                    m.x = path[0].x;
                    m.y = path[0].y;
                }
            }
        } else {
            // Patrol - same speed as player
            m.moveTimer = (m.moveTimer || 0) + dt * m.speed;
            if (m.moveTimer >= 0.75) {
                m.moveTimer = 0;
                if (!m.patrolTarget || (m.x === m.patrolTarget.x && m.y === m.patrolTarget.y)) {
                    m.patrolTarget = findValidPosition();
                }
                if (m.patrolTarget) {
                    const path = findPath(m.x, m.y, m.patrolTarget.x, m.patrolTarget.y);
                    if (path.length > 0) {
                        m.x = path[0].x;
                        m.y = path[0].y;
                    }
                }
            }
        }

        // Boss abilities
        if (m.isBoss && m.abilities) {
            m.abilities.forEach(ability => {
                ability.timer = (ability.timer || 0) + dt;
                if (ability.timer >= ability.cooldown) {
                    ability.timer = 0;
                    useBossAbility(m, ability);
                }
            });
        }

        // Mini-boss abilities
        if (m.isMiniBoss) {
            m.abilityTimer = (m.abilityTimer || 0) + dt;
            useMiniBossAbility(m, distToPlayer, dt);
        }
    });

    // Player combat - use class attack range
    const classData = CLASSES[gameState.selectedClass] || CLASSES.warrior;
    const attackRange = classData.attackRange || 1;

    if (closestMonster && closestDist <= attackRange) {
        r.attackTimer = (r.attackTimer || 0) + dt * r.speed;
        if (r.attackTimer >= 1) {
            r.attackTimer = 0;

            // Check for multi-target attacks
            if (classData.multiTarget && classData.maxTargets > 1) {
                // Get all monsters in range, sorted by distance
                const monstersInRange = gameState.monsters
                    .map(m => ({ monster: m, dist: heuristic(gameState.player.x, gameState.player.y, m.x, m.y) }))
                    .filter(m => m.dist <= attackRange)
                    .sort((a, b) => a.dist - b.dist)
                    .slice(0, classData.maxTargets);

                // Attack each target with damage falloff
                monstersInRange.forEach((target, index) => {
                    const damageMult = index === 0 ? 1.0 : Math.pow(classData.chainDamageFalloff || 0.7, index);
                    playerAttackWithMult(target.monster, damageMult, classData, index > 0);
                });
            } else {
                // Single target attack
                playerAttack(closestMonster);
            }
        }
    }

    // Auto-use skills
    if (gameState.settings.autoSkills !== false) {
        autoUseSkills(closestMonster, closestDist);
    }

    updateSkillCooldownsUI();
    updateAllUI();
}

// Auto-skill system - uses skills intelligently based on situation
function autoUseSkills(closestMonster, closestDist) {
    const r = gameState.run;
    if (!r) return;

    const playerLevel = r.level || 0;
    const playerClass = gameState.selectedClass;
    const hpPercent = r.currentHp / r.maxHp;
    const inCombat = closestMonster && closestDist <= 2;
    const nearMonster = closestMonster && closestDist <= 5;

    // Helper to check if skill can be used
    const canUseSkill = (skillKey) => {
        const skill = SKILLS[skillKey];
        if (!skill) return false;
        if (gameState.skillCooldowns[skillKey] > 0) return false;
        if (skill.class && skill.class !== playerClass) return false;
        if (skill.levelReq && playerLevel < skill.levelReq) return false;
        return true;
    };

    // Priority 1: Heal when HP is low (below 40%)
    if (hpPercent < 0.4 && canUseSkill('heal')) {
        useSkill('heal');
        return;
    }

    // Priority 2: Use defensive skills when HP is critical (below 25%)
    if (hpPercent < 0.25 && inCombat) {
        if (canUseSkill('dash')) {
            useSkill('dash');
            return;
        }
        if (canUseSkill('smokeBomb')) {
            useSkill('smokeBomb');
            return;
        }
        if (canUseSkill('arcaneShield')) {
            useSkill('arcaneShield');
            return;
        }
    }

    // Priority 3: Use offensive skills when in combat
    if (inCombat && closestMonster) {
        // AoE skills when multiple enemies nearby
        const nearbyEnemies = gameState.monsters.filter(m =>
            heuristic(gameState.player.x, gameState.player.y, m.x, m.y) <= 2
        ).length;

        if (nearbyEnemies >= 2 && canUseSkill('whirlwind')) {
            useSkill('whirlwind');
            return;
        }

        // High damage skills
        if (canUseSkill('backstab')) {
            useSkill('backstab');
            return;
        }
        if (canUseSkill('lightning')) {
            useSkill('lightning');
            return;
        }
        if (canUseSkill('fireball')) {
            useSkill('fireball');
            return;
        }

        // Stun for tough enemies
        if ((closestMonster.isBoss || closestMonster.isMiniBoss) && canUseSkill('shieldBash')) {
            useSkill('shieldBash');
            return;
        }

        // Other offensive skills
        if (canUseSkill('iceSpike')) {
            useSkill('iceSpike');
            return;
        }
        if (canUseSkill('poisonBlade')) {
            useSkill('poisonBlade');
            return;
        }
        if (canUseSkill('shadowstep')) {
            useSkill('shadowstep');
            return;
        }
    }

    // Priority 4: Buff skills when near monsters (prepare for combat)
    if (nearMonster) {
        if (canUseSkill('battleCry')) {
            useSkill('battleCry');
            return;
        }
        if (canUseSkill('berserkerRage') && hpPercent > 0.6) {
            useSkill('berserkerRage');
            return;
        }
    }
}

function useBossAbility(boss, ability) {
    switch (ability.type) {
        case 'aoe':
            const aoeDmg = Math.floor(boss.attack * ability.damage);
            gameState.run.currentHp -= aoeDmg;
            showDamageNumber(gameState.player.x, gameState.player.y, aoeDmg, 'player-damage', true);
            addLog(`${boss.name} uses AoE attack!`, 'monster-action');
            break;
        case 'summon':
            for (let i = 0; i < ability.count; i++) {
                const pos = findDistantPosition(boss.x, boss.y, 3);
                if (pos) {
                    const minion = generateMonster(gameState.run.floor - 5, false, false);
                    minion.x = pos.x;
                    minion.y = pos.y;
                    minion.statusEffects = [];
                    gameState.monsters.push(minion);
                }
            }
            addLog(`${boss.name} summons minions!`, 'monster-action');
            break;
        case 'heal':
            const healAmt = Math.floor(boss.maxHp * ability.amount);
            boss.currentHp = Math.min(boss.maxHp, boss.currentHp + healAmt);
            showDamageNumber(boss.x, boss.y, healAmt, 'heal', false);
            addLog(`${boss.name} heals!`, 'monster-action');
            break;
    }
    updatePlayerHealthBar();
}

function useMiniBossAbility(m, distToPlayer, dt) {
    switch (m.miniBossType) {
        case 'enrage':
            // Berserker: Gains attack when below 50% HP
            if (m.currentHp < m.maxHp * 0.5 && !m.enraged) {
                m.enraged = true;
                m.attack = Math.floor(m.attack * 1.5);
                m.speed *= 1.3;
                addLog(`${m.name} becomes enraged!`, 'monster-action');
                addVisualEffect('levelup', m.x * TILE_SIZE + TILE_SIZE/2, m.y * TILE_SIZE + TILE_SIZE/2, 0.5);
            }
            break;

        case 'shield':
            // Guardian: Gains shield every 8 seconds
            if (m.abilityTimer >= 8) {
                m.abilityTimer = 0;
                m.shield = Math.floor(m.maxHp * 0.2);
                addLog(`${m.name} raises a shield!`, 'monster-action');
            }
            break;

        case 'shadowStrike':
            // Assassin: Teleports and crits every 6 seconds
            if (m.abilityTimer >= 6 && distToPlayer > 1) {
                m.abilityTimer = 0;
                // Teleport near player
                const positions = [
                    { x: gameState.player.x + 1, y: gameState.player.y },
                    { x: gameState.player.x - 1, y: gameState.player.y },
                    { x: gameState.player.x, y: gameState.player.y + 1 },
                    { x: gameState.player.x, y: gameState.player.y - 1 }
                ].filter(p => p.x >= 0 && p.x < GRID_WIDTH && p.y >= 0 && p.y < GRID_HEIGHT && gameState.grid[p.y][p.x] === TILE.FLOOR);
                if (positions.length) {
                    const pos = positions[Math.floor(Math.random() * positions.length)];
                    m.x = pos.x;
                    m.y = pos.y;
                    // Bonus damage strike
                    const dmg = Math.floor(m.attack * 2);
                    gameState.run.currentHp -= dmg;
                    showDamageNumber(gameState.player.x, gameState.player.y, dmg, 'player-damage', true);
                    addLog(`${m.name} shadow strikes for ${dmg}!`, 'crit');
                    gameState.screenShake = 6;
                }
            }
            break;

        case 'summon':
            // Necromancer: Summons minions every 12 seconds
            if (m.abilityTimer >= 12) {
                m.abilityTimer = 0;
                for (let i = 0; i < 2; i++) {
                    const pos = findDistantPosition(m.x, m.y, 3);
                    if (pos) {
                        const minion = generateMonster(Math.max(1, gameState.run.floor - 3), false, false);
                        minion.name = 'Skeleton';
                        minion.color = '#c0c0c0';
                        minion.x = pos.x;
                        minion.y = pos.y;
                        minion.moveTimer = 0;
                        minion.attackTimer = 0;
                        minion.statusEffects = [];
                        minion.state = 'chase';
                        gameState.monsters.push(minion);
                    }
                }
                addLog(`${m.name} raises the dead!`, 'monster-action');
            }
            break;

        case 'lifesteal':
            // Vampire: Heals when attacking (handled in monsterAttack)
            // Mark for lifesteal
            m.hasLifesteal = true;
            break;
    }
}

function updateRunBuffs(dt) {
    if (!gameState.runBuffs) return;

    let needsRecalc = false;
    gameState.runBuffs = gameState.runBuffs.filter(buff => {
        if (buff.permanent) return true;
        buff.timer -= dt;
        if (buff.timer <= 0) {
            needsRecalc = true;
            addLog(`${buff.stat} buff expired!`, 'status');
            return false;
        }
        return true;
    });

    if (needsRecalc && gameState.run) {
        const newStats = calculatePlayerStats();
        Object.assign(gameState.run, newStats);
    }
}

function updatePetPosition(dt) {
    if (!gameState.activePet) return;

    const px = gameState.player.x;
    const py = gameState.player.y;

    // Pet follows player with slight delay
    const targetX = px - 1;
    const targetY = py;

    // Smoothly move towards target
    if (gameState.pet.x !== targetX || gameState.pet.y !== targetY) {
        if (Math.abs(gameState.pet.x - targetX) > 3 || Math.abs(gameState.pet.y - targetY) > 3) {
            // Teleport if too far
            gameState.pet.x = targetX;
            gameState.pet.y = targetY;
        } else {
            // Move towards player
            if (gameState.pet.x < targetX) gameState.pet.x++;
            else if (gameState.pet.x > targetX) gameState.pet.x--;
            if (gameState.pet.y < targetY) gameState.pet.y++;
            else if (gameState.pet.y > targetY) gameState.pet.y--;
        }
    }
}

// ==========================================
// RENDERING
// ==========================================

function render() {
    if (!gameState.grid.length) return;

    ctx.save();
    const time = Date.now() / 1000; // For animations

    // Screen shake
    if (gameState.screenShake > 0) {
        const shake = gameState.screenShake;
        ctx.translate(
            (Math.random() - 0.5) * shake,
            (Math.random() - 0.5) * shake
        );
    }

    const biome = getCurrentBiome();
    ctx.fillStyle = biome.floorColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate player light position for ambient lighting
    const playerLightX = gameState.player.x * TILE_SIZE + TILE_SIZE / 2;
    const playerLightY = gameState.player.y * TILE_SIZE + TILE_SIZE / 2;
    const lightRadius = TILE_SIZE * 8;

    // Draw tiles with enhanced graphics (sprites with procedural fallback)
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const tile = gameState.grid[y][x];
            const px = x * TILE_SIZE, py = y * TILE_SIZE;
            const cx = px + TILE_SIZE / 2, cy = py + TILE_SIZE / 2;

            // Calculate distance from player for lighting
            const distFromPlayer = Math.sqrt((cx - playerLightX) ** 2 + (cy - playerLightY) ** 2);
            const lightIntensity = Math.max(0.3, 1 - (distFromPlayer / lightRadius) * 0.5);

            // Try sprite rendering first
            if (renderTileSprite(ctx, tile, x, y, TILE_SIZE, { alpha: lightIntensity })) {
                continue; // Sprite rendered successfully, skip procedural
            }

            // Procedural fallback below
            if (tile === TILE.FLOOR) {
                // Enhanced floor with stone texture
                const hash = ((x * 12345 + y * 67890) % 100) / 100;
                const hash2 = ((x * 67890 + y * 12345) % 100) / 100;
                const baseShade = -5 + hash * 15;
                const baseColor = shadeColor(biome.floorColor, baseShade + (lightIntensity - 0.6) * 40);

                // Main floor tile
                ctx.fillStyle = baseColor;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                // Stone texture - grout lines
                ctx.fillStyle = shadeColor(biome.floorColor, -25);
                ctx.fillRect(px, py, TILE_SIZE, 1);
                ctx.fillRect(px, py, 1, TILE_SIZE);

                // Random stone variations
                if (hash < 0.15) {
                    // Crack
                    ctx.strokeStyle = shadeColor(biome.floorColor, -20);
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(px + TILE_SIZE * hash2, py);
                    ctx.lineTo(px + TILE_SIZE * (1 - hash2), py + TILE_SIZE);
                    ctx.stroke();
                } else if (hash < 0.25) {
                    // Dark spot/stain
                    ctx.fillStyle = shadeColor(biome.floorColor, -15);
                    ctx.beginPath();
                    ctx.arc(cx + (hash2 - 0.5) * TILE_SIZE * 0.5, cy + (hash - 0.5) * TILE_SIZE * 0.5, TILE_SIZE * 0.15, 0, Math.PI * 2);
                    ctx.fill();
                } else if (hash < 0.32) {
                    // Small pebble
                    ctx.fillStyle = shadeColor(biome.floorColor, 15);
                    ctx.beginPath();
                    ctx.arc(px + TILE_SIZE * hash2, py + TILE_SIZE * hash, TILE_SIZE * 0.08, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Subtle highlight on some tiles
                if ((x + y) % 3 === 0) {
                    ctx.fillStyle = `rgba(255,255,255,${0.03 * lightIntensity})`;
                    ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                }
            } else if (tile === TILE.WALL) {
                // Enhanced 3D wall with stone brick texture
                const hash = ((x * 54321 + y * 98765) % 100) / 100;
                const wallDark = shadeColor(biome.wallColor, -40);
                const wallMid = biome.wallColor;
                const wallLight = shadeColor(biome.wallColor, 50);
                const wallHighlight = shadeColor(biome.wallColor, 70);

                // Base dark shadow
                ctx.fillStyle = wallDark;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                // Main wall face with gradient
                const wallGrad = ctx.createLinearGradient(px, py, px, py + TILE_SIZE);
                wallGrad.addColorStop(0, wallLight);
                wallGrad.addColorStop(0.3, wallMid);
                wallGrad.addColorStop(1, wallDark);
                ctx.fillStyle = wallGrad;
                ctx.fillRect(px, py, TILE_SIZE - 2, TILE_SIZE - 2);

                // Top edge highlight
                ctx.fillStyle = wallHighlight;
                ctx.fillRect(px, py, TILE_SIZE - 2, 2);

                // Left edge highlight
                ctx.fillStyle = shadeColor(biome.wallColor, 30);
                ctx.fillRect(px, py, 2, TILE_SIZE - 2);

                // Brick pattern (horizontal lines)
                if (TILE_SIZE > 12) {
                    ctx.fillStyle = wallDark;
                    ctx.fillRect(px + 1, py + Math.floor(TILE_SIZE * 0.33), TILE_SIZE - 4, 1);
                    ctx.fillRect(px + 1, py + Math.floor(TILE_SIZE * 0.66), TILE_SIZE - 4, 1);

                    // Vertical brick offset
                    const vOffset = (y % 2 === 0) ? TILE_SIZE * 0.5 : 0;
                    ctx.fillRect(px + vOffset + TILE_SIZE * 0.25, py + 1, 1, TILE_SIZE * 0.32);
                    ctx.fillRect(px + (vOffset + TILE_SIZE * 0.75) % TILE_SIZE, py + TILE_SIZE * 0.34, 1, TILE_SIZE * 0.32);
                }

                // Random wall details
                if (hash < 0.08) {
                    // Moss/lichen
                    ctx.fillStyle = 'rgba(80, 120, 60, 0.4)';
                    ctx.beginPath();
                    ctx.arc(px + TILE_SIZE * 0.7, py + TILE_SIZE * 0.8, TILE_SIZE * 0.15, 0, Math.PI * 2);
                    ctx.fill();
                } else if (hash < 0.12) {
                    // Crack in wall
                    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(px + TILE_SIZE * 0.3, py);
                    ctx.lineTo(px + TILE_SIZE * 0.5, py + TILE_SIZE * 0.5);
                    ctx.lineTo(px + TILE_SIZE * 0.4, py + TILE_SIZE);
                    ctx.stroke();
                }

                // Check if this wall should have a torch (sparse placement)
                if ((x * 7 + y * 11) % 23 === 0 && y > 0 && gameState.grid[y-1] && gameState.grid[y-1][x] === TILE.FLOOR) {
                    // Torch holder
                    ctx.fillStyle = '#4a3728';
                    ctx.fillRect(cx - 2, py + TILE_SIZE * 0.2, 4, TILE_SIZE * 0.3);

                    // Torch flame (animated)
                    const flicker = Math.sin(time * 10 + x + y) * 2;
                    const flameHeight = TILE_SIZE * 0.25 + flicker;

                    // Flame glow
                    const glowGrad = ctx.createRadialGradient(cx, py + TILE_SIZE * 0.15, 0, cx, py + TILE_SIZE * 0.15, TILE_SIZE * 0.5);
                    glowGrad.addColorStop(0, 'rgba(255, 150, 50, 0.4)');
                    glowGrad.addColorStop(1, 'rgba(255, 100, 0, 0)');
                    ctx.fillStyle = glowGrad;
                    ctx.beginPath();
                    ctx.arc(cx, py + TILE_SIZE * 0.15, TILE_SIZE * 0.5, 0, Math.PI * 2);
                    ctx.fill();

                    // Flame
                    ctx.fillStyle = '#ff6600';
                    ctx.beginPath();
                    ctx.moveTo(cx - 3, py + TILE_SIZE * 0.2);
                    ctx.quadraticCurveTo(cx - 2 + flicker * 0.3, py + TILE_SIZE * 0.1 - flameHeight * 0.5, cx, py + TILE_SIZE * 0.05 - flicker);
                    ctx.quadraticCurveTo(cx + 2 - flicker * 0.3, py + TILE_SIZE * 0.1 - flameHeight * 0.5, cx + 3, py + TILE_SIZE * 0.2);
                    ctx.fill();

                    // Inner flame
                    ctx.fillStyle = '#ffcc00';
                    ctx.beginPath();
                    ctx.moveTo(cx - 1.5, py + TILE_SIZE * 0.2);
                    ctx.quadraticCurveTo(cx, py + TILE_SIZE * 0.1, cx + 1.5, py + TILE_SIZE * 0.2);
                    ctx.fill();
                }
            } else if (tile === TILE.CHEST) {
                ctx.fillStyle = (x + y) % 2 === 0 ? biome.floorColor : shadeColor(biome.floorColor, -10);
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                // Chest glow
                const glowPulse = 0.3 + Math.sin(time * 3) * 0.1;
                ctx.fillStyle = `rgba(255, 215, 0, ${glowPulse})`;
                ctx.beginPath();
                ctx.arc(cx, cy, TILE_SIZE * 0.5, 0, Math.PI * 2);
                ctx.fill();
                // Chest body with gradient effect
                ctx.fillStyle = '#6d3a0a';
                ctx.fillRect(px + 2, py + TILE_SIZE * 0.45, TILE_SIZE - 4, TILE_SIZE * 0.45);
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(px + 2, py + TILE_SIZE * 0.45, TILE_SIZE - 4, TILE_SIZE * 0.35);
                // Chest lid (curved top)
                ctx.fillStyle = '#A0522D';
                ctx.beginPath();
                ctx.moveTo(px + 1, py + TILE_SIZE * 0.45);
                ctx.quadraticCurveTo(cx, py + TILE_SIZE * 0.2, px + TILE_SIZE - 1, py + TILE_SIZE * 0.45);
                ctx.fill();
                // Gold clasp
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(cx - 2, py + TILE_SIZE * 0.4, 4, 5);
                // Shine
                ctx.fillStyle = '#ffe066';
                ctx.fillRect(cx - 1, py + TILE_SIZE * 0.42, 2, 2);
            } else if (tile === TILE.TRAP) {
                ctx.fillStyle = (x + y) % 2 === 0 ? biome.floorColor : shadeColor(biome.floorColor, -10);
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                // Danger glow
                ctx.fillStyle = 'rgba(220, 53, 69, 0.15)';
                ctx.beginPath();
                ctx.arc(cx, cy, TILE_SIZE * 0.4, 0, Math.PI * 2);
                ctx.fill();
                // Enhanced spikes
                const spikes = 3;
                for (let i = 0; i < spikes; i++) {
                    const sx = px + (TILE_SIZE / (spikes + 1)) * (i + 1);
                    // Spike shadow
                    ctx.fillStyle = '#333';
                    ctx.beginPath();
                    ctx.moveTo(sx - 2, py + TILE_SIZE - 1);
                    ctx.lineTo(sx, py + 3);
                    ctx.lineTo(sx + 2, py + TILE_SIZE - 1);
                    ctx.fill();
                    // Spike
                    ctx.fillStyle = '#6a6a6a';
                    ctx.beginPath();
                    ctx.moveTo(sx - 2, py + TILE_SIZE - 2);
                    ctx.lineTo(sx, py + 4);
                    ctx.lineTo(sx + 2, py + TILE_SIZE - 2);
                    ctx.fill();
                    // Spike tip highlight
                    ctx.fillStyle = '#8a8a8a';
                    ctx.beginPath();
                    ctx.moveTo(sx - 1, py + 6);
                    ctx.lineTo(sx, py + 4);
                    ctx.lineTo(sx + 1, py + 6);
                    ctx.fill();
                }
            } else if (tile === TILE.NPC) {
                ctx.fillStyle = (x + y) % 2 === 0 ? biome.floorColor : shadeColor(biome.floorColor, -10);
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                // NPC glow
                ctx.fillStyle = 'rgba(74, 158, 255, 0.2)';
                ctx.beginPath();
                ctx.arc(cx, cy, TILE_SIZE * 0.45, 0, Math.PI * 2);
                ctx.fill();
                // NPC robe
                ctx.fillStyle = '#3a7bd5';
                ctx.beginPath();
                ctx.moveTo(cx - TILE_SIZE * 0.3, py + TILE_SIZE * 0.9);
                ctx.lineTo(cx, py + TILE_SIZE * 0.4);
                ctx.lineTo(cx + TILE_SIZE * 0.3, py + TILE_SIZE * 0.9);
                ctx.fill();
                // NPC body highlight
                ctx.fillStyle = '#4a9eff';
                ctx.beginPath();
                ctx.arc(cx, py + TILE_SIZE * 0.55, TILE_SIZE * 0.18, 0, Math.PI * 2);
                ctx.fill();
                // NPC head
                ctx.fillStyle = '#FFE4C4';
                ctx.beginPath();
                ctx.arc(cx, py + TILE_SIZE * 0.32, TILE_SIZE * 0.18, 0, Math.PI * 2);
                ctx.fill();
                // Eyes
                ctx.fillStyle = '#333';
                ctx.fillRect(cx - 3, py + TILE_SIZE * 0.3, 2, 2);
                ctx.fillRect(cx + 1, py + TILE_SIZE * 0.3, 2, 2);
            } else if (tile === TILE.SHRINE) {
                ctx.fillStyle = (x + y) % 2 === 0 ? biome.floorColor : shadeColor(biome.floorColor, -10);
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                // Animated glow
                const shrinePulse = 0.3 + Math.sin(time * 2) * 0.15;
                ctx.fillStyle = `rgba(155, 89, 182, ${shrinePulse})`;
                ctx.beginPath();
                ctx.arc(cx, cy - TILE_SIZE * 0.1, TILE_SIZE * 0.5, 0, Math.PI * 2);
                ctx.fill();
                // Pedestal
                ctx.fillStyle = '#4a3a5a';
                ctx.fillRect(px + 3, py + TILE_SIZE * 0.65, TILE_SIZE - 6, TILE_SIZE * 0.3);
                ctx.fillStyle = '#5a4a6a';
                ctx.fillRect(px + 2, py + TILE_SIZE * 0.6, TILE_SIZE - 4, TILE_SIZE * 0.1);
                // Crystal with inner glow
                const crystalGlow = 0.8 + Math.sin(time * 3) * 0.2;
                ctx.fillStyle = `rgba(180, 120, 220, ${crystalGlow})`;
                ctx.beginPath();
                ctx.moveTo(cx, py + 2);
                ctx.lineTo(px + TILE_SIZE - 3, py + TILE_SIZE * 0.55);
                ctx.lineTo(px + 3, py + TILE_SIZE * 0.55);
                ctx.closePath();
                ctx.fill();
                // Crystal outline
                ctx.strokeStyle = '#9b59b6';
                ctx.lineWidth = 1;
                ctx.stroke();
            } else if (tile === TILE.FOUNTAIN) {
                ctx.fillStyle = (x + y) % 2 === 0 ? biome.floorColor : shadeColor(biome.floorColor, -10);
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                // Water glow
                const waterPulse = 0.25 + Math.sin(time * 2.5) * 0.1;
                ctx.fillStyle = `rgba(23, 162, 184, ${waterPulse})`;
                ctx.beginPath();
                ctx.arc(cx, cy, TILE_SIZE * 0.45, 0, Math.PI * 2);
                ctx.fill();
                // Stone basin outer
                ctx.fillStyle = '#4a5a6a';
                ctx.beginPath();
                ctx.arc(cx, py + TILE_SIZE * 0.6, TILE_SIZE * 0.38, 0, Math.PI * 2);
                ctx.fill();
                // Stone basin inner
                ctx.fillStyle = '#3a4a5a';
                ctx.beginPath();
                ctx.arc(cx, py + TILE_SIZE * 0.6, TILE_SIZE * 0.3, 0, Math.PI * 2);
                ctx.fill();
                // Animated water
                const waterOffset = Math.sin(time * 4) * 2;
                ctx.fillStyle = '#17a2b8';
                ctx.beginPath();
                ctx.arc(cx + waterOffset * 0.2, py + TILE_SIZE * 0.58, TILE_SIZE * 0.22, 0, Math.PI * 2);
                ctx.fill();
                // Water sparkles
                ctx.fillStyle = '#7dd3e8';
                ctx.beginPath();
                ctx.arc(cx - 2 + Math.sin(time * 5) * 2, py + TILE_SIZE * 0.5, 1.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#a0e7f0';
                ctx.beginPath();
                ctx.arc(cx + 2 + Math.cos(time * 4) * 2, py + TILE_SIZE * 0.55, 1, 0, Math.PI * 2);
                ctx.fill();
            } else if (tile === TILE.ALTAR) {
                ctx.fillStyle = (x + y) % 2 === 0 ? biome.floorColor : shadeColor(biome.floorColor, -10);
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                // Evil pulsing glow
                const evilPulse = 0.3 + Math.sin(time * 1.5) * 0.15;
                ctx.fillStyle = `rgba(108, 29, 69, ${evilPulse})`;
                ctx.beginPath();
                ctx.arc(cx, cy, TILE_SIZE * 0.5, 0, Math.PI * 2);
                ctx.fill();
                // Altar base
                ctx.fillStyle = '#2a0a1a';
                ctx.fillRect(px + 2, py + TILE_SIZE * 0.55, TILE_SIZE - 4, TILE_SIZE * 0.4);
                // Altar top slab
                ctx.fillStyle = '#4c1d35';
                ctx.fillRect(px + 1, py + TILE_SIZE * 0.45, TILE_SIZE - 2, TILE_SIZE * 0.15);
                ctx.fillStyle = '#6c1d45';
                ctx.fillRect(px, py + TILE_SIZE * 0.4, TILE_SIZE, TILE_SIZE * 0.1);
                // Skull
                ctx.fillStyle = '#ddd';
                ctx.beginPath();
                ctx.arc(cx, py + TILE_SIZE * 0.28, TILE_SIZE * 0.14, 0, Math.PI * 2);
                ctx.fill();
                // Skull eye sockets
                ctx.fillStyle = '#111';
                ctx.beginPath();
                ctx.arc(cx - 3, py + TILE_SIZE * 0.26, 2, 0, Math.PI * 2);
                ctx.arc(cx + 3, py + TILE_SIZE * 0.26, 2, 0, Math.PI * 2);
                ctx.fill();
                // Glowing eyes effect
                const eyeGlow = 0.5 + Math.sin(time * 3) * 0.3;
                ctx.fillStyle = `rgba(255, 0, 0, ${eyeGlow})`;
                ctx.beginPath();
                ctx.arc(cx - 3, py + TILE_SIZE * 0.26, 1.5, 0, Math.PI * 2);
                ctx.arc(cx + 3, py + TILE_SIZE * 0.26, 1.5, 0, Math.PI * 2);
                ctx.fill();
            } else if (tile === TILE.EXIT) {
                // Draw floor beneath
                ctx.fillStyle = (x + y) % 2 === 0 ? biome.floorColor : shadeColor(biome.floorColor, -10);
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                // Swirling portal effect
                const portalPulse = 0.4 + Math.sin(time * 3) * 0.2;
                const portalRotation = time * 2;
                // Outer glow
                ctx.fillStyle = `rgba(100, 200, 255, ${portalPulse * 0.5})`;
                ctx.beginPath();
                ctx.arc(cx, cy, TILE_SIZE * 0.6, 0, Math.PI * 2);
                ctx.fill();
                // Portal ring
                ctx.strokeStyle = `rgba(50, 150, 255, ${portalPulse})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(cx, cy, TILE_SIZE * 0.4, 0, Math.PI * 2);
                ctx.stroke();
                // Inner portal (dark center)
                const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, TILE_SIZE * 0.35);
                gradient.addColorStop(0, '#001030');
                gradient.addColorStop(0.7, '#003080');
                gradient.addColorStop(1, 'rgba(50, 150, 255, 0.5)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(cx, cy, TILE_SIZE * 0.35, 0, Math.PI * 2);
                ctx.fill();
                // Swirling particles inside
                for (let i = 0; i < 4; i++) {
                    const angle = portalRotation + (i * Math.PI / 2);
                    const dist = TILE_SIZE * 0.2 * (0.5 + Math.sin(time * 4 + i) * 0.3);
                    const sparkX = cx + Math.cos(angle) * dist;
                    const sparkY = cy + Math.sin(angle) * dist;
                    ctx.fillStyle = `rgba(200, 230, 255, ${0.6 + Math.sin(time * 5 + i) * 0.3})`;
                    ctx.beginPath();
                    ctx.arc(sparkX, sparkY, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                // Downward arrow indicator
                ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(time * 4) * 0.3})`;
                ctx.beginPath();
                ctx.moveTo(cx, cy + TILE_SIZE * 0.15);
                ctx.lineTo(cx - 4, cy - TILE_SIZE * 0.1);
                ctx.lineTo(cx + 4, cy - TILE_SIZE * 0.1);
                ctx.closePath();
                ctx.fill();
            }
        }
    }

    // Draw ambient particles (dust motes, etc)
    if (!gameState.ambientParticles) gameState.ambientParticles = [];
    if (gameState.ambientParticles.length < 20 && Math.random() < 0.1) {
        gameState.ambientParticles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: 1 + Math.random() * 2,
            speed: 0.2 + Math.random() * 0.3,
            alpha: 0.1 + Math.random() * 0.2
        });
    }
    gameState.ambientParticles = gameState.ambientParticles.filter(p => {
        p.y -= p.speed;
        p.x += Math.sin(time + p.y * 0.05) * 0.3;
        if (p.y < -10) return false;
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        return true;
    });

    // Draw visual effects (behind entities)
    gameState.visualEffects.filter(e => e.type === 'ground').forEach(e => {
        const progress = 1 - (e.duration / e.maxDuration);
        ctx.globalAlpha = 1 - progress;
        ctx.fillStyle = e.color || '#fff';
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius * (1 + progress), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });

    // Draw monsters with enhanced visuals (sprites with procedural fallback)
    gameState.monsters.forEach(m => {
        const mx = m.x * TILE_SIZE + TILE_SIZE / 2;
        const my = m.y * TILE_SIZE + TILE_SIZE / 2;
        const bounce = Math.sin(time * 5 + m.x + m.y) * 1; // Idle bounce
        const spriteSize = (m.isBoss ? TILE_SIZE * 1.2 : (m.isMiniBoss ? TILE_SIZE * 1.1 : TILE_SIZE * 0.9));

        // Try sprite rendering for monster body
        const spriteRendered = renderMonsterSprite(ctx, m, mx, my + bounce, spriteSize, {
            flipX: gameState.player.x < m.x
        });

        // If sprite rendered, just draw health bar and skip procedural body
        if (spriteRendered) {
            // Health bar (always procedural)
            const barWidth = TILE_SIZE * 0.9;
            const barHeight = 4;
            const hpPercent = m.currentHp / m.maxHp;
            const barY = my + bounce - spriteSize / 2 - 8;
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.beginPath();
            ctx.roundRect(mx - barWidth/2 - 1, barY - 1, barWidth + 2, barHeight + 2, 2);
            ctx.fill();
            ctx.fillStyle = hpPercent > 0.5 ? '#28a745' : (hpPercent > 0.25 ? '#ffc107' : '#dc3545');
            ctx.beginPath();
            ctx.roundRect(mx - barWidth/2, barY, barWidth * hpPercent, barHeight, 2);
            ctx.fill();
            return; // Skip procedural rendering
        }

        // Procedural pixel-art monster rendering
        const monsterSize = m.isBoss ? TILE_SIZE * 1.6 : (m.isMiniBoss ? TILE_SIZE * 1.3 : TILE_SIZE * 1.1);
        drawProceduralMonster(ctx, mx, my + bounce, monsterSize, m, time);

        // Health bar with better styling
        const barWidth = TILE_SIZE * 0.9;
        const barHeight = 4;
        const hpPercent = m.currentHp / m.maxHp;
        const barY = my + bounce - monsterSize / 2 - 10;

        // Bar background
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.beginPath();
        ctx.roundRect(mx - barWidth/2 - 1, barY - 1, barWidth + 2, barHeight + 2, 2);
        ctx.fill();

        // Health fill with gradient
        const hpColor = m.isBoss ? '#dc3545' : (m.isMiniBoss ? '#e74c3c' : (m.isElite ? '#9b59b6' : '#28a745'));
        const hpGradient = ctx.createLinearGradient(mx - barWidth/2, 0, mx - barWidth/2 + barWidth * hpPercent, 0);
        hpGradient.addColorStop(0, shadeColor(hpColor, 20));
        hpGradient.addColorStop(1, hpColor);
        ctx.fillStyle = hpGradient;
        ctx.beginPath();
        ctx.roundRect(mx - barWidth/2, barY, barWidth * hpPercent, barHeight, 2);
        ctx.fill();

        // Shield bar (for Guardian mini-boss)
        if (m.shield && m.shield > 0) {
            const shieldPercent = m.shield / (m.maxHp * 0.2);
            ctx.fillStyle = '#3498db';
            ctx.beginPath();
            ctx.roundRect(mx - barWidth/2, barY - 5, barWidth * shieldPercent, 3, 1);
            ctx.fill();
        }

        // Boss crown indicator
        if (m.isBoss) {
            // Crown
            const crownY = my + bounce - monsterSize / 2 - 2;
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.moveTo(mx - monsterSize * 0.2, crownY);
            ctx.lineTo(mx - monsterSize * 0.1, crownY - 6);
            ctx.lineTo(mx, crownY - 3);
            ctx.lineTo(mx + monsterSize * 0.1, crownY - 6);
            ctx.lineTo(mx + monsterSize * 0.2, crownY);
            ctx.closePath();
            ctx.fill();
            // Gem on crown
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(mx, crownY - 4, 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (m.isMiniBoss || m.isElite) {
            ctx.fillStyle = m.isMiniBoss ? '#e74c3c' : '#9b59b6';
            ctx.beginPath();
            ctx.arc(mx, barY - 6, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Draw pet with enhanced visuals (sprites with procedural fallback)
    if (gameState.activePet && gameState.pet) {
        const pet = PET_TYPES.find(p => p.id === gameState.activePet);
        if (pet) {
            const petX = gameState.pet.x * TILE_SIZE + TILE_SIZE / 2;
            const petY = gameState.pet.y * TILE_SIZE + TILE_SIZE / 2;
            const petSize = TILE_SIZE * 0.22;
            const petBounce = Math.sin(time * 6) * 1.5;
            const petSpriteSize = TILE_SIZE * 0.7;

            // Try sprite rendering for pet
            if (renderPetSprite(ctx, gameState.activePet, petX, petY + petBounce, petSpriteSize)) {
                // Sprite rendered, continue to next section
            } else {
                // Emoji-based pet rendering fallback
                // Pet-specific aura
                const auraPulse = 0.25 + Math.sin(time * 4) * 0.1;
                ctx.fillStyle = `rgba(${hexToRgb(pet.color)}, ${auraPulse})`;
                ctx.beginPath();
                ctx.arc(petX, petY + petBounce, petSize * 2.2, 0, Math.PI * 2);
                ctx.fill();

                // Pet shadow
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.beginPath();
                ctx.ellipse(petX, petY + petSize * 1.2, petSize * 0.9, petSize * 0.3, 0, 0, Math.PI * 2);
                ctx.fill();

                // Pet body background with gradient
                const petGradient = ctx.createRadialGradient(petX - petSize * 0.3, petY + petBounce - petSize * 0.3, 0, petX, petY + petBounce, petSize * 1.2);
                petGradient.addColorStop(0, shadeColor(pet.color, 50));
                petGradient.addColorStop(0.6, pet.color);
                petGradient.addColorStop(1, shadeColor(pet.color, -30));

                // Outline
                ctx.fillStyle = shadeColor(pet.color, -40);
                ctx.beginPath();
                ctx.arc(petX, petY + petBounce, petSize * 1.15, 0, Math.PI * 2);
                ctx.fill();

                // Main body circle
                ctx.fillStyle = petGradient;
                ctx.beginPath();
                ctx.arc(petX, petY + petBounce, petSize * 1.0, 0, Math.PI * 2);
                ctx.fill();

                // Draw pet emoji icon
                const petIcon = pet.icon || '🐾';
                const petFontSize = petSize * 1.5;
                ctx.font = `${petFontSize}px Arial, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                // Shadow for emoji
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 3;
                ctx.shadowOffsetX = 1;
                ctx.shadowOffsetY = 1;
                ctx.fillText(petIcon, petX, petY + petBounce);
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
            } // End of procedural pet rendering else block
        }
    }

    // Draw player with enhanced visuals (sprites with procedural fallback)
    const px = gameState.player.x * TILE_SIZE + TILE_SIZE / 2;
    const py = gameState.player.y * TILE_SIZE + TILE_SIZE / 2;
    const classColor = CLASSES[gameState.selectedClass]?.color || '#4a9eff';
    const playerSize = TILE_SIZE * 0.35;
    const playerBounce = Math.sin(time * 4) * 0.8;

    // Draw buff auras around player
    if (gameState.runBuffs && gameState.runBuffs.length > 0) {
        gameState.runBuffs.forEach((buff, index) => {
            const auraRadius = TILE_SIZE * 0.7 + index * 4;
            const auraAlpha = 0.3 + Math.sin(time * 3 + index) * 0.15;
            const rotationSpeed = 2 + index * 0.5;

            let auraColor;
            switch(buff.stat) {
                case 'attack':
                    auraColor = '#ff4444'; // Red for attack
                    break;
                case 'berserk':
                    auraColor = '#ff6600'; // Orange for berserk
                    break;
                case 'shield':
                    auraColor = '#6666ff'; // Blue for shield
                    break;
                case 'evasion':
                    auraColor = '#666666'; // Gray for smoke/evasion
                    break;
                default:
                    auraColor = '#ffdd00'; // Gold default
            }

            // Outer rotating ring
            ctx.save();
            ctx.translate(px, py + playerBounce);
            ctx.rotate(time * rotationSpeed);

            ctx.strokeStyle = auraColor;
            ctx.lineWidth = 2;
            ctx.globalAlpha = auraAlpha;

            // Dashed ring effect
            ctx.setLineDash([8, 4]);
            ctx.beginPath();
            ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
            ctx.stroke();

            // Inner glow
            const gradient = ctx.createRadialGradient(0, 0, auraRadius * 0.5, 0, 0, auraRadius);
            gradient.addColorStop(0, 'transparent');
            gradient.addColorStop(0.7, `${auraColor}22`);
            gradient.addColorStop(1, `${auraColor}44`);
            ctx.fillStyle = gradient;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
            ctx.fill();

            // Buff particles
            if (Math.random() < 0.1) {
                const angle = Math.random() * Math.PI * 2;
                spawnParticles(
                    px + Math.cos(angle) * auraRadius * 0.8,
                    py + playerBounce + Math.sin(angle) * auraRadius * 0.8,
                    buff.stat === 'berserk' ? 'fire' : 'sparkle',
                    1
                );
            }

            ctx.restore();
        });
    }

    // Shield visual (if player has active shield)
    if (gameState.run && gameState.run.shield > 0) {
        const shieldAlpha = 0.3 + Math.sin(time * 4) * 0.1;
        const shieldGradient = ctx.createRadialGradient(px, py + playerBounce, 0, px, py + playerBounce, TILE_SIZE * 0.8);
        shieldGradient.addColorStop(0, 'transparent');
        shieldGradient.addColorStop(0.6, `rgba(100, 150, 255, ${shieldAlpha * 0.3})`);
        shieldGradient.addColorStop(0.9, `rgba(100, 150, 255, ${shieldAlpha * 0.6})`);
        shieldGradient.addColorStop(1, `rgba(150, 200, 255, ${shieldAlpha})`);
        ctx.fillStyle = shieldGradient;
        ctx.beginPath();
        ctx.arc(px, py + playerBounce, TILE_SIZE * 0.8, 0, Math.PI * 2);
        ctx.fill();

        // Shield hex pattern
        ctx.strokeStyle = `rgba(150, 200, 255, ${shieldAlpha * 0.5})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + time;
            ctx.beginPath();
            ctx.arc(px + Math.cos(angle) * TILE_SIZE * 0.4, py + playerBounce + Math.sin(angle) * TILE_SIZE * 0.4, TILE_SIZE * 0.15, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    // Try sprite rendering for player
    const playerSpriteSize = TILE_SIZE * 0.95;
    const nearestMonster = gameState.monsters.reduce((nearest, m) => {
        const d = Math.hypot(m.x - gameState.player.x, m.y - gameState.player.y);
        return (!nearest || d < nearest.dist) ? { m, dist: d } : nearest;
    }, null);
    const playerFlipX = nearestMonster && nearestMonster.m.x < gameState.player.x;

    if (renderPlayerSprite(ctx, px, py + playerBounce, playerSpriteSize, gameState.selectedClass, { flipX: playerFlipX })) {
        // Draw HP ring around sprite
        const hpPercent = gameState.run.currentHp / gameState.run.maxHp;
        if (hpPercent < 1) {
            ctx.strokeStyle = hpPercent > 0.5 ? '#28a745' : (hpPercent > 0.25 ? '#ffc107' : '#dc3545');
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(px, py + playerBounce, playerSpriteSize / 2 + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * hpPercent);
            ctx.stroke();
        }
    } else {
        // Procedural pixel-art style player rendering
        drawProceduralPlayer(ctx, px, py, TILE_SIZE * 1.2, gameState.selectedClass, classColor, time);

        // HP indicator ring
        const hpPercent = gameState.run.currentHp / gameState.run.maxHp;
        const ringY = py + Math.sin(time * 4) * 2;
        ctx.strokeStyle = hpPercent > 0.5 ? '#28a745' : (hpPercent > 0.25 ? '#ffc107' : '#dc3545');
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(px, ringY, TILE_SIZE * 0.7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * hpPercent);
        ctx.stroke();

        // HP ring background
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(px, ringY, TILE_SIZE * 0.7, -Math.PI / 2 + Math.PI * 2 * hpPercent, -Math.PI / 2 + Math.PI * 2);
        ctx.stroke();
    } // End of procedural player rendering else block

    // Draw visual effects (above entities)
    gameState.visualEffects.filter(e => e.type !== 'ground').forEach(e => {
        const progress = 1 - (e.duration / e.maxDuration);

        if (e.type === 'attack') {
            ctx.globalAlpha = 1 - progress;
            ctx.strokeStyle = e.color || '#fff';
            ctx.lineWidth = 3 * (1 - progress);
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.radius * (0.5 + progress * 0.5), 0, Math.PI * 2);
            ctx.stroke();
        } else if (e.type === 'levelup') {
            ctx.globalAlpha = 1 - progress;
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(e.x, e.y, TILE_SIZE * progress * 2, 0, Math.PI * 2);
            ctx.stroke();
            // Particles
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2 + progress * Math.PI;
                const dist = TILE_SIZE * progress * 1.5;
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.arc(e.x + Math.cos(angle) * dist, e.y + Math.sin(angle) * dist, 3 * (1 - progress), 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (e.type === 'hit') {
            ctx.globalAlpha = 1 - progress;
            ctx.fillStyle = e.color || '#ff0000';
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2 + e.angle;
                const dist = e.radius * progress;
                ctx.beginPath();
                ctx.arc(e.x + Math.cos(angle) * dist, e.y + Math.sin(angle) * dist, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (e.type === 'projectile') {
            // Projectile animation - moves from start to target
            const currentX = e.x + (e.targetX - e.x) * progress;
            const currentY = e.y + (e.targetY - e.y) * progress;

            ctx.save();
            ctx.translate(currentX, currentY);
            ctx.rotate(e.angle);

            if (e.attackType === 'magic') {
                // Magic orb
                ctx.globalAlpha = 1 - progress * 0.5;
                ctx.shadowBlur = 15;
                ctx.shadowColor = e.color;

                // Outer glow
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 12);
                gradient.addColorStop(0, e.color);
                gradient.addColorStop(0.5, e.color + '88');
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(0, 0, 12, 0, Math.PI * 2);
                ctx.fill();

                // Inner core
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(0, 0, 4, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Throwing knife / dagger
                ctx.globalAlpha = 1 - progress * 0.3;
                ctx.fillStyle = e.color;
                ctx.shadowBlur = 5;
                ctx.shadowColor = e.color;

                // Knife shape
                ctx.beginPath();
                ctx.moveTo(8, 0);
                ctx.lineTo(-4, -3);
                ctx.lineTo(-4, 3);
                ctx.closePath();
                ctx.fill();

                // Blade highlight
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.moveTo(6, 0);
                ctx.lineTo(-2, -1);
                ctx.lineTo(-2, 1);
                ctx.closePath();
                ctx.fill();
            }

            ctx.restore();
            ctx.shadowBlur = 0;
        }
        ctx.globalAlpha = 1;
    });

    // Render particles
    renderParticles(ctx);

    // Render hit flashes (impact effects)
    renderHitFlashes(ctx);

    // Render screen flashes (damage, level up, etc.)
    renderScreenFlashes(ctx);

    // Post-processing effects
    // Vignette effect (darker edges)
    const vignetteGrad = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.width * 0.2,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.8
    );
    vignetteGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignetteGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.1)');
    vignetteGrad.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    ctx.fillStyle = vignetteGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle color overlay based on biome (biome already declared above)
    let overlayColor = 'rgba(0, 0, 30, 0.08)'; // Default dungeon blue
    if (biome.name === 'Frozen Caverns') overlayColor = 'rgba(100, 150, 200, 0.1)';
    else if (biome.name === 'Volcanic Halls') overlayColor = 'rgba(150, 50, 0, 0.1)';
    else if (biome.name === 'Shadow Realm') overlayColor = 'rgba(50, 0, 80, 0.15)';
    else if (biome.name === 'Crystal Depths') overlayColor = 'rgba(100, 0, 150, 0.1)';
    ctx.fillStyle = overlayColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Scanline effect (subtle)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
    for (let i = 0; i < canvas.height; i += 3) {
        ctx.fillRect(0, i, canvas.width, 1);
    }

    // Render day/night overlay
    renderDayNightOverlay();

    // Render minimap
    renderMinimap();

    // Render DPS meter
    renderDPSMeter();

    // Render combo counter if active
    if (gameState.comboCount >= 5) {
        const threshold = getComboThreshold();
        if (threshold) {
            ctx.save();
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = threshold.color;
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            const comboText = `${threshold.name} x${gameState.comboCount}`;
            const textX = canvas.width / 2 - ctx.measureText(comboText).width / 2;
            ctx.strokeText(comboText, textX, 60);
            ctx.fillText(comboText, textX, 60);

            // Combo timer bar
            const barWidth = 100;
            const barHeight = 6;
            const barX = canvas.width / 2 - barWidth / 2;
            const barY = 68;
            const fillPercent = gameState.comboTimer / gameState.comboMaxTime;
            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            ctx.fillStyle = threshold.color;
            ctx.fillRect(barX, barY, barWidth * fillPercent, barHeight);
            ctx.restore();
        }
    }

    // Render stamina bar
    if (gameState.stamina < gameState.maxStamina || gameState.dodgeCooldown > 0) {
        ctx.save();
        const barWidth = 80;
        const barHeight = 8;
        const barX = 10;
        const barY = canvas.height - 30;

        // Background
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Stamina fill
        const staminaPercent = gameState.stamina / gameState.maxStamina;
        ctx.fillStyle = gameState.dodgeCooldown > 0 ? '#666' : '#00CED1';
        ctx.fillRect(barX, barY, barWidth * staminaPercent, barHeight);

        // Border
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Label
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.fillText('STAMINA', barX, barY - 3);
        ctx.restore();
    }

    // Render weather indicator
    if (gameState.currentWeather !== 'clear') {
        const weather = WEATHER_TYPES.find(w => w.id === gameState.currentWeather);
        if (weather) {
            ctx.save();
            ctx.font = '14px Arial';
            ctx.fillStyle = weather.color || '#fff';
            ctx.fillText(`☁ ${weather.name}`, 10, 25);
            ctx.restore();
        }
    }

    // Render time of day indicator
    const phase = getCurrentDayPhase();
    if (phase) {
        ctx.save();
        ctx.font = '12px Arial';
        ctx.fillStyle = phase.tint || '#fff';
        ctx.fillText(`🕐 ${phase.name}`, canvas.width - 80, canvas.height - 10);
        ctx.restore();
    }

    ctx.restore();

    // Update floating health bar position
    if (DOM.player_health_float) {
        DOM.player_health_float.style.left = px + 'px';
        DOM.player_health_float.style.top = (py - 18) + 'px';
    }
}

function getCurrentBiome() {
    const floor = gameState.run?.floor || 1;
    return BIOMES.find(b => floor >= b.floors[0] && floor <= b.floors[1]) || BIOMES[0];
}

function shadeColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

// ==========================================
// UI UPDATES
// ==========================================

function updateAllUI() {
    if (!gameState.run) return;
    const r = gameState.run;

    // Header
    if (DOM.soul_points) DOM.soul_points.textContent = formatNum(gameState.soulPoints);
    if (DOM.current_floor) DOM.current_floor.textContent = r.floor;
    if (DOM.player_level) DOM.player_level.textContent = r.level;
    if (DOM.best_floor) DOM.best_floor.textContent = gameState.bestFloor;
    if (DOM.prestige_level) DOM.prestige_level.textContent = gameState.prestigeLevel;

    // Biome
    const biome = getCurrentBiome();
    if (DOM.biome_indicator) DOM.biome_indicator.textContent = biome.name;

    // Floor type
    const isBoss = r.floor % 10 === 0;
    const isMiniBoss = !isBoss && r.floor % 5 === 0 && r.floor > 0;
    if (DOM.floor_type) {
        DOM.floor_type.textContent = isBoss ? 'BOSS' : (isMiniBoss ? 'MINI-BOSS' : `Floor ${r.floor}`);
        DOM.floor_type.className = `floor-type ${isBoss ? 'boss' : (isMiniBoss ? 'mini-boss' : 'normal')}`;
    }

    // Stats
    if (DOM.stat_hp) DOM.stat_hp.textContent = `${r.currentHp}/${r.maxHp}`;
    if (DOM.stat_attack) DOM.stat_attack.textContent = r.attack;
    if (DOM.stat_defense) DOM.stat_defense.textContent = r.defense;
    if (DOM.stat_speed) DOM.stat_speed.textContent = r.speed.toFixed(2);
    if (DOM.stat_evasion) DOM.stat_evasion.textContent = r.evasion + '%';
    if (DOM.stat_crit_chance) DOM.stat_crit_chance.textContent = r.critChance + '%';
    if (DOM.stat_crit_damage) DOM.stat_crit_damage.textContent = r.critDamage + '%';

    // Class
    if (DOM.class_name) DOM.class_name.textContent = CLASSES[gameState.selectedClass]?.name || 'None';
    if (DOM.class_icon) {
        // Remove all class-specific icons first
        DOM.class_icon.classList.remove('warrior-icon', 'mage-icon', 'rogue-icon');
        // Add the appropriate class icon
        if (gameState.selectedClass) {
            DOM.class_icon.classList.add(`${gameState.selectedClass}-icon`);
        }
    }

    // XP
    const xpNeeded = getXpNeeded(r.level);
    if (DOM.xp_current) DOM.xp_current.textContent = r.xp;
    if (DOM.xp_needed) DOM.xp_needed.textContent = xpNeeded;
    if (DOM.xp_bar) DOM.xp_bar.style.width = (r.xp / xpNeeded * 100) + '%';

    // Monsters
    updateMonstersUI();
    updatePlayerHealthBar();
    updateUpgradeButtons();
    updateSpecialItems();
    updateEquipmentUI();
    updateStatsDisplay();
}

function updateMonstersUI() {
    // Update monsters remaining
    if (DOM.monsters_remaining) {
        DOM.monsters_remaining.textContent = gameState.monsters.length;
    }

    // Update floor objectives UI
    updateFloorObjectivesUI();
}

function updateFloorObjectivesUI() {
    const monstersLeft = gameState.monsters.length;
    const chestsCollected = gameState.chestsCollected || 0;
    const totalChests = gameState.totalChestsOnFloor || 0;
    const exitSpawned = gameState.exitSpawned;

    // Chests objective
    if (DOM.chests_collected) DOM.chests_collected.textContent = chestsCollected;
    if (DOM.chests_total) DOM.chests_total.textContent = totalChests;
    if (DOM.objective_chests) {
        DOM.objective_chests.classList.toggle('completed', chestsCollected >= totalChests);
    }

    // Monsters objective
    if (DOM.objective_monsters) {
        DOM.objective_monsters.classList.toggle('completed', monstersLeft === 0);
    }

    // Exit objective
    if (DOM.exit_status) {
        if (exitSpawned) {
            DOM.exit_status.textContent = 'Open!';
            DOM.exit_status.style.color = '#4fc3f7';
        } else if (monstersLeft === 0) {
            DOM.exit_status.textContent = 'Spawning...';
            DOM.exit_status.style.color = '#ffeb3b';
        } else {
            DOM.exit_status.textContent = 'Locked';
            DOM.exit_status.style.color = '#888';
        }
    }
    if (DOM.objective_exit) {
        DOM.objective_exit.classList.toggle('completed', exitSpawned);
    }
}

function updatePlayerHealthBar() {
    if (!gameState.run) return;
    const percent = Math.max(0, gameState.run.currentHp / gameState.run.maxHp * 100);
    if (DOM.player_health_bar) DOM.player_health_bar.style.width = percent + '%';
}

function updateUpgradeButtons() {
    Object.keys(UPGRADE_CONFIG).forEach(type => {
        const level = gameState.upgrades[type];
        const cost = getUpgradeCost(type);
        const affordable = gameState.soulPoints >= cost;

        const levelEl = document.getElementById(`upgrade-${type}-level`);
        const costEl = document.getElementById(`upgrade-${type}-cost`);
        const btn = document.querySelector(`[data-upgrade="${type}"]`);

        if (levelEl) levelEl.textContent = level;
        if (costEl) costEl.textContent = formatNum(cost);
        if (btn) {
            btn.disabled = !affordable;
            btn.classList.toggle('affordable', affordable);
        }
    });
}

function updateSpecialItems() {
    Object.keys(SPECIAL_ITEMS).forEach(key => {
        const owned = gameState.specialItems[key];
        const btn = document.querySelector(`[data-item="${key}"]`);
        if (btn) {
            if (owned) {
                btn.classList.add('owned');
                btn.disabled = true;
            } else {
                btn.classList.remove('owned');
                btn.disabled = gameState.soulPoints < SPECIAL_ITEMS[key].cost;
            }
        }
    });
}

function updateStatsDisplay() {
    if (DOM.stats_runs) DOM.stats_runs.textContent = gameState.totalRuns;
    if (DOM.stats_kills) DOM.stats_kills.textContent = gameState.stats.monstersKilled;
    if (DOM.stats_damage) DOM.stats_damage.textContent = formatNum(gameState.stats.totalDamage);
    if (DOM.stats_chests) DOM.stats_chests.textContent = gameState.stats.chestsOpened;
    if (DOM.stats_time) DOM.stats_time.textContent = formatTime(gameState.stats.timePlayed);
}

function formatNum(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n.toString();
}

function formatTime(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    return `${h}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

// ==========================================
// VISUAL EFFECTS
// ==========================================

function showDamageNumber(tx, ty, amount, type, isCrit) {
    if (!gameState.settings.showDamage) return;
    const el = document.createElement('div');
    el.className = `damage-number ${type}${isCrit ? ' crit' : ''}`;
    el.textContent = (type === 'heal' ? '+' : type === 'dodge' ? '' : '-') + amount;
    el.style.left = (tx * TILE_SIZE + TILE_SIZE / 2 + (Math.random() * 16 - 8)) + 'px';
    el.style.top = (ty * TILE_SIZE) + 'px';
    DOM.damage_container?.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

function addFloatingText(tx, ty, text, color = '#ffffff', duration = 1.0) {
    const el = document.createElement('div');
    el.className = 'damage-number floating-text';
    el.textContent = text;
    el.style.left = (tx * TILE_SIZE + TILE_SIZE / 2) + 'px';
    el.style.top = (ty * TILE_SIZE) + 'px';
    el.style.color = color;
    el.style.textShadow = `0 0 4px ${color}, 0 2px 4px rgba(0,0,0,0.8)`;
    DOM.damage_container?.appendChild(el);
    setTimeout(() => el.remove(), duration * 1000);
}

function addLog(msg, type = '') {
    if (!gameState.settings.showLog || !DOM.combat_log) return;
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = msg;
    DOM.combat_log.appendChild(entry);
    DOM.combat_log.scrollTop = DOM.combat_log.scrollHeight;
    while (DOM.combat_log.children.length > 50) {
        DOM.combat_log.removeChild(DOM.combat_log.firstChild);
    }
}

// ==========================================
// SHOP FUNCTIONS
// ==========================================

function purchaseUpgrade(type) {
    const cost = getUpgradeCost(type);
    if (gameState.soulPoints >= cost) {
        gameState.soulPoints -= cost;
        gameState.upgrades[type]++;

        if (gameState.gameRunning && gameState.run) {
            const newStats = calculatePlayerStats();
            if (type === 'maxHp') {
                gameState.run.currentHp += newStats.maxHp - gameState.run.maxHp;
            }
            Object.assign(gameState.run, newStats);
        }

        addLog(`Upgraded ${type}!`, 'level-up');
        updateAllUI();
        saveGame();
    }
}

function purchaseSpecialItem(key) {
    const item = SPECIAL_ITEMS[key];
    if (gameState.soulPoints >= item.cost && !gameState.specialItems[key]) {
        gameState.soulPoints -= item.cost;
        gameState.specialItems[key] = true;

        if (gameState.gameRunning && gameState.run) {
            const newStats = calculatePlayerStats();
            if (key === 'lifeCrystal') {
                gameState.run.currentHp += newStats.maxHp - gameState.run.maxHp;
            }
            Object.assign(gameState.run, newStats);
        }

        addLog(`Acquired ${key}!`, 'level-up');
        updateAllUI();
        saveGame();
    }
}

// ==========================================
// SAVE/LOAD
// ==========================================

const SAVE_KEY = 'idleDungeonRunner_v2';

function saveGame() {
    const data = {
        soulPoints: gameState.soulPoints,
        totalRuns: gameState.totalRuns,
        bestFloor: gameState.bestFloor,
        prestigeLevel: gameState.prestigeLevel,
        prestigeMultiplier: gameState.prestigeMultiplier,
        selectedClass: gameState.selectedClass,
        upgrades: gameState.upgrades,
        specialItems: gameState.specialItems,
        achievements: gameState.achievements,
        settings: gameState.settings,
        stats: gameState.stats,
        pets: gameState.pets,
        activePet: gameState.activePet,
        lastSaveTime: Date.now(),
        // New features
        relics: gameState.relics,
        equippedRelics: gameState.equippedRelics,
        ascensionTier: gameState.ascensionTier,
        totalSoulsSpentOnAscension: gameState.totalSoulsSpentOnAscension,
        challengesCompleted: gameState.challengesCompleted,
        dailyRewards: gameState.dailyRewards,
        milestonesUnlocked: gameState.milestonesUnlocked,
        tutorialStep: gameState.tutorialStep
    };
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('Save failed:', e);
    }
}

function loadGame() {
    try {
        const data = JSON.parse(localStorage.getItem(SAVE_KEY));
        if (data) {
            gameState.soulPoints = data.soulPoints || 0;
            gameState.totalRuns = data.totalRuns || 0;
            gameState.bestFloor = data.bestFloor || 0;
            gameState.prestigeLevel = data.prestigeLevel || 0;
            gameState.prestigeMultiplier = data.prestigeMultiplier || 1;
            gameState.selectedClass = data.selectedClass;
            if (data.upgrades) Object.assign(gameState.upgrades, data.upgrades);
            if (data.specialItems) Object.assign(gameState.specialItems, data.specialItems);
            if (data.achievements) gameState.achievements = data.achievements;
            if (data.settings) Object.assign(gameState.settings, data.settings);
            if (data.stats) Object.assign(gameState.stats, data.stats);
            if (data.pets) gameState.pets = data.pets;
            if (data.activePet) gameState.activePet = data.activePet;
            gameState.lastSaveTime = data.lastSaveTime || Date.now();

            // Load new features
            if (data.relics) gameState.relics = data.relics;
            if (data.equippedRelics) gameState.equippedRelics = data.equippedRelics;
            if (data.ascensionTier) gameState.ascensionTier = data.ascensionTier;
            if (data.totalSoulsSpentOnAscension) gameState.totalSoulsSpentOnAscension = data.totalSoulsSpentOnAscension;
            if (data.challengesCompleted) gameState.challengesCompleted = data.challengesCompleted;
            if (data.dailyRewards) gameState.dailyRewards = data.dailyRewards;
            if (data.milestonesUnlocked) gameState.milestonesUnlocked = data.milestonesUnlocked;
            if (data.tutorialStep !== undefined) gameState.tutorialStep = data.tutorialStep;

            // Unlock class skills
            if (gameState.selectedClass) {
                const classData = CLASSES[gameState.selectedClass];
                if (classData.skill) SKILLS[classData.skill].unlocked = true;
            }

            return true;
        }
    } catch (e) {
        console.error('Load failed:', e);
    }
    return false;
}

function exportSave() {
    saveGame();
    const data = localStorage.getItem(SAVE_KEY);
    DOM.save_textarea.value = btoa(data);
    DOM.save_textarea.readOnly = true;
    DOM.save_modal_title.textContent = 'Export Save';
    DOM.save_modal.classList.add('active');
}

function importSave() {
    DOM.save_textarea.value = '';
    DOM.save_textarea.readOnly = false;
    DOM.save_modal_title.textContent = 'Import Save';
    DOM.save_modal.classList.add('active');

    DOM.copy_save.textContent = 'Import';
    DOM.copy_save.onclick = () => {
        try {
            const data = atob(DOM.save_textarea.value);
            localStorage.setItem(SAVE_KEY, data);
            location.reload();
        } catch (e) {
            alert('Invalid save data!');
        }
    };
}

function resetSave() {
    if (confirm('Are you sure? This will delete ALL progress!')) {
        localStorage.removeItem(SAVE_KEY);
        location.reload();
    }
}

setInterval(saveGame, 30000);

// ==========================================
// GAME START
// ==========================================

function startNewRun() {
    // Reset run buffs and run-specific state
    gameState.runBuffs = [];
    gameState.phoenixRebirthUsed = false;
    gameState.floorKills = 0;
    gameState.particles = [];
    if (gameState.activeChallenge) {
        gameState.challengeTimer = 0;
    }

    const stats = calculatePlayerStats();

    gameState.run = {
        floor: 1,
        level: 1,
        xp: 0,
        currentHp: stats.maxHp,
        maxHp: stats.maxHp,
        attack: stats.attack,
        defense: stats.defense,
        speed: stats.speed,
        evasion: stats.evasion,
        critChance: stats.critChance,
        critDamage: stats.critDamage,
        statusEffects: [],
        equipment: { weapon: null, armor: null, accessory: null },
        inventory: [],
        attackTimer: 0,
        moveTimer: 0,
        killsThisRun: 0
    };

    gameState.monsters = [];
    gameState.skillCooldowns = {
        heal: 0, dash: 0,
        whirlwind: 0, shieldBash: 0, battleCry: 0, berserkerRage: 0,
        fireball: 0, iceSpike: 0, lightning: 0, arcaneShield: 0,
        shadowstep: 0, backstab: 0, poisonBlade: 0, smokeBomb: 0
    };

    generateDungeon();
    const pos = findValidPosition();
    gameState.player = { x: pos.x, y: pos.y };

    // Position pet near player
    gameState.pet = { x: pos.x - 1, y: pos.y };

    gameState.gameRunning = true;

    // Start background music and ambient sounds
    const biome = getCurrentBiome();
    playBackgroundMusic(biome.name);
    startAmbientSounds();

    if (DOM.combat_log) DOM.combat_log.innerHTML = '';
    addLog('A new adventure begins...', 'floor-clear');

    updateAllUI();
    updateAchievementsUI();
    updateSkillCooldownsUI();
    updateInventoryUI();
    updateEquipmentUI();
    updatePetsUI();

    setTimeout(() => spawnMonsters(), 500);
}

// Pet shop functions
function purchasePet(petId) {
    const pet = PET_TYPES.find(p => p.id === petId);
    if (!pet || gameState.pets[petId]) return;

    if (gameState.soulPoints >= pet.unlockCost) {
        gameState.soulPoints -= pet.unlockCost;
        gameState.pets[petId] = true;
        addLog(`Unlocked ${pet.name}!`, 'level-up');
        updatePetsUI();
        updateAllUI();
        saveGame();
    }
}

function selectPet(petId) {
    if (!gameState.pets[petId]) return;
    gameState.activePet = gameState.activePet === petId ? null : petId;

    // Recalculate stats with pet bonus
    if (gameState.run) {
        const newStats = calculatePlayerStats();
        Object.assign(gameState.run, newStats);
    }

    addLog(gameState.activePet ? `${PET_TYPES.find(p => p.id === petId).name} is now your companion!` : 'Pet dismissed.', 'player-action');
    updatePetsUI();
    updateAllUI();
    saveGame();
}

function updatePetsUI() {
    const container = document.getElementById('pets-list');
    const activePetName = document.getElementById('active-pet-name');

    // Update active pet display
    if (activePetName) {
        const activePet = PET_TYPES.find(p => p.id === gameState.activePet);
        activePetName.textContent = activePet ? activePet.name : 'None';
    }

    if (!container) return;

    container.innerHTML = '';
    PET_TYPES.forEach(pet => {
        const owned = gameState.pets[pet.id];
        const active = gameState.activePet === pet.id;
        const affordable = gameState.soulPoints >= pet.unlockCost;

        const div = document.createElement('div');
        div.className = `pet-item${owned ? ' owned' : ''}${active ? ' active' : ''}`;
        div.innerHTML = `
            <div class="pet-icon" style="background: ${pet.color}"></div>
            <div class="pet-info">
                <span class="pet-name">${pet.name}</span>
                <span class="pet-desc">${pet.desc}</span>
            </div>
            ${owned ? '<button class="pet-select-btn">' + (active ? 'Active' : 'Select') + '</button>' :
                '<button class="pet-buy-btn"' + (!affordable ? ' disabled' : '') + '>' + pet.unlockCost + ' SP</button>'}
        `;

        if (owned) {
            div.querySelector('.pet-select-btn').onclick = () => selectPet(pet.id);
        } else {
            div.querySelector('.pet-buy-btn').onclick = () => purchasePet(pet.id);
        }

        container.appendChild(div);
    });
}

// ==========================================
// NEW FEATURE IMPLEMENTATIONS
// ==========================================

// === SYNERGY SYSTEM ===
function checkSynergies() {
    const active = [];
    const r = gameState.run;
    if (!r) return active;

    SYNERGIES.forEach(synergy => {
        let isActive = true;
        const req = synergy.requires;

        if (req.class && gameState.selectedClass !== req.class) isActive = false;
        if (req.pet && gameState.activePet !== req.pet) isActive = false;
        if (req.hpBelow && r.currentHp / r.maxHp >= req.hpBelow) isActive = false;
        if (req.kills && gameState.floorKills < req.kills) isActive = false;
        if (req.floor && r.floor < req.floor) isActive = false;
        if (req.defense && r.defense < req.defense) isActive = false;
        if (req.legendaries && gameState.stats.legendariesFound < req.legendaries) isActive = false;

        if (isActive) active.push(synergy);
    });

    gameState.activeSynergies = active.map(s => s.id);
    return active;
}

function getSynergyBonuses() {
    const bonuses = { attack: 0, defense: 0, critChance: 0, critDamage: 0, soulBonus: 0, allStats: 0, dropRate: 0, thorns: 0 };
    const synergies = checkSynergies();

    synergies.forEach(s => {
        if (s.effect.attack) bonuses.attack += s.effect.attack;
        if (s.effect.defense) bonuses.defense += s.effect.defense;
        if (s.effect.critChance) bonuses.critChance += s.effect.critChance;
        if (s.effect.critDamage) bonuses.critDamage += s.effect.critDamage;
        if (s.effect.soulBonus) bonuses.soulBonus += s.effect.soulBonus;
        if (s.effect.allStats) bonuses.allStats += s.effect.allStats;
        if (s.effect.dropRate) bonuses.dropRate += s.effect.dropRate;
        if (s.effect.thorns) bonuses.thorns += s.effect.thorns;
    });

    return bonuses;
}

function checkPhoenixRebirth() {
    if (gameState.phoenixRebirthUsed) return false;
    const synergies = checkSynergies();
    const phoenixSynergy = synergies.find(s => s.id === 'phoenix_rebirth');
    if (phoenixSynergy && gameState.run.currentHp <= gameState.run.maxHp * 0.2) {
        gameState.run.currentHp = Math.floor(gameState.run.maxHp * phoenixSynergy.effect.healBurst);
        gameState.phoenixRebirthUsed = true;
        addLog('Phoenix Rebirth activated! Healed to ' + Math.floor(phoenixSynergy.effect.healBurst * 100) + '% HP!', 'level-up');
        spawnParticles(gameState.player.x * TILE_SIZE, gameState.player.y * TILE_SIZE, 'fire', 20);
        return true;
    }
    return false;
}

// === CHALLENGE MODES ===
function startChallenge(challengeId) {
    const challenge = CHALLENGE_MODES.find(c => c.id === challengeId);
    if (!challenge || gameState.challengesCompleted[challengeId]) return;

    gameState.activeChallenge = { ...challenge, startTime: Date.now() };
    gameState.challengeTimer = 0;
    addLog(`Challenge started: ${challenge.name}!`, 'level-up');
    startNewRun();
}

function checkChallengeConditions() {
    if (!gameState.activeChallenge) return;
    const challenge = gameState.activeChallenge;
    const r = gameState.run;
    if (!r) return;

    let completed = true;
    const cond = challenge.condition;

    if (cond.floor && r.floor < cond.floor) completed = false;
    if (cond.timeLimit && gameState.challengeTimer > cond.timeLimit) {
        addLog('Challenge failed: Time limit exceeded!', 'monster-action');
        gameState.activeChallenge = null;
        return;
    }
    if (cond.elites && gameState.stats.elitesKilled < cond.elites) completed = false;
    if (cond.bossesOnly && !r.floor % 10 === 0) completed = false;

    if (completed) {
        completeChallenge(challenge);
    }
}

function completeChallenge(challenge) {
    gameState.challengesCompleted[challenge.id] = true;
    gameState.soulPoints += challenge.rewards.souls || 0;
    if (challenge.rewards.relic && !gameState.relics.includes(challenge.rewards.relic)) {
        gameState.relics.push(challenge.rewards.relic);
    }
    addLog(`Challenge Complete: ${challenge.name}! +${challenge.rewards.souls} SP`, 'level-up');
    gameState.activeChallenge = null;
    saveGame();
}

function updateChallengesUI() {
    const container = document.getElementById('challenges-list');
    if (!container) return;

    container.innerHTML = '';
    CHALLENGE_MODES.forEach(challenge => {
        const completed = gameState.challengesCompleted[challenge.id];
        const div = document.createElement('div');
        div.className = `challenge-item${completed ? ' completed' : ''}`;
        div.innerHTML = `
            <div class="challenge-info">
                <span class="challenge-name">${challenge.name}</span>
                <span class="challenge-desc">${challenge.desc}</span>
                <span class="challenge-reward">Reward: ${challenge.rewards.souls} SP${challenge.rewards.relic ? ' + Relic' : ''}</span>
            </div>
            ${completed ? '<span class="challenge-status">Completed</span>' : '<button class="challenge-start-btn">Start</button>'}
        `;
        if (!completed) {
            div.querySelector('.challenge-start-btn').onclick = () => startChallenge(challenge.id);
        }
        container.appendChild(div);
    });
}

// === ASCENSION SYSTEM ===
function getAscensionTier() {
    return ASCENSION_TIERS.find(t => t.tier === gameState.ascensionTier) || { bonus: { soulMult: 1, statMult: 1 } };
}

function canAscend() {
    const nextTier = ASCENSION_TIERS.find(t => t.tier === gameState.ascensionTier + 1);
    return nextTier && gameState.soulPoints >= nextTier.requirement;
}

function doAscension() {
    const nextTier = ASCENSION_TIERS.find(t => t.tier === gameState.ascensionTier + 1);
    if (!nextTier || gameState.soulPoints < nextTier.requirement) return;

    gameState.soulPoints -= nextTier.requirement;
    gameState.totalSoulsSpentOnAscension += nextTier.requirement;
    gameState.ascensionTier++;

    // Reset prestige but keep relics
    gameState.prestigeLevel = 0;
    gameState.prestigeMultiplier = 1;

    addLog(`ASCENSION! You are now ${nextTier.name}!`, 'level-up');
    saveGame();
    updateAscensionUI();
    startNewRun();
}

function updateAscensionUI() {
    const container = document.getElementById('ascension-info');
    if (!container) return;

    const current = getAscensionTier();
    const next = ASCENSION_TIERS.find(t => t.tier === gameState.ascensionTier + 1);

    container.innerHTML = `
        <div class="ascension-current">
            <h4>Current Tier: ${current.name || 'None'}</h4>
            <p>Soul Mult: ${current.bonus?.soulMult?.toFixed(1) || 1}x | Stat Mult: ${current.bonus?.statMult?.toFixed(2) || 1}x</p>
        </div>
        ${next ? `
        <div class="ascension-next">
            <h4>Next: ${next.name} (${formatNum(next.requirement)} SP)</h4>
            <p>Soul Mult: ${next.bonus.soulMult}x | Stat Mult: ${next.bonus.statMult}x</p>
            <p>Unlocks: ${next.unlocks.join(', ')}</p>
        </div>
        <button class="ascension-btn" id="ascension-btn" ${!canAscend() ? 'disabled' : ''}>ASCEND</button>
        ` : '<p>Maximum Ascension reached!</p>'}
    `;

    const btn = document.getElementById('ascension-btn');
    if (btn) btn.onclick = doAscension;
}

// === RELIC SYSTEM ===
function getRelicSlots() {
    let slots = 1;
    if (gameState.ascensionTier >= 1) slots++;
    if (gameState.ascensionTier >= 2) slots++;
    if (gameState.milestonesUnlocked['unlock_relic_slot']) slots++;
    return slots;
}

function equipRelic(relicId) {
    if (!gameState.relics.includes(relicId)) return;
    if (gameState.equippedRelics.includes(relicId)) {
        gameState.equippedRelics = gameState.equippedRelics.filter(r => r !== relicId);
        addLog(`Unequipped ${RELICS.find(r => r.id === relicId)?.name}`, 'player-action');
    } else if (gameState.equippedRelics.length < getRelicSlots()) {
        gameState.equippedRelics.push(relicId);
        addLog(`Equipped ${RELICS.find(r => r.id === relicId)?.name}`, 'level-up');
    }
    updateRelicsUI();
    saveGame();
}

function getRelicBonuses() {
    const bonuses = { speedBonus: 0, soulBonus: 0, lifesteal: 0, critMultiplier: 0, damageReduction: 0, luckBonus: 0, xpBonus: 0, bossDamage: 0, eliteBonus: 0, allStats: 0 };

    gameState.equippedRelics.forEach(relicId => {
        const relic = RELICS.find(r => r.id === relicId);
        if (!relic) return;
        Object.keys(relic.effect).forEach(key => {
            if (bonuses[key] !== undefined) bonuses[key] += relic.effect[key];
        });
    });

    return bonuses;
}

function updateRelicsUI() {
    const container = document.getElementById('relics-list');
    if (!container) return;

    container.innerHTML = `<p>Slots: ${gameState.equippedRelics.length}/${getRelicSlots()}</p>`;

    if (gameState.relics.length === 0) {
        container.innerHTML += '<p class="no-relics">No relics found yet. Complete challenges or reach milestones!</p>';
        return;
    }

    gameState.relics.forEach(relicId => {
        const relic = RELICS.find(r => r.id === relicId);
        if (!relic) return;
        const equipped = gameState.equippedRelics.includes(relicId);
        const div = document.createElement('div');
        div.className = `relic-item ${relic.tier}${equipped ? ' equipped' : ''}`;
        div.innerHTML = `
            <div class="relic-icon ${relic.tier}"></div>
            <div class="relic-info">
                <span class="relic-name">${relic.name}</span>
                <span class="relic-desc">${relic.desc}</span>
            </div>
            <button class="relic-equip-btn">${equipped ? 'Unequip' : 'Equip'}</button>
        `;
        div.querySelector('.relic-equip-btn').onclick = () => equipRelic(relicId);
        container.appendChild(div);
    });
}

// === DAILY REWARDS ===
function checkDailyReward() {
    const now = new Date();
    const today = now.toDateString();
    const lastClaim = gameState.dailyRewards.lastClaim;

    if (lastClaim === today) return null; // Already claimed

    // Check if streak continues
    if (lastClaim) {
        const lastDate = new Date(lastClaim);
        const daysDiff = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
        if (daysDiff > 1) {
            gameState.dailyRewards.streak = 0; // Reset streak
        }
    }

    return DAILY_REWARDS[(gameState.dailyRewards.streak % 7)];
}

function claimDailyReward() {
    const reward = checkDailyReward();
    if (!reward) return;

    gameState.dailyRewards.streak++;
    gameState.dailyRewards.lastClaim = new Date().toDateString();

    gameState.soulPoints += reward.reward.souls || 0;

    if (reward.reward.relic && !gameState.relics.includes(reward.reward.relic)) {
        gameState.relics.push(reward.reward.relic);
        addLog(`Received relic: ${RELICS.find(r => r.id === reward.reward.relic)?.name}!`, 'level-up');
    }

    if (reward.reward.item === 'random_equipment' && gameState.run) {
        const item = generateEquipment(Math.max(1, gameState.bestFloor), 1);
        addToInventory(item);
        addLog(`Received: ${item.name}!`, 'level-up');
    }

    if (reward.reward.item === 'legendary_chest' && gameState.run) {
        const item = generateEquipment(Math.max(1, gameState.bestFloor), 4);
        addToInventory(item);
        addLog(`Legendary Chest: ${item.name}!`, 'level-up');
    }

    addLog(`Daily Reward Day ${gameState.dailyRewards.streak}: ${reward.desc}`, 'level-up');
    saveGame();
    updateDailyRewardsUI();
}

function updateDailyRewardsUI() {
    const container = document.getElementById('daily-rewards');
    if (!container) return;

    const canClaim = checkDailyReward() !== null;
    const streak = gameState.dailyRewards.streak;

    container.innerHTML = `
        <div class="daily-streak">
            <span>Login Streak: ${streak} days</span>
        </div>
        <div class="daily-rewards-grid">
            ${DAILY_REWARDS.map((r, i) => `
                <div class="daily-reward-item ${i < (streak % 7) ? 'claimed' : ''} ${i === (streak % 7) && canClaim ? 'available' : ''}">
                    <span class="day-label">Day ${i + 1}</span>
                    <span class="reward-desc">${r.desc}</span>
                </div>
            `).join('')}
        </div>
        <button class="claim-daily-btn" ${!canClaim ? 'disabled' : ''} onclick="claimDailyReward()">
            ${canClaim ? 'Claim Reward!' : 'Come back tomorrow!'}
        </button>
    `;
}

// === MILESTONE UNLOCKS ===
function checkMilestones() {
    MILESTONES.forEach(milestone => {
        if (gameState.milestonesUnlocked[milestone.id]) return;

        let unlocked = true;
        const cond = milestone.condition;

        if (cond.floor && gameState.bestFloor < cond.floor) unlocked = false;
        if (cond.kills && gameState.stats.monstersKilled < cond.kills) unlocked = false;
        if (cond.bosses && gameState.stats.bossesKilled < cond.bosses) unlocked = false;
        if (cond.prestige && gameState.prestigeLevel < cond.prestige) unlocked = false;
        if (cond.timePlayed && gameState.stats.timePlayed < cond.timePlayed) unlocked = false;

        if (unlocked) {
            gameState.milestonesUnlocked[milestone.id] = true;
            addLog(`Milestone Unlocked: ${milestone.desc}`, 'level-up');
            showMilestonePopup(milestone);
            saveGame();
        }
    });
}

function showMilestonePopup(milestone) {
    const popup = document.getElementById('milestone-popup');
    if (!popup) return;
    popup.querySelector('.milestone-text').textContent = milestone.desc;
    popup.classList.add('show');
    setTimeout(() => popup.classList.remove('show'), 3000);
}

function updateMilestonesUI() {
    const container = document.getElementById('milestones-list');
    if (!container) return;

    container.innerHTML = '';
    MILESTONES.forEach(milestone => {
        const unlocked = gameState.milestonesUnlocked[milestone.id];
        const div = document.createElement('div');
        div.className = `milestone-item${unlocked ? ' unlocked' : ''}`;
        div.innerHTML = `
            <span class="milestone-icon">${unlocked ? '✓' : '?'}</span>
            <span class="milestone-desc">${milestone.desc}</span>
        `;
        container.appendChild(div);
    });
}

// === ENHANCED STATISTICS DASHBOARD ===
function updateStatsDashboard() {
    const stats = gameState.stats;
    const dashboard = document.getElementById('stats-dashboard');
    if (!dashboard) return;

    const playTime = formatTime(stats.timePlayed);
    const avgFloor = gameState.totalRuns > 0 ? (gameState.bestFloor / gameState.totalRuns).toFixed(1) : 0;
    const killsPerRun = gameState.totalRuns > 0 ? Math.floor(stats.monstersKilled / gameState.totalRuns) : 0;

    dashboard.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <span class="stat-card-value">${gameState.totalRuns}</span>
                <span class="stat-card-label">Total Runs</span>
            </div>
            <div class="stat-card">
                <span class="stat-card-value">${gameState.bestFloor}</span>
                <span class="stat-card-label">Best Floor</span>
            </div>
            <div class="stat-card">
                <span class="stat-card-value">${formatNum(stats.monstersKilled)}</span>
                <span class="stat-card-label">Monsters Killed</span>
            </div>
            <div class="stat-card">
                <span class="stat-card-value">${stats.bossesKilled}</span>
                <span class="stat-card-label">Bosses Slain</span>
            </div>
            <div class="stat-card">
                <span class="stat-card-value">${stats.elitesKilled}</span>
                <span class="stat-card-label">Elites Killed</span>
            </div>
            <div class="stat-card">
                <span class="stat-card-value">${formatNum(stats.totalDamage)}</span>
                <span class="stat-card-label">Total Damage</span>
            </div>
            <div class="stat-card">
                <span class="stat-card-value">${formatNum(stats.highestDamage)}</span>
                <span class="stat-card-label">Highest Hit</span>
            </div>
            <div class="stat-card">
                <span class="stat-card-value">${stats.chestsOpened}</span>
                <span class="stat-card-label">Chests Opened</span>
            </div>
            <div class="stat-card">
                <span class="stat-card-value">${stats.legendariesFound}</span>
                <span class="stat-card-label">Legendaries</span>
            </div>
            <div class="stat-card">
                <span class="stat-card-value">${formatNum(stats.totalSoulsEarned)}</span>
                <span class="stat-card-label">Total Souls</span>
            </div>
            <div class="stat-card">
                <span class="stat-card-value">${playTime}</span>
                <span class="stat-card-label">Time Played</span>
            </div>
            <div class="stat-card">
                <span class="stat-card-value">${avgFloor}</span>
                <span class="stat-card-label">Avg Floor/Run</span>
            </div>
        </div>
    `;
}

// === SOUND EFFECTS & MUSIC ===
const audioContext = typeof AudioContext !== 'undefined' ? new (window.AudioContext || window.webkitAudioContext)() : null;
let musicGainNode = null;
let currentMusic = null;
let ambientInterval = null;

// Music themes for different biomes
const MUSIC_THEMES = {
    'Stone Dungeon': { baseNote: 110, scale: [0, 2, 3, 5, 7, 8, 10], tempo: 0.8, mood: 'dark' },
    'Frozen Caverns': { baseNote: 130, scale: [0, 2, 4, 5, 7, 9, 11], tempo: 0.6, mood: 'ethereal' },
    'Volcanic Halls': { baseNote: 82, scale: [0, 1, 4, 5, 7, 8, 10], tempo: 1.0, mood: 'intense' },
    'Shadow Realm': { baseNote: 98, scale: [0, 1, 3, 5, 6, 8, 10], tempo: 0.5, mood: 'ominous' },
    'Crystal Depths': { baseNote: 146, scale: [0, 2, 4, 6, 7, 9, 11], tempo: 0.7, mood: 'mystical' },
    'Celestial Tower': { baseNote: 164, scale: [0, 2, 4, 5, 7, 9, 11], tempo: 0.9, mood: 'epic' },
    'boss': { baseNote: 73, scale: [0, 1, 4, 5, 7, 8, 11], tempo: 1.2, mood: 'battle' }
};

// Initialize music system
function initMusicSystem() {
    if (!audioContext) return;
    musicGainNode = audioContext.createGain();
    musicGainNode.connect(audioContext.destination);
    musicGainNode.gain.value = gameState.settings.musicVolume / 100 * 0.3;
}

// Update music volume
function updateMusicVolume() {
    if (musicGainNode) {
        musicGainNode.gain.value = gameState.settings.musicVolume / 100 * 0.3;
    }
}

// Play procedural background music
function playBackgroundMusic(biomeName = 'Stone Dungeon') {
    if (!audioContext || gameState.settings.musicVolume === 0) return;

    stopBackgroundMusic();

    const theme = MUSIC_THEMES[biomeName] || MUSIC_THEMES['Stone Dungeon'];
    const isBoss = gameState.run?.floor % 10 === 0;
    const activeTheme = isBoss ? MUSIC_THEMES['boss'] : theme;

    let noteIndex = 0;
    let measureCount = 0;

    currentMusic = setInterval(() => {
        if (!audioContext || gameState.settings.musicVolume === 0) return;

        const volume = gameState.settings.musicVolume / 100 * 0.15;

        // Play bass note every 4 beats
        if (noteIndex % 4 === 0) {
            playMusicNote(activeTheme.baseNote, 'sine', volume * 0.8, 0.8);
        }

        // Play melody
        const scaleNote = activeTheme.scale[Math.floor(Math.random() * activeTheme.scale.length)];
        const octave = Math.random() > 0.5 ? 2 : 1;
        const freq = activeTheme.baseNote * octave * Math.pow(2, scaleNote / 12);

        if (Math.random() > 0.3) {
            playMusicNote(freq, activeTheme.mood === 'battle' ? 'sawtooth' : 'triangle', volume * 0.4, 0.2);
        }

        // Ambient pad
        if (noteIndex % 8 === 0 && activeTheme.mood !== 'battle') {
            playMusicNote(activeTheme.baseNote * 0.5, 'sine', volume * 0.2, 2.0);
        }

        noteIndex++;
        if (noteIndex >= 16) {
            noteIndex = 0;
            measureCount++;
        }
    }, 250 / activeTheme.tempo);
}

function playMusicNote(freq, type, volume, duration) {
    if (!audioContext || !musicGainNode) return;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.connect(gain);
    gain.connect(musicGainNode);

    osc.frequency.value = freq;
    osc.type = type;

    gain.gain.setValueAtTime(volume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

    osc.start();
    osc.stop(audioContext.currentTime + duration);
}

function stopBackgroundMusic() {
    if (currentMusic) {
        clearInterval(currentMusic);
        currentMusic = null;
    }
}

// Ambient sounds
function playAmbientSound() {
    if (!audioContext || gameState.settings.sfxVolume === 0 || !gameState.gameRunning) return;

    const volume = gameState.settings.sfxVolume / 100 * 0.05;
    const biome = getCurrentBiome();

    // Random ambient sounds based on biome
    if (Math.random() > 0.7) {
        if (biome.name === 'Frozen Caverns') {
            // Wind sound
            playNoise('lowpass', 200, volume * 0.3, 1.5);
        } else if (biome.name === 'Volcanic Halls') {
            // Rumble
            playNoise('lowpass', 80, volume * 0.4, 0.5);
        } else {
            // Dripping water
            if (Math.random() > 0.8) {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.frequency.setValueAtTime(800 + Math.random() * 400, audioContext.currentTime);
                osc.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1);
                gain.gain.setValueAtTime(volume, audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);
                osc.type = 'sine';
                osc.start();
                osc.stop(audioContext.currentTime + 0.15);
            }
        }
    }
}

function playNoise(filterType, filterFreq, volume, duration) {
    if (!audioContext) return;

    const bufferSize = audioContext.sampleRate * duration;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();

    noise.buffer = buffer;
    filter.type = filterType;
    filter.frequency.value = filterFreq;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);

    gain.gain.setValueAtTime(volume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

    noise.start();
    noise.stop(audioContext.currentTime + duration);
}

// Start ambient sound loop
function startAmbientSounds() {
    if (ambientInterval) clearInterval(ambientInterval);
    ambientInterval = setInterval(playAmbientSound, 3000);
}

function stopAmbientSounds() {
    if (ambientInterval) {
        clearInterval(ambientInterval);
        ambientInterval = null;
    }
}

function playSound(type) {
    if (!audioContext || gameState.settings.sfxVolume === 0) return;

    const volume = gameState.settings.sfxVolume / 100;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch(type) {
        case 'hit':
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.type = 'square';
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
        case 'crit':
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.15);
            gainNode.gain.setValueAtTime(volume * 0.4, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            oscillator.type = 'sawtooth';
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.15);
            break;
        case 'levelup':
            oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.2);
            gainNode.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.type = 'sine';
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
            break;
        case 'death':
            oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.5);
            gainNode.gain.setValueAtTime(volume * 0.4, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator.type = 'sawtooth';
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.5);
            break;
        case 'pickup':
            oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(volume * 0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.type = 'sine';
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
        case 'heal':
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(500, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.2);
            gainNode.gain.setValueAtTime(volume * 0.25, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
            oscillator.type = 'sine';
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.25);
            break;
        case 'powerup':
            // Power-up sound (ascending arpeggio)
            [400, 500, 600, 800].forEach((freq, i) => {
                setTimeout(() => {
                    const osc = audioContext.createOscillator();
                    const g = audioContext.createGain();
                    osc.connect(g);
                    g.connect(audioContext.destination);
                    osc.frequency.value = freq;
                    g.gain.setValueAtTime(volume * 0.2, audioContext.currentTime);
                    g.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
                    osc.type = 'sine';
                    osc.start();
                    osc.stop(audioContext.currentTime + 0.15);
                }, i * 50);
            });
            return; // Early return since we handled this differently
        case 'click':
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
            gainNode.gain.setValueAtTime(volume * 0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
            oscillator.type = 'square';
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.05);
            break;
        case 'error':
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(150, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.type = 'square';
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
            break;
        case 'chest':
            // Chest open sound
            oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(500, audioContext.currentTime + 0.15);
            gainNode.gain.setValueAtTime(volume * 0.25, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.type = 'triangle';
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
            break;
        case 'dodge':
            // Whoosh sound for dodge
            playNoise('highpass', 1000, volume * 0.2, 0.15);
            return;
        case 'footstep':
            oscillator.frequency.setValueAtTime(100 + Math.random() * 50, audioContext.currentTime);
            gainNode.gain.setValueAtTime(volume * 0.05, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
            oscillator.type = 'triangle';
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.05);
            break;
        case 'magic':
            // Magic casting sound
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.2);
            gainNode.gain.setValueAtTime(volume * 0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.type = 'sine';
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
            break;
        case 'combo':
            // Combo hit sound (higher pitch)
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.08);
            gainNode.gain.setValueAtTime(volume * 0.35, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.type = 'square';
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
    }
}

// === ENHANCED PARTICLE SYSTEM ===
function spawnParticles(x, y, type, count = 10) {
    if (!gameState.settings.showParticles) return;

    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
        const speed = 1 + Math.random() * 2;
        const particle = {
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            maxLife: 1,
            type,
            size: 2 + Math.random() * 3,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.2,
            gravity: 0.1,
            friction: 0.98,
            glow: false
        };

        switch(type) {
            case 'fire':
                particle.color = `hsl(${20 + Math.random() * 30}, 100%, ${50 + Math.random() * 20}%)`;
                particle.size = 3 + Math.random() * 4;
                particle.gravity = -0.05; // fire rises
                particle.glow = true;
                particle.glowColor = '#ff6600';
                break;
            case 'ice':
                particle.color = `hsl(${190 + Math.random() * 20}, 80%, 70%)`;
                particle.glow = true;
                particle.glowColor = '#00ccff';
                particle.gravity = 0.05;
                break;
            case 'heal':
                particle.color = `hsl(${120 + Math.random() * 20}, 70%, 50%)`;
                particle.vy = -Math.abs(particle.vy) * 1.5;
                particle.glow = true;
                particle.glowColor = '#00ff44';
                particle.shape = 'cross';
                break;
            case 'soul':
                particle.color = `hsl(${270 + Math.random() * 30}, 70%, 60%)`;
                particle.gravity = -0.02;
                particle.glow = true;
                particle.glowColor = '#aa44ff';
                break;
            case 'gold':
                particle.color = `hsl(${45 + Math.random() * 10}, 100%, 50%)`;
                particle.glow = true;
                particle.glowColor = '#ffcc00';
                particle.shape = 'star';
                break;
            case 'blood':
                particle.color = `hsl(${0 + Math.random() * 10}, 80%, ${30 + Math.random() * 20}%)`;
                particle.gravity = 0.15;
                particle.friction = 0.95;
                break;
            case 'lightning':
                particle.color = `hsl(${200 + Math.random() * 60}, 100%, 70%)`;
                particle.size = 2 + Math.random() * 2;
                particle.glow = true;
                particle.glowColor = '#00ffff';
                particle.life = 0.3 + Math.random() * 0.3;
                particle.maxLife = particle.life;
                particle.shape = 'lightning';
                break;
            case 'poison':
                particle.color = `hsl(${100 + Math.random() * 30}, 80%, 40%)`;
                particle.gravity = -0.03;
                particle.size = 2 + Math.random() * 3;
                particle.glow = true;
                particle.glowColor = '#44ff00';
                break;
            case 'explosion':
                particle.color = `hsl(${20 + Math.random() * 40}, 100%, ${40 + Math.random() * 30}%)`;
                particle.size = 4 + Math.random() * 6;
                particle.vx *= 2;
                particle.vy *= 2;
                particle.glow = true;
                particle.glowColor = '#ff4400';
                particle.gravity = 0.08;
                break;
            case 'smoke':
                particle.color = `rgba(${100 + Math.random() * 50}, ${100 + Math.random() * 50}, ${100 + Math.random() * 50}, 0.6)`;
                particle.size = 5 + Math.random() * 8;
                particle.gravity = -0.02;
                particle.friction = 0.96;
                particle.life = 1.5;
                particle.maxLife = 1.5;
                break;
            case 'sparkle':
                particle.color = '#ffffff';
                particle.size = 1 + Math.random() * 2;
                particle.glow = true;
                particle.glowColor = '#ffffff';
                particle.life = 0.5 + Math.random() * 0.5;
                particle.maxLife = particle.life;
                particle.shape = 'star';
                break;
            case 'levelup':
                particle.color = `hsl(${Math.random() * 360}, 80%, 60%)`;
                particle.size = 3 + Math.random() * 4;
                particle.vy = -2 - Math.random() * 3;
                particle.vx = (Math.random() - 0.5) * 4;
                particle.glow = true;
                particle.glowColor = particle.color;
                particle.shape = 'star';
                particle.life = 1.5;
                particle.maxLife = 1.5;
                break;
            case 'death':
                particle.color = `hsl(${0 + Math.random() * 20}, 70%, ${20 + Math.random() * 30}%)`;
                particle.size = 3 + Math.random() * 5;
                particle.vx *= 1.5;
                particle.vy *= 1.5;
                particle.gravity = 0.2;
                particle.life = 0.8 + Math.random() * 0.4;
                particle.maxLife = particle.life;
                break;
            case 'trail':
                particle.color = `hsl(${200 + Math.random() * 40}, 70%, 50%)`;
                particle.size = 2 + Math.random() * 2;
                particle.vx = (Math.random() - 0.5) * 0.5;
                particle.vy = (Math.random() - 0.5) * 0.5;
                particle.gravity = 0;
                particle.life = 0.4 + Math.random() * 0.2;
                particle.maxLife = particle.life;
                particle.glow = true;
                particle.glowColor = '#6699ff';
                break;
            case 'stun':
                particle.color = '#ffff00';
                particle.size = 2 + Math.random() * 2;
                particle.shape = 'star';
                particle.vy = -1 - Math.random();
                particle.vx = (Math.random() - 0.5) * 2;
                particle.glow = true;
                particle.glowColor = '#ffff00';
                break;
            default:
                particle.color = '#fff';
        }

        gameState.particles.push(particle);
    }
}

function updateParticles(dt) {
    gameState.particles = gameState.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= p.friction || 0.98;
        p.vy *= p.friction || 0.98;
        p.vy += p.gravity || 0.1;
        p.rotation = (p.rotation || 0) + (p.rotationSpeed || 0);
        p.life -= dt * 2;
        return p.life > 0;
    });
}

function renderParticles(ctx) {
    if (!gameState.settings.showParticles) return;

    gameState.particles.forEach(p => {
        const alpha = p.life / p.maxLife;
        const size = p.size * (0.5 + alpha * 0.5);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);

        // Glow effect
        if (p.glow && p.glowColor) {
            ctx.shadowBlur = size * 3;
            ctx.shadowColor = p.glowColor;
        }

        ctx.fillStyle = p.color;

        // Different shapes
        switch(p.shape) {
            case 'star':
                drawStar(ctx, 0, 0, 5, size, size * 0.5);
                break;
            case 'cross':
                ctx.fillRect(-size * 0.3, -size, size * 0.6, size * 2);
                ctx.fillRect(-size, -size * 0.3, size * 2, size * 0.6);
                break;
            case 'lightning':
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, -size);
                ctx.lineTo(size * 0.3, 0);
                ctx.lineTo(-size * 0.2, 0);
                ctx.lineTo(0, size);
                ctx.stroke();
                break;
            default:
                ctx.beginPath();
                ctx.arc(0, 0, size, 0, Math.PI * 2);
                ctx.fill();
        }

        ctx.restore();
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
}

// === SCREEN EFFECTS SYSTEM ===
function addScreenFlash(color, intensity = 0.3, duration = 0.2) {
    if (!gameState.screenFlashes) gameState.screenFlashes = [];
    gameState.screenFlashes.push({
        color,
        intensity,
        duration,
        timer: duration
    });
}

function addHitFlash(x, y, color = '#ffffff', size = TILE_SIZE) {
    if (!gameState.hitFlashes) gameState.hitFlashes = [];
    gameState.hitFlashes.push({
        x, y, color, size,
        timer: 0.15,
        maxTimer: 0.15
    });
}

function updateScreenEffects(dt) {
    // Update screen flashes
    if (gameState.screenFlashes) {
        gameState.screenFlashes = gameState.screenFlashes.filter(flash => {
            flash.timer -= dt;
            return flash.timer > 0;
        });
    }

    // Update hit flashes
    if (gameState.hitFlashes) {
        gameState.hitFlashes = gameState.hitFlashes.filter(flash => {
            flash.timer -= dt;
            return flash.timer > 0;
        });
    }
}

function renderScreenFlashes(ctx) {
    if (!gameState.screenFlashes) return;

    gameState.screenFlashes.forEach(flash => {
        const alpha = (flash.timer / flash.duration) * flash.intensity;
        ctx.fillStyle = flash.color;
        ctx.globalAlpha = alpha;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    });
    ctx.globalAlpha = 1;
}

function renderHitFlashes(ctx) {
    if (!gameState.hitFlashes) return;

    gameState.hitFlashes.forEach(flash => {
        const alpha = flash.timer / flash.maxTimer;
        const scale = 1 + (1 - alpha) * 0.5;

        ctx.save();
        ctx.globalAlpha = alpha * 0.7;
        ctx.fillStyle = flash.color;
        ctx.translate(flash.x + flash.size / 2, flash.y + flash.size / 2);
        ctx.scale(scale, scale);

        // Draw impact burst
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const innerR = flash.size * 0.2;
            const outerR = flash.size * 0.5;
            if (i === 0) {
                ctx.moveTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
            } else {
                ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
            }
            const midAngle = angle + Math.PI / 8;
            ctx.lineTo(Math.cos(midAngle) * innerR, Math.sin(midAngle) * innerR);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    });
}

// Helper function to draw stars
function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
}

// === TUTORIAL SYSTEM ===
function showTutorial() {
    if (gameState.settings.tutorialComplete) return;

    const step = TUTORIAL_STEPS[gameState.tutorialStep];
    if (!step) {
        completeTutorial();
        return;
    }

    const modal = document.getElementById('tutorial-modal');
    if (!modal) return;

    modal.querySelector('.tutorial-title').textContent = step.title;
    modal.querySelector('.tutorial-text').textContent = step.text;
    modal.querySelector('.tutorial-progress').textContent = `${gameState.tutorialStep + 1}/${TUTORIAL_STEPS.length}`;

    // Highlight element
    document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
    if (step.highlight) {
        const el = document.getElementById(step.highlight);
        if (el) el.classList.add('tutorial-highlight');
    }

    modal.classList.add('active');
}

function nextTutorialStep() {
    gameState.tutorialStep++;
    if (gameState.tutorialStep >= TUTORIAL_STEPS.length) {
        completeTutorial();
    } else {
        showTutorial();
    }
}

function completeTutorial() {
    gameState.settings.tutorialComplete = true;
    const modal = document.getElementById('tutorial-modal');
    if (modal) modal.classList.remove('active');
    document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
    saveGame();
}

function skipTutorial() {
    completeTutorial();
}

// === TOOLTIP SYSTEM ===
function initTooltips() {
    document.querySelectorAll('[data-tooltip]').forEach(el => {
        const tooltipKey = el.dataset.tooltip;
        const tooltipText = TOOLTIPS[tooltipKey] || tooltipKey;

        el.addEventListener('mouseenter', (e) => showTooltip(e, tooltipText));
        el.addEventListener('mouseleave', hideTooltip);
        el.addEventListener('touchstart', (e) => showTooltip(e, tooltipText));
        el.addEventListener('touchend', hideTooltip);
    });
}

function showTooltip(e, text) {
    let tooltip = document.getElementById('game-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'game-tooltip';
        tooltip.className = 'game-tooltip';
        document.body.appendChild(tooltip);
    }

    tooltip.textContent = text;
    tooltip.style.display = 'block';

    const rect = e.target.getBoundingClientRect();
    tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';

    // Keep on screen
    if (parseFloat(tooltip.style.left) < 10) tooltip.style.left = '10px';
    if (parseFloat(tooltip.style.top) < 10) {
        tooltip.style.top = rect.bottom + 8 + 'px';
    }
}

function hideTooltip() {
    const tooltip = document.getElementById('game-tooltip');
    if (tooltip) tooltip.style.display = 'none';
}

// === ENHANCED OFFLINE PROGRESS ===
function calculateOfflineProgress() {
    const offlineTime = Date.now() - gameState.lastSaveTime;
    if (offlineTime < 60000) return null; // Less than 1 minute

    const minutes = Math.floor(offlineTime / 60000);
    const maxMinutes = 480; // 8 hours max
    const effectiveMinutes = Math.min(minutes, maxMinutes);

    // Base souls per minute based on best floor
    const baseSoulsPerMin = gameState.bestFloor * 0.2;
    const ascensionBonus = getAscensionTier().bonus?.soulMult || 1;
    const relicBonus = 1 + getRelicBonuses().soulBonus;

    const totalSouls = Math.floor(effectiveMinutes * baseSoulsPerMin * ascensionBonus * relicBonus * gameState.prestigeMultiplier);

    return {
        time: effectiveMinutes,
        souls: totalSouls,
        capped: minutes > maxMinutes
    };
}

function showOfflineProgress(progress) {
    if (!progress || progress.souls <= 0) return;

    const modal = document.getElementById('offline-modal');
    if (!modal) return;

    modal.querySelector('.offline-time').textContent = `${progress.time} minutes`;
    modal.querySelector('.offline-souls').textContent = formatNum(progress.souls);
    if (progress.capped) {
        modal.querySelector('.offline-capped').style.display = 'block';
    }

    modal.classList.add('active');
}

function claimOfflineRewards() {
    const progress = calculateOfflineProgress();
    if (progress && progress.souls > 0) {
        gameState.soulPoints += progress.souls;
        gameState.stats.totalSoulsEarned += progress.souls;
        addLog(`Offline earnings: +${formatNum(progress.souls)} SP!`, 'level-up');
    }

    const modal = document.getElementById('offline-modal');
    if (modal) modal.classList.remove('active');
    saveGame();
}

// === UPDATE SYNERGIES UI ===
function updateSynergiesUI() {
    const container = document.getElementById('synergies-list');
    if (!container) return;

    const active = checkSynergies();
    container.innerHTML = '';

    if (active.length === 0) {
        container.innerHTML = '<p class="no-synergies">No active synergies. Combine class, pet, and equipment for bonuses!</p>';
        return;
    }

    active.forEach(synergy => {
        const div = document.createElement('div');
        div.className = 'synergy-item active';
        div.innerHTML = `
            <span class="synergy-name">${synergy.name}</span>
            <span class="synergy-desc">${synergy.desc}</span>
        `;
        container.appendChild(div);
    });
}

// === NEW FEATURE IMPLEMENTATIONS ===

// --- COMBO SYSTEM ---
function updateComboSystem(dt) {
    if (gameState.comboCount > 0) {
        gameState.comboTimer -= dt;
        if (gameState.comboTimer <= 0) {
            // Combo expired
            if (gameState.comboCount > gameState.bestCombo) {
                gameState.bestCombo = gameState.comboCount;
            }
            gameState.comboCount = 0;
            gameState.comboBonus = 1.0;
            gameState.comboTimer = 0;
        }
    }
}

function addComboKill() {
    gameState.comboCount++;
    gameState.comboTimer = gameState.comboMaxTime;

    // Calculate combo bonus
    let bonus = 1.0;
    for (let i = COMBO_THRESHOLDS.length - 1; i >= 0; i--) {
        if (gameState.comboCount >= COMBO_THRESHOLDS[i].count) {
            bonus = COMBO_THRESHOLDS[i].bonus;
            // Show combo notification
            const threshold = COMBO_THRESHOLDS[i];
            addFloatingText(gameState.player.x, gameState.player.y - 1,
                `${threshold.name} x${gameState.comboCount}`, threshold.color, 1.5);
            playSound('combo');
            break;
        }
    }
    gameState.comboBonus = bonus;

    if (gameState.comboCount > gameState.bestCombo) {
        gameState.bestCombo = gameState.comboCount;
    }
}

function getComboThreshold() {
    for (let i = COMBO_THRESHOLDS.length - 1; i >= 0; i--) {
        if (gameState.comboCount >= COMBO_THRESHOLDS[i].count) {
            return COMBO_THRESHOLDS[i];
        }
    }
    return null;
}

// --- DODGE/STAMINA SYSTEM ---
function updateDodgeSystem(dt) {
    // Regenerate stamina
    if (gameState.stamina < gameState.maxStamina) {
        gameState.stamina = Math.min(gameState.maxStamina,
            gameState.stamina + DODGE_CONFIG.staminaRegen * dt);
    }

    // Update dodge cooldown
    if (gameState.dodgeCooldown > 0) {
        gameState.dodgeCooldown -= dt;
    }

    // Update invincibility frames
    if (gameState.isInvincible) {
        gameState.invincibilityTimer -= dt;
        if (gameState.invincibilityTimer <= 0) {
            gameState.isInvincible = false;
        }
    }

    // Update perfect dodge bonus
    if (gameState.perfectDodgeActive) {
        gameState.perfectDodgeTimer -= dt;
        if (gameState.perfectDodgeTimer <= 0) {
            gameState.perfectDodgeActive = false;
        }
    }
}

function performDodge(direction = null) {
    if (gameState.dodgeCooldown > 0 || gameState.stamina < DODGE_CONFIG.staminaCost) {
        playSound('error');
        return false;
    }

    gameState.stamina -= DODGE_CONFIG.staminaCost;
    gameState.dodgeCooldown = DODGE_CONFIG.baseCooldown;
    gameState.isInvincible = true;
    gameState.invincibilityTimer = DODGE_CONFIG.iFrameDuration;

    // Calculate dash direction
    let dx = 0, dy = 0;
    if (direction) {
        dx = direction.x;
        dy = direction.y;
    } else {
        // Dash away from nearest enemy
        let closestMonster = null;
        let closestDist = Infinity;
        gameState.monsters.forEach(m => {
            const d = heuristic(gameState.player.x, gameState.player.y, m.x, m.y);
            if (d < closestDist) {
                closestDist = d;
                closestMonster = m;
            }
        });
        if (closestMonster) {
            dx = gameState.player.x - closestMonster.x;
            dy = gameState.player.y - closestMonster.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len > 0) {
                dx /= len;
                dy /= len;
            }
        } else {
            dx = Math.random() - 0.5;
            dy = Math.random() - 0.5;
        }
    }

    // Perform the dash
    const dashDist = DODGE_CONFIG.dashDistance;
    let newX = Math.round(gameState.player.x + dx * dashDist);
    let newY = Math.round(gameState.player.y + dy * dashDist);

    // Clamp to grid bounds and ensure valid position
    newX = Math.max(1, Math.min(GRID_WIDTH - 2, newX));
    newY = Math.max(1, Math.min(GRID_HEIGHT - 2, newY));

    // Find nearest valid floor tile
    if (gameState.grid[newY] && gameState.grid[newY][newX] !== TILE.FLOOR) {
        const pos = findValidPosition();
        if (pos) {
            newX = pos.x;
            newY = pos.y;
        }
    }

    // Visual effect for dodge
    addVisualEffect('dash', gameState.player.x, gameState.player.y, 0.3, {
        targetX: newX, targetY: newY, color: '#00ffff'
    });

    gameState.player.x = newX;
    gameState.player.y = newY;

    playSound('dodge');
    return true;
}

function checkPerfectDodge(attackTiming) {
    // If player dodged within the perfect window
    if (gameState.isInvincible && attackTiming < DODGE_CONFIG.perfectDodgeWindow) {
        gameState.perfectDodgeActive = true;
        gameState.perfectDodgeTimer = 3.0; // 3 second bonus window
        addFloatingText(gameState.player.x, gameState.player.y - 1, 'PERFECT DODGE!', '#FFD700', 1.0);
        playSound('powerup');
        return true;
    }
    return false;
}

// --- TRAP VARIETY SYSTEM ---
function getRandomTrapType() {
    return TRAP_TYPES[Math.floor(Math.random() * TRAP_TYPES.length)];
}

function handleTrapEffect(trap, trapType) {
    const r = gameState.run;
    if (!r || !trapType) return;

    // Apply base damage
    if (trapType.damage > 0) {
        const damage = Math.floor(r.maxHp * trapType.damage);
        r.currentHp -= damage;
        addFloatingText(gameState.player.x, gameState.player.y, `-${damage}`, trapType.color || '#ff0000');
        playSound('trap');
    }

    // Apply status effect
    if (trapType.status) {
        applyStatus(r, trapType.status);
    }

    // Handle special effects
    if (trapType.special) {
        switch (trapType.special) {
            case 'teleport':
                const pos = findValidPosition();
                if (pos) {
                    addVisualEffect('teleport', gameState.player.x, gameState.player.y, 0.5);
                    gameState.player.x = pos.x;
                    gameState.player.y = pos.y;
                    addVisualEffect('teleport', pos.x, pos.y, 0.5);
                }
                break;
            case 'spawn':
                // Spawn 1-3 additional monsters
                const spawnCount = 1 + Math.floor(Math.random() * 3);
                for (let i = 0; i < spawnCount; i++) {
                    spawnSingleMonster();
                }
                addFloatingText(gameState.player.x, gameState.player.y - 1, 'ALARM!', '#ffd700');
                playSound('error');
                break;
            case 'root':
                // Immobilize player (handled by status effect system)
                r.rooted = true;
                r.rootDuration = trapType.duration || 3;
                addFloatingText(gameState.player.x, gameState.player.y, 'ROOTED!', '#dcdcdc');
                break;
            case 'knockback':
                // Push player in random direction
                const knockDir = { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 };
                const knockDist = 2;
                let kx = Math.round(gameState.player.x + knockDir.x * knockDist);
                let ky = Math.round(gameState.player.y + knockDir.y * knockDist);
                kx = Math.max(1, Math.min(GRID_WIDTH - 2, kx));
                ky = Math.max(1, Math.min(GRID_HEIGHT - 2, ky));
                if (gameState.grid[ky] && gameState.grid[ky][kx] === TILE.FLOOR) {
                    gameState.player.x = kx;
                    gameState.player.y = ky;
                }
                addScreenFlash('#696969', 0.3);
                break;
        }
    }

    trap.triggered = true;
    trap.trapType = trapType;
}

function spawnSingleMonster() {
    const pos = findValidPosition();
    if (!pos) return;

    const floor = gameState.run?.floor || 1;
    const monster = generateMonster(floor);
    monster.x = pos.x;
    monster.y = pos.y;
    gameState.monsters.push(monster);
}

// --- SECRET ROOM SYSTEM ---
function generateSecretRoom() {
    const roomType = SECRET_ROOM_TYPES[Math.floor(Math.random() * SECRET_ROOM_TYPES.length)];
    return {
        ...roomType,
        discovered: false,
        claimed: false
    };
}

function discoverSecretRoom(x, y) {
    const secretRoom = gameState.secretRoomsFound.find(r => r.x === x && r.y === y);
    if (secretRoom && !secretRoom.discovered) {
        secretRoom.discovered = true;
        playSound('chest');
        addFloatingText(x, y - 1, `SECRET: ${secretRoom.name}!`, '#9400d3', 2.0);
        addScreenFlash('#9400d3', 0.5);
        return secretRoom;
    }
    return null;
}

function claimSecretRoomReward(secretRoom) {
    if (!secretRoom || secretRoom.claimed) return;

    const r = gameState.run;
    const rewards = secretRoom.rewards;

    if (rewards.gold) {
        gameState.soulPoints += rewards.gold;
        addFloatingText(gameState.player.x, gameState.player.y, `+${rewards.gold} Souls`, '#ffd700');
    }

    if (rewards.chests) {
        for (let i = 0; i < rewards.chests; i++) {
            openChestReward();
        }
    }

    if (rewards.equipment) {
        const rarity = rewards.equipment;
        const equip = generateEquipment(r.floor, rarity);
        showEquipmentDrop(equip);
    }

    if (rewards.buff) {
        const buff = {
            type: 'secretBuff',
            stat: 'allStats',
            value: rewards.buff.allStats || 0.1,
            duration: rewards.buff.duration || 60,
            maxDuration: rewards.buff.duration || 60
        };
        gameState.runBuffs.push(buff);
        addFloatingText(gameState.player.x, gameState.player.y - 1, `+${Math.round(buff.value * 100)}% All Stats!`, '#9400d3');
    }

    if (rewards.heal) {
        const healAmount = Math.floor(r.maxHp * rewards.heal);
        r.currentHp = Math.min(r.maxHp, r.currentHp + healAmount);
        addFloatingText(gameState.player.x, gameState.player.y, `+${healAmount} HP`, '#00ff00');
    }

    if (rewards.skillPoints) {
        // Add free skill point (simplified - just grants souls equivalent)
        const bonus = rewards.skillPoints * 200;
        gameState.soulPoints += bonus;
        addFloatingText(gameState.player.x, gameState.player.y, `+${bonus} Souls (Skill Point)`, '#9370db');
    }

    if (rewards.upgrade) {
        // Upgrade weapon tier
        const weapon = r.equipment?.weapon;
        if (weapon) {
            const currentRarityIndex = RARITIES.indexOf(weapon.rarity);
            if (currentRarityIndex < RARITIES.length - 1) {
                weapon.rarity = RARITIES[currentRarityIndex + 1];
                addFloatingText(gameState.player.x, gameState.player.y, 'WEAPON UPGRADED!', '#ffd700');
            }
        }
    }

    if (rewards.skipFloors) {
        const skip = rewards.skipFloors;
        r.floor += skip;
        addFloatingText(gameState.player.x, gameState.player.y - 1, `Skipped ${skip} floors!`, '#00ffff');
        generateDungeon();
        spawnMonsters();
    }

    if (rewards.potions) {
        for (let i = 0; i < rewards.potions; i++) {
            // Grant random temporary buff
            const buffTypes = ['attack', 'defense', 'speed', 'critChance'];
            const buffType = buffTypes[Math.floor(Math.random() * buffTypes.length)];
            gameState.runBuffs.push({
                type: 'potion',
                stat: buffType,
                value: 0.15,
                duration: 60,
                maxDuration: 60
            });
        }
        addFloatingText(gameState.player.x, gameState.player.y, `+${rewards.potions} Potions!`, '#ff69b4');
    }

    secretRoom.claimed = true;
    playSound('powerup');
}

// --- WEATHER SYSTEM ---
function updateWeatherSystem(dt) {
    gameState.weatherTimer -= dt;

    if (gameState.weatherTimer <= 0) {
        // Change weather
        changeWeather();
    }

    // Apply weather effects
    applyWeatherEffects(dt);
}

function changeWeather() {
    // 60% chance of clear weather, 40% chance of other weather
    if (Math.random() < 0.6) {
        gameState.currentWeather = 'clear';
    } else {
        const weatherOptions = WEATHER_TYPES.filter(w => w.id !== 'clear');
        const newWeather = weatherOptions[Math.floor(Math.random() * weatherOptions.length)];
        gameState.currentWeather = newWeather.id;
    }
    gameState.weatherTimer = gameState.weatherDuration + Math.random() * 60;

    const weather = WEATHER_TYPES.find(w => w.id === gameState.currentWeather);
    if (weather && weather.id !== 'clear') {
        addLog(`Weather changed to: ${weather.name}`);
    }
}

function applyWeatherEffects(dt) {
    const weather = WEATHER_TYPES.find(w => w.id === gameState.currentWeather);
    if (!weather || !weather.effect) return;

    const r = gameState.run;
    if (!r) return;

    // Apply DOT damage from certain weather
    if (weather.effect.dotDamage) {
        const dotDmg = Math.floor(r.maxHp * weather.effect.dotDamage * dt);
        if (dotDmg > 0) {
            r.currentHp -= dotDmg;
        }
    }

    // Random lightning strikes in storms
    if (weather.effect.lightningChance && Math.random() < weather.effect.lightningChance * dt) {
        // Strike a random monster or player
        if (Math.random() < 0.7 && gameState.monsters.length > 0) {
            const target = gameState.monsters[Math.floor(Math.random() * gameState.monsters.length)];
            const damage = Math.floor(target.maxHp * 0.2);
            target.hp -= damage;
            addVisualEffect('lightning', target.x, target.y, 0.5, { color: '#FFD700' });
            addFloatingText(target.x, target.y, `-${damage}`, '#FFD700');
            playSound('lightning');
        } else {
            const damage = Math.floor(r.maxHp * 0.1);
            r.currentHp -= damage;
            addVisualEffect('lightning', gameState.player.x, gameState.player.y, 0.5, { color: '#FFD700' });
            addFloatingText(gameState.player.x, gameState.player.y, `-${damage}`, '#FFD700');
        }
    }
}

function getWeatherStatModifier(stat) {
    const weather = WEATHER_TYPES.find(w => w.id === gameState.currentWeather);
    if (!weather || !weather.effect) return 0;
    return weather.effect[stat] || 0;
}

function renderWeatherParticles() {
    const weather = WEATHER_TYPES.find(w => w.id === gameState.currentWeather);
    if (!weather || weather.particles === 0) return;

    // Add weather particles
    for (let i = 0; i < weather.particles / 60; i++) {
        const particle = {
            x: Math.random() * canvas.width,
            y: -10,
            vx: weather.id === 'sandstorm' ? 3 : (Math.random() - 0.5),
            vy: weather.id === 'snow' ? 1 : 5,
            life: 3,
            maxLife: 3,
            color: weather.color,
            size: weather.id === 'snow' ? 3 : 2,
            type: 'weather'
        };
        gameState.particles.push(particle);
    }
}

// --- DAY/NIGHT CYCLE ---
function updateDayNightCycle(dt) {
    gameState.dayNightTime += dt / DAY_NIGHT_CYCLE.cycleDuration;
    if (gameState.dayNightTime >= 1) {
        gameState.dayNightTime -= 1;
    }

    // Determine current phase
    const time = gameState.dayNightTime;
    for (const phase of DAY_NIGHT_CYCLE.phases) {
        if (time >= phase.start && time < phase.end) {
            if (gameState.currentPhase !== phase.id) {
                gameState.currentPhase = phase.id;
                addLog(`Time: ${phase.name}`);
            }
            break;
        }
    }
}

function getCurrentDayPhase() {
    return DAY_NIGHT_CYCLE.phases.find(p => p.id === gameState.currentPhase);
}

function getDayNightModifier(stat) {
    const phase = getCurrentDayPhase();
    if (!phase || !phase.effect) return stat === 'critChance' || stat === 'evasion' ? 0 : 1;
    return phase.effect[stat] || (stat === 'critChance' || stat === 'evasion' ? 0 : 1);
}

function renderDayNightOverlay() {
    const phase = getCurrentDayPhase();
    if (!phase) return;

    ctx.save();
    ctx.globalAlpha = 1 - phase.brightness;
    ctx.fillStyle = phase.tint || '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
}

// --- CRAFTING SYSTEM ---
function addCraftingMaterial(materialId, amount = 1) {
    if (!gameState.craftingMaterials[materialId]) {
        gameState.craftingMaterials[materialId] = 0;
    }
    gameState.craftingMaterials[materialId] += amount;

    const material = CRAFTING_MATERIALS.find(m => m.id === materialId);
    if (material) {
        addFloatingText(gameState.player.x, gameState.player.y, `+${amount} ${material.name}`, material.color);
    }
}

function canCraftRecipe(recipeId) {
    const recipe = CRAFTING_RECIPES.find(r => r.id === recipeId);
    if (!recipe) return false;

    for (const [matId, required] of Object.entries(recipe.materials)) {
        if ((gameState.craftingMaterials[matId] || 0) < required) {
            return false;
        }
    }
    return true;
}

function craftItem(recipeId) {
    if (!canCraftRecipe(recipeId)) {
        playSound('error');
        return null;
    }

    const recipe = CRAFTING_RECIPES.find(r => r.id === recipeId);

    // Consume materials
    for (const [matId, required] of Object.entries(recipe.materials)) {
        gameState.craftingMaterials[matId] -= required;
    }

    // Generate the equipment
    const baseItem = EQUIPMENT_BASES[recipe.type].find(b => b.name === recipe.result.base);
    const equipment = {
        name: recipe.name,
        type: recipe.type,
        rarity: recipe.result.rarity,
        stats: { ...baseItem },
        icon: baseItem.icon
    };

    // Apply rarity multiplier
    const mult = RARITY_MULT[recipe.result.rarity];
    for (const stat of ['atk', 'def', 'hp', 'crit', 'critDmg', 'eva', 'spd']) {
        if (equipment.stats[stat]) {
            equipment.stats[stat] = Math.floor(equipment.stats[stat] * mult);
        }
    }

    playSound('powerup');
    addFloatingText(gameState.player.x, gameState.player.y, `Crafted: ${recipe.name}!`, RARITY_COLORS[recipe.result.rarity]);

    return equipment;
}

function dropCraftingMaterial() {
    // Called when monster dies - chance to drop materials
    const floor = gameState.run?.floor || 1;
    const dropChance = 0.15 + (floor * 0.002); // Increases with floor

    if (Math.random() > dropChance) return;

    // Determine material tier based on floor
    let tierChances = [0.5, 0.3, 0.15, 0.04, 0.01]; // Tier 1-5 base chances
    if (floor > 20) tierChances = [0.3, 0.35, 0.25, 0.08, 0.02];
    if (floor > 50) tierChances = [0.15, 0.30, 0.35, 0.15, 0.05];
    if (floor > 100) tierChances = [0.05, 0.20, 0.40, 0.25, 0.10];

    let roll = Math.random();
    let tier = 1;
    for (let i = 0; i < tierChances.length; i++) {
        roll -= tierChances[i];
        if (roll <= 0) {
            tier = i + 1;
            break;
        }
    }

    const tierMaterials = CRAFTING_MATERIALS.filter(m => m.tier === tier);
    if (tierMaterials.length > 0) {
        const material = tierMaterials[Math.floor(Math.random() * tierMaterials.length)];
        addCraftingMaterial(material.id, 1);
    }
}

// --- ENCHANTING SYSTEM ---
function canEnchantItem(equipment) {
    if (!equipment || equipment.enchantment) return false;

    const cost = ENCHANTING_COSTS[equipment.rarity];
    if (!cost) return false;

    if (gameState.soulPoints < cost.souls) return false;

    for (const [matId, required] of Object.entries(cost.materials)) {
        if ((gameState.craftingMaterials[matId] || 0) < required) {
            return false;
        }
    }

    return true;
}

function enchantItem(equipment, enchantmentId) {
    if (!canEnchantItem(equipment)) {
        playSound('error');
        return false;
    }

    const enchantment = ENCHANTMENT_TYPES.find(e => e.id === enchantmentId);
    if (!enchantment) return false;

    const cost = ENCHANTING_COSTS[equipment.rarity];

    // Consume resources
    gameState.soulPoints -= cost.souls;
    for (const [matId, required] of Object.entries(cost.materials)) {
        gameState.craftingMaterials[matId] -= required;
    }

    // Apply enchantment
    equipment.enchantment = {
        id: enchantmentId,
        name: enchantment.name,
        icon: enchantment.icon,
        effect: { ...enchantment.effect }
    };

    playSound('magic');
    addFloatingText(gameState.player.x, gameState.player.y, `${enchantment.icon} ${enchantment.name} Enchanted!`, enchantment.color);

    return true;
}

function getEnchantmentBonus(effectType) {
    const r = gameState.run;
    if (!r || !r.equipment) return 0;

    let total = 0;
    for (const slot of ['weapon', 'armor', 'accessory']) {
        const item = r.equipment[slot];
        if (item && item.enchantment && item.enchantment.effect[effectType]) {
            total += item.enchantment.effect[effectType];
        }
    }
    return total;
}

// --- PET EVOLUTION SYSTEM ---
function getPetLevel(petId) {
    return gameState.petLevels[petId] || 1;
}

function getPetExperience(petId) {
    return gameState.petExperience[petId] || 0;
}

function getExpForPetLevel(level) {
    return Math.floor(100 * Math.pow(1.5, level - 1));
}

function addPetExperience(petId, amount) {
    if (!gameState.pets[petId]) return;

    if (!gameState.petExperience[petId]) gameState.petExperience[petId] = 0;
    if (!gameState.petLevels[petId]) gameState.petLevels[petId] = 1;

    gameState.petExperience[petId] += amount;

    // Check for level up
    const expNeeded = getExpForPetLevel(gameState.petLevels[petId]);
    while (gameState.petExperience[petId] >= expNeeded && gameState.petLevels[petId] < 20) {
        gameState.petExperience[petId] -= expNeeded;
        gameState.petLevels[petId]++;

        // Check for evolution
        const evolution = PET_EVOLUTION[petId];
        if (evolution) {
            const newStage = evolution.stages.find(s => s.level === gameState.petLevels[petId]);
            if (newStage) {
                addLog(`${newStage.icon} Pet evolved into ${newStage.name}!`);
                addFloatingText(gameState.player.x, gameState.player.y - 1, `EVOLVED: ${newStage.name}!`, '#FFD700', 2.0);
                playSound('levelup');
            }
        }
    }
}

function getPetStage(petId) {
    const evolution = PET_EVOLUTION[petId];
    if (!evolution) return null;

    const level = getPetLevel(petId);
    let currentStage = evolution.stages[0];

    for (const stage of evolution.stages) {
        if (level >= stage.level) {
            currentStage = stage;
        }
    }

    return currentStage;
}

function getPetAbility(petId) {
    const stage = getPetStage(petId);
    if (!stage || !stage.stats.ability) return null;

    const evolution = PET_EVOLUTION[petId];
    return evolution.abilities[stage.stats.ability];
}

function usePetAbility(petId) {
    const ability = getPetAbility(petId);
    if (!ability) return false;

    const cooldownKey = `${petId}_${ability.name}`;
    if (gameState.petAbilityCooldowns[cooldownKey] > 0) return false;

    gameState.petAbilityCooldowns[cooldownKey] = ability.cooldown;

    // Apply ability effect (simplified)
    addLog(`Pet uses ${ability.name}: ${ability.effect}`);
    addFloatingText(gameState.player.x, gameState.player.y - 1, ability.name, '#FFD700');
    playSound('magic');

    return true;
}

function updatePetAbilityCooldowns(dt) {
    for (const key of Object.keys(gameState.petAbilityCooldowns)) {
        if (gameState.petAbilityCooldowns[key] > 0) {
            gameState.petAbilityCooldowns[key] -= dt;
        }
    }
}

// --- MINIMAP SYSTEM ---
function updateExploredTiles() {
    const px = gameState.player.x;
    const py = gameState.player.y;
    const viewRadius = 5;

    for (let dy = -viewRadius; dy <= viewRadius; dy++) {
        for (let dx = -viewRadius; dx <= viewRadius; dx++) {
            const x = px + dx;
            const y = py + dy;
            if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
                const key = `${x},${y}`;
                if (!gameState.exploredTiles.includes(key)) {
                    gameState.exploredTiles.push(key);
                }
            }
        }
    }
}

function renderMinimap() {
    const config = MINIMAP_CONFIG;
    const mapX = canvas.width - config.size - 10;
    const mapY = 10;

    ctx.save();
    ctx.globalAlpha = config.opacity;

    // Background
    ctx.fillStyle = '#000000';
    ctx.fillRect(mapX, mapY, config.size, config.size);

    // Border
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 2;
    ctx.strokeRect(mapX, mapY, config.size, config.size);

    const scale = config.scale;
    const offsetX = mapX + config.size / 2 - gameState.player.x * scale;
    const offsetY = mapY + config.size / 2 - gameState.player.y * scale;

    // Render tiles
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const tileX = offsetX + x * scale;
            const tileY = offsetY + y * scale;

            // Skip if outside minimap bounds
            if (tileX < mapX || tileX > mapX + config.size - scale ||
                tileY < mapY || tileY > mapY + config.size - scale) continue;

            // Check if explored (fog of war)
            const key = `${x},${y}`;
            if (config.fogOfWar && !gameState.exploredTiles.includes(key)) continue;

            const tile = gameState.grid[y]?.[x];
            if (tile === TILE.WALL) {
                ctx.fillStyle = config.colors.wall;
            } else if (tile === TILE.FLOOR) {
                ctx.fillStyle = config.colors.floor;
            } else if (tile === TILE.CHEST) {
                ctx.fillStyle = config.colors.chest;
            } else if (tile === TILE.EXIT) {
                ctx.fillStyle = config.colors.exit;
            } else if (tile === TILE.SECRET) {
                ctx.fillStyle = config.colors.secret;
            } else if (tile === TILE.TRAP && config.showTraps) {
                ctx.fillStyle = config.colors.trap;
            } else {
                ctx.fillStyle = config.colors.floor;
            }

            ctx.fillRect(tileX, tileY, scale - 1, scale - 1);
        }
    }

    // Render monsters
    if (config.showEnemies) {
        gameState.monsters.forEach(m => {
            const mx = offsetX + m.x * scale;
            const my = offsetY + m.y * scale;
            if (mx >= mapX && mx <= mapX + config.size && my >= mapY && my <= mapY + config.size) {
                ctx.fillStyle = m.isBoss ? config.colors.boss : config.colors.monster;
                ctx.fillRect(mx, my, scale, scale);
            }
        });
    }

    // Render pet
    if (gameState.activePet) {
        const petX = offsetX + gameState.pet.x * scale;
        const petY = offsetY + gameState.pet.y * scale;
        ctx.fillStyle = config.colors.pet;
        ctx.fillRect(petX, petY, scale, scale);
    }

    // Render player (always visible, larger)
    const playerX = offsetX + gameState.player.x * scale;
    const playerY = offsetY + gameState.player.y * scale;
    ctx.fillStyle = config.colors.player;
    ctx.fillRect(playerX - 1, playerY - 1, scale + 2, scale + 2);

    ctx.restore();
}

// --- DAMAGE STATISTICS ---
function logDamage(amount, category = 'player') {
    const now = Date.now();
    gameState.damageLog.push({ amount, category, time: now });
    gameState.sessionDamage[category] = (gameState.sessionDamage[category] || 0) + amount;

    // Clean old entries (keep only last 10 seconds)
    const cutoff = now - DAMAGE_STATS_CONFIG.trackWindow * 1000;
    gameState.damageLog = gameState.damageLog.filter(d => d.time > cutoff);

    // Calculate current DPS
    calculateDPS();
}

function calculateDPS() {
    const now = Date.now();
    const trackWindow = DAMAGE_STATS_CONFIG.trackWindow * 1000; // 10 seconds in ms
    const cutoff = now - trackWindow;

    // Filter to only recent damage entries
    const recentEntries = gameState.damageLog.filter(d => d.time > cutoff);
    const recentDamage = recentEntries.reduce((sum, d) => sum + d.amount, 0);

    // Calculate elapsed time based on actual damage log entries
    let elapsed = DAMAGE_STATS_CONFIG.trackWindow; // Default to full window
    if (recentEntries.length > 0) {
        // Use time since first entry in window, or full window if longer
        const firstEntryTime = recentEntries[0].time;
        elapsed = Math.min(DAMAGE_STATS_CONFIG.trackWindow, (now - firstEntryTime) / 1000);
        // Ensure at least 1 second to avoid division issues
        elapsed = Math.max(1, elapsed);
    }

    // Calculate DPS: total damage in window / seconds elapsed
    gameState.currentDPS = recentDamage > 0 ? Math.floor(recentDamage / elapsed) : 0;

    // Record DPS history every second
    if (!gameState.lastDPSRecord || now - gameState.lastDPSRecord > 1000) {
        gameState.dpsHistory.push({ dps: gameState.currentDPS, time: now });
        gameState.lastDPSRecord = now;

        // Keep only last 60 entries
        if (gameState.dpsHistory.length > 60) {
            gameState.dpsHistory.shift();
        }
    }
}

function renderDPSMeter() {
    if (!DAMAGE_STATS_CONFIG.showDPSMeter) return;

    const meterX = 10;
    const meterY = canvas.height - 80;
    const meterWidth = 120;
    const meterHeight = 60;

    ctx.save();
    ctx.globalAlpha = 0.8;

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(meterX, meterY, meterWidth, meterHeight);
    ctx.strokeStyle = '#4a9eff';
    ctx.lineWidth = 1;
    ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);

    // DPS Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('DPS', meterX + 5, meterY + 15);

    ctx.fillStyle = '#4a9eff';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(formatNumber(gameState.currentDPS), meterX + 5, meterY + 35);

    // Mini graph
    if (gameState.dpsHistory.length > 1) {
        const graphX = meterX + 5;
        const graphY = meterY + 42;
        const graphW = meterWidth - 10;
        const graphH = 15;

        const maxDPS = Math.max(...gameState.dpsHistory.map(d => d.dps), 1);

        ctx.strokeStyle = '#4a9eff';
        ctx.lineWidth = 1;
        ctx.beginPath();

        gameState.dpsHistory.forEach((entry, i) => {
            const x = graphX + (i / (gameState.dpsHistory.length - 1)) * graphW;
            const y = graphY + graphH - (entry.dps / maxDPS) * graphH;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });

        ctx.stroke();
    }

    ctx.restore();
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// --- GAME MODE SYSTEM ---
function selectGameMode(modeId) {
    const mode = GAME_MODES[modeId];
    if (!mode) return false;

    // Check unlock requirements
    if (mode.unlockFloor && gameState.bestFloor < mode.unlockFloor) {
        addLog(`Unlock ${mode.name} by reaching floor ${mode.unlockFloor}`);
        playSound('error');
        return false;
    }
    if (mode.unlockBosses && gameState.stats.bossesKilled < mode.unlockBosses) {
        addLog(`Unlock ${mode.name} by defeating ${mode.unlockBosses} bosses`);
        playSound('error');
        return false;
    }

    gameState.currentGameMode = modeId;
    addLog(`Game Mode: ${mode.name}`);
    playSound('click');
    return true;
}

function getGameModeModifier(stat) {
    const mode = GAME_MODES[gameState.currentGameMode];
    if (!mode || !mode.modifiers) return stat === 'rewardMult' ? 1 : 0;
    return mode.modifiers[stat] || (stat === 'rewardMult' ? 1 : 0);
}

function applyGameModeModifiers() {
    const mode = GAME_MODES[gameState.currentGameMode];
    if (!mode || !mode.modifiers) return;

    const r = gameState.run;
    if (!r) return;

    // Apply enemy modifiers
    if (mode.modifiers.enemyHp) {
        gameState.monsters.forEach(m => {
            m.maxHp = Math.floor(m.maxHp * mode.modifiers.enemyHp);
            m.hp = m.maxHp;
        });
    }

    if (mode.modifiers.enemyDamage) {
        gameState.monsters.forEach(m => {
            m.attack = Math.floor(m.attack * mode.modifiers.enemyDamage);
        });
    }
}

async function initGame() {
    initDOM();

    // Initialize sprite system (will fallback to procedural if sprites not found)
    await initSprites();

    loadGame();
    setupEventListeners();
    initTooltips();
    updateAchievementsUI();
    updatePetsUI();
    updateMilestonesUI();
    updateDailyRewardsUI();
    updateStatsDashboard();
    updateSynergiesUI();

    // Check for offline progress
    const offlineProgress = calculateOfflineProgress();
    if (offlineProgress && offlineProgress.souls > 0) {
        showOfflineProgress(offlineProgress);
    }

    // Check daily rewards
    if (checkDailyReward()) {
        setTimeout(() => {
            const dailyModal = document.getElementById('daily-reward-modal');
            if (dailyModal) dailyModal.classList.add('active');
        }, 1000);
    }

    // Initialize auto-loot toggle state
    const autoLootToggle = document.getElementById('auto-loot-toggle');
    if (autoLootToggle) {
        autoLootToggle.classList.toggle('active', gameState.settings.autoLoot);
    }

    if (!gameState.selectedClass) {
        DOM.class_modal.classList.add('active');
    } else {
        startNewRun();
        // Show tutorial for new players
        if (!gameState.settings.tutorialComplete && gameState.totalRuns < 3) {
            setTimeout(showTutorial, 2000);
        }
    }

    requestAnimationFrame(gameLoop);
}

// ===================== INTRO SCREEN =====================
function initIntroScreen() {
    const introScreen = document.getElementById('intro-screen');
    const gameContainer = document.getElementById('game-container');
    const continueBtn = document.getElementById('intro-continue');
    const newGameBtn = document.getElementById('intro-new-game');
    const continueInfo = document.getElementById('continue-info');
    const particlesContainer = document.getElementById('intro-particles');

    // Volume sliders
    const musicSlider = document.getElementById('intro-music');
    const sfxSlider = document.getElementById('intro-sfx');
    const musicVal = document.getElementById('intro-music-val');
    const sfxVal = document.getElementById('intro-sfx-val');
    const particlesCheck = document.getElementById('intro-particles');
    const damageCheck = document.getElementById('intro-damage-numbers');

    // Create floating particles
    if (particlesContainer) {
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'intro-particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 10 + 's';
            particle.style.animationDuration = (8 + Math.random() * 6) + 's';
            const colors = ['#7b2cbf', '#4a9eff', '#ffd700', '#28a745', '#17a2b8'];
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            particle.style.width = (2 + Math.random() * 4) + 'px';
            particle.style.height = particle.style.width;
            particlesContainer.appendChild(particle);
        }
    }

    // Check for existing save
    const savedData = localStorage.getItem('idleDungeonSave');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            if (data.bestFloor > 0 || data.totalRuns > 0) {
                continueBtn.style.display = 'flex';
                continueInfo.textContent = `Floor ${data.bestFloor || 1} | ${data.totalRuns || 0} Runs`;
            }
        } catch (e) {
            console.log('No valid save data');
        }
    }

    // Load saved settings
    const savedSettings = localStorage.getItem('idleDungeonSettings');
    if (savedSettings) {
        try {
            const settings = JSON.parse(savedSettings);
            if (musicSlider) musicSlider.value = settings.musicVolume ?? 50;
            if (sfxSlider) sfxSlider.value = settings.sfxVolume ?? 50;
            if (musicVal) musicVal.textContent = (settings.musicVolume ?? 50) + '%';
            if (sfxVal) sfxVal.textContent = (settings.sfxVolume ?? 50) + '%';
            const particlesCheckbox = document.getElementById('intro-particles');
            const damageCheckbox = document.getElementById('intro-damage-numbers');
            if (particlesCheckbox) particlesCheckbox.checked = settings.showParticles !== false;
            if (damageCheckbox) damageCheckbox.checked = settings.showDamage !== false;
        } catch (e) {}
    }

    // Volume slider events
    if (musicSlider) {
        musicSlider.addEventListener('input', () => {
            musicVal.textContent = musicSlider.value + '%';
        });
    }
    if (sfxSlider) {
        sfxSlider.addEventListener('input', () => {
            sfxVal.textContent = sfxSlider.value + '%';
        });
    }

    // Start game function
    function startGame(resetSave = false) {
        // Save settings from intro screen
        const settings = {
            musicVolume: parseInt(musicSlider?.value ?? 50),
            sfxVolume: parseInt(sfxSlider?.value ?? 50),
            showParticles: document.getElementById('intro-particles')?.checked !== false,
            showDamage: document.getElementById('intro-damage-numbers')?.checked !== false
        };
        localStorage.setItem('idleDungeonSettings', JSON.stringify(settings));

        // Apply settings
        const musicVolumeEl = document.getElementById('music-volume');
        const sfxVolumeEl = document.getElementById('sfx-volume');
        const showParticlesEl = document.getElementById('show-particles');
        const showDamageEl = document.getElementById('show-damage');

        if (musicVolumeEl) musicVolumeEl.value = settings.musicVolume;
        if (sfxVolumeEl) sfxVolumeEl.value = settings.sfxVolume;
        if (showParticlesEl) showParticlesEl.checked = settings.showParticles;
        if (showDamageEl) showDamageEl.checked = settings.showDamage;

        if (resetSave) {
            localStorage.removeItem('idleDungeonSave');
        }

        // Hide intro, show game
        introScreen.style.opacity = '0';
        introScreen.style.transition = 'opacity 0.5s ease';

        setTimeout(() => {
            introScreen.style.display = 'none';
            gameContainer.style.display = 'flex';
            gameContainer.style.opacity = '0';
            gameContainer.style.transition = 'opacity 0.5s ease';

            setTimeout(() => {
                gameContainer.style.opacity = '1';
                initGame();
            }, 50);
        }, 500);
    }

    // Button events
    if (continueBtn) {
        continueBtn.addEventListener('click', () => startGame(false));
    }
    if (newGameBtn) {
        newGameBtn.addEventListener('click', () => {
            if (savedData) {
                if (confirm('Start a new game? Your existing save will be erased.')) {
                    startGame(true);
                }
            } else {
                startGame(false);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', initIntroScreen);
