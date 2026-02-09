import { BuildingTypes, ColorSchemes } from '../config/GameConfig.js';

// Cache buster: v2.0 - Fixed bezierCurveTo and strokeArc issues
export class BuildingRenderer {
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * Utility function to darken a color by a factor
     * @param {number} color - Hex color value
     * @param {number} factor - Darkening factor (0-1, where 0.85 = 85% brightness)
     * @returns {number} - Darkened hex color
     */
    darkenColor(color, factor) {
        const r = (color >> 16) & 0xFF;
        const g = (color >> 8) & 0xFF;
        const b = color & 0xFF;
        return ((r * factor) << 16) | ((g * factor) << 8) | (b * factor);
    }

    /**
     * Main function to draw building details based on type
     * @param {Phaser.GameObjects.Graphics} graphics - Graphics object to draw on
     * @param {string} type - Building type key
     * @param {number} x - X position
     * @param {number} y - Y position (bottom of building)
     * @param {number} facadeVariation - Color variation index (0-3)
     */
    drawBuildingDetails(graphics, type, x, y, facadeVariation = 0) {
        const building = BuildingTypes[type];

        if (type === 'house') {
            this.drawHouse(graphics, building, x, y, facadeVariation);
        } else if (type === 'apartment') {
            this.drawApartment(graphics, building, x, y, facadeVariation);
        } else if (type === 'hotel') {
            this.drawHotel(graphics, building, x, y, facadeVariation);
        } else if (type === 'clothingShop') {
            this.drawClothingShop(graphics, building, x, y, facadeVariation);
        } else if (type === 'electronicsShop') {
            this.drawElectronicsShop(graphics, building, x, y, facadeVariation);
        } else if (type === 'groceryStore') {
            this.drawGroceryStore(graphics, building, x, y, facadeVariation);
        } else if (type === 'bookstore') {
            this.drawBookstore(graphics, building, x, y, facadeVariation);
        } else if (type === 'bakery') {
            this.drawBakery(graphics, building, x, y, facadeVariation);
        } else if (type === 'restaurant' || type === 'chinese_restaurant' || type === 'italian_restaurant' || type === 'diner' || type === 'sub_shop') {
            this.drawRestaurant(graphics, building, x, y, facadeVariation, type);
        } else if (type === 'arcade') {
            this.drawArcade(graphics, building, x, y, facadeVariation);
        } else if (type === 'library') {
            this.drawLibrary(graphics, building, x, y, facadeVariation);
        } else if (type === 'museum') {
            this.drawMuseum(graphics, building, x, y, facadeVariation);
        } else if (type === 'themePark') {
            this.drawThemePark(graphics, building, x, y, facadeVariation);
        } else if (type === 'bank') {
            this.drawBank(graphics, building, x, y, facadeVariation);
        } else if (type === 'market') {
            this.drawMarket(graphics, building, x, y, facadeVariation);
        } else if (type === 'lumbermill') {
            this.drawLumberMill(graphics, building, x, y, facadeVariation);
        } else if (type === 'brickfactory') {
            this.drawBrickFactory(graphics, building, x, y, facadeVariation);
        } else if (type === 'park') {
            this.drawPark(graphics, building, x, y, facadeVariation);
        } else if (type === 'playground') {
            this.drawPlayground(graphics, building, x, y, facadeVariation);
        } else if (type === 'fountain') {
            this.drawFountain(graphics, building, x, y, facadeVariation);
        } else if (type === 'school') {
            this.drawSchool(graphics, building, x, y, facadeVariation);
        } else if (type === 'officeBuilding') {
            this.drawOfficeBuilding(graphics, building, x, y, facadeVariation);
        } else if (type === 'movieTheater') {
            this.drawMovieTheater(graphics, building, x, y, facadeVariation);
        } else if (type === 'fireStation') {
            this.drawFireStation(graphics, building, x, y, facadeVariation);
        } else if (type === 'policeStation') {
            this.drawPoliceStation(graphics, building, x, y, facadeVariation);
        } else if (type === 'hospital') {
            this.drawHospital(graphics, building, x, y, facadeVariation);
        } else if (type === 'trainStation') {
            this.drawTrainStation(graphics, building, x, y, facadeVariation);
        }
    }

    drawHouse(graphics, building, x, y, facadeVariation) {
        const scheme = ColorSchemes.house[facadeVariation % 4];

        // Building base
        graphics.fillStyle(scheme.building, 1);
        graphics.fillRect(x - building.width/2, y - building.height, building.width, building.height);

        const windowColor = scheme.window;
        const windowWidth = 20;
        const windowHeight = 25;
        const spacing = 25;

        // Floor separator line
        graphics.lineStyle(3, 0x654321, 1);
        graphics.lineBetween(x - building.width/2, y - building.height/2, x + building.width/2, y - building.height/2);

        // Windows (2 columns, 3 rows) with shutters
        const shutterColor = this.darkenColor(scheme.roof, 0.7);
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 2; col++) {
                const wx = x - spacing + (col * spacing * 2);
                const wy = y - building.height + 50 + (row * 50);

                // Left shutter
                graphics.fillStyle(shutterColor, 1);
                graphics.fillRect(wx - windowWidth/2 - 8, wy, 6, windowHeight);
                graphics.lineStyle(1, 0x654321, 1);
                graphics.strokeRect(wx - windowWidth/2 - 8, wy, 6, windowHeight);
                // Shutter slats
                for (let i = 0; i < 5; i++) {
                    graphics.lineBetween(wx - windowWidth/2 - 8, wy + (i * 5), wx - windowWidth/2 - 2, wy + (i * 5));
                }

                // Right shutter
                graphics.fillStyle(shutterColor, 1);
                graphics.fillRect(wx + windowWidth/2 + 2, wy, 6, windowHeight);
                graphics.lineStyle(1, 0x654321, 1);
                graphics.strokeRect(wx + windowWidth/2 + 2, wy, 6, windowHeight);
                // Shutter slats
                for (let i = 0; i < 5; i++) {
                    graphics.lineBetween(wx + windowWidth/2 + 2, wy + (i * 5), wx + windowWidth/2 + 8, wy + (i * 5));
                }

                // Window shadow
                graphics.fillStyle(0x000000, 0.3);
                graphics.fillRect(wx - windowWidth/2 + 2, wy + 2, windowWidth, windowHeight);

                // Window
                graphics.fillStyle(windowColor, 1);
                graphics.fillRect(wx - windowWidth/2, wy, windowWidth, windowHeight);

                // Window reflection
                graphics.fillStyle(0xFFFFFF, 0.3);
                graphics.fillRect(wx - windowWidth/2, wy, windowWidth, windowHeight/2);

                // Window frame
                graphics.lineStyle(2, 0x654321, 1);
                graphics.strokeRect(wx - windowWidth/2, wy, windowWidth, windowHeight);

                // Window cross
                graphics.lineStyle(1, 0x654321, 1);
                graphics.lineBetween(wx, wy, wx, wy + windowHeight);
                graphics.lineBetween(wx - windowWidth/2, wy + windowHeight/2, wx + windowWidth/2, wy + windowHeight/2);
            }
        }

        // Door shadow
        graphics.fillStyle(0x000000, 0.4);
        graphics.fillRect(x - 20 + 3, y - 50 + 3, 40, 50);

        // Front door
        graphics.fillStyle(scheme.door, 1);
        graphics.fillRect(x - 20, y - 50, 40, 50);
        graphics.lineStyle(2, 0x654321, 1);
        graphics.strokeRect(x - 20, y - 50, 40, 50);

        // Door panels
        graphics.lineStyle(1, 0x654321, 1);
        graphics.strokeRect(x - 15, y - 45, 12, 20);
        graphics.strokeRect(x + 3, y - 45, 12, 20);

        // Doorknob with shadow
        graphics.fillStyle(0x000000, 0.3);
        graphics.fillCircle(x + 13, y - 24, 3);
        graphics.fillStyle(0xFFD700, 1);
        graphics.fillCircle(x + 12, y - 25, 3);
        graphics.fillStyle(0xFFFF99, 0.5);
        graphics.fillCircle(x + 11, y - 26, 1.5);

        // Peaked roof - shadow
        graphics.fillStyle(0x000000, 0.4);
        graphics.fillTriangle(
            x - building.width/2 - 10, y - building.height,
            x, y - building.height - 35,
            x + building.width/2 + 10, y - building.height
        );

        // Left side of roof
        graphics.fillStyle(scheme.roof, 1);
        graphics.fillTriangle(
            x - building.width/2 - 10, y - building.height,
            x, y - building.height - 35,
            x, y - building.height
        );

        // Right side of roof (darker)
        const darkerRoof = this.darkenColor(scheme.roof, 0.85);
        graphics.fillStyle(darkerRoof, 1);
        graphics.fillTriangle(
            x, y - building.height - 35,
            x + building.width/2 + 10, y - building.height,
            x, y - building.height
        );

        // Roof outline
        graphics.lineStyle(2, 0x654321, 1);
        graphics.strokeTriangle(
            x - building.width/2 - 10, y - building.height,
            x, y - building.height - 35,
            x + building.width/2 + 10, y - building.height
        );

        // Roof ridge line
        graphics.lineStyle(1, 0x000000, 0.5);
        graphics.lineBetween(x, y - building.height, x, y - building.height - 35);

        // House sign plaque above windows (near top of building)
        graphics.fillStyle(0x000000, 0.3);
        graphics.fillRect(x - 28 + 2, y - building.height + 17, 56, 18);

        graphics.fillStyle(0xF5F5DC, 1); // Beige plaque
        graphics.fillRect(x - 28, y - building.height + 15, 56, 18);

        graphics.lineStyle(2, 0x654321, 1);
        graphics.strokeRect(x - 28, y - building.height + 15, 56, 18);
    }

    drawApartment(graphics, building, x, y, facadeVariation) {
        const scheme = ColorSchemes.apartment[facadeVariation % 4];

        // Building base
        graphics.fillStyle(scheme.building, 1);
        graphics.fillRect(x - building.width/2, y - building.height, building.width, building.height);

        const windowColor = scheme.window;
        const windowWidth = 18;
        const windowHeight = 20;
        const floorHeight = building.height / 4; // 90px per floor

        // Floor separator lines
        graphics.lineStyle(2, 0x654321, 1);
        for (let floor = 1; floor < 4; floor++) {
            const floorY = y - (floor * floorHeight);
            graphics.lineBetween(x - building.width/2, floorY, x + building.width/2, floorY);
        }

        // Draw units (2 per floor, 4 floors = 8 units)
        for (let floor = 0; floor < 4; floor++) {
            for (let unit = 0; unit < 2; unit++) {
                const unitX = x - 50 + (unit * 100);
                const unitY = y - building.height + (floor * floorHeight) + 20;

                // Windows for each unit
                for (let win = 0; win < 2; win++) {
                    const wx = unitX - 15 + (win * 30);
                    const wy = unitY + 15;

                    // Window shadow
                    graphics.fillStyle(0x000000, 0.3);
                    graphics.fillRect(wx - windowWidth/2 + 1, wy + 1, windowWidth, windowHeight);

                    // Window
                    graphics.fillStyle(windowColor, 1);
                    graphics.fillRect(wx - windowWidth/2, wy, windowWidth, windowHeight);

                    // Window reflection
                    graphics.fillStyle(0xFFFFFF, 0.3);
                    graphics.fillRect(wx - windowWidth/2, wy, windowWidth, windowHeight/2);

                    // Window frame
                    graphics.lineStyle(1, 0x654321, 1);
                    graphics.strokeRect(wx - windowWidth/2, wy, windowWidth, windowHeight);
                }
            }
        }

        // Main entrance
        const entranceWidth = 50;
        const entranceHeight = 70;
        const entranceY = y - entranceHeight;

        // Door frame shadow
        graphics.fillStyle(0x000000, 0.4);
        graphics.fillRect(x - entranceWidth/2 + 3, entranceY + 3, entranceWidth, entranceHeight);

        // Door frame
        graphics.fillStyle(scheme.door, 1);
        graphics.fillRect(x - entranceWidth/2, entranceY, entranceWidth, entranceHeight);

        // Glass doors
        graphics.fillStyle(0x87CEEB, 0.7);
        graphics.fillRect(x - entranceWidth/2 + 3, entranceY + 3, (entranceWidth/2) - 5, entranceHeight - 6);
        graphics.fillRect(x + 2, entranceY + 3, (entranceWidth/2) - 5, entranceHeight - 6);

        // Glass reflection
        graphics.fillStyle(0xFFFFFF, 0.3);
        graphics.fillRect(x - entranceWidth/2 + 3, entranceY + 3, (entranceWidth/2) - 5, (entranceHeight - 6)/2);
        graphics.fillRect(x + 2, entranceY + 3, (entranceWidth/2) - 5, (entranceHeight - 6)/2);

        // Door divider
        graphics.fillStyle(0x654321, 1);
        graphics.fillRect(x - 2, entranceY, 4, entranceHeight);

        // Door handles
        graphics.fillStyle(0xFFD700, 1);
        graphics.fillCircle(x - 10, entranceY + entranceHeight/2, 3);
        graphics.fillCircle(x + 10, entranceY + entranceHeight/2, 3);

        // Apartment sign at top of building
        graphics.fillStyle(0x000000, 0.3);
        graphics.fillRect(x - 55 + 2, y - building.height + 7, 110, 22);

        graphics.fillStyle(0xFFD700, 1); // Gold sign
        graphics.fillRect(x - 55, y - building.height + 5, 110, 22);

        graphics.lineStyle(2, 0x000000, 1);
        graphics.strokeRect(x - 55, y - building.height + 5, 110, 22);

        // Flat roof
        graphics.fillStyle(0x696969, 1);
        graphics.fillRect(x - building.width/2 - 5, y - building.height - 10, building.width + 10, 10);
    }

    drawHotel(graphics, building, x, y, facadeVariation) {
        const scheme = ColorSchemes.hotel[facadeVariation % 4];

        // Building base
        graphics.fillStyle(scheme.building, 1);
        graphics.fillRect(x - building.width/2, y - building.height, building.width, building.height);

        const windowColor = scheme.window;
        const windowWidth = 20;
        const windowHeight = 22;
        const floorHeight = building.height / 5; // 80px per floor

        // Floor separator lines
        graphics.lineStyle(2, 0x654321, 1);
        for (let floor = 1; floor < 5; floor++) {
            const floorY = y - (floor * floorHeight);
            graphics.lineBetween(x - building.width/2, floorY, x + building.width/2, floorY);
        }

        // Draw rooms (2 per floor, 5 floors = 10 rooms)
        for (let floor = 0; floor < 5; floor++) {
            for (let room = 0; room < 2; room++) {
                const roomX = x - 60 + (room * 120);
                const roomY = y - building.height + (floor * floorHeight) + 25;

                // Windows for each room
                for (let win = 0; win < 2; win++) {
                    const wx = roomX - 20 + (win * 40);
                    const wy = roomY + 15;

                    // Window shadow
                    graphics.fillStyle(0x000000, 0.3);
                    graphics.fillRect(wx - windowWidth/2 + 1, wy + 1, windowWidth, windowHeight);

                    // Window
                    graphics.fillStyle(windowColor, 1);
                    graphics.fillRect(wx - windowWidth/2, wy, windowWidth, windowHeight);

                    // Window reflection
                    graphics.fillStyle(0xFFFFFF, 0.3);
                    graphics.fillRect(wx - windowWidth/2, wy, windowWidth, windowHeight/2);

                    // Window frame
                    graphics.lineStyle(1, 0x654321, 1);
                    graphics.strokeRect(wx - windowWidth/2, wy, windowWidth, windowHeight);
                }
            }
        }

        // Main entrance
        const entranceWidth = 60;
        const entranceHeight = 75;
        const entranceY = y - entranceHeight;

        // Door frame shadow
        graphics.fillStyle(0x000000, 0.4);
        graphics.fillRect(x - entranceWidth/2 + 3, entranceY + 3, entranceWidth, entranceHeight);

        // Door frame
        graphics.fillStyle(scheme.doorFrame, 1);
        graphics.fillRect(x - entranceWidth/2, entranceY, entranceWidth, entranceHeight);

        // Glass revolving door
        graphics.fillStyle(0x87CEEB, 0.6);
        graphics.fillRect(x - entranceWidth/2 + 5, entranceY + 5, entranceWidth - 10, entranceHeight - 10);

        // Glass reflection
        graphics.fillStyle(0xFFFFFF, 0.4);
        graphics.fillRect(x - entranceWidth/2 + 5, entranceY + 5, entranceWidth - 10, (entranceHeight - 10)/2);

        // Revolving door dividers
        graphics.fillStyle(0xC0C0C0, 1);
        graphics.fillRect(x - 2, entranceY + 5, 4, entranceHeight - 10);
        graphics.fillRect(x - entranceWidth/2 + 5, entranceY + entranceHeight/2 - 2, entranceWidth - 10, 4);

        // Hotel sign
        graphics.fillStyle(scheme.accent, 1);
        graphics.fillRect(x - 40, y - building.height + 10, 80, 20);
        graphics.lineStyle(2, 0x654321, 1);
        graphics.strokeRect(x - 40, y - building.height + 10, 80, 20);

        // Flat roof
        graphics.fillStyle(0x696969, 1);
        graphics.fillRect(x - building.width/2 - 5, y - building.height - 10, building.width + 10, 10);
    }

    drawClothingShop(graphics, building, x, y, facadeVariation) {
        const scheme = ColorSchemes.clothingShop[facadeVariation % 4];

        // Building base
        graphics.fillStyle(scheme.building, 1);
        graphics.fillRect(x - building.width/2, y - building.height, building.width, building.height);

        const windowColor = scheme.window;

        // Large storefront window
        graphics.fillStyle(0x000000, 0.3);
        graphics.fillRect(x - 70 + 3, y - 140 + 3, 140, 80);

        graphics.fillStyle(windowColor, 1);
        graphics.fillRect(x - 70, y - 140, 140, 80);

        // Window reflection
        graphics.fillStyle(0xFFFFFF, 0.3);
        graphics.fillRect(x - 70, y - 140, 140, 40);

        graphics.lineStyle(3, 0x000000, 1);
        graphics.strokeRect(x - 70, y - 140, 140, 80);

        // Window dividers
        graphics.lineStyle(2, 0x000000, 1);
        graphics.lineBetween(x - 35, y - 140, x - 35, y - 60);
        graphics.lineBetween(x + 35, y - 140, x + 35, y - 60);

        // Mannequins
        graphics.fillStyle(0xC0C0C0, 0.6);
        graphics.fillCircle(x - 40, y - 115, 8);
        graphics.fillRect(x - 46, y - 105, 12, 20);
        graphics.fillRect(x - 48, y - 85, 16, 20);
        graphics.fillCircle(x + 40, y - 115, 8);
        graphics.fillRect(x + 34, y - 105, 12, 20);
        graphics.fillRect(x + 32, y - 85, 16, 20);

        // Upper windows
        for (let col = 0; col < 3; col++) {
            const wx = x - 50 + (col * 50);
            const wy = y - building.height + 25;

            graphics.fillStyle(0x000000, 0.3);
            graphics.fillRect(wx - 10 + 2, wy + 2, 20, 40);

            graphics.fillStyle(windowColor, 1);
            graphics.fillRect(wx - 10, wy, 20, 40);

            graphics.fillStyle(0xFFFFFF, 0.2);
            graphics.fillRect(wx - 10, wy, 20, 20);

            graphics.lineStyle(2, 0x000000, 1);
            graphics.strokeRect(wx - 10, wy, 20, 40);
        }

        // Awning
        graphics.fillStyle(0x000000, 0.3);
        graphics.fillRect(x - 75, y - 140, 150, 8);

        graphics.fillStyle(scheme.awning, 1);
        graphics.fillRect(x - 75, y - 148, 150, 8);

        graphics.fillStyle(0xC2185B, 1);
        graphics.beginPath();
        graphics.moveTo(x - 75, y - 140);
        graphics.lineTo(x + 75, y - 140);
        graphics.lineTo(x + 70, y - 135);
        graphics.lineTo(x - 70, y - 135);
        graphics.closePath();
        graphics.fillPath();

        // Glass door
        graphics.fillStyle(0x000000, 0.4);
        graphics.fillRect(x - 20 + 3, y - 55 + 3, 40, 55);

        graphics.fillStyle(0x87CEEB, 0.4);
        graphics.fillRect(x - 20, y - 55, 40, 55);

        graphics.fillStyle(0xFFFFFF, 0.3);
        graphics.fillRect(x - 20, y - 55, 40, 27);

        graphics.lineStyle(2, 0xC0C0C0, 1);
        graphics.strokeRect(x - 20, y - 55, 40, 55);

        // Door handle
        graphics.fillStyle(0xFFD700, 1);
        graphics.fillCircle(x + 10, y - 28, 4);

        // Sign banner above awning
        graphics.fillStyle(0x000000, 0.3);
        graphics.fillRect(x - 80 + 2, y - 110 + 2, 160, 20);

        graphics.fillStyle(scheme.awning, 1); // Match awning color
        graphics.fillRect(x - 80, y - 110, 160, 20);

        graphics.lineStyle(2, 0x000000, 1);
        graphics.strokeRect(x - 80, y - 110, 160, 20);

        // Roof
        graphics.fillStyle(0x696969, 1);
        graphics.fillRect(x - building.width/2 - 5, y - building.height - 10, building.width + 10, 10);
    }

    drawElectronicsShop(graphics, building, x, y, facadeVariation) {
        const scheme = ColorSchemes.electronicsShop[facadeVariation % 4];

        // Building base
        graphics.fillStyle(scheme.building, 1);
        graphics.fillRect(x - building.width/2, y - building.height, building.width, building.height);

        const windowColor = scheme.window;

        // Modern grid display
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 3; col++) {
                const wx = x - 50 + (col * 40);
                const wy = y - 130 + (row * 35);

                graphics.fillStyle(0x000000, 0.4);
                graphics.fillRect(wx + 2, wy + 2, 35, 30);

                graphics.fillStyle(windowColor, 1);
                graphics.fillRect(wx, wy, 35, 30);

                // Screen glow
                graphics.fillStyle(0x2196F3, 0.3);
                graphics.fillRect(wx + 2, wy + 2, 31, 26);

                graphics.lineStyle(2, 0x000000, 1);
                graphics.strokeRect(wx, wy, 35, 30);
            }
        }

        // Neon accent
        graphics.fillStyle(0x00E5FF, 0.8);
        graphics.fillRect(x - 70, y - 135, 140, 3);

        // Upper windows
        for (let col = 0; col < 2; col++) {
            const wx = x - 35 + (col * 70);
            const wy = y - building.height + 30;

            graphics.fillStyle(0x000000, 0.3);
            graphics.fillRect(wx - 15 + 2, wy + 2, 30, 30);

            graphics.fillStyle(windowColor, 1);
            graphics.fillRect(wx - 15, wy, 30, 30);

            graphics.fillStyle(0x2196F3, 0.2);
            graphics.fillRect(wx - 15, wy, 30, 15);

            graphics.lineStyle(2, 0x000000, 1);
            graphics.strokeRect(wx - 15, wy, 30, 30);
        }

        // Awning
        graphics.fillStyle(0x000000, 0.3);
        graphics.fillRect(x - 70, y - 140, 140, 8);

        graphics.fillStyle(scheme.awning, 1);
        graphics.fillRect(x - 70, y - 148, 140, 8);

        const darkerAwning = this.darkenColor(scheme.awning, 0.85);
        graphics.fillStyle(darkerAwning, 1);
        graphics.beginPath();
        graphics.moveTo(x - 70, y - 140);
        graphics.lineTo(x + 70, y - 140);
        graphics.lineTo(x + 65, y - 135);
        graphics.lineTo(x - 65, y - 135);
        graphics.closePath();
        graphics.fillPath();

        // Glass door
        graphics.fillStyle(0x000000, 0.4);
        graphics.fillRect(x - 20 + 3, y - 55 + 3, 40, 55);

        graphics.fillStyle(0x87CEEB, 0.3);
        graphics.fillRect(x - 20, y - 55, 40, 55);

        graphics.lineStyle(2, 0x424242, 1);
        graphics.strokeRect(x - 20, y - 55, 40, 55);
        graphics.lineBetween(x, y - 55, x, y);

        // Door handle
        graphics.fillStyle(0xC0C0C0, 1);
        graphics.fillRect(x + 8, y - 30, 3, 15);

        // Sign banner above awning
        graphics.fillStyle(0x000000, 0.3);
        graphics.fillRect(x - 95 + 2, y - 110 + 2, 190, 20);

        graphics.fillStyle(scheme.awning, 1); // Match awning color
        graphics.fillRect(x - 95, y - 110, 190, 20);

        graphics.lineStyle(2, 0x000000, 1);
        graphics.strokeRect(x - 95, y - 110, 190, 20);

        // Roof
        graphics.fillStyle(0x616161, 1);
        graphics.fillRect(x - building.width/2 - 5, y - building.height - 10, building.width + 10, 10);
    }

    drawGroceryStore(graphics, building, x, y, facadeVariation) {
        const scheme = ColorSchemes.groceryStore[facadeVariation % 4];

        // Building base
        graphics.fillStyle(scheme.building, 1);
        graphics.fillRect(x - building.width/2, y - building.height, building.width, building.height);

        const windowColor = scheme.window;

        // Market-style windows (4 windows centered)
        // 4 windows at 30px each + 3 gaps of 10px = 150px total
        const windowStartX = x - 75; // Center the 150px span
        for (let col = 0; col < 4; col++) {
            const wx = windowStartX + (col * 40); // 30px window + 10px gap
            const wy = y - 125;

            graphics.fillStyle(0x000000, 0.3);
            graphics.fillRect(wx + 2, wy + 2, 30, 40);

            graphics.fillStyle(windowColor, 1);
            graphics.fillRect(wx, wy, 30, 40);

            graphics.fillStyle(0xFFFFFF, 0.2);
            graphics.fillRect(wx, wy, 30, 20);

            graphics.lineStyle(2, 0x000000, 1);
            graphics.strokeRect(wx, wy, 30, 40);
            graphics.lineBetween(wx, wy + 20, wx + 30, wy + 20);
        }

        // Produce crates (left)
        graphics.fillStyle(0x8D6E63, 1);
        graphics.lineStyle(2, 0x5D4037, 1);
        graphics.strokeRect(x - 85, y - 30, 20, 25);
        graphics.strokeRect(x - 85, y - 25, 20, 20);

        // Produce (apples)
        graphics.fillStyle(0xF44336, 1);
        graphics.fillCircle(x - 80, y - 18, 5);
        graphics.fillCircle(x - 72, y - 18, 5);
        graphics.fillCircle(x - 76, y - 24, 5);

        // Produce crates (right)
        graphics.lineStyle(2, 0x5D4037, 1);
        graphics.strokeRect(x + 65, y - 30, 20, 25);
        graphics.strokeRect(x + 65, y - 25, 20, 20);

        // Produce (oranges)
        graphics.fillStyle(0xFF9800, 1);
        graphics.fillCircle(x + 70, y - 18, 5);
        graphics.fillCircle(x + 78, y - 18, 5);
        graphics.fillCircle(x + 74, y - 24, 5);

        // Upper windows
        for (let col = 0; col < 3; col++) {
            const wx = x - 45 + (col * 45);
            const wy = y - building.height + 30;

            graphics.fillStyle(0x000000, 0.3);
            graphics.fillRect(wx - 12 + 2, wy + 2, 24, 30);

            graphics.fillStyle(windowColor, 1);
            graphics.fillRect(wx - 12, wy, 24, 30);

            graphics.fillStyle(0xFFFFFF, 0.2);
            graphics.fillRect(wx - 12, wy, 24, 15);

            graphics.lineStyle(2, 0x000000, 1);
            graphics.strokeRect(wx - 12, wy, 24, 30);
        }

        // Awning
        graphics.fillStyle(0x000000, 0.3);
        graphics.fillRect(x - 85, y - 125, 170, 8);

        graphics.fillStyle(scheme.awning, 1);
        graphics.fillRect(x - 85, y - 133, 170, 8);

        const awningDark = this.darkenColor(scheme.awning, 0.8);
        graphics.fillStyle(awningDark, 1);
        graphics.beginPath();
        graphics.moveTo(x - 85, y - 125);
        graphics.lineTo(x + 85, y - 125);
        graphics.lineTo(x + 80, y - 120);
        graphics.lineTo(x - 80, y - 120);
        graphics.closePath();
        graphics.fillPath();

        // Awning stripes
        const darkerStripe = this.darkenColor(awningDark, 0.7);
        graphics.lineStyle(2, darkerStripe, 1);
        for (let i = 0; i < 8; i++) {
            graphics.lineBetween(x - 85 + (i * 24), y - 133, x - 85 + (i * 24), y - 125);
        }

        // Wood door
        graphics.fillStyle(0x000000, 0.4);
        graphics.fillRect(x - 20 + 3, y - 55 + 3, 40, 55);

        graphics.fillStyle(0x8D6E63, 1);
        graphics.fillRect(x - 20, y - 55, 40, 55);

        graphics.lineStyle(2, 0x5D4037, 1);
        graphics.strokeRect(x - 20, y - 55, 40, 55);

        // Door handle
        graphics.fillStyle(0xFFD700, 1);
        graphics.fillCircle(x + 10, y - 28, 4);

        // Roof
        graphics.fillStyle(0x795548, 1);
        graphics.fillRect(x - building.width/2 - 5, y - building.height - 10, building.width + 10, 10);
    }

    drawBookstore(graphics, building, x, y, facadeVariation) {
        const scheme = ColorSchemes.bookstore[facadeVariation % 4];

        // Building base
        graphics.fillStyle(scheme.building, 1);
        graphics.fillRect(x - building.width/2, y - building.height, building.width, building.height);

        const windowColor = scheme.window;

        // Storefront window
        graphics.fillStyle(0x000000, 0.3);
        graphics.fillRect(x - 65 + 3, y - 125 + 3, 130, 65);

        graphics.fillStyle(windowColor, 1);
        graphics.fillRect(x - 65, y - 125, 130, 65);

        // Window reflection
        graphics.fillStyle(0xFFFFFF, 0.15);
        graphics.fillRect(x - 65, y - 125, 130, 32);

        graphics.lineStyle(3, 0x4E342E, 1);
        graphics.strokeRect(x - 65, y - 125, 130, 65);

        // Window panes
        graphics.lineStyle(2, 0x4E342E, 1);
        graphics.lineBetween(x - 65, y - 103, x + 65, y - 103);
        graphics.lineBetween(x - 22, y - 125, x - 22, y - 60);
        graphics.lineBetween(x + 22, y - 125, x + 22, y - 60);

        // Book stacks
        graphics.fillStyle(0x8B4513, 0.6);
        graphics.fillRect(x - 50, y - 85, 8, 20);
        graphics.fillRect(x - 40, y - 80, 8, 15);
        graphics.fillRect(x - 30, y - 88, 8, 23);
        graphics.fillRect(x + 25, y - 85, 8, 20);
        graphics.fillRect(x + 35, y - 80, 8, 15);
        graphics.fillRect(x + 45, y - 88, 8, 23);

        // Upper windows with shutters
        for (let col = 0; col < 2; col++) {
            const wx = x - 35 + (col * 70);
            const wy = y - building.height + 30;

            // Left shutter
            graphics.fillStyle(scheme.shutter, 1);
            graphics.fillRect(wx - 30, wy, 10, 35);
            graphics.lineStyle(1, 0x4E342E, 1);
            graphics.strokeRect(wx - 30, wy, 10, 35);
            for (let i = 0; i < 7; i++) {
                graphics.lineBetween(wx - 30, wy + (i * 5), wx - 20, wy + (i * 5));
            }

            // Window
            graphics.fillStyle(0x000000, 0.3);
            graphics.fillRect(wx - 15 + 2, wy + 2, 30, 35);

            graphics.fillStyle(windowColor, 1);
            graphics.fillRect(wx - 15, wy, 30, 35);

            graphics.fillStyle(0xFFFFFF, 0.15);
            graphics.fillRect(wx - 15, wy, 30, 17);

            graphics.lineStyle(2, 0x4E342E, 1);
            graphics.strokeRect(wx - 15, wy, 30, 35);
            graphics.lineBetween(wx, wy, wx, wy + 35);

            // Right shutter
            graphics.fillStyle(scheme.shutter, 1);
            graphics.fillRect(wx + 20, wy, 10, 35);
            graphics.lineStyle(1, 0x4E342E, 1);
            graphics.strokeRect(wx + 20, wy, 10, 35);
            for (let i = 0; i < 7; i++) {
                graphics.lineBetween(wx + 20, wy + (i * 5), wx + 30, wy + (i * 5));
            }
        }

        // Awning
        graphics.fillStyle(0x000000, 0.3);
        graphics.fillRect(x - 70, y - 125, 140, 8);

        graphics.fillStyle(scheme.awning, 1);
        graphics.fillRect(x - 70, y - 133, 140, 8);

        graphics.fillStyle(scheme.awningDark, 1);
        graphics.beginPath();
        graphics.moveTo(x - 70, y - 125);
        graphics.lineTo(x + 70, y - 125);
        graphics.lineTo(x + 65, y - 120);
        graphics.lineTo(x - 65, y - 120);
        graphics.closePath();
        graphics.fillPath();

        // Wood door
        graphics.fillStyle(0x000000, 0.4);
        graphics.fillRect(x - 20 + 3, y - 55 + 3, 40, 55);

        graphics.fillStyle(0x5D4037, 1);
        graphics.fillRect(x - 20, y - 55, 40, 55);

        // Door panels
        graphics.lineStyle(2, 0x4E342E, 1);
        graphics.strokeRect(x - 20, y - 55, 40, 55);
        graphics.strokeRect(x - 15, y - 48, 30, 20);
        graphics.strokeRect(x - 15, y - 25, 30, 20);

        // Brass handle
        graphics.fillStyle(0xB8860B, 1);
        graphics.fillCircle(x + 10, y - 28, 4);
        graphics.fillStyle(0xFFD700, 0.6);
        graphics.fillCircle(x + 9, y - 29, 2);

        // Sign banner above awning
        graphics.fillStyle(0x000000, 0.3);
        graphics.fillRect(x - 70 + 2, y - 110 + 2, 140, 20);

        graphics.fillStyle(scheme.awning, 1); // Match awning color
        graphics.fillRect(x - 70, y - 110, 140, 20);

        graphics.lineStyle(2, 0x000000, 1);
        graphics.strokeRect(x - 70, y - 110, 140, 20);

        // Roof
        graphics.fillStyle(0x5D4037, 1);
        graphics.fillRect(x - building.width/2 - 5, y - building.height - 10, building.width + 10, 10);
    }

    drawRestaurant(graphics, building, x, y, facadeVariation, type) {
        const windowColor = 0xFFF8DC;

        // Calculate banner width based on restaurant name
        // Average character width is ~10px at 16px font size, add padding
        const restaurantName = this.scene.buildingTypes[type]?.name || 'Restaurant';
        const bannerWidth = Math.max(130, restaurantName.length * 10 + 20); // Minimum 130px, or name length + padding
        const bannerHalfWidth = bannerWidth / 2;

        // Arched windows
        for (let col = 0; col < 3; col++) {
            const wx = x - 50 + (col * 50);
            const wy = y - building.height + 40;

            // Shadow
            graphics.fillStyle(0x000000, 0.3);
            graphics.fillRect(wx - 15 + 2, wy + 2, 30, 40);
            graphics.fillCircle(wx + 2, wy + 2, 15);

            // Window rectangle
            graphics.fillStyle(windowColor, 1);
            graphics.fillRect(wx - 15, wy, 30, 40);
            graphics.fillCircle(wx, wy, 15);

            // Reflection
            graphics.fillStyle(0xFFFFFF, 0.25);
            graphics.fillRect(wx - 15, wy, 30, 20);
            graphics.fillCircle(wx, wy, 7);

            // Frame
            graphics.lineStyle(2, 0x8B4513, 1);
            graphics.strokeRect(wx - 15, wy, 30, 40);
            graphics.strokeCircle(wx, wy, 15);
        }

        // Entrance shadow
        graphics.fillStyle(0x000000, 0.4);
        graphics.fillRect(x - 30 + 4, y - 70 + 4, 60, 70);

        // Entrance
        graphics.fillStyle(0x8B4513, 1);
        graphics.fillRect(x - 30, y - 70, 60, 70);
        graphics.lineStyle(3, 0x654321, 1);
        graphics.strokeRect(x - 30, y - 70, 60, 70);

        // Double doors
        graphics.lineStyle(2, 0x654321, 1);
        graphics.lineBetween(x, y - 70, x, y);
        graphics.fillStyle(windowColor, 1);
        graphics.fillRect(x - 20, y - 60, 15, 30);
        graphics.fillRect(x + 5, y - 60, 15, 30);

        // Door glass reflection
        graphics.fillStyle(0xFFFFFF, 0.3);
        graphics.fillRect(x - 20, y - 60, 15, 15);
        graphics.fillRect(x + 5, y - 60, 15, 15);

        // Door handles
        graphics.fillStyle(0x000000, 0.3);
        graphics.fillCircle(x - 7, y - 34, 3);
        graphics.fillCircle(x + 9, y - 34, 3);
        graphics.fillStyle(0xFFD700, 1);
        graphics.fillCircle(x - 8, y - 35, 3);
        graphics.fillCircle(x + 8, y - 35, 3);
        graphics.fillStyle(0xFFFF99, 0.5);
        graphics.fillCircle(x - 9, y - 36, 1.5);
        graphics.fillCircle(x + 7, y - 36, 1.5);

        // Restaurant sign (dynamic width based on name)
        graphics.fillStyle(0x000000, 0.3);
        graphics.fillRect(x - bannerHalfWidth + 2, y - 105 + 2, bannerWidth, 20);

        graphics.fillStyle(0x8B0000, 1);
        graphics.fillRect(x - bannerHalfWidth, y - 105, bannerWidth, 20);

        graphics.fillStyle(0x660000, 1);
        graphics.beginPath();
        graphics.moveTo(x - bannerHalfWidth, y - 85);
        graphics.lineTo(x + bannerHalfWidth, y - 85);
        graphics.lineTo(x + bannerHalfWidth - 2, y - 80);
        graphics.lineTo(x - bannerHalfWidth + 2, y - 80);
        graphics.closePath();
        graphics.fillPath();

        graphics.lineStyle(2, 0x000000, 1);
        graphics.strokeRect(x - bannerHalfWidth, y - 105, bannerWidth, 20);

        // Peaked roof
        graphics.fillStyle(0x000000, 0.3);
        graphics.fillTriangle(
            x - building.width/2 - 8, y - building.height,
            x, y - building.height - 30,
            x + building.width/2 + 8, y - building.height
        );

        graphics.fillStyle(0xA0522D, 1);
        graphics.fillTriangle(
            x - building.width/2 - 8, y - building.height,
            x, y - building.height - 30,
            x, y - building.height
        );

        graphics.fillStyle(0x8B4513, 1);
        graphics.fillTriangle(
            x, y - building.height - 30,
            x + building.width/2 + 8, y - building.height,
            x, y - building.height
        );

        graphics.lineStyle(2, 0x654321, 1);
        graphics.strokeTriangle(
            x - building.width/2 - 8, y - building.height,
            x, y - building.height - 30,
            x + building.width/2 + 8, y - building.height
        );

        graphics.lineStyle(1, 0x000000, 0.5);
        graphics.lineBetween(x, y - building.height, x, y - building.height - 30);

        // Decorative trim
        graphics.fillStyle(0x654321, 1);
        graphics.beginPath();
        graphics.moveTo(x - building.width/2 - 8, y - building.height);
        graphics.lineTo(x - building.width/2 - 15, y - building.height + 5);
        graphics.lineTo(x + building.width/2 + 15, y - building.height + 5);
        graphics.lineTo(x + building.width/2 + 8, y - building.height);
        graphics.closePath();
        graphics.fillPath();
    }

    // Note: Bank, Market, LumberMill, BrickFactory don't have color variations yet
    // They use default colors from BuildingTypes

    drawBank(graphics, building, x, y, facadeVariation) {
        // Classical bank building with columns and grand entrance
        const leftX = x - building.width/2;
        const topY = y - building.height;

        // Main building body (marble white/cream)
        graphics.fillStyle(0xF5F5DC, 1); // Beige/cream color
        graphics.fillRect(leftX, topY, building.width, building.height);

        // Dark base foundation
        graphics.fillStyle(0x4A4A4A, 1);
        graphics.fillRect(leftX, y - 40, building.width, 40);

        // Grand entrance steps (3 levels)
        graphics.fillStyle(0x696969, 1);
        graphics.fillRect(leftX + 40, y - 10, building.width - 80, 10); // Top step
        graphics.fillRect(leftX + 30, y - 20, building.width - 60, 10); // Middle step
        graphics.fillRect(leftX + 20, y - 30, building.width - 40, 10); // Bottom step

        // Top pediment (triangular roof)
        graphics.fillStyle(0xD3D3D3, 1);
        graphics.beginPath();
        graphics.moveTo(leftX - 10, topY + 30);
        graphics.lineTo(x, topY - 10);
        graphics.lineTo(leftX + building.width + 10, topY + 30);
        graphics.closePath();
        graphics.fillPath();

        // Pediment border
        graphics.lineStyle(3, 0x000000, 1);
        graphics.beginPath();
        graphics.moveTo(leftX - 10, topY + 30);
        graphics.lineTo(x, topY - 10);
        graphics.lineTo(leftX + building.width + 10, topY + 30);
        graphics.closePath();
        graphics.strokePath();

        // Classical columns (4 grand columns)
        const columnWidth = 25;
        const columnSpacing = building.width / 5;

        for (let i = 1; i <= 4; i++) {
            const columnX = leftX + (i * columnSpacing) - columnWidth/2;
            const columnY = topY + 30;
            const columnHeight = building.height - 70;

            // Column shaft
            graphics.fillStyle(0xFFFFFF, 1);
            graphics.fillRect(columnX, columnY, columnWidth, columnHeight);
            graphics.lineStyle(2, 0x000000, 1);
            graphics.strokeRect(columnX, columnY, columnWidth, columnHeight);

            // Column capital (decorative top)
            graphics.fillStyle(0xE8E8E8, 1);
            graphics.fillRect(columnX - 5, columnY - 15, columnWidth + 10, 15);
            graphics.lineStyle(2, 0x000000, 1);
            graphics.strokeRect(columnX - 5, columnY - 15, columnWidth + 10, 15);

            // Column base
            graphics.fillStyle(0xE8E8E8, 1);
            graphics.fillRect(columnX - 5, columnY + columnHeight, columnWidth + 10, 10);
            graphics.lineStyle(2, 0x000000, 1);
            graphics.strokeRect(columnX - 5, columnY + columnHeight, columnWidth + 10, 10);

            // Vertical fluting lines on column
            graphics.lineStyle(1, 0xD3D3D3, 0.5);
            for (let f = 0; f < 3; f++) {
                const flutingX = columnX + 5 + (f * 7);
                graphics.lineBetween(flutingX, columnY, flutingX, columnY + columnHeight);
            }
        }

        // Grand entrance door (dark wood)
        const doorWidth = 60;
        const doorHeight = 100;
        graphics.fillStyle(0x3E2723, 1); // Dark brown
        graphics.fillRect(x - doorWidth/2, y - doorHeight - 30, doorWidth, doorHeight);
        graphics.lineStyle(3, 0x000000, 1);
        graphics.strokeRect(x - doorWidth/2, y - doorHeight - 30, doorWidth, doorHeight);

        // Door panels
        graphics.lineStyle(2, 0x5D4037, 1);
        graphics.strokeRect(x - doorWidth/2 + 5, y - doorHeight - 25, doorWidth - 10, doorHeight/2 - 10);
        graphics.strokeRect(x - doorWidth/2 + 5, y - doorHeight/2 - 35, doorWidth - 10, doorHeight/2 - 10);

        // Door handle (gold)
        graphics.fillStyle(0xFFD700, 1);
        graphics.fillCircle(x + 15, y - 70, 4);

        // Windows on upper floor (arched windows)
        const windowY = topY + 60;
        const windowSpacing = building.width / 3;

        for (let i = 1; i <= 2; i++) {
            const winX = leftX + (i * windowSpacing);
            const winWidth = 35;
            const winHeight = 50;

            // Window frame
            graphics.fillStyle(0x87CEEB, 1); // Sky blue glass
            graphics.fillRect(winX - winWidth/2, windowY, winWidth, winHeight);

            // Arched top
            graphics.beginPath();
            graphics.arc(winX, windowY, winWidth/2, Math.PI, 0, false);
            graphics.fillPath();

            // Window border
            graphics.lineStyle(3, 0x000000, 1);
            graphics.strokeRect(winX - winWidth/2, windowY, winWidth, winHeight);
            graphics.beginPath();
            graphics.arc(winX, windowY, winWidth/2, Math.PI, 0, false);
            graphics.strokePath();

            // Window cross bars
            graphics.lineStyle(2, 0x4A4A4A, 1);
            graphics.lineBetween(winX, windowY, winX, windowY + winHeight);
        }

        // Building name frieze (decorative band below pediment)
        graphics.fillStyle(0xC0C0C0, 1);
        graphics.fillRect(leftX, topY + 30, building.width, 20);
        graphics.lineStyle(2, 0x000000, 1);
        graphics.strokeRect(leftX, topY + 30, building.width, 20);

        // Ornamental details on frieze
        graphics.fillStyle(0xFFD700, 1);
        for (let i = 0; i < 5; i++) {
            const detailX = leftX + 30 + (i * 40);
            graphics.fillCircle(detailX, topY + 40, 3);
        }
    }

    drawMarket(graphics, building, x, y, facadeVariation) {
        // TODO: Implement market building design
        graphics.fillStyle(building.color, 1);
        graphics.fillRect(x - building.width/2, y - building.height, building.width, building.height);
    }

    drawLumberMill(graphics, building, x, y, facadeVariation) {
        const scheme = ColorSchemes.lumbermill[facadeVariation % 4];

        // Main building (rustic wood building)
        graphics.fillStyle(scheme.building, 1);
        graphics.fillRect(x - building.width/2, y - building.height, building.width, building.height);

        // Slanted roof
        graphics.fillStyle(scheme.roof, 1);
        graphics.beginPath();
        graphics.moveTo(x - building.width/2 - 10, y - building.height);
        graphics.lineTo(x, y - building.height - 30);
        graphics.lineTo(x + building.width/2 + 10, y - building.height);
        graphics.closePath();
        graphics.fillPath();
        graphics.lineStyle(3, 0x000000, 1);
        graphics.strokePath();

        // Wood planks texture (horizontal lines)
        graphics.lineStyle(2, this.darkenColor(scheme.building, 0.85), 1);
        for (let i = 1; i < 5; i++) {
            const plankY = y - building.height + (i * 40);
            graphics.lineBetween(x - building.width/2, plankY, x + building.width/2, plankY);
        }

        // Large saw blade on the side (iconic lumber mill feature)
        const sawX = x + 60;
        const sawY = y - building.height + 60; // Moved up 10px
        const sawRadius = 35;

        // Saw blade circle
        graphics.fillStyle(scheme.sawBlade, 1);
        graphics.fillCircle(sawX, sawY, sawRadius);
        graphics.lineStyle(3, 0x000000, 1);
        graphics.strokeCircle(sawX, sawY, sawRadius);

        // Saw teeth (triangular points around the blade)
        graphics.fillStyle(scheme.sawBlade, 1);
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const x1 = sawX + Math.cos(angle) * sawRadius;
            const y1 = sawY + Math.sin(angle) * sawRadius;
            const x2 = sawX + Math.cos(angle) * (sawRadius + 8);
            const y2 = sawY + Math.sin(angle) * (sawRadius + 8);
            const nextAngle = ((i + 1) / 12) * Math.PI * 2;
            const x3 = sawX + Math.cos(nextAngle) * sawRadius;
            const y3 = sawY + Math.sin(nextAngle) * sawRadius;

            graphics.beginPath();
            graphics.moveTo(x1, y1);
            graphics.lineTo(x2, y2);
            graphics.lineTo(x3, y3);
            graphics.closePath();
            graphics.fillPath();
        }

        // Center bolt on saw
        graphics.fillStyle(0x424242, 1);
        graphics.fillCircle(sawX, sawY, 8);

        // Stacked logs in front of building
        for (let i = 0; i < 3; i++) {
            const logX = x - 60 + (i * 25);
            const logY = y - 30;

            // Log body
            graphics.fillStyle(scheme.logs, 1);
            graphics.fillRect(logX - 10, logY, 20, 30);

            // Wood grain rings on top
            graphics.lineStyle(1, this.darkenColor(scheme.logs, 0.7), 1);
            graphics.strokeCircle(logX, logY + 2, 6);
            graphics.strokeCircle(logX, logY + 2, 4);
        }

        // Loading door (upper level)
        graphics.fillStyle(this.darkenColor(scheme.building, 0.6), 1);
        graphics.fillRect(x - 30, y - building.height + 30, 30, 40);
        graphics.lineStyle(2, 0x000000, 1);
        graphics.strokeRect(x - 30, y - building.height + 30, 30, 40);

        // Windows
        graphics.fillStyle(scheme.window, 1);
        graphics.fillRect(x - 70, y - building.height + 100, 25, 30);
        graphics.fillRect(x + 10, y - building.height + 100, 25, 30);

        graphics.lineStyle(2, 0x000000, 1);
        graphics.strokeRect(x - 70, y - building.height + 100, 25, 30);
        graphics.strokeRect(x + 10, y - building.height + 100, 25, 30);

        // Window panes (cross)
        graphics.lineBetween(x - 57.5, y - building.height + 100, x - 57.5, y - building.height + 130);
        graphics.lineBetween(x - 70, y - building.height + 115, x - 45, y - building.height + 115);
        graphics.lineBetween(x + 22.5, y - building.height + 100, x + 22.5, y - building.height + 130);
        graphics.lineBetween(x + 10, y - building.height + 115, x + 35, y - building.height + 115);

        // Main door
        graphics.fillStyle(this.darkenColor(scheme.building, 0.5), 1);
        graphics.fillRect(x - 20, y - 50, 40, 50);
        graphics.lineStyle(3, 0x000000, 1);
        graphics.strokeRect(x - 20, y - 50, 40, 50);

        // Border
        graphics.lineStyle(3, 0x000000, 1);
        graphics.strokeRect(x - building.width/2, y - building.height, building.width, building.height);
    }

    drawBrickFactory(graphics, building, x, y, facadeVariation) {
        const scheme = ColorSchemes.brickfactory[facadeVariation % 4];

        // Main building (brick texture)
        graphics.fillStyle(scheme.building, 1);
        graphics.fillRect(x - building.width/2, y - building.height, building.width, building.height);

        // Brick pattern (rows of bricks)
        graphics.lineStyle(1, this.darkenColor(scheme.building, 0.75), 1);
        for (let row = 0; row < 10; row++) {
            const brickY = y - building.height + (row * 20);
            const offsetX = (row % 2) * 10; // Alternate rows for brick pattern

            for (let col = 0; col < 5; col++) {
                const brickX = x - building.width/2 + offsetX + (col * 40);
                graphics.strokeRect(brickX, brickY, 38, 18);
            }
        }

        // Tall chimney on the left side (industrial feature)
        const chimneyX = x - 70;
        const chimneyWidth = 25;
        const chimneyHeight = 100;

        graphics.fillStyle(scheme.chimney, 1);
        graphics.fillRect(chimneyX - chimneyWidth/2, y - building.height - chimneyHeight, chimneyWidth, chimneyHeight);

        // Chimney top (wider)
        graphics.fillRect(chimneyX - chimneyWidth/2 - 3, y - building.height - chimneyHeight, chimneyWidth + 6, 8);

        // Chimney brick detail
        graphics.lineStyle(1, 0x000000, 0.5);
        for (let i = 0; i < 5; i++) {
            graphics.lineBetween(
                chimneyX - chimneyWidth/2,
                y - building.height - chimneyHeight + (i * 20),
                chimneyX + chimneyWidth/2,
                y - building.height - chimneyHeight + (i * 20)
            );
        }

        // Smoke from chimney
        graphics.fillStyle(0x808080, 0.3);
        graphics.fillCircle(chimneyX - 5, y - building.height - chimneyHeight - 15, 8);
        graphics.fillCircle(chimneyX + 3, y - building.height - chimneyHeight - 25, 10);
        graphics.fillCircle(chimneyX - 8, y - building.height - chimneyHeight - 35, 9);

        // Kiln/furnace opening (glowing)
        graphics.fillStyle(scheme.kiln, 1);
        graphics.beginPath();
        graphics.arc(x + 40, y - 60, 20, Math.PI, 0, true); // Arch opening
        graphics.closePath();
        graphics.fillPath();

        graphics.lineStyle(3, this.darkenColor(scheme.kiln, 0.7), 1);
        graphics.beginPath();
        graphics.arc(x + 40, y - 60, 20, Math.PI, 0, true);
        graphics.strokePath();

        // Glow effect from kiln
        graphics.fillStyle(0xFFFF00, 0.3);
        graphics.fillCircle(x + 40, y - 50, 15);

        // Stacked bricks (finished product) in front
        for (let stack = 0; stack < 2; stack++) {
            for (let layer = 0; layer < 3; layer++) {
                const stackX = x - 50 + (stack * 35);
                const stackY = y - 25 + (layer * -8);

                graphics.fillStyle(scheme.bricks, 1);
                graphics.fillRect(stackX - 15, stackY, 30, 8);
                graphics.lineStyle(1, 0x000000, 1);
                graphics.strokeRect(stackX - 15, stackY, 30, 8);

                // Brick divisions
                graphics.lineBetween(stackX - 5, stackY, stackX - 5, stackY + 8);
                graphics.lineBetween(stackX + 5, stackY, stackX + 5, stackY + 8);
            }
        }

        // Industrial windows (small and high up)
        graphics.fillStyle(scheme.window, 1);
        for (let i = 0; i < 3; i++) {
            const winX = x - 60 + (i * 35);
            graphics.fillRect(winX, y - building.height + 40, 20, 25);
            graphics.lineStyle(2, 0x000000, 1);
            graphics.strokeRect(winX, y - building.height + 40, 20, 25);

            // Window panes
            graphics.lineBetween(winX + 10, y - building.height + 40, winX + 10, y - building.height + 65);
            graphics.lineBetween(winX, y - building.height + 52.5, winX + 20, y - building.height + 52.5);
        }

        // Large loading door
        graphics.fillStyle(this.darkenColor(scheme.building, 0.5), 1);
        graphics.fillRect(x - 25, y - 80, 50, 80);
        graphics.lineStyle(3, 0x000000, 1);
        graphics.strokeRect(x - 25, y - 80, 50, 80);

        // Door panels (industrial garage door look)
        graphics.lineStyle(2, this.darkenColor(scheme.building, 0.6), 1);
        for (let i = 1; i < 5; i++) {
            graphics.lineBetween(x - 25, y - 80 + (i * 16), x + 25, y - 80 + (i * 16));
        }

        // Border
        graphics.lineStyle(3, 0x000000, 1);
        graphics.strokeRect(x - building.width/2, y - building.height, building.width, building.height);
    }

    drawPark(graphics, building, x, y, facadeVariation) {
        // Trees with trunks that go to the ground
        for (let i = 0; i < 3; i++) {
            const treeX = x - 60 + (i * 60);
            const treeFoliageY = y - building.height + 40; // Where the foliage sits
            const trunkHeight = building.height - 40; // Trunk goes from foliage to ground

            // Tree trunk (goes all the way to the ground)
            graphics.fillStyle(0x5D4037, 1);
            graphics.fillRect(treeX - 6, treeFoliageY, 12, trunkHeight);

            // Tree foliage (layered circles for fuller look)
            graphics.fillStyle(0x2E7D32, 1);
            graphics.fillCircle(treeX, treeFoliageY, 22);
            graphics.fillCircle(treeX - 15, treeFoliageY + 5, 16);
            graphics.fillCircle(treeX + 15, treeFoliageY + 5, 16);
            graphics.fillCircle(treeX, treeFoliageY - 15, 18);
        }

        // White fence in front of trees (about 1/3 up the tree height)
        const fenceHeight = (building.height - 40) / 3; // About 1/3 of tree trunk height
        const fenceBottom = y;
        const fenceTop = fenceBottom - fenceHeight;
        const picketWidth = 4;
        const picketSpacing = 10;

        // Draw horizontal rails first (behind pickets)
        graphics.fillStyle(0xF5F5F5, 1);
        graphics.fillRect(x - building.width/2, fenceTop + fenceHeight * 0.3, building.width, 3);
        graphics.fillRect(x - building.width/2, fenceTop + fenceHeight * 0.7, building.width, 3);

        // Draw white pickets
        graphics.fillStyle(0xFFFFFF, 1);
        for (let i = 0; i < building.width / picketSpacing; i++) {
            const picketX = x - building.width/2 + (i * picketSpacing);

            // Picket post
            graphics.fillRect(picketX, fenceTop, picketWidth, fenceHeight);

            // Pointed top
            graphics.beginPath();
            graphics.moveTo(picketX, fenceTop);
            graphics.lineTo(picketX + picketWidth/2, fenceTop - 5);
            graphics.lineTo(picketX + picketWidth, fenceTop);
            graphics.closePath();
            graphics.fillPath();
        }
    }

    drawPlayground(graphics, building, x, y, facadeVariation) {
        // Transparent background - no mulch base
        // graphics.fillStyle(0xA1887F, 1);
        // graphics.fillRect(x - building.width/2, y - building.height, building.width, building.height);

        // Swing set - positioned on ground
        const swingX = x - 50;
        const swingHeight = 60;
        const swingY = y - swingHeight; // Top of frame

        graphics.fillStyle(0xFF9800, 1);
        // Swing frame posts (sitting on ground)
        graphics.fillRect(swingX - 40, swingY, 5, swingHeight);
        graphics.fillRect(swingX + 35, swingY, 5, swingHeight);
        // Top bar
        graphics.fillRect(swingX - 40, swingY, 80, 5);

        // Swings hanging from top bar
        graphics.lineStyle(2, 0x424242, 1);
        graphics.lineBetween(swingX - 25, swingY + 5, swingX - 25, swingY + 45);
        graphics.lineBetween(swingX + 20, swingY + 5, swingX + 20, swingY + 45);
        graphics.fillStyle(0xF44336, 1);
        graphics.fillRect(swingX - 30, swingY + 45, 10, 3);
        graphics.fillRect(swingX + 15, swingY + 45, 10, 3);

        // Slide - positioned on ground
        const slideX = x + 40;
        const slideHeight = 70;
        const slideY = y - slideHeight; // Top of platform

        graphics.fillStyle(0x2196F3, 1);
        // Slide platform
        graphics.fillRect(slideX - 15, slideY, 30, 5);
        // Platform support legs
        graphics.fillRect(slideX - 10, slideY + 5, 5, slideHeight - 5);
        graphics.fillRect(slideX + 5, slideY + 5, 5, slideHeight - 5);
        // Slide surface (goes down to ground)
        graphics.fillTriangle(
            slideX - 15, slideY + 5,
            slideX + 15, slideY + 5,
            slideX + 40, y
        );

        // Border removed for transparent background
        // graphics.lineStyle(3, 0xFF6F00, 1);
        // graphics.strokeRect(x - building.width/2, y - building.height, building.width, building.height);
    }

    drawFountain(graphics, building, x, y, facadeVariation) {
        // Stone base
        graphics.fillStyle(0x90A4AE, 1);
        graphics.fillCircle(x, y - building.height/2, building.width/2);

        // Inner basin
        graphics.fillStyle(0x607D8B, 1);
        graphics.fillCircle(x, y - building.height/2, building.width/2 - 10);

        // Water
        graphics.fillStyle(0x2196F3, 0.6);
        graphics.fillCircle(x, y - building.height/2 + 5, building.width/2 - 15);

        // Center pillar
        graphics.fillStyle(0xB0BEC5, 1);
        graphics.fillRect(x - 10, y - building.height/2 - 30, 20, 30);

        // Water spray (decorative dots)
        graphics.fillStyle(0x64B5F6, 0.8);
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const sprayX = x + Math.cos(angle) * 15;
            const sprayY = y - building.height/2 - 35 + Math.sin(angle) * 10;
            graphics.fillCircle(sprayX, sprayY, 3);
        }

        // Highlight
        graphics.fillStyle(0xFFFFFF, 0.3);
        graphics.fillCircle(x - 15, y - building.height/2 - 10, 20);

        // Border
        graphics.lineStyle(3, 0x455A64, 1);
        graphics.strokeCircle(x, y - building.height/2, building.width/2);
    }

    drawBakery(graphics, building, x, y, facadeVariation) {
        const scheme = ColorSchemes.bakery[facadeVariation % 4];

        // Bottom floor (painted pink)
        graphics.fillStyle(scheme.building, 1);
        graphics.fillRect(x - building.width/2, y - 120, building.width, 120);

        // Top floor (brick pattern)
        const brickColor = 0xA0522D; // Sienna/brick color
        graphics.fillStyle(brickColor, 1);
        graphics.fillRect(x - building.width/2, y - building.height, building.width, building.height - 120);

        // Brick pattern on top floor (clipped to building bounds)
        graphics.lineStyle(1, 0x8B4513, 0.6);
        const brickHeight = 8;
        const brickWidth = 20;
        const topFloorStart = y - building.height;
        const topFloorEnd = y - 120;
        const leftEdge = x - building.width/2;
        const rightEdge = x + building.width/2;

        for (let by = topFloorStart; by < topFloorEnd; by += brickHeight) {
            const offset = ((by - topFloorStart) / brickHeight) % 2 === 0 ? 0 : brickWidth / 2;
            for (let bx = leftEdge; bx < rightEdge; bx += brickWidth) {
                const brickX = bx + offset;
                const brickW = Math.min(brickWidth, rightEdge - brickX);
                if (brickX >= leftEdge && brickX < rightEdge && brickW > 0) {
                    graphics.strokeRect(brickX, by, brickW, brickHeight);
                }
            }
        }

        // Upper floor windows (2 windows)
        for (let col = 0; col < 2; col++) {
            const wx = x - 40 + (col * 80);
            const wy = y - building.height + 40;

            // Window shadow
            graphics.fillStyle(0x000000, 0.3);
            graphics.fillRect(wx - 15 + 2, wy + 2, 30, 40);

            // Window
            graphics.fillStyle(scheme.window, 1);
            graphics.fillRect(wx - 15, wy, 30, 40);

            // Window reflection
            graphics.fillStyle(0xFFFFFF, 0.2);
            graphics.fillRect(wx - 15, wy, 30, 20);

            // Window frame
            graphics.lineStyle(2, 0x654321, 1);
            graphics.strokeRect(wx - 15, wy, 30, 40);
            graphics.lineBetween(wx, wy, wx, wy + 40);
        }

        // Awning
        graphics.fillStyle(scheme.awning, 1);
        graphics.fillRect(x - building.width/2 - 10, y - 120, building.width + 20, 30);

        // Awning stripes
        graphics.lineStyle(3, this.darkenColor(scheme.awning, 0.8), 1);
        for (let i = 0; i < 5; i++) {
            const stripeX = x - building.width/2 + (i * 50);
            graphics.lineBetween(stripeX, y - 120, stripeX, y - 90);
        }

        // Display window
        graphics.fillStyle(scheme.window, 1);
        graphics.fillRect(x - 60, y - 85, 120, 55);

        // Window frame
        graphics.lineStyle(3, 0x8B4513, 1);
        graphics.strokeRect(x - 60, y - 85, 120, 55);

        // Baked goods display - Side view pies (semicircles)
        // Pie 1
        graphics.fillStyle(0xCD853F, 1); // Crust color
        graphics.beginPath();
        graphics.arc(x - 35, y - 50, 12, Math.PI, 0, false);
        graphics.lineTo(x - 35 + 12, y - 50);
        graphics.lineTo(x - 35 - 12, y - 50);
        graphics.closePath();
        graphics.fillPath();

        // Pie filling (darker)
        graphics.fillStyle(0x8B4513, 1);
        graphics.fillRect(x - 42, y - 53, 14, 3);

        // Pie 2
        graphics.fillStyle(0xCD853F, 1);
        graphics.beginPath();
        graphics.arc(x - 10, y - 50, 12, Math.PI, 0, false);
        graphics.lineTo(x - 10 + 12, y - 50);
        graphics.lineTo(x - 10 - 12, y - 50);
        graphics.closePath();
        graphics.fillPath();

        graphics.fillStyle(0x8B4513, 1);
        graphics.fillRect(x - 17, y - 53, 14, 3);

        // Donuts (side view - circles with hole)
        graphics.fillStyle(0xD2691E, 1);
        graphics.fillCircle(x + 20, y - 55, 10);
        graphics.fillStyle(scheme.window, 1);
        graphics.fillCircle(x + 20, y - 55, 4);

        graphics.fillStyle(0xD2691E, 1);
        graphics.fillCircle(x + 40, y - 55, 10);
        graphics.fillStyle(scheme.window, 1);
        graphics.fillCircle(x + 40, y - 55, 4);

        // Door (taller - 70px tall to match customer height)
        graphics.fillStyle(0x8B4513, 1);
        graphics.fillRect(x - 25, y - 70, 50, 70);
        graphics.lineStyle(2, 0x654321, 1);
        graphics.strokeRect(x - 25, y - 70, 50, 70);

        // Door window
        graphics.fillStyle(scheme.window, 0.7);
        graphics.fillRoundedRect(x - 18, y - 60, 36, 30, 3);

        // Door handle
        graphics.fillStyle(0xFFD700, 1);
        graphics.fillCircle(x + 12, y - 35, 3);

        // Border (in segments to avoid cutting through awning)
        graphics.lineStyle(3, 0x000000, 1);
        // Top floor border (brick section)
        graphics.strokeRect(x - building.width/2, y - building.height, building.width, building.height - 120);
        // Left side of bottom floor
        graphics.lineBetween(x - building.width/2, y - 120, x - building.width/2, y);
        // Right side of bottom floor
        graphics.lineBetween(x + building.width/2, y - 120, x + building.width/2, y);
        // Bottom edge
        graphics.lineBetween(x - building.width/2, y, x + building.width/2, y);

        // Roof (slanted, overhangs the walls) - drawn last so it appears on top
        graphics.fillStyle(0x8B4513, 1);
        graphics.beginPath();
        graphics.moveTo(x - building.width/2 - 15, y - building.height + 5);
        graphics.lineTo(x, y - building.height - 25);
        graphics.lineTo(x + building.width/2 + 15, y - building.height + 5);
        graphics.closePath();
        graphics.fillPath();
        graphics.lineStyle(2, 0x654321, 1);
        graphics.strokePath();
    }

    drawArcade(graphics, building, x, y, facadeVariation) {
        const scheme = ColorSchemes.arcade[facadeVariation % 4];

        // Building base (dark for arcade vibe)
        graphics.fillStyle(scheme.building, 1);
        graphics.fillRect(x - building.width/2, y - building.height, building.width, building.height);

        // Flat roof
        graphics.fillStyle(0x1A1A1A, 1);
        graphics.fillRect(x - building.width/2 - 5, y - building.height - 10, building.width + 10, 10);
        graphics.lineStyle(2, 0x000000, 1);
        graphics.strokeRect(x - building.width/2 - 5, y - building.height - 10, building.width + 10, 10);

        // Neon sign area at top
        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(x - building.width/2 + 10, y - building.height + 10, building.width - 20, 50);

        // Neon sign border effect (brighter, more visible)
        graphics.lineStyle(5, scheme.neon, 1);
        graphics.strokeRect(x - building.width/2 + 10, y - building.height + 10, building.width - 20, 50);

        graphics.lineStyle(3, scheme.accent, 1);
        graphics.strokeRect(x - building.width/2 + 15, y - building.height + 15, building.width - 30, 40);

        // Windows (lighter, more visible)
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 3; col++) {
                const wx = x - 60 + (col * 60);
                const wy = y - building.height + 85 + (row * 60);

                // Lighter base window color
                graphics.fillStyle(0x4A4A4A, 1);
                graphics.fillRect(wx - 20, wy, 40, 35);

                // Brighter neon glow effect
                graphics.fillStyle(scheme.neon, 0.5);
                graphics.fillRect(wx - 20, wy, 40, 35);

                // Window frame
                graphics.lineStyle(2, scheme.accent, 1);
                graphics.strokeRect(wx - 20, wy, 40, 35);
            }
        }

        // Door (taller - 70px to match customer height)
        graphics.fillStyle(0x2A2A2A, 1);
        graphics.fillRect(x - 30, y - 70, 60, 70);

        // Neon door frame
        graphics.lineStyle(3, scheme.neon, 1);
        graphics.strokeRect(x - 30, y - 70, 60, 70);

        // Door handle
        graphics.fillStyle(scheme.accent, 1);
        graphics.fillCircle(x + 18, y - 35, 4);

        // Border
        graphics.lineStyle(3, 0x000000, 1);
        graphics.strokeRect(x - building.width/2, y - building.height, building.width, building.height);
    }

    drawLibrary(graphics, building, x, y, facadeVariation) {
        const scheme = ColorSchemes.library[facadeVariation % 4];

        // Building base
        graphics.fillStyle(scheme.building, 1);
        graphics.fillRect(x - building.width/2, y - building.height, building.width, building.height);

        // Flat roof with overhang
        graphics.fillStyle(this.darkenColor(scheme.building, 0.7), 1);
        graphics.fillRect(x - building.width/2 - 10, y - building.height - 15, building.width + 20, 15);
        graphics.lineStyle(3, 0x654321, 1);
        graphics.strokeRect(x - building.width/2 - 10, y - building.height - 15, building.width + 20, 15);

        // Classical columns (library aesthetic)
        graphics.fillStyle(scheme.columns, 1);
        for (let i = 0; i < 4; i++) {
            const colX = x - 75 + (i * 50);
            // Column
            graphics.fillRect(colX - 8, y - building.height + 40, 16, building.height - 80);
            // Capital (top of column)
            graphics.fillRect(colX - 12, y - building.height + 40, 24, 12);
            // Base
            graphics.fillRect(colX - 12, y - 40, 24, 12);
        }

        // Windows between columns
        graphics.fillStyle(scheme.window, 1);
        for (let i = 0; i < 3; i++) {
            const winX = x - 50 + (i * 50);
            graphics.fillRect(winX - 15, y - building.height + 80, 30, 100);

            // Window panes
            graphics.lineStyle(2, 0x8B4513, 1);
            graphics.strokeRect(winX - 15, y - building.height + 80, 30, 100);
            graphics.lineBetween(winX - 15, y - building.height + 130, winX + 15, y - building.height + 130);
        }

        // Door (grand entrance)
        graphics.fillStyle(scheme.door, 1);
        graphics.fillRect(x - 30, y - 65, 60, 65);

        // Door frame
        graphics.lineStyle(3, scheme.columns, 1);
        graphics.strokeRect(x - 35, y - 70, 70, 70);

        // Door panels
        graphics.lineStyle(2, this.darkenColor(scheme.door, 0.7), 1);
        graphics.strokeRect(x - 25, y - 60, 20, 55);
        graphics.strokeRect(x + 5, y - 60, 20, 55);

        // Border
        graphics.lineStyle(3, 0x000000, 1);
        graphics.strokeRect(x - building.width/2, y - building.height, building.width, building.height);
    }

    drawMuseum(graphics, building, x, y, facadeVariation) {
        const scheme = ColorSchemes.museum[facadeVariation % 4];

        // Building base
        graphics.fillStyle(scheme.building, 1);
        graphics.fillRect(x - building.width/2, y - building.height, building.width, building.height);

        // Classical columns (grand museum entrance)
        graphics.fillStyle(scheme.columns, 1);
        for (let i = 0; i < 5; i++) {
            const colX = x - 90 + (i * 45);
            // Column
            graphics.fillRect(colX - 10, y - building.height + 80, 20, building.height - 120);
            // Ornate capital
            graphics.fillRect(colX - 15, y - building.height + 80, 30, 15);
            graphics.fillRect(colX - 12, y - building.height + 95, 24, 10);
            // Base
            graphics.fillRect(colX - 15, y - 40, 30, 15);
        }

        // Windows (tall, elegant) - moved higher up
        graphics.fillStyle(scheme.window, 1);
        for (let i = 0; i < 4; i++) {
            const winX = x - 70 + (i * 45);
            const windowTopY = y - building.height + 50; // Moved down 10px
            graphics.fillRect(winX - 12, windowTopY, 24, 100);

            // Arched top
            graphics.beginPath();
            graphics.arc(winX, windowTopY, 12, Math.PI, 0, false);
            graphics.fillPath();

            // Window frame
            graphics.lineStyle(2, scheme.accent, 1);
            graphics.strokeRect(winX - 12, windowTopY, 24, 100);
        }

        // Grand entrance door
        graphics.fillStyle(scheme.accent, 1);
        graphics.fillRect(x - 35, y - 70, 70, 70);

        // Door frame (ornate)
        graphics.lineStyle(4, scheme.roof, 1);
        graphics.strokeRect(x - 40, y - 75, 80, 75);

        // Door decoration
        graphics.fillStyle(scheme.roof, 1);
        graphics.fillRect(x - 30, y - 65, 25, 60);
        graphics.fillRect(x + 5, y - 65, 25, 60);

        // Border
        graphics.lineStyle(3, 0x000000, 1);
        graphics.strokeRect(x - building.width/2, y - building.height, building.width, building.height);
    }

    drawThemePark(graphics, building, x, y, facadeVariation = 0) {
        const scheme = ColorSchemes.themePark[facadeVariation % ColorSchemes.themePark.length];

        // NO BACKGROUND - transparent!

        // Ferris wheel (left side) with base on ground
        const wheelX = x - 180;
        const wheelY = y - 150;

        // Ferris wheel base structure on ground
        graphics.fillStyle(0x8B4513, 1); // Brown base
        graphics.fillRect(wheelX - 30, y - 40, 60, 40);
        graphics.lineStyle(3, 0x000000, 1);
        graphics.strokeRect(wheelX - 30, y - 40, 60, 40);

        // Support beams from base to wheel
        graphics.lineStyle(4, 0x808080, 1); // Gray metal
        graphics.lineBetween(wheelX - 20, y - 40, wheelX - 10, wheelY);
        graphics.lineBetween(wheelX + 20, y - 40, wheelX + 10, wheelY);

        // Ferris wheel circle
        graphics.lineStyle(3, 0x000000, 1);
        graphics.strokeCircle(wheelX, wheelY, 60);

        // Ferris wheel spokes
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            graphics.lineBetween(
                wheelX, wheelY,
                wheelX + Math.cos(angle) * 60,
                wheelY + Math.sin(angle) * 60
            );
        }

        // Ferris wheel gondolas
        graphics.fillStyle(scheme.ride1, 1);
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const gX = wheelX + Math.cos(angle) * 60;
            const gY = wheelY + Math.sin(angle) * 60;
            graphics.fillRect(gX - 8, gY - 8, 16, 16);
            graphics.lineStyle(3, 0x000000, 1);
            graphics.strokeRect(gX - 8, gY - 8, 16, 16);
        }

        // Circus tent (center-left)
        const tentX = x - 80;
        const tentY = y;

        // Tent body (striped)
        graphics.fillStyle(scheme.entrance, 1);
        graphics.fillTriangle(
            tentX - 50, tentY,
            tentX, tentY - 100,
            tentX + 50, tentY
        );
        graphics.lineStyle(3, 0x000000, 1);
        graphics.strokeTriangle(
            tentX - 50, tentY,
            tentX, tentY - 100,
            tentX + 50, tentY
        );

        // Tent stripes
        graphics.lineStyle(2, 0xFFFFFF, 1);
        graphics.lineBetween(tentX - 40, tentY - 20, tentX, tentY - 100);
        graphics.lineBetween(tentX - 20, tentY - 40, tentX, tentY - 100);
        graphics.lineBetween(tentX + 20, tentY - 40, tentX, tentY - 100);
        graphics.lineBetween(tentX + 40, tentY - 20, tentX, tentY - 100);

        // Tent flag on top
        graphics.fillStyle(scheme.flags, 1);
        graphics.fillTriangle(
            tentX, tentY - 100,
            tentX + 15, tentY - 105,
            tentX, tentY - 110
        );

        // Entrance gate (center-right)
        graphics.fillStyle(scheme.entrance, 1);
        graphics.fillRect(x + 20, y - 80, 80, 80);
        graphics.lineStyle(3, 0x000000, 1);
        graphics.strokeRect(x + 20, y - 80, 80, 80);

        // Entrance archway
        graphics.fillStyle(0xFFFFFF, 0.3);
        graphics.fillCircle(x + 60, y - 40, 30);
        graphics.lineStyle(3, 0x000000, 1);
        graphics.strokeCircle(x + 60, y - 40, 30);

        // Entrance sign "THEME PARK"
        graphics.fillStyle(scheme.entrance, 1);
        graphics.fillRect(x, y - 120, 120, 30);
        graphics.lineStyle(2, 0x000000, 1);
        graphics.strokeRect(x, y - 120, 120, 30);

        // Roller coaster track (right side) - using line segments for wavy effect
        graphics.lineStyle(5, scheme.ride2, 1);
        // First hill up
        graphics.lineBetween(x + 140, y, x + 160, y - 100);
        graphics.lineBetween(x + 160, y - 100, x + 180, y - 160);
        graphics.lineBetween(x + 180, y - 160, x + 200, y - 180);
        // Down and up again
        graphics.lineBetween(x + 200, y - 180, x + 220, y - 120);
        graphics.lineBetween(x + 220, y - 120, x + 230, y - 70);
        // Final drop
        graphics.lineBetween(x + 230, y - 70, x + 220, y - 30);
        graphics.lineBetween(x + 220, y - 30, x + 200, y);

        // Roller coaster supports
        graphics.lineStyle(2, 0x000000, 1);
        graphics.lineBetween(x + 160, y, x + 160, y - 100);
        graphics.lineBetween(x + 200, y, x + 200, y - 180);
        graphics.lineBetween(x + 220, y, x + 220, y - 120);

        // Fence along bottom
        graphics.lineStyle(3, scheme.fence, 1);
        for (let fx = -230; fx < 230; fx += 20) {
            graphics.lineBetween(x + fx, y, x + fx, y - 30);
        }
        graphics.lineBetween(x - 230, y - 30, x + 230, y - 30);

        // Colorful flags on top
        for (let i = 0; i < 12; i++) {
            const flagX = x - 220 + (i * 40);
            const flagY = y - building.height + 10;
            const flagColor = i % 3 === 0 ? scheme.flags : (i % 3 === 1 ? 0xFFFF00 : 0x00FF00);
            graphics.fillStyle(flagColor, 1);
            graphics.fillTriangle(
                flagX, flagY,
                flagX + 15, flagY + 10,
                flagX, flagY + 20
            );
        }

        // NO BORDER - keep it transparent!
    }

    drawSchool(graphics, building, x, y, facadeVariation) {
        const scheme = ColorSchemes.school[facadeVariation % 4];

        // Main building body
        graphics.fillStyle(scheme.building, 1);
        graphics.fillRect(x - building.width/2, y - building.height, building.width, building.height);

        // Roof
        graphics.fillStyle(scheme.roof, 1);
        graphics.fillTriangle(
            x - building.width/2 - 10, y - building.height,
            x + building.width/2 + 10, y - building.height,
            x, y - building.height - 40
        );

        // Entrance door (centered, bottom)
        graphics.fillStyle(scheme.door, 1);
        graphics.fillRect(x - 25, y - 60, 50, 60);

        // Door handle
        graphics.fillStyle(0xFFD700, 1);
        graphics.fillCircle(x + 15, y - 30, 4);

        // Windows (3 rows, 4 columns) - properly centered within building width
        graphics.fillStyle(scheme.window, 1);
        const windowWidth = 30;
        const windowSpacing = 50; // Space between window centers
        const startX = x - 85; // Starting position for first window

        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 4; col++) {
                const wx = startX + (col * windowSpacing);
                const wy = y - building.height + 40 + (row * 60);
                graphics.fillRect(wx, wy, windowWidth, 35);

                // Window panes
                graphics.lineStyle(2, this.darkenColor(scheme.window, 0.6), 1);
                graphics.lineBetween(wx, wy + 17.5, wx + windowWidth, wy + 17.5);
                graphics.lineBetween(wx + windowWidth/2, wy, wx + windowWidth/2, wy + 35);
            }
        }

        // Flag pole on roof (centered more to avoid edge)
        graphics.lineStyle(3, 0x8B4513, 1); // Brown pole
        graphics.lineBetween(x + 50, y - building.height, x + 50, y - building.height - 60);

        // Flag
        graphics.fillStyle(scheme.flag, 1);
        graphics.fillTriangle(
            x + 50, y - building.height - 60,
            x + 80, y - building.height - 50,
            x + 50, y - building.height - 40
        );

        // "SCHOOL" sign above door
        graphics.fillStyle(0xFFFFFF, 1);
        graphics.fillRect(x - 40, y - building.height + 20, 80, 25);

        // Border
        graphics.lineStyle(2, 0x000000, 1);
        graphics.strokeRect(x - building.width/2, y - building.height, building.width, building.height);
    }

    drawOfficeBuilding(graphics, building, x, y, facadeVariation) {
        const scheme = ColorSchemes.officeBuilding[facadeVariation % 4];

        // Main building body
        graphics.fillStyle(scheme.building, 1);
        graphics.fillRect(x - building.width/2, y - building.height, building.width, building.height);

        // Roof trim
        graphics.fillStyle(scheme.roof, 1);
        graphics.fillRect(x - building.width/2 - 5, y - building.height, building.width + 10, 20);

        // Vertical trim strips
        graphics.fillStyle(scheme.trim, 1);
        graphics.fillRect(x - building.width/2, y - building.height, 8, building.height);
        graphics.fillRect(x + building.width/2 - 8, y - building.height, 8, building.height);

        // Glass windows grid (modern office look - 4 columns, 12 rows)
        graphics.fillStyle(scheme.windows, 1);
        const windowWidth = 40;
        const windowHeight = 25;
        const cols = 4;
        const rows = 12;
        const xSpacing = (building.width - 40) / cols;
        const ySpacing = (building.height - 40) / rows;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const wx = x - building.width/2 + 20 + (col * xSpacing);
                const wy = y - building.height + 25 + (row * ySpacing);
                graphics.fillRect(wx, wy, windowWidth, windowHeight);

                // Reflective effect
                graphics.fillStyle(this.darkenColor(scheme.windows, 0.7), 0.3);
                graphics.fillRect(wx, wy, windowWidth/2, windowHeight);
                graphics.fillStyle(scheme.windows, 1);
            }
        }

        // Entrance at bottom
        graphics.fillStyle(scheme.door, 1);
        graphics.fillRect(x - 40, y - 80, 80, 80);

        // Glass door effect
        graphics.fillStyle(scheme.windows, 0.6);
        graphics.fillRect(x - 35, y - 75, 70, 70);

        // Building border
        graphics.lineStyle(3, scheme.trim, 1);
        graphics.strokeRect(x - building.width/2, y - building.height, building.width, building.height);
    }

    drawMovieTheater(graphics, building, x, y, facadeVariation) {
        const scheme = ColorSchemes.movieTheater[facadeVariation % 4];

        // Main building body
        graphics.fillStyle(scheme.building, 1);
        graphics.fillRect(x - building.width/2, y - building.height, building.width, building.height);

        // Marquee (ticket booth awning at top)
        graphics.fillStyle(scheme.marquee, 1);
        graphics.fillRect(x - building.width/2 - 10, y - building.height + 40, building.width + 20, 50);

        // Marquee border lights
        for (let lx = -building.width/2; lx < building.width/2; lx += 15) {
            graphics.fillStyle(scheme.lights, 1);
            graphics.fillCircle(x + lx, y - building.height + 45, 4);
            graphics.fillCircle(x + lx, y - building.height + 85, 4);
        }

        // "CINEMA" text area
        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(x - 80, y - building.height + 50, 160, 25);

        // Movie posters on walls (3 frames) - positioned below marquee, centered
        const posterColors = [0xFF6347, 0x4169E1, 0x32CD32];
        const posterWidth = 50;
        const posterGap = 10; // Gap between posters
        const totalWidth = (posterWidth * 3) + (posterGap * 2); // Total width of all posters + gaps
        const startX = x - (totalWidth / 2); // Start position to center all three posters

        for (let i = 0; i < 3; i++) {
            const px = startX + (i * (posterWidth + posterGap));
            const py = y - 180; // Below the marquee

            // Poster frame
            graphics.fillStyle(0x000000, 1);
            graphics.fillRect(px - 2, py - 2, 54, 74);

            // Poster background
            graphics.fillStyle(posterColors[i], 1);
            graphics.fillRect(px, py, 50, 70);

            // Add geometric designs to each poster
            if (i === 0) {
                // Red poster: Circles and triangles
                graphics.fillStyle(0xFFFFFF, 0.8);
                graphics.fillCircle(px + 25, py + 20, 12);
                graphics.fillStyle(0x000000, 0.6);
                graphics.fillTriangle(px + 10, py + 50, px + 25, py + 35, px + 40, py + 50);
                graphics.fillStyle(0xFFD700, 0.7);
                graphics.fillCircle(px + 38, py + 15, 6);
            } else if (i === 1) {
                // Blue poster: Rectangles and lines
                graphics.fillStyle(0xFFFFFF, 0.8);
                graphics.fillRect(px + 8, py + 15, 34, 8);
                graphics.fillStyle(0xFFD700, 0.7);
                graphics.fillRect(px + 8, py + 28, 34, 3);
                graphics.fillStyle(0x000000, 0.5);
                graphics.fillRect(px + 12, py + 40, 26, 20);
                graphics.lineStyle(3, 0xFFFFFF, 0.8);
                graphics.lineBetween(px + 25, py + 35, px + 25, py + 65);
            } else {
                // Green poster: Stars and shapes
                graphics.fillStyle(0xFFFF00, 0.8);
                // Star shape (simplified as triangle + inverted triangle)
                graphics.fillTriangle(px + 25, py + 10, px + 18, py + 25, px + 32, py + 25);
                graphics.fillTriangle(px + 25, py + 30, px + 18, py + 15, px + 32, py + 15);
                graphics.fillStyle(0xFFFFFF, 0.7);
                graphics.fillCircle(px + 12, py + 45, 8);
                graphics.fillCircle(px + 38, py + 45, 8);
                graphics.fillStyle(0x000000, 0.5);
                graphics.fillRect(px + 18, py + 55, 14, 8);
            }
        }

        // Entrance doors (double doors)
        graphics.fillStyle(scheme.door, 1);
        graphics.fillRect(x - 45, y - 80, 40, 80);
        graphics.fillRect(x + 5, y - 80, 40, 80);

        // Door handles
        graphics.fillStyle(0xFFD700, 1);
        graphics.fillCircle(x - 10, y - 40, 5);
        graphics.fillCircle(x + 40, y - 40, 5);

        // Door window
        graphics.fillStyle(scheme.window, 1);
        graphics.fillRect(x - 40, y - 70, 30, 20);
        graphics.fillRect(x + 10, y - 70, 30, 20);

        // Red carpet
        graphics.fillStyle(0xDC143C, 1);
        graphics.fillRect(x - 50, y, 100, 5);

        // Building border
        graphics.lineStyle(2, this.darkenColor(scheme.building, 0.7), 1);
        graphics.strokeRect(x - building.width/2, y - building.height, building.width, building.height);
    }

    drawFireStation(graphics, building, x, y, facadeVariation) {
        const scheme = {
            building: 0xD32F2F, // Fire red
            accent: 0xFFEB3B,   // Yellow
            door: 0x8B0000,     // Dark red
            window: 0x87CEEB    // Sky blue
        };

        // Main building body
        graphics.fillStyle(scheme.building, 1);
        graphics.fillRect(x - building.width/2, y - building.height, building.width, building.height);

        // Yellow accent stripes
        graphics.fillStyle(scheme.accent, 1);
        graphics.fillRect(x - building.width/2, y - building.height + 40, building.width, 15);
        graphics.fillRect(x - building.width/2, y - building.height + 100, building.width, 15);

        // Garage doors (where fire trucks are stored)
        for (let i = 0; i < 2; i++) {
            const gx = x - 60 + (i * 80);

            // Door frame
            graphics.fillStyle(0x333333, 1);
            graphics.fillRect(gx, y - 130, 70, 130);

            // Door panels
            graphics.fillStyle(0x555555, 1);
            for (let j = 0; j < 6; j++) {
                graphics.fillRect(gx + 5, y - 125 + (j * 21), 60, 18);
            }

            // Door handle
            graphics.fillStyle(0xC0C0C0, 1);
            graphics.fillCircle(gx + 35, y - 20, 4);
        }

        // Windows on upper floor
        graphics.fillStyle(scheme.window, 1);
        for (let i = 0; i < 3; i++) {
            const wx = x - 75 + (i * 60);
            graphics.fillRect(wx, y - building.height + 30, 40, 35);

            // Window frame
            graphics.lineStyle(2, 0x000000, 1);
            graphics.strokeRect(wx, y - building.height + 30, 40, 35);
        }

        // Fire department logo/emblem
        graphics.fillStyle(0xFFD700, 1);
        graphics.fillCircle(x, y - building.height + 120, 25);
        graphics.fillStyle(scheme.building, 1);
        graphics.fillCircle(x, y - building.height + 120, 20);

        // Maltese cross shape (simplified)
        graphics.fillStyle(0xFFFFFF, 1);
        graphics.fillRect(x - 3, y - building.height + 105, 6, 30);
        graphics.fillRect(x - 15, y - building.height + 117, 30, 6);

        // Building border
        graphics.lineStyle(2, this.darkenColor(scheme.building, 0.7), 1);
        graphics.strokeRect(x - building.width/2, y - building.height, building.width, building.height);
    }

    drawPoliceStation(graphics, building, x, y, facadeVariation) {
        const scheme = {
            building: 0x1565C0, // Police blue
            accent: 0x0D47A1,   // Dark blue
            door: 0x37474F,     // Dark gray
            window: 0xFFFFFF    // White
        };

        // Main building body
        graphics.fillStyle(scheme.building, 1);
        graphics.fillRect(x - building.width/2, y - building.height, building.width, building.height);

        // Darker blue accent band
        graphics.fillStyle(scheme.accent, 1);
        graphics.fillRect(x - building.width/2, y - building.height + 60, building.width, 20);

        // Windows (grid pattern)
        graphics.fillStyle(scheme.window, 1);
        for (let floor = 0; floor < 3; floor++) {
            for (let i = 0; i < 4; i++) {
                const wx = x - 82.5 + (i * 45);
                const wy = y - building.height + 30 + (floor * 60);
                graphics.fillRect(wx, wy, 35, 40);

                // Window frame
                graphics.lineStyle(2, 0x000000, 1);
                graphics.strokeRect(wx, wy, 35, 40);
            }
        }

        // Main entrance
        graphics.fillStyle(scheme.door, 1);
        graphics.fillRect(x - 40, y - 90, 80, 90);

        // Door windows
        graphics.fillStyle(scheme.window, 1);
        graphics.fillRect(x - 35, y - 80, 30, 50);
        graphics.fillRect(x + 5, y - 80, 30, 50);

        // Police shield badge
        graphics.fillStyle(0xFFD700, 1);
        graphics.beginPath();
        graphics.moveTo(x, y - building.height + 20);
        graphics.lineTo(x - 30, y - building.height + 40);
        graphics.lineTo(x - 30, y - building.height + 80);
        graphics.lineTo(x, y - building.height + 100);
        graphics.lineTo(x + 30, y - building.height + 80);
        graphics.lineTo(x + 30, y - building.height + 40);
        graphics.closePath();
        graphics.fillPath();

        // Badge details
        graphics.fillStyle(scheme.building, 1);
        graphics.fillCircle(x, y - building.height + 60, 15);
        graphics.fillStyle(0xFFFFFF, 1);
        graphics.fillCircle(x, y - building.height + 60, 12);

        // Flashing light on roof
        graphics.fillStyle(0xFF0000, 1);
        graphics.fillCircle(x - 60, y - building.height - 10, 8);
        graphics.fillStyle(0x0000FF, 1);
        graphics.fillCircle(x + 60, y - building.height - 10, 8);

        // Building border
        graphics.lineStyle(2, this.darkenColor(scheme.building, 0.7), 1);
        graphics.strokeRect(x - building.width/2, y - building.height, building.width, building.height);
    }

    drawHospital(graphics, building, x, y, facadeVariation) {
        const scheme = {
            building: 0xFFFFFF, // White
            accent: 0xE0E0E0,   // Light gray
            cross: 0xFF0000,    // Red cross
            window: 0xB3E5FC    // Light blue
        };

        // Main building body (white)
        graphics.fillStyle(scheme.building, 1);
        graphics.fillRect(x - building.width/2, y - building.height, building.width, building.height);

        // Gray accent sections
        graphics.fillStyle(scheme.accent, 1);
        graphics.fillRect(x - building.width/2, y - building.height, 40, building.height);
        graphics.fillRect(x + building.width/2 - 40, y - building.height, 40, building.height);

        // Windows (many floors)
        graphics.fillStyle(scheme.window, 1);
        for (let floor = 0; floor < 4; floor++) {
            for (let i = 0; i < 3; i++) {
                const wx = x - 52.5 + (i * 38.75);
                const wy = y - building.height + 30 + (floor * 55);
                graphics.fillRect(wx, wy, 35, 50);

                // Window frame
                graphics.lineStyle(1, 0x666666, 1);
                graphics.strokeRect(wx, wy, 35, 50);

                // Window divider (cross)
                graphics.lineBetween(wx + 17.5, wy, wx + 17.5, wy + 50);
                graphics.lineBetween(wx, wy + 25, wx + 35, wy + 25);
            }
        }

        // Large red cross symbol on front
        graphics.fillStyle(scheme.cross, 1);
        const crossSize = 60;
        const crossThick = 20;
        // Vertical bar
        graphics.fillRect(x - crossThick/2, y - building.height + 20, crossThick, crossSize);
        // Horizontal bar
        graphics.fillRect(x - crossSize/2, y - building.height + 40, crossSize, crossThick);

        // Emergency entrance
        graphics.fillStyle(0x2196F3, 1);
        graphics.fillRect(x - building.width/2, y - 100, building.width, 25);

        // Entrance doors
        graphics.fillStyle(0x90CAF9, 1);
        graphics.fillRect(x - 50, y - 95, 45, 95);
        graphics.fillRect(x + 5, y - 95, 45, 95);

        // Helipad on roof (H symbol)
        graphics.fillStyle(0xFF6F00, 1);
        graphics.fillCircle(x, y - building.height - 20, 35);
        graphics.fillStyle(0xFFFFFF, 1);
        graphics.fillRect(x - 15, y - building.height - 30, 8, 20);
        graphics.fillRect(x + 7, y - building.height - 30, 8, 20);
        graphics.fillRect(x - 15, y - building.height - 23, 30, 6);

        // Building border
        graphics.lineStyle(3, 0xBDBDBD, 1);
        graphics.strokeRect(x - building.width/2, y - building.height, building.width, building.height);
    }

    drawTrainStation(graphics, building, x, y, facadeVariation) {
        const scheme = {
            building: 0x795548, // Brown
            roof: 0x5D4037,     // Dark brown
            platform: 0xBDBDBD, // Gray
            tracks: 0x424242,   // Dark gray
            accent: 0xFFEB3B    // Yellow
        };

        // Main station building
        graphics.fillStyle(scheme.building, 1);
        graphics.fillRect(x - building.width/2, y - building.height, building.width, building.height);

        // Peaked roof
        graphics.fillStyle(scheme.roof, 1);
        graphics.beginPath();
        graphics.moveTo(x - building.width/2 - 20, y - building.height);
        graphics.lineTo(x, y - building.height - 40);
        graphics.lineTo(x + building.width/2 + 20, y - building.height);
        graphics.closePath();
        graphics.fillPath();

        // Roof ridge
        graphics.fillStyle(0x3E2723, 1);
        graphics.fillRect(x - building.width/2 - 20, y - building.height - 5, building.width + 40, 5);

        // Clock tower on roof
        graphics.fillStyle(scheme.building, 1);
        graphics.fillRect(x - 20, y - building.height - 80, 40, 40);
        graphics.fillStyle(0xFFFFFF, 1);
        graphics.fillCircle(x, y - building.height - 60, 15);
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(x, y - building.height - 60, 12);

        // Clock hands
        graphics.lineStyle(2, 0xFFFFFF, 1);
        graphics.lineBetween(x, y - building.height - 60, x, y - building.height - 70);
        graphics.lineBetween(x, y - building.height - 60, x + 8, y - building.height - 60);

        // Large arched entrance
        graphics.fillStyle(0x37474F, 1);
        graphics.fillRect(x - 50, y - 100, 100, 100);

        // Arch top
        graphics.beginPath();
        graphics.arc(x, y - 100, 50, Math.PI, 0, false);
        graphics.fillPath();

        // Platform canopy
        graphics.fillStyle(scheme.roof, 1);
        graphics.fillRect(x - building.width/2 - 30, y - 130, building.width + 60, 10);

        // Support pillars for canopy
        graphics.fillStyle(0x616161, 1);
        for (let i = -1; i <= 1; i++) {
            const px = x + (i * 100);
            graphics.fillRect(px - 5, y - 130, 10, 30);
        }

        // Windows
        graphics.fillStyle(0x87CEEB, 1);
        for (let floor = 0; floor < 2; floor++) {
            for (let i = 0; i < 4; i++) {
                if (i === 1 || i === 2) continue; // Skip center (entrance area)
                const wx = x - 100 + (i * 60);
                const wy = y - building.height + 40 + (floor * 50);
                graphics.fillRect(wx, wy, 35, 35);

                // Window frame
                graphics.lineStyle(2, 0x000000, 1);
                graphics.strokeRect(wx, wy, 35, 35);
            }
        }

        // "TRAIN STATION" sign above entrance
        graphics.fillStyle(scheme.accent, 1);
        graphics.fillRect(x - 70, y - 110, 140, 20);

        // Platform (ground level)
        graphics.fillStyle(scheme.platform, 1);
        graphics.fillRect(x - building.width/2 - 40, y, building.width + 80, 10);

        // Yellow safety line on platform
        graphics.fillStyle(scheme.accent, 1);
        graphics.fillRect(x - building.width/2 - 40, y, building.width + 80, 3);

        // Train tracks
        graphics.lineStyle(4, scheme.tracks, 1);
        // Track 1 (main line)
        graphics.lineBetween(x - building.width/2 - 50, y + 20, x + building.width/2 + 50, y + 20);
        graphics.lineBetween(x - building.width/2 - 50, y + 30, x + building.width/2 + 50, y + 30);

        // Cross ties (railroad ties)
        graphics.lineStyle(2, 0x8D6E63, 1);
        for (let i = 0; i < 8; i++) {
            const tx = x - building.width/2 - 30 + (i * 40);
            graphics.lineBetween(tx, y + 15, tx, y + 35);
        }

        // Building border
        graphics.lineStyle(2, this.darkenColor(scheme.building, 0.7), 1);
        graphics.strokeRect(x - building.width/2, y - building.height, building.width, building.height);
    }
}
