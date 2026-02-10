/**
 * CitizenSystem - Manages citizen spawning, movement, and behavior
 * Handles citizen AI, building visits, shopping, dining, and bus system integration
 */
export class CitizenSystem {
    constructor(scene) {
        this.scene = scene;

        // Performance settings
        this.MAX_CITIZENS = 120; // Hard cap to prevent performance issues
        this.CULL_DISTANCE = 1500; // Hide citizens this far from camera
        this.lastCullCheck = 0;
        this.CULL_CHECK_INTERVAL = 1000; // Check every 1 second
    }

    spawnCitizens() {
        // Spawn 20 initial citizens at random locations
        const groundLevel = this.scene.gameHeight - 100;

        for (let i = 0; i < 20; i++) {
            const x = Math.random() * 12000;
            this.createCitizen(x, groundLevel - 30);
        }
    }

    spawnNewCitizen() {
        // Check if we're at the citizen cap
        if (this.scene.citizens.length >= this.MAX_CITIZENS) {
            console.log(`⚠️ Citizen cap reached (${this.MAX_CITIZENS}). Not spawning more citizens.`);
            return false;
        }

        // Spawn a new citizen near a random residential building
        const groundLevel = this.scene.gameHeight - 100;

        // Find all residential buildings
        const residentialBuildings = this.scene.buildings.filter(b =>
            this.scene.buildingTypes[b.type]?.district === 'residential'
        );

        let spawnX;
        if (residentialBuildings.length > 0) {
            // Spawn near a random residential building
            const randomBuilding = residentialBuildings[Math.floor(Math.random() * residentialBuildings.length)];
            spawnX = randomBuilding.x + (Math.random() * 400 - 200); // Within 200px of building
        } else {
            // No residential buildings yet, spawn randomly
            spawnX = Math.random() * 12000;
        }

        this.createCitizen(spawnX, groundLevel - 30);
        return true;
    }

    spawnTourist(x) {
        // Spawn a tourist (temporary visitor) at a bus stop
        const groundLevel = this.scene.gameHeight - 100;
        const spawnX = x + (Math.random() * 100 - 50); // Near bus stop

        this.createCitizen(spawnX, groundLevel - 30);

        // Mark the last spawned citizen as a tourist
        const tourist = this.scene.citizens[this.scene.citizens.length - 1];
        tourist.isTourist = true;
        // Stay for 180-300 game minutes (3-5 game hours)
        tourist.touristTimeRemaining = 180 + Math.random() * 120;
        tourist.touristStartTime = this.scene.gameTime;
        tourist.spawnedAtStop = x; // Remember where they arrived

        // Try to book a hotel room
        this.bookHotelForTourist(tourist);
    }

    bookHotelForTourist(tourist) {
        // Find ALL hotels with available clean rooms (search entire map)
        const nearbyHotels = this.scene.buildings.filter(b =>
            b.type === 'hotel' &&
            b.rooms
        );

        console.log(`🏨 Tourist at x=${Math.floor(tourist.x)}, found ${nearbyHotels.length} hotels in town`);

        // Look for a hotel with an available clean room
        for (let hotel of nearbyHotels) {
            const cleanRooms = hotel.rooms.filter(r => r.status === 'clean');
            const availableRooms = hotel.rooms.filter(r => r.status === 'clean' && !r.isOccupied);
            console.log(`🏨 Hotel at x=${hotel.x}: ${cleanRooms.length} clean rooms, ${availableRooms.length} available (not occupied)`);

            const availableRoom = hotel.rooms.find(r => r.status === 'clean' && !r.isOccupied);
            if (availableRoom) {
                // Book the room
                availableRoom.status = 'occupied';
                availableRoom.isOccupied = true;
                availableRoom.nightsOccupied = 0;
                availableRoom.guest = tourist;

                tourist.hotelRoom = availableRoom;
                tourist.hotel = hotel;

                console.log('🏨 Tourist checked into hotel room!');
                this.scene.uiManager.addNotification('🏨 Tourist checked into hotel');

                // Update hotel UI if player is viewing this hotel
                console.log(`🏨 Checking if need to update UI: insideHotel=${this.scene.insideHotel}, currentHotel=${this.scene.currentHotel ? 'yes' : 'no'}, matchesThisHotel=${this.scene.currentHotel === hotel}`);
                if (this.scene.insideHotel && this.scene.currentHotel === hotel) {
                    console.log('🏨 Updating hotel UI!');
                    this.scene.hotelSystem.updateHotelUI();
                }

                return true;
            }
        }

        console.log('🏨 No available hotel rooms for tourist');
        return false;
    }

    createCitizen(startX, startY) {
        const citizen = this.scene.add.container(startX, startY);
        citizen.setDepth(11); // Above buildings (10), below buses (12)

        // Shadow
        const shadow = this.scene.add.ellipse(0, 28, 20, 6, 0x000000, 0.3);
        citizen.add(shadow);

        // Add pixel art citizen sprite
        const citizenSprite = this.scene.add.sprite(0, 0, 'citizen');
        citizenSprite.setOrigin(0.5, 0.5);
        // Scale to appropriate size (0.15x since original is 512x512)
        citizenSprite.setScale(0.15);
        citizen.add(citizenSprite);

        // Store citizen data
        const targetBuilding = this.scene.buildings.length > 0
            ? this.scene.buildings[Math.floor(Math.random() * this.scene.buildings.length)]
            : null;

        this.scene.citizens.push({
            container: citizen,
            sprite: citizenSprite, // Store sprite reference for flipping
            x: startX,
            y: startY,
            state: 'walking', // walking, waiting, riding, visiting
            walkSpeed: 30 + Math.random() * 20, // Random walk speed
            direction: Math.random() > 0.5 ? 1 : -1,
            targetBuilding: targetBuilding,
            targetBusStop: null,
            waitTimer: 0,
            visitTimer: 0
        });
    }

    updateCitizens() {
        const deltaTime = 1/60; // Approximate 60 FPS

        // Periodic culling check (hide off-screen citizens for performance)
        const now = Date.now();
        if (now - this.lastCullCheck > this.CULL_CHECK_INTERVAL) {
            this.cullOffscreenCitizens();
            this.lastCullCheck = now;
        }

        // Remove excess citizens if we're over the cap (cleanup from old saves)
        this.enforcePopulationCap();

        for (let citizen of this.scene.citizens) {
            // Skip update for invisible (culled) citizens to save performance
            if (!citizen.container || !citizen.container.visible) {
                continue;
            }
            // Handle tourist timer - tourists leave after their time is up (based on game time)
            if (citizen.isTourist && citizen.touristTimeRemaining !== undefined) {
                const timeElapsed = this.scene.gameTime - citizen.touristStartTime;
                if (timeElapsed >= citizen.touristTimeRemaining) {
                    // Check out of hotel immediately when time expires
                    if (citizen.hotelRoom && citizen.hotel && !citizen.hasCheckedOut) {
                        citizen.hotelRoom.isOccupied = false;
                        citizen.hotelRoom.status = 'dirty';
                        citizen.hotelRoom.guest = null;
                        console.log('🏨 Tourist checked out - room is now dirty');

                        // If maid is hired, clean the room immediately
                        if (citizen.hotel.hasMaid) {
                            citizen.hotelRoom.status = 'clean';
                            console.log('🧹 Maid immediately cleaned room after tourist checkout!');
                        }

                        // Update hotel UI if player is viewing this hotel
                        if (this.scene.insideHotel && this.scene.currentHotel === citizen.hotel) {
                            this.scene.hotelSystem.updateHotelUI();
                        }

                        // Mark as checked out so we don't do this again
                        citizen.hasCheckedOut = true;
                    }

                    // Time to leave - prefer train stations (bigger capacity), fallback to bus stops
                    const trainStations = this.scene.buildings.filter(b => b.type === 'trainStation');

                    if (trainStations.length > 0 && this.scene.trainSystem) {
                        // Use train system - much faster for large groups
                        if (!citizen.targetTrainStation) {
                            const sent = this.scene.trainSystem.sendCitizenToNearestStation(citizen);
                            if (sent) {
                                console.log('🚂 Tourist heading to train station to leave');
                            }
                        }
                    } else {
                        // No train stations - use bus stops
                        let nearestStop = null;
                        let nearestDistance = Infinity;
                        if (this.scene.busStops && this.scene.busStops.length > 0) {
                            for (let stop of this.scene.busStops) {
                                const dist = Math.abs(citizen.x - stop.x);
                                if (dist < nearestDistance) {
                                    nearestDistance = dist;
                                    nearestStop = stop;
                                }
                            }
                        }

                        if (nearestStop && !citizen.targetBusStop) {
                        // Interrupt whatever they're doing and head to bus stop
                        if (citizen.state === 'visiting') {
                            // If visiting, exit the building immediately
                            citizen.container.setVisible(true);

                            // Clean up occupied table if dining
                            if (citizen.occupiedTable) {
                                citizen.occupiedTable.status = 'dirty';
                                citizen.occupiedTable.customer = null;
                                citizen.occupiedTable.mealStartTime = null;
                                citizen.occupiedTable.mealDuration = 0;
                                citizen.occupiedTable = null;
                            }

                            // Reset position to building exit if they have a target building
                            if (citizen.targetBuilding) {
                                citizen.x = citizen.targetBuilding.x + (Math.random() * 100 - 50);
                                citizen.container.x = citizen.x;
                            }
                        }

                        if (citizen.state === 'waiting') {
                            // Remove from current bus stop waiting list
                            for (let stop of this.scene.busStops) {
                                const index = stop.waitingCitizens.indexOf(citizen);
                                if (index > -1) {
                                    stop.waitingCitizens.splice(index, 1);
                                    break;
                                }
                            }
                        }

                        // Clear any current targets
                        citizen.targetBuilding = null;
                        citizen.isShoppingVisit = false;
                        citizen.isDiningVisit = false;
                        citizen.isEntertainmentVisit = false;
                        citizen.isServiceVisit = false;

                            // Head to bus stop
                            citizen.targetBusStop = nearestStop;
                            citizen.state = 'walking';
                            citizen.direction = citizen.x < nearestStop.x ? 1 : -1;
                            console.log('👋 Tourist time expired - heading to bus stop to leave town');
                        }
                    }
                }
            }

            if (citizen.state === 'walking') {
                // Walk in current direction
                const distance = citizen.walkSpeed * deltaTime;
                citizen.x += distance * citizen.direction;
                citizen.container.x = citizen.x;

                // Flip sprite based on direction (right = normal, left = flipped)
                if (citizen.sprite) {
                    citizen.sprite.setFlipX(citizen.direction < 0);
                }

                // Randomly decide to go to a bus stop
                if (Math.random() < 0.001 && this.scene.busStops && this.scene.busStops.length > 0) { // 0.1% chance per frame
                    // Find nearest bus stop
                    let nearestStop = null;
                    let nearestDistance = Infinity;
                    for (let stop of this.scene.busStops) {
                        const dist = Math.abs(citizen.x - stop.x);
                        if (dist < nearestDistance) {
                            nearestDistance = dist;
                            nearestStop = stop;
                        }
                    }

                    if (nearestStop) {
                        citizen.targetBusStop = nearestStop;
                        citizen.direction = citizen.x < nearestStop.x ? 1 : -1;
                    }
                }

                // Check if reached bus stop
                if (citizen.targetBusStop) {
                    const distanceToStop = Math.abs(citizen.x - citizen.targetBusStop.x);
                    if (distanceToStop < 30) {
                        // Arrived at bus stop
                        citizen.state = 'waiting';
                        citizen.waitTimer = 0;
                        citizen.targetBusStop.waitingCitizens.push(citizen);
                        citizen.targetBusStop = null;
                    }
                }

                // Randomly reverse direction at edges or randomly
                if (citizen.x > 11900 || citizen.x < 100 || Math.random() < 0.002) {
                    citizen.direction *= -1;
                }

                // Randomly visit nearby buildings (prioritize shops)
                if (Math.random() < 0.001 && this.scene.buildings.length > 0) { // Increased from 0.0005 to 0.001 (2x more frequent)
                    // Find nearby shops that are open and have stock
                    const allShops = this.scene.buildings.filter(b => this.scene.isShop(b.type));
                    console.log(`🛍️ Checking ${allShops.length} shops for visit...`);
                    allShops.forEach(s => {
                        console.log(`  ${s.type}: isOpen=${s.isOpen}, hasInventory=${!!s.inventory}, stock=${s.inventory?.stock}, needsStock=${s.inventory?.salesPerCustomer}`);
                    });

                    const nearbyShops = this.scene.buildings.filter(b =>
                        this.scene.isShop(b.type) &&
                        b.isOpen &&
                        b.inventory &&
                        b.inventory.stock >= b.inventory.salesPerCustomer
                    );
                    console.log(`  -> ${nearbyShops.length} shops are available for visit (town-wide search)`);

                    // Get current hour for restaurant shift check
                    const totalMinutes = Math.floor(this.scene.gameTime);
                    const hour = Math.floor((totalMinutes % (24 * 60)) / 60);
                    const isDayTime = hour >= 6 && hour < 20; // 6am-8pm is day shift

                    // Find nearby restaurants with available tables and appropriate waiter
                    const nearbyRestaurants = this.scene.buildings.filter(b =>
                        this.scene.isRestaurant(b.type) &&
                        Math.abs(b.x - citizen.x) < 800 &&
                        b.tables &&
                        b.tables.some(t => t.status === 'available') &&
                        ((isDayTime && b.hasDayWaiter) || (!isDayTime && b.hasNightWaiter))
                    );

                    // Find nearby entertainment (arcades - always open) - search whole town
                    const nearbyEntertainment = this.scene.buildings.filter(b =>
                        this.scene.isEntertainment(b.type)
                    );

                    // Find nearby services (libraries, museums) - search whole town
                    const nearbyServices = this.scene.buildings.filter(b =>
                        this.scene.isService(b.type)
                    );

                    // Choose target building (25% shop, 25% restaurant, 20% entertainment, 20% service, 10% any)
                    let targetBuilding = null;
                    const randomChoice = Math.random();

                    if (randomChoice < 0.25 && nearbyShops.length > 0) {
                        // 25% chance to visit shop
                        targetBuilding = nearbyShops[Math.floor(Math.random() * nearbyShops.length)];
                        console.log(`🛍️ Citizen heading to shop: ${targetBuilding.type} at x=${targetBuilding.x}`);
                        citizen.isShoppingVisit = true;
                        citizen.isDiningVisit = false;
                        citizen.isEntertainmentVisit = false;
                        citizen.isServiceVisit = false;
                    } else if (randomChoice < 0.50 && nearbyRestaurants.length > 0) {
                        // 25% chance to visit restaurant
                        targetBuilding = nearbyRestaurants[Math.floor(Math.random() * nearbyRestaurants.length)];
                        citizen.isShoppingVisit = false;
                        citizen.isDiningVisit = true;
                        citizen.isEntertainmentVisit = false;
                        citizen.isServiceVisit = false;
                    } else if (randomChoice < 0.70 && nearbyEntertainment.length > 0) {
                        // 20% chance to visit entertainment
                        targetBuilding = nearbyEntertainment[Math.floor(Math.random() * nearbyEntertainment.length)];
                        citizen.isShoppingVisit = false;
                        citizen.isDiningVisit = false;
                        citizen.isEntertainmentVisit = true;
                        citizen.isServiceVisit = false;
                    } else if (randomChoice < 0.90 && nearbyServices.length > 0) {
                        // 20% chance to visit service
                        targetBuilding = nearbyServices[Math.floor(Math.random() * nearbyServices.length)];
                        citizen.isShoppingVisit = false;
                        citizen.isDiningVisit = false;
                        citizen.isEntertainmentVisit = false;
                        citizen.isServiceVisit = true;
                    } else {
                        // 10% chance to visit any building
                        const nearbyBuildings = this.scene.buildings.filter(b =>
                            Math.abs(b.x - citizen.x) < 500
                        );
                        if (nearbyBuildings.length > 0) {
                            targetBuilding = nearbyBuildings[Math.floor(Math.random() * nearbyBuildings.length)];
                            citizen.isShoppingVisit = false;
                            citizen.isDiningVisit = false;
                            citizen.isEntertainmentVisit = false;
                            citizen.isServiceVisit = false;
                        }
                    }

                    if (targetBuilding) {
                        citizen.targetBuilding = targetBuilding;
                        citizen.direction = citizen.x < targetBuilding.x ? 1 : -1;
                    }
                }

                // Check if reached target building
                if (citizen.targetBuilding) {
                    // Safety check: make sure building still exists
                    if (!this.scene.buildings.includes(citizen.targetBuilding)) {
                        citizen.targetBuilding = null;
                        citizen.direction = Math.random() > 0.5 ? 1 : -1;
                    } else {
                        const distanceToBuilding = Math.abs(citizen.x - citizen.targetBuilding.x);
                        if (distanceToBuilding < 50) {
                            // Special handling for restaurants - find available table
                            if (citizen.isDiningVisit && this.scene.isRestaurant(citizen.targetBuilding.type) && citizen.targetBuilding.tables) {
                                const availableTable = citizen.targetBuilding.tables.find(t => t.status === 'available');
                                if (availableTable) {
                                    // Occupy the table
                                    availableTable.status = 'occupied';
                                    availableTable.customer = citizen;
                                    availableTable.mealStartTime = this.scene.gameTime;
                                    availableTable.mealDuration = 15 + Math.random() * 20; // 15-35 game minutes

                                    citizen.state = 'visiting';
                                    citizen.visitTimer = availableTable.mealDuration / 60; // Convert game minutes to real seconds
                                    citizen.occupiedTable = availableTable;
                                    citizen.container.setVisible(false); // Hide while dining
                                    console.log(`🍽️ Customer seated at restaurant, will dine for ${Math.floor(availableTable.mealDuration)} game minutes`);
                                } else {
                                    // No tables available, leave
                                    citizen.targetBuilding = null;
                                    citizen.direction = Math.random() > 0.5 ? 1 : -1;
                                }
                            } else {
                                // Regular building visit
                                citizen.state = 'visiting';
                                citizen.visitTimer = 5 + Math.random() * 10; // Visit for 5-15 seconds
                                citizen.container.setVisible(false); // Hide while inside building
                            }
                        }
                    }
                }
            } else if (citizen.state === 'waiting') {
                // Citizen is waiting at bus stop - just stand still
                citizen.waitTimer += deltaTime;

                // Small chance to give up waiting and start walking again
                if (citizen.waitTimer > 30 && Math.random() < 0.01) {
                    citizen.state = 'walking';
                    // Remove from bus stop waiting list
                    for (let stop of this.scene.busStops) {
                        const index = stop.waitingCitizens.indexOf(citizen);
                        if (index > -1) {
                            stop.waitingCitizens.splice(index, 1);
                            break;
                        }
                    }
                }
            } else if (citizen.state === 'visiting') {
                // Citizen is inside a building
                citizen.visitTimer -= deltaTime;
                if (citizen.visitTimer <= 0) {
                    // Safety check: make sure building still exists
                    if (citizen.targetBuilding && !this.scene.buildings.includes(citizen.targetBuilding)) {
                        citizen.targetBuilding = null;
                        citizen.state = 'walking';
                        citizen.container.setVisible(true);
                        citizen.direction = Math.random() > 0.5 ? 1 : -1;
                        continue;
                    }

                    // Process shop purchase if this was a shopping visit
                    if (citizen.isShoppingVisit && citizen.targetBuilding && this.scene.isShop(citizen.targetBuilding.type)) {
                        const shop = citizen.targetBuilding;
                        if (shop.inventory && shop.isOpen && shop.inventory.stock >= shop.inventory.salesPerCustomer) {
                            // Customer makes a purchase
                            const oldStock = shop.inventory.stock;
                            shop.inventory.stock -= shop.inventory.salesPerCustomer;
                            shop.inventory.stock = Math.max(0, shop.inventory.stock); // Ensure stock doesn't go negative
                            const salePrice = shop.inventory.salesPerCustomer * 15; // $15 per unit sold

                            // Add to shop's accumulated income (collect when entering shop)
                            shop.accumulatedIncome = (shop.accumulatedIncome || 0) + salePrice;
                            console.log(`🛍️ Customer bought items at ${shop.type}. Stock: ${oldStock} → ${shop.inventory.stock}. Shop income: $${Math.floor(shop.accumulatedIncome)}`);

                            const shopName = this.scene.buildingTypes[shop.type].name;
                            this.scene.uiManager.addNotification(`🛍️ Purchase at ${shopName} - $${salePrice} (Stock: ${shop.inventory.stock})`);

                            // Update UI if player is currently viewing this shop
                            if (this.scene.insideShop && this.scene.currentShop === shop) {
                                this.scene.shopSystem.updateShopInventoryUI();
                            }
                        }
                        citizen.isShoppingVisit = false;
                    }

                    // Process restaurant payment if this was a dining visit
                    if (citizen.isDiningVisit && citizen.targetBuilding && this.scene.isRestaurant(citizen.targetBuilding.type)) {
                        const restaurant = citizen.targetBuilding;
                        const mealPrice = restaurant.mealPrice || 25;

                        // Customer pays for meal
                        restaurant.accumulatedIncome = (restaurant.accumulatedIncome || 0) + mealPrice;
                        console.log(`🍽️ Customer paid $${mealPrice} for meal. Restaurant income: $${Math.floor(restaurant.accumulatedIncome)}`);

                        const restaurantName = this.scene.buildingTypes[restaurant.type].name;
                        this.scene.uiManager.addNotification(`🍽️ Meal at ${restaurantName} - $${mealPrice}`);

                        // Mark table as dirty if citizen has an occupied table
                        if (citizen.occupiedTable) {
                            citizen.occupiedTable.status = 'dirty';
                            citizen.occupiedTable.customer = null;
                            citizen.occupiedTable.mealStartTime = null;
                            citizen.occupiedTable.mealDuration = 0;
                            citizen.occupiedTable = null;
                            console.log(`🍽️ Table marked as dirty after customer left`);

                            // Update UI if player is currently viewing this restaurant
                            if (this.scene.insideRestaurant && this.scene.currentRestaurant === restaurant) {
                                this.scene.restaurantSystem.updateRestaurantUI();
                            }
                        }

                        citizen.isDiningVisit = false;
                    }

                    // Process entertainment payment if this was an entertainment visit
                    if (citizen.isEntertainmentVisit && citizen.targetBuilding && this.scene.isEntertainment(citizen.targetBuilding.type)) {
                        const entertainment = citizen.targetBuilding;
                        const buildingType = this.scene.buildingTypes[entertainment.type];
                        let totalIncome = buildingType.ticketPrice || buildingType.gamePlayPrice || 10;

                        // Movie theater specific: add concession sales
                        if (entertainment.type === 'movieTheater' && Math.random() < buildingType.concessionChance) {
                            totalIncome += buildingType.concessionPrice;
                        }

                        // Customer pays for entertainment
                        entertainment.accumulatedIncome = (entertainment.accumulatedIncome || 0) + totalIncome;
                        console.log(`🎡 Customer visited ${entertainment.type}. Income: $${Math.floor(entertainment.accumulatedIncome)}`);

                        const icon = entertainment.type === 'themePark' ? '🎡' : entertainment.type === 'movieTheater' ? '🎬' : '🕹️';
                        const name = entertainment.type === 'themePark' ? 'Theme Park' : entertainment.type === 'movieTheater' ? 'Movie Theater' : 'Arcade';
                        this.scene.uiManager.addNotification(`${icon} ${name} visit - $${totalIncome}`);

                        citizen.isEntertainmentVisit = false;
                    }

                    // Process library/museum payment if this was a service visit
                    if (citizen.isServiceVisit && citizen.targetBuilding && this.scene.isService(citizen.targetBuilding.type)) {
                        const service = citizen.targetBuilding;
                        const buildingType = this.scene.buildingTypes[service.type];
                        let totalIncome = 0;

                        if (service.type === 'library') {
                            // 15% chance of late fee
                            if (Math.random() < (buildingType.lateFeeChance || 0.15)) {
                                const lateFee = buildingType.lateFeeAmount || 5;
                                totalIncome += lateFee;
                                console.log(`📚 Customer paid $${lateFee} late fee at library`);
                            }
                        } else if (service.type === 'museum') {
                            // Admission ticket (always)
                            totalIncome += buildingType.admissionPrice || 15;

                            // 40% chance of gift shop purchase
                            if (Math.random() < (buildingType.giftShopChance || 0.40)) {
                                const giftShopPrice = buildingType.giftShopPrice || 20;
                                totalIncome += giftShopPrice;
                                console.log(`🎁 Customer bought from museum gift shop: $${giftShopPrice}`);
                            }

                            // 30% chance of cafe purchase
                            if (Math.random() < (buildingType.cafeChance || 0.30)) {
                                const cafePrice = buildingType.cafePrice || 12;
                                totalIncome += cafePrice;
                                console.log(`☕ Customer visited museum cafe: $${cafePrice}`);
                            }

                            console.log(`🏛️ Customer visit to museum. Total: $${totalIncome}`);
                        }

                        if (totalIncome > 0) {
                            service.accumulatedIncome = (service.accumulatedIncome || 0) + totalIncome;
                            console.log(`${service.type} income: $${Math.floor(service.accumulatedIncome)}`);

                            const serviceName = this.scene.buildingTypes[service.type].name;
                            const icon = service.type === 'library' ? '📚' : '🏛️';
                            this.scene.uiManager.addNotification(`${icon} ${serviceName} visit - $${totalIncome}`);
                        }

                        citizen.isServiceVisit = false;
                    }

                    // Finished visiting - come back out
                    citizen.state = 'walking';
                    citizen.container.setVisible(true);
                    if (citizen.targetBuilding) {
                        citizen.x = citizen.targetBuilding.x + (Math.random() * 100 - 50);
                        citizen.container.x = citizen.x;
                    }
                    citizen.targetBuilding = null;
                    citizen.direction = Math.random() > 0.5 ? 1 : -1;
                }
            } else if (citizen.state === 'riding') {
                // Citizen is on a bus - already handled in updateBuses
                // The bus will drop them off and change state back to walking
            }
        }
    }

    cullOffscreenCitizens() {
        // Hide citizens far from camera to improve performance
        if (!this.scene.cameras || !this.scene.cameras.main) return;

        const camera = this.scene.cameras.main;
        const cameraX = camera.scrollX + camera.width / 2;

        let visibleCount = 0;
        let hiddenCount = 0;

        for (let citizen of this.scene.citizens) {
            if (!citizen.container) continue;

            const distance = Math.abs(citizen.x - cameraX);

            if (distance > this.CULL_DISTANCE) {
                // Too far - hide to save performance
                if (citizen.container.visible) {
                    citizen.container.setVisible(false);
                    hiddenCount++;
                }
            } else {
                // Close enough - show
                if (!citizen.container.visible) {
                    citizen.container.setVisible(true);
                }
                visibleCount++;
            }
        }

        // Log occasionally for debugging
        if (Math.random() < 0.05) { // 5% chance
            console.log(`👥 Citizens: ${visibleCount} visible, ${hiddenCount} culled (${this.scene.citizens.length} total)`);
        }
    }

    enforcePopulationCap() {
        // Remove oldest citizens if we're over the cap (can happen from loading old saves)
        if (this.scene.citizens.length > this.MAX_CITIZENS) {
            const excessCount = this.scene.citizens.length - this.MAX_CITIZENS;
            console.log(`⚠️ Removing ${excessCount} excess citizens to enforce cap of ${this.MAX_CITIZENS}`);

            // Remove the oldest citizens (first in array)
            for (let i = 0; i < excessCount; i++) {
                const citizen = this.scene.citizens[i];
                if (citizen && citizen.container) {
                    citizen.container.destroy();
                }
            }

            // Remove from array
            this.scene.citizens.splice(0, excessCount);

            // Update population counter
            this.scene.population = this.scene.citizens.length;

            console.log(`✅ Population reduced to ${this.scene.citizens.length}`);
        }
    }
}
