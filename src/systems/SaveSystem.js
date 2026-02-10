/**
 * SaveSystem - Manages game saving and loading
 * Handles localStorage persistence, save data serialization, and building restoration
 */
export class SaveSystem {
    constructor(scene) {
        this.scene = scene;
    }

    saveGame() {
        try {
            const saveData = {
                cityName: this.scene.cityName,
                money: this.scene.money,
                wood: this.scene.wood,
                bricks: this.scene.bricks,
                bankBalance: this.scene.bankBalance,
                loanAmount: this.scene.loanAmount,
                lastInterestPayment: this.scene.lastInterestPayment,
                lastTaxCollection: this.scene.lastTaxCollection,
                gameTime: this.scene.gameTime,
                timeSpeed: this.scene.timeSpeed,
                autoCollectionEnabled: this.scene.autoCollectionEnabled,
                currentStreet: this.scene.currentStreet,
                unlockedStreets: this.scene.unlockedStreets,
                buildings: this.scene.buildings.map(b => {
                    // Sanitize rooms to remove circular references (guest -> hotelRoom -> guest)
                    let sanitizedRooms = undefined;
                    if (b.rooms) {
                        sanitizedRooms = b.rooms.map(room => ({
                            status: room.status,
                            isOccupied: room.isOccupied,
                            guest: null, // Don't save guest reference (circular)
                            nightsOccupied: room.nightsOccupied || 0,
                            lastStatusChange: room.lastStatusChange
                        }));
                    }

                    // Sanitize tables to remove circular references (customer -> occupiedTable -> customer)
                    let sanitizedTables = undefined;
                    if (b.tables) {
                        sanitizedTables = b.tables.map(table => ({
                            status: table.status,
                            customer: null, // Don't save customer reference (circular)
                            mealStartTime: table.mealStartTime,
                            mealDuration: table.mealDuration
                        }));
                    }

                    return {
                        type: b.type,
                        x: b.x,
                        y: b.y,
                        useSprite: !!b.sprite, // Save whether this building uses a sprite
                        streetNumber: b.streetNumber || 1, // Which street this building is on
                        accumulatedIncome: b.accumulatedIncome || 0,
                        lastIncomeTime: b.lastIncomeTime || Date.now(),
                        storedResources: b.storedResources || 0,
                        lastResourceTime: b.lastResourceTime || Date.now(),
                        placedDistrict: b.placedDistrict || null,
                        districtBonus: b.districtBonus || 1.0,
                        facadeVariation: b.facadeVariation || 0,
                        // Save apartment units
                        units: b.units || undefined,
                        // Save hotel rooms (sanitized)
                        rooms: sanitizedRooms,
                        lastNightCheck: b.lastNightCheck || undefined,
                        lastAutoClean: b.lastAutoClean || undefined,
                        hasMaid: b.hasMaid,
                        maidDailyWage: b.maidDailyWage,
                        lastMaidWageCheck: b.lastMaidWageCheck,
                        lastMaidClean: b.lastMaidClean,
                        // Save shop inventory
                        inventory: b.inventory || undefined,
                        hasEmployee: b.hasEmployee,
                        isOpen: b.isOpen,
                        dailyWage: b.dailyWage,
                        lastWageCheck: b.lastWageCheck,
                        // Save restaurant tables (sanitized)
                        tables: sanitizedTables,
                        hasDayWaiter: b.hasDayWaiter,
                        hasNightWaiter: b.hasNightWaiter,
                        dayWaiterWage: b.dayWaiterWage,
                        nightWaiterWage: b.nightWaiterWage,
                        mealPrice: b.mealPrice
                    };
                }),
                population: this.scene.population,
                populationCapacity: this.scene.populationCapacity,
                pendingCitizens: this.scene.pendingCitizens,
                // Save mission progress
                missions: this.scene.missionSystem ? this.scene.missionSystem.missions.map(m => ({
                    id: m.id,
                    completed: m.completed
                })) : []
            };
            localStorage.setItem('mainstreetmayor_save', JSON.stringify(saveData));
            console.log(`💾 Game saved! ${this.scene.buildings.length} buildings:`, this.scene.buildings.map(b => `${b.type} at x=${b.x}`));

            // Extra logging for theme parks
            const themeParks = this.scene.buildings.filter(b => b.type === 'themePark');
            if (themeParks.length > 0) {
                console.log(`🎡 Saved ${themeParks.length} theme park(s):`, themeParks.map(b => `x=${b.x}`));
            }
        } catch (error) {
            console.error('Error saving game:', error);
            // Game continues even if save fails
        }
    }

    loadGame() {
        const saveDataStr = localStorage.getItem('mainstreetmayor_save');
        if (!saveDataStr) {
            console.log('No save data found');
            return false;
        }

        try {
            const saveData = JSON.parse(saveDataStr);

            // Restore city name
            this.scene.cityName = saveData.cityName || 'Main Street';
            this.scene.updateCityNameDisplay();

            // Restore resources
            this.scene.money = saveData.money;
            this.scene.wood = saveData.wood;
            this.scene.bricks = saveData.bricks;

            // Restore bank data
            this.scene.bankBalance = saveData.bankBalance || 0;
            this.scene.loanAmount = saveData.loanAmount || 0;
            this.scene.lastInterestPayment = saveData.lastInterestPayment || 0;
            this.scene.lastTaxCollection = saveData.lastTaxCollection || 0;

            // Restore population data
            this.scene.population = saveData.population || 20;
            this.scene.populationCapacity = saveData.populationCapacity || 20;
            this.scene.pendingCitizens = saveData.pendingCitizens || 0;

            // Restore time data
            this.scene.gameTime = saveData.gameTime || 0;
            this.scene.timeSpeed = saveData.timeSpeed || 1;
            this.scene.lastRealTime = Date.now(); // Reset to current time on load

            // Restore auto-collection setting (default to true if not saved)
            this.scene.autoCollectionEnabled = saveData.autoCollectionEnabled !== undefined ? saveData.autoCollectionEnabled : true;
            // Update button text to reflect loaded setting
            if (this.scene.autoCollectionButton) {
                this.scene.autoCollectionButton.setText(this.scene.autoCollectionEnabled ? '💰 Auto-Collect: ON' : '💰 Auto-Collect: OFF');
            }

            // Restore multi-street data
            this.scene.currentStreet = saveData.currentStreet || 1;
            this.scene.unlockedStreets = saveData.unlockedStreets || 1;
            // Update street unlocked states
            if (this.scene.streets) {
                for (let i = 0; i < this.scene.unlockedStreets && i < this.scene.streets.length; i++) {
                    this.scene.streets[i].unlocked = true;
                }
            }

            if (saveData.missions && this.scene.missionSystem) {
                saveData.missions.forEach(savedMission => {
                    const mission = this.scene.missionSystem.missions.find(m => m.id === savedMission.id);
                    if (mission) {
                        mission.completed = savedMission.completed;
                        if (mission.completed && !this.scene.missionSystem.completedMissions.includes(mission)) {
                            this.scene.missionSystem.completedMissions.push(mission);
                        }
                    }
                });
            }

            // Clear all existing text objects that might be old signs (depth 11)
            // This prevents duplicate signs from appearing
            const allTextObjects = this.scene.children.list.filter(obj =>
                obj.type === 'Text' && obj.depth === 11
            );
            allTextObjects.forEach(textObj => {
                try {
                    textObj.destroy();
                } catch (e) {
                    console.warn('Could not destroy text object:', e);
                }
            });

            // Restore buildings
            if (saveData.buildings && saveData.buildings.length > 0) {
                console.log(`📦 Loading ${saveData.buildings.length} buildings from save:`, saveData.buildings.map(b => b.type));

                // Extra logging for theme parks
                const savedThemeParks = saveData.buildings.filter(b => b.type === 'themePark');
                if (savedThemeParks.length > 0) {
                    console.log(`🎡 Found ${savedThemeParks.length} theme park(s) in save data:`, savedThemeParks);
                }
                saveData.buildings.forEach((buildingData, index) => {
                    // Migration: Convert old 'shop' type to 'clothingShop'
                    if (buildingData.type === 'shop') {
                        console.log(`Migrating old 'shop' building to 'clothingShop'`);
                        buildingData.type = 'clothingShop';
                    }
                    console.log(`Loading building ${index}: ${buildingData.type} at x=${buildingData.x}, street=${buildingData.streetNumber || 1}`);
                    this.loadBuilding(
                        buildingData.type,
                        buildingData.x,
                        buildingData.y,
                        buildingData.useSprite || false, // Whether to use sprite
                        buildingData.streetNumber || 1, // Street number
                        buildingData.accumulatedIncome || 0,
                        buildingData.lastIncomeTime || Date.now(),
                        buildingData.storedResources || 0,
                        buildingData.lastResourceTime || Date.now(),
                        buildingData.units,
                        buildingData.rooms,
                        buildingData.lastNightCheck,
                        buildingData.placedDistrict || null,
                        buildingData.districtBonus || 1.0,
                        buildingData.inventory,
                        buildingData.hasEmployee,
                        buildingData.isOpen,
                        buildingData.dailyWage,
                        buildingData.lastWageCheck,
                        buildingData.lastAutoClean,
                        buildingData.facadeVariation || 0,
                        buildingData.hasMaid,
                        buildingData.maidDailyWage,
                        buildingData.lastMaidWageCheck,
                        buildingData.lastMaidClean,
                        buildingData.tables,
                        buildingData.hasDayWaiter,
                        buildingData.hasNightWaiter,
                        buildingData.dayWaiterWage,
                        buildingData.nightWaiterWage,
                        buildingData.mealPrice
                    );
                });
                console.log(`Successfully loaded ${this.scene.buildings.length} buildings`);
            }

            console.log('Game loaded!');
            return true;
        } catch (e) {
            console.error('Error loading save data:', e);
            return false;
        }
    }

    loadBuilding(type, x, y, useSprite = false, streetNumber = 1, accumulatedIncome = 0, lastIncomeTime = Date.now(), storedResources = 0, lastResourceTime = Date.now(), units = null, rooms = null, lastNightCheck = null, placedDistrict = null, districtBonus = 1.0, inventory = null, hasEmployee = null, isOpen = null, dailyWage = null, lastWageCheck = null, lastAutoClean = null, facadeVariation = 0, hasMaid = null, maidDailyWage = null, lastMaidWageCheck = null, lastMaidClean = null, tables = null, hasDayWaiter = null, hasNightWaiter = null, dayWaiterWage = null, nightWaiterWage = null, mealPrice = null) {
        console.log(`🔍 Attempting to load building: type=${type}, x=${x}, useSprite=${useSprite}`);
        const building = this.scene.buildingTypes[type];
        if (!building) {
            console.error(`❌ Building type '${type}' not found in buildingTypes!`);
            console.error(`Available types:`, Object.keys(this.scene.buildingTypes));
            return;
        }
        console.log(`✅ Found building type '${type}':`, building);

        // Always use current ground level instead of saved Y coordinate
        const buildingY = this.scene.gameHeight - 100;

        console.log(`Drawing ${type} at x=${x}, y=${buildingY}, width=${building.width}, height=${building.height}`);

        let newBuilding;
        let buildingSprite = null;

        // Use sprite for buildings that were saved with sprites
        if (useSprite && type === 'clothingShop' && this.scene.textures.exists('clothingShop')) {
            // Create sprite for clothing shop
            const spriteWidth = building.width * 1.5;
            const spriteHeight = building.height * 1.5;

            buildingSprite = this.scene.add.sprite(x, buildingY - spriteHeight / 2, 'clothingShop');
            buildingSprite.setDepth(10);
            buildingSprite.setVisible(streetNumber === this.scene.currentStreet);
            buildingSprite.setOrigin(0.5, 0.5);
            buildingSprite.setDisplaySize(spriteWidth, spriteHeight);

            // Create empty graphics object for consistency
            newBuilding = this.scene.add.graphics();
            newBuilding.setDepth(10);
            newBuilding.setVisible(streetNumber === this.scene.currentStreet);
        } else {
            // Use graphics for all other buildings
            newBuilding = this.scene.add.graphics();
            newBuilding.setDepth(10); // Buildings are on top of background

            // Don't draw base rectangle for parks/recreation items and theme park (they draw everything custom)
            if (type !== 'park' && type !== 'playground' && type !== 'fountain' && type !== 'themePark') {
                newBuilding.fillStyle(building.color, 1);
                newBuilding.fillRect(x - building.width/2, buildingY - building.height, building.width, building.height);
                newBuilding.lineStyle(3, 0x000000, 1);
                newBuilding.strokeRect(x - building.width/2, buildingY - building.height, building.width, building.height);
            }

            // Draw detailed building features (windows, doors, roof, etc.)
            try {
                this.scene.buildingRenderer.drawBuildingDetails(newBuilding, type, x, buildingY, facadeVariation);
                console.log(`Successfully drew details for ${type}`);
            } catch (error) {
                console.error(`Error drawing details for ${type}:`, error);
            }
        }

        // Building signs are now handled by addBuildingSign() function
        if (type === 'bank') {
            // Bank now has detailed classical architecture with columns built-in
            // No additional decorations needed
        } else if (type === 'market') {
            // Add market emoji
            const awning = this.scene.add.text(x, buildingY - building.height / 2, '🏪', {
                fontSize: '60px'
            }).setOrigin(0.5).setDepth(11);
        }

        // Note: Building signs are now handled by addBuildingSign() function

        // Add loaded building with income and resource tracking (use buildingY for current ground level)
        const buildingData = {
            graphics: newBuilding,
            sprite: buildingSprite, // Store sprite reference if it exists
            type: type,
            x: x,
            y: buildingY,
            streetNumber: streetNumber, // Which street this building is on
            accumulatedIncome: accumulatedIncome,
            lastIncomeTime: lastIncomeTime,
            storedResources: storedResources,
            lastResourceTime: lastResourceTime,
            placedDistrict: placedDistrict,
            districtBonus: districtBonus,
            facadeVariation: facadeVariation
        };

        // Add visual indicator if building is in correct district
        const inCorrectDistrict = placedDistrict === building.district;
        if (inCorrectDistrict) {
            const bonusIndicator = this.scene.add.text(x, buildingY - building.height - 30, '⭐', {
                fontSize: '20px'
            }).setOrigin(0.5).setDepth(12);
            buildingData.bonusIndicator = bonusIndicator;
        }

        // Restore apartment units if they exist
        if (units) {
            buildingData.units = units;
            buildingData.vacancySigns = [];
        }

        // Restore hotel rooms if they exist
        if (rooms) {
            buildingData.rooms = rooms;
            buildingData.lastNightCheck = lastNightCheck || this.scene.gameTime;
            buildingData.hasEmployee = hasEmployee !== null ? hasEmployee : false;
            buildingData.dailyWage = dailyWage !== null ? dailyWage : 0;
            buildingData.lastWageCheck = lastWageCheck !== null ? lastWageCheck : this.scene.gameTime;
            buildingData.lastAutoClean = lastAutoClean !== null ? lastAutoClean : this.scene.gameTime;
            buildingData.hasMaid = hasMaid !== null ? hasMaid : false;
            buildingData.maidDailyWage = maidDailyWage !== null ? maidDailyWage : 0;
            buildingData.lastMaidWageCheck = lastMaidWageCheck !== null ? lastMaidWageCheck : this.scene.gameTime;
            buildingData.lastMaidClean = lastMaidClean !== null ? lastMaidClean : this.scene.gameTime;
        }

        // Initialize shop inventory if it's a shop (use saved data or defaults)
        if (this.scene.isShop(type)) {
            buildingData.inventory = inventory || {
                stock: 50,
                maxStock: 100,
                restockCost: 5,
                salesPerCustomer: 5
            };
            buildingData.hasEmployee = hasEmployee !== null ? hasEmployee : false;
            buildingData.isOpen = isOpen !== null ? isOpen : false;
            buildingData.dailyWage = dailyWage !== null ? dailyWage : 0;
            buildingData.lastWageCheck = lastWageCheck !== null ? lastWageCheck : this.scene.gameTime;
        }

        // Restore restaurant tables or initialize if missing
        if (this.scene.isRestaurant(type)) {
            if (tables) {
                buildingData.tables = tables;
            } else {
                // Create tables if restaurant doesn't have them (for old saves)
                console.log('🍽️ Initializing tables for existing restaurant');
                buildingData.tables = [];
                for (let i = 0; i < 6; i++) {
                    buildingData.tables.push({
                        status: 'available',
                        customer: null,
                        mealStartTime: null,
                        mealDuration: 0
                    });
                }
            }
            buildingData.hasDayWaiter = hasDayWaiter !== null ? hasDayWaiter : false;
            buildingData.hasNightWaiter = hasNightWaiter !== null ? hasNightWaiter : false;
            buildingData.dayWaiterWage = dayWaiterWage !== null ? dayWaiterWage : 0;
            buildingData.nightWaiterWage = nightWaiterWage !== null ? nightWaiterWage : 0;
            // Use saved mealPrice, or get from building type, or default to 25
            const buildingType = this.scene.buildingTypes[type];
            buildingData.mealPrice = mealPrice !== null ? mealPrice : (buildingType.mealPrice || 25);
            buildingData.lastWageCheck = lastWageCheck !== null ? lastWageCheck : this.scene.gameTime;
        }

        // Add window lights for nighttime
        const buildingType = this.scene.buildingTypes[type];
        this.scene.addWindowLights(buildingData, buildingType);

        // Add building sign
        this.scene.addBuildingSign(buildingData, buildingType);

        this.scene.buildings.push(buildingData);
    }
}
