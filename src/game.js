import { BuildingTypes, Districts, GameConfig } from './config/GameConfig.js';
import { BuildingRenderer } from './buildings/BuildingRenderer.js';
import { RestaurantSystem } from './systems/RestaurantSystem.js';
import { HotelSystem } from './systems/HotelSystem.js';
import { ShopSystem } from './systems/ShopSystem.js';
import { SaveSystem } from './systems/SaveSystem.js';
import { CitizenSystem } from './systems/CitizenSystem.js';
import { UIManager } from './systems/UIManager.js';
import { EventSystem } from './systems/EventSystem.js';
import { SchoolSystem } from './systems/SchoolSystem.js';
import { EmergencyVehicleSystem } from './systems/EmergencyVehicleSystem.js';
import { TrainSystem } from './systems/TrainSystem.js';
import { FireStationSystem } from './systems/FireStationSystem.js';
import { PoliceStationSystem } from './systems/PoliceStationSystem.js';
import { LibrarySystem } from './systems/LibrarySystem.js';
import { MuseumSystem } from './systems/MuseumSystem.js';
import { HospitalSystem } from './systems/HospitalSystem.js';
import { EntertainmentSystem } from './systems/EntertainmentSystem.js';
import { MissionSystem } from './systems/MissionSystem.js';
import { ResourceBuildingSystem } from './systems/ResourceBuildingSystem.js';

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        // Load building sprites
        this.load.image('clothingShop', 'assets/clothingShop.png');

        // Load mayor sprite
        this.load.image('mayor', 'assets/mayor.png');

        // Load citizen sprite
        this.load.image('citizen', 'assets/citizen.png');
    }

    create() {
        // Set world bounds (use window height for dynamic sizing)
        this.gameHeight = window.innerHeight;
        this.gameWidth = window.innerWidth;
        this.physics.world.setBounds(0, 0, 12000, this.gameHeight);

        // Listen for resize events
        this.scale.on('resize', this.handleResize, this);

        // City name
        this.cityName = 'Main Street'; // Default name

        // Resources (default starting values)
        this.money = 5000;
        this.wood = 200;
        this.bricks = 150;

        // Rental application system
        this.pendingApplications = []; // Applications waiting in mailbox
        this.mailboxes = []; // Track all mailboxes on the street
        this.nearMailbox = null; // Track which mailbox player is near

        // Bank system
        this.bankBalance = 0;  // Money stored in bank
        this.loanAmount = 0;   // Money owed to bank
        this.loanInterestRate = 0.1; // 10% interest
        this.savingsInterestRate = 0.05; // 5% annual interest on savings (0.0137% daily)
        this.lastInterestPayment = 0; // Track last time interest was paid (game time in minutes)

        // Tax system
        this.lastTaxCollection = 0; // Track last time taxes were collected (game time in minutes)
        this.propertyTaxRate = GameConfig.PROPERTY_TAX_RATE; // 2% of building cost per day

        // Time system
        this.gameTime = 0; // Time in game minutes (0 = Day 1, 00:00)
        this.timeSpeed = 1; // 1x, 2x, or 3x speed
        this.lastRealTime = Date.now();

        // Creative mode (unlimited resources for building preview)
        this.creativeMode = false;

        // Auto-collection setting (default to ON)
        this.autoCollectionEnabled = true;

        // Pause system
        this.isPaused = false;

        // Multi-street system
        this.currentStreet = 1; // Which street the player is currently on (1-4)
        this.unlockedStreets = 1; // How many streets are unlocked (starts with 1)
        this.maxStreets = 4; // Maximum number of streets
        this.streets = []; // Will store street data (platformY, name, etc.)

        // Building system
        this.buildMode = false;
        this.deleteMode = false;  // Delete building mode
        this.selectedBuilding = null;
        this.buildingPreview = null;
        this.buildings = []; // All buildings across all streets

        // Transit system
        this.buses = [];
        this.citizens = [];
        this.busStops = []; // Will be populated in createStreetFurniture()

        // Population tracking
        this.population = 20; // Start with initial 20 citizens
        this.populationCapacity = 20; // Increases with residential buildings
        this.pendingCitizens = 0; // Citizens waiting to spawn
        this.lastCitizenSpawnTime = Date.now();

        // Shop interior system
        this.insideShop = false;
        this.currentShop = null;
        this.nearShop = null;
        this.lowStockPopupShowing = false; // Track if low stock popup is currently showing

        // Apartment viewing system
        this.insideApartment = false;
        this.currentApartment = null;
        this.nearApartment = null;

        // Use imported building types from GameConfig.js
        this.buildingTypes = BuildingTypes;

        // Use imported districts from GameConfig.js
        this.districts = Districts;
        this.districtTravelMenuOpen = false;

        // Initialize building renderer
        this.buildingRenderer = new BuildingRenderer(this);

        // Initialize restaurant system
        this.restaurantSystem = new RestaurantSystem(this);

        // Initialize hotel system
        this.hotelSystem = new HotelSystem(this);

        // Initialize shop system
        this.shopSystem = new ShopSystem(this);

        // Initialize resource building system (lumber mill, brick factory)
        this.resourceBuildingSystem = new ResourceBuildingSystem(this);

        // Initialize save system
        this.saveSystem = new SaveSystem(this);

        // Initialize citizen system
        this.citizenSystem = new CitizenSystem(this);

        // Initialize UI manager
        this.uiManager = new UIManager(this);

        // Create notification ticker at bottom of screen
        this.uiManager.createNotificationTicker();

        // Initialize event system (parades, festivals, etc.)
        this.eventSystem = new EventSystem(this);

        // Initialize school system
        this.schoolSystem = new SchoolSystem(this);

        // Initialize emergency vehicle system
        this.emergencyVehicleSystem = new EmergencyVehicleSystem(this);

        // Initialize train system
        this.trainSystem = new TrainSystem(this);

        // Initialize fire station system
        this.fireStationSystem = new FireStationSystem(this);

        // Initialize police station system
        this.policeStationSystem = new PoliceStationSystem(this);

        // Initialize library system
        this.librarySystem = new LibrarySystem(this);

        // Initialize museum system
        this.museumSystem = new MuseumSystem(this);

        // Initialize hospital system
        this.hospitalSystem = new HospitalSystem(this);

        // Initialize entertainment system
        this.entertainmentSystem = new EntertainmentSystem(this);

        // Initialize mission system
        this.missionSystem = new MissionSystem(this);
        this.missionsMenuOpen = false;
        this.statsMenuOpen = false;

        // Settings menu state
        this.settingsMenuOpen = false;

        // === BACKGROUND LAYERS (Parallax) ===

        // Sky - gradient background (fixed, doesn't scroll) - will update dynamically
        this.skyGraphics = this.add.graphics();
        this.skyGraphics.setScrollFactor(0);
        this.skyGraphics.setDepth(-100); // Far background
        // Initial sky (will be updated in update loop)
        this.updateSky();

        // Sun/Moon (changes based on time of day) - very slow parallax
        this.celestialBody = this.add.graphics();
        this.celestialBody.setScrollFactor(0.05);
        this.celestialBody.setDepth(-90); // Behind mountains
        this.updateCelestialBody(); // Will be called in update loop

        // Distant mountains (far background) - slowest parallax
        this.createMountains();

        // Distant city skyline - medium parallax
        this.createDistantCity();

        // Clouds - slow parallax
        this.createClouds();

        // Stars - appear at night
        this.createStars();

        // Single street (ground and platform)
        this.createSingleStreet();

        // Add street furniture (benches, lamp posts, trash cans, mailboxes)
        this.lampPosts = []; // Track lamp posts for day/night lighting
        this.createStreetFurniture();

        // Create district markers
        this.createDistrictMarkers();

        // Create player as a simple colored rectangle first
        this.player = this.physics.add.sprite(100, this.gameHeight - 200);
        const playerBox = this.add.rectangle(0, 0, 30, 60, 0x2196F3);
        this.player.setSize(30, 60);
        this.player.setCollideWorldBounds(true);

        // Attach visual to player
        this.playerVisual = this.add.container(100, this.gameHeight - 200);
        this.playerVisual.setDepth(100); // Player on top of everything

        // Shadow
        const shadow = this.add.ellipse(0, 28, 35, 10, 0x000000, 0.3);
        this.playerVisual.add(shadow);

        // Add pixel art mayor sprite
        const mayorSprite = this.add.sprite(0, 0, 'mayor');
        mayorSprite.setOrigin(0.5, 0.5);
        // Scale to a reasonable size (0.3x since original is 256x256)
        mayorSprite.setScale(0.3);
        this.playerVisual.add(mayorSprite);

        // Add collisions (will be set up after streets are created)

        // Camera follow
        this.cameras.main.setBounds(0, 0, 12000, this.gameHeight);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wKey = this.input.keyboard.addKey('W');
        this.aKey = this.input.keyboard.addKey('A');
        this.sKey = this.input.keyboard.addKey('S');
        this.dKey = this.input.keyboard.addKey('D');
        this.spaceKey = this.input.keyboard.addKey('SPACE');
        this.bKey = this.input.keyboard.addKey('B');
        this.xKey = this.input.keyboard.addKey('X');  // Delete mode
        this.key1 = this.input.keyboard.addKey('ONE');
        this.key2 = this.input.keyboard.addKey('TWO');
        this.key3 = this.input.keyboard.addKey('THREE');
        this.key4 = this.input.keyboard.addKey('FOUR');
        this.key5 = this.input.keyboard.addKey('FIVE');
        this.key6 = this.input.keyboard.addKey('SIX');
        this.key7 = this.input.keyboard.addKey('SEVEN');
        this.key8 = this.input.keyboard.addKey('EIGHT');
        this.enterKey = this.input.keyboard.addKey('ENTER');
        this.eKey = this.input.keyboard.addKey('E');
        this.escKey = this.input.keyboard.addKey('ESC');
        this.rKey = this.input.keyboard.addKey('R');
        this.tKey = this.input.keyboard.addKey('T');
        this.cKey = this.input.keyboard.addKey('C');
        this.pKey = this.input.keyboard.addKey('P');
        this.vKey = this.input.keyboard.addKey('V');  // Bird's eye view

        // Bird's eye view mode
        this.birdsEyeView = false;
        this.normalZoom = 1;
        this.birdsEyeZoom = 0.25; // Zoom out to 25% to see the entire street

        // Mouse input for building placement and demolish mode
        this.input.on('pointerdown', (pointer) => {
            // Handle build mode
            if (this.buildMode && this.buildingPreview && !this.buildConfirmShowing) {
                console.log('🏗️ Build mode click detected - showing confirmation dialog');
                // Save the position where user clicked
                this.pendingBuildingX = this.buildingPreview.snappedX;
                this.pendingBuildingY = this.buildingPreview.buildingY;

                // Show confirmation dialog instead of placing immediately
                const buildingType = this.buildingTypes[this.selectedBuilding];
                const cost = buildingType.cost;
                const wood = buildingType.wood;
                const bricks = buildingType.bricks;

                this.buildConfirmUI.setText(`Place ${buildingType.name}?\n\nCost: $${cost}, 🪵${wood}, 🧱${bricks}`);
                this.buildConfirmContainer.setVisible(true);
                this.buildConfirmShowing = true;
                console.log('Confirmation dialog shown, buildConfirmShowing:', this.buildConfirmShowing);
            } else if (this.buildMode && this.buildingPreview && this.buildConfirmShowing) {
                console.log('⚠️ Build mode click ignored - dialog already showing');
            }

            // Handle delete mode
            if (this.deleteMode && !this.deleteConfirmShowing) {
                console.log('🔨 CLICK DETECTED IN DELETE MODE! (via event)');
                const clickX = pointer.x + this.cameras.main.scrollX;
                const clickY = pointer.y + this.cameras.main.scrollY;

                console.log(`🔨 Delete mode click at (${clickX}, ${clickY})`);
                console.log(`🔨 Total buildings to check: ${this.buildings.length}`);

                // Find building at click position
                let foundBuilding = false;
                for (let building of this.buildings) {
                    // Safety check
                    if (!building.type) {
                        console.warn('Building has no type, skipping');
                        continue;
                    }

                    const buildingType = this.buildingTypes[building.type];
                    if (!buildingType) {
                        console.warn(`Building type ${building.type} not found, skipping`);
                        continue;
                    }

                    const left = building.x - buildingType.width / 2;
                    const right = building.x + buildingType.width / 2;
                    const top = building.y - buildingType.height;
                    const bottom = building.y;

                    console.log(`🔨 Checking ${buildingType.name}: left=${left}, right=${right}, top=${top}, bottom=${bottom}`);

                    if (clickX >= left && clickX <= right && clickY >= top && clickY <= bottom) {
                        // Show confirmation dialog
                        console.log(`🔨 ✓ Building clicked: ${buildingType.name} at (${building.x}, ${building.y})`);
                        this.buildingToDelete = building;
                        this.deleteConfirmShowing = true;
                        this.deleteConfirmUI.setText(`Delete ${buildingType.name}?`);
                        this.deleteConfirmContainer.setVisible(true);
                        foundBuilding = true;
                        break;
                    }
                }

                if (!foundBuilding) {
                    console.log(`🔨 ✗ No building found at click position.`);
                }
            }
        });

        // UI - Controls (top left - simplified)
        const controls = this.add.text(20, 20, 'WASD/Arrows: Move | Space: Jump | E: Interact', {
            fontSize: '12px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        }).setScrollFactor(0);

        // Resource UI (top left, below controls) - Always visible above everything
        this.resourceUI = this.add.text(20, 45, '', {
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 8, y: 6 }
        }).setScrollFactor(0).setDepth(25000); // Very high depth to stay on top

        // Save button (top right, beside stats button)
        this.saveButton = this.add.text(this.gameWidth - 600, 20, '💾 SAVE', {
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#ffffff',
            backgroundColor: '#2196F3',
            padding: { x: 12, y: 6 }
        }).setOrigin(0, 0);

        this.saveButton.setScrollFactor(0);
        this.saveButton.setDepth(26000); // Higher than resource UI
        this.saveButton.setInteractive();

        this.saveButton.on('pointerdown', () => {
            console.log('💾 Save button clicked!');
            this.saveSystem.saveGame();
            this.showSaveFeedback();
        });

        this.saveButton.on('pointerover', () => {
            this.saveButton.setStyle({ backgroundColor: '#1976D2' });
        });

        this.saveButton.on('pointerout', () => {
            this.saveButton.setStyle({ backgroundColor: '#2196F3' });
        });

        // Settings button (top right)
        // Building Tally button
        this.buildingTallyButton = this.add.text(this.gameWidth - 450, 20, '📊 TALLY', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#4CAF50',
            padding: { x: 12, y: 6 }
        }).setScrollFactor(0).setDepth(99999).setInteractive();

        this.buildingTallyButton.on('pointerdown', () => {
            if (this.buildingTallyOpen) {
                this.uiManager.hideBuildingTally();
            } else {
                this.uiManager.showBuildingTally();
            }
        });

        this.buildingTallyButton.on('pointerover', () => {
            this.buildingTallyButton.setStyle({ backgroundColor: '#66BB6A' });
        });

        this.buildingTallyButton.on('pointerout', () => {
            this.buildingTallyButton.setStyle({ backgroundColor: '#4CAF50' });
        });

        this.buildingTallyOpen = false;

        // Missions button removed - now in menu dropdown

        // Street name display (bottom right corner)
        this.streetNameDisplay = this.add.text(
            this.gameWidth - 20,
            this.gameHeight - 40,
            '',
            {
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#FFD700',
                backgroundColor: '#1a1a1a',
                padding: { x: 12, y: 8 }
            }
        ).setOrigin(1, 1);

        this.streetNameDisplay.setScrollFactor(0);
        this.streetNameDisplay.setDepth(26000);

        // Set street name to city name
        this.streetNameDisplay.setText(`🛣️ ${this.cityName}`);

        // Stats button
        this.statsButton = this.add.text(this.gameWidth - 450, 20, '📊 STATS', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#4CAF50',
            padding: { x: 12, y: 6 }
        }).setScrollFactor(0).setDepth(99999).setInteractive();

        this.statsButton.on('pointerdown', () => {
            if (this.statsMenuOpen) {
                this.uiManager.hideStatsPanel();
            } else {
                this.uiManager.showStatsPanel();
            }
        });

        this.statsButton.on('pointerover', () => {
            this.statsButton.setStyle({ backgroundColor: '#66BB6A' });
        });

        this.statsButton.on('pointerout', () => {
            this.statsButton.setStyle({ backgroundColor: '#4CAF50' });
        });

        // City Name Display (removed from top center - now only in street name display)

        this.settingsButton = this.add.text(this.gameWidth - 130, 20, '⚙️ MENU', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#424242',
            padding: { x: 12, y: 6 }
        }).setScrollFactor(0).setDepth(99999).setInteractive();

        this.settingsButton.on('pointerdown', () => {
            this.settingsMenuOpen = !this.settingsMenuOpen;
            this.settingsDropdown.setVisible(this.settingsMenuOpen);
        });

        this.settingsButton.on('pointerover', () => {
            this.settingsButton.setStyle({ backgroundColor: '#616161' });
        });

        this.settingsButton.on('pointerout', () => {
            this.settingsButton.setStyle({ backgroundColor: '#424242' });
        });

        // Settings dropdown menu (Pause & Speed moved to bottom-left buttons)
        this.settingsDropdown = this.add.container(this.gameWidth - 200, 55);
        this.settingsDropdown.setScrollFactor(0).setDepth(100000).setVisible(false);

        const dropdownBg = this.add.rectangle(0, 0, 200, 300, 0x424242, 1);
        dropdownBg.setOrigin(0, 0);
        this.settingsDropdown.add(dropdownBg);

        // Restart button
        this.restartButton = this.add.text(10, 10, '🔄 Restart', {
            fontSize: '14px',
            color: '#ffffff'
        }).setInteractive().setScrollFactor(0);
        this.settingsDropdown.add(this.restartButton);

        // Creative mode button
        this.creativeButton = this.add.text(10, 40, '🎨 Creative: OFF', {
            fontSize: '14px',
            color: '#ffffff'
        }).setInteractive().setScrollFactor(0);
        this.settingsDropdown.add(this.creativeButton);

        // Auto-collection toggle button
        this.autoCollectionButton = this.add.text(10, 70, '💰 Auto-Collect: ON', {
            fontSize: '14px',
            color: '#ffffff'
        }).setInteractive().setScrollFactor(0);
        this.settingsDropdown.add(this.autoCollectionButton);

        // Travel button
        this.travelButton = this.add.text(10, 100, '🚌 Fast Travel', {
            fontSize: '14px',
            color: '#ffffff'
        }).setInteractive().setScrollFactor(0);
        this.settingsDropdown.add(this.travelButton);

        // Build button
        this.buildButton = this.add.text(10, 130, '🏗️ Build Mode', {
            fontSize: '14px',
            color: '#ffffff'
        }).setInteractive().setScrollFactor(0);
        this.settingsDropdown.add(this.buildButton);

        // Demolish button
        this.demolishButton = this.add.text(10, 160, '💥 Demolish Mode', {
            fontSize: '14px',
            color: '#ffffff'
        }).setInteractive().setScrollFactor(0);
        this.settingsDropdown.add(this.demolishButton);

        // Help button
        this.helpButton = this.add.text(10, 190, '❓ Help / Controls', {
            fontSize: '14px',
            color: '#ffffff'
        }).setInteractive().setScrollFactor(0);
        this.settingsDropdown.add(this.helpButton);

        this.helpButton.on('pointerdown', () => {
            this.showHelpMenu();
            this.settingsMenuOpen = false;
            this.settingsDropdown.setVisible(false);
        });

        // Missions button (in dropdown menu)
        this.menuMissionsButton = this.add.text(10, 220, '🏆 Missions', {
            fontSize: '14px',
            color: '#ffffff'
        }).setInteractive().setScrollFactor(0);
        this.settingsDropdown.add(this.menuMissionsButton);

        this.menuMissionsButton.on('pointerdown', () => {
            if (this.missionsMenuOpen) {
                this.uiManager.hideMissionsPanel();
            } else {
                this.uiManager.showMissionsPanel();
            }
            this.settingsMenuOpen = false;
            this.settingsDropdown.setVisible(false);
        });

        // Add hover effects to all dropdown buttons
        [this.restartButton, this.creativeButton, this.autoCollectionButton, this.travelButton, this.buildButton, this.demolishButton, this.helpButton, this.menuMissionsButton].forEach(btn => {
            btn.on('pointerover', () => btn.setStyle({ color: '#FFD700' }));
            btn.on('pointerout', () => btn.setStyle({ color: '#ffffff' }));
        });

        // Add click handlers for dropdown buttons
        this.restartButton.on('pointerdown', () => {
            this.settingsMenuOpen = false;
            this.settingsDropdown.setVisible(false);
            this.restartConfirmShowing = true;
            this.restartConfirmUI.setText('⚠️ RESTART GAME? ⚠️\nAll progress will be lost!');
            this.restartConfirmContainer.setVisible(true);
        });

        this.creativeButton.on('pointerdown', () => {
            this.creativeMode = !this.creativeMode;
            this.creativeButton.setText(this.creativeMode ? '🎨 Creative: ON' : '🎨 Creative: OFF');
        });

        this.autoCollectionButton.on('pointerdown', () => {
            this.autoCollectionEnabled = !this.autoCollectionEnabled;
            this.autoCollectionButton.setText(this.autoCollectionEnabled ? '💰 Auto-Collect: ON' : '💰 Auto-Collect: OFF');
            this.uiManager.addNotification(this.autoCollectionEnabled ? '💰 Auto-collection enabled' : '💰 Auto-collection disabled - collect manually with E');
        });

        this.travelButton.on('pointerdown', () => {
            this.settingsMenuOpen = false;
            this.settingsDropdown.setVisible(false);
            this.districtTravelMenuOpen = true;
            this.districtTravelContainer.setVisible(true);
        });

        // Emergency: Return to Main Street button (in case user gets stuck)
        this.returnToMainStreetButton = this.add.text(10, 250, '🏠 Return to Main St', {
            fontSize: '14px',
            color: '#ffffff'
        }).setInteractive().setScrollFactor(0);
        this.settingsDropdown.add(this.returnToMainStreetButton);

        this.returnToMainStreetButton.on('pointerdown', () => {
            if (this.currentStreet !== 1) {
                this.switchToStreet(1);
            }
            this.settingsMenuOpen = false;
            this.settingsDropdown.setVisible(false);
        });
        this.returnToMainStreetButton.on('pointerover', () => this.returnToMainStreetButton.setStyle({ color: '#FFD700' }));
        this.returnToMainStreetButton.on('pointerout', () => this.returnToMainStreetButton.setStyle({ color: '#ffffff' }));

        this.buildButton.on('pointerdown', () => {
            this.settingsMenuOpen = false;
            this.settingsDropdown.setVisible(false);
            this.buildMode = !this.buildMode;
            console.log('🏗️ Build mode toggled:', this.buildMode ? 'ON' : 'OFF');
            this.deleteMode = false;
            this.buildMenuContainer.setVisible(this.buildMode);

            if (this.buildMode) {
                // Don't auto-select a building - let user choose
                this.selectedBuilding = null;
                if (this.buildingPreview) {
                    this.buildingPreview.destroy();
                    this.buildingPreview = null;
                }
                console.log('Build mode opened, preview cleared');
            } else {
                this.selectedBuilding = null;
                if (this.buildingPreview) {
                    this.buildingPreview.destroy();
                    this.buildingPreview = null;
                }
                console.log('Build mode closed, preview cleared');
            }
        });

        this.demolishButton.on('pointerdown', () => {
            console.log('🔨 Demolish button clicked!');
            this.settingsMenuOpen = false;
            this.settingsDropdown.setVisible(false);
            this.deleteMode = !this.deleteMode;
            console.log(`🔨 Delete mode is now: ${this.deleteMode}`);
            this.buildMode = false;
            this.buildMenuContainer.setVisible(false);

            if (!this.deleteMode) {
                this.selectedBuilding = null;
                if (this.buildingPreview) {
                    this.buildingPreview.destroy();
                    this.buildingPreview = null;
                }
                console.log('🔨 Delete mode turned OFF');
            } else {
                console.log('🔨 Delete mode turned ON - you should see the red banner');
            }
        });

        // Time UI (top right, next to settings)
        this.timeUI = this.add.text(this.gameWidth - 300, 20, '', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 6 }
        }).setScrollFactor(0).setDepth(99998);

        // Speed Control Buttons (upper right, beneath time display, always visible)
        const speedButtonY = 55;  // Below time UI (which is at y: 20)
        const speedButtonSpacing = 45;  // Smaller spacing for compact layout
        const speedButtonStartX = this.gameWidth - 300;  // Align with time UI

        // Pause button (using simple text symbols instead of emoji)
        this.speedPauseButton = this.add.text(speedButtonStartX, speedButtonY, '||', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#424242',
            padding: { x: 8, y: 4 },
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0, 0).setScrollFactor(0).setDepth(99999).setInteractive();

        this.speedPauseButton.on('pointerdown', () => {
            this.isPaused = !this.isPaused;
            this.speedPauseButton.setText(this.isPaused ? '▶' : '||');
            this.uiManager.updateSpeedButtons();
        });

        // 1x speed button
        this.speed1xButton = this.add.text(speedButtonStartX + speedButtonSpacing, speedButtonY, '▶', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#2E7D32',
            padding: { x: 8, y: 4 }
        }).setOrigin(0, 0).setScrollFactor(0).setDepth(99999).setInteractive();

        this.speed1xButton.on('pointerdown', () => {
            this.timeSpeed = 1;
            this.uiManager.updateSpeedButtons();
        });

        // 2x speed button
        this.speed2xButton = this.add.text(speedButtonStartX + speedButtonSpacing * 2, speedButtonY, '▶▶', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#424242',
            padding: { x: 8, y: 4 }
        }).setOrigin(0, 0).setScrollFactor(0).setDepth(99999).setInteractive();

        this.speed2xButton.on('pointerdown', () => {
            this.timeSpeed = 2;
            this.uiManager.updateSpeedButtons();
        });

        // 3x speed button
        this.speed3xButton = this.add.text(speedButtonStartX + speedButtonSpacing * 3, speedButtonY, '▶▶▶', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#424242',
            padding: { x: 8, y: 4 }
        }).setOrigin(0, 0).setScrollFactor(0).setDepth(99999).setInteractive();

        this.speed3xButton.on('pointerdown', () => {
            this.timeSpeed = 3;
            this.uiManager.updateSpeedButtons();
        });

        // Add hover effects
        [this.speedPauseButton, this.speed1xButton, this.speed2xButton, this.speed3xButton].forEach(btn => {
            btn.on('pointerover', () => btn.setStyle({ color: '#FFD700' }));
            btn.on('pointerout', () => btn.setStyle({ color: '#ffffff' }));
        });

        // Initialize speed button states
        this.uiManager.updateSpeedButtons();

        // Build menu UI (clickable buttons at bottom of screen) - RESTORED TO WORKING VERSION
        this.buildMenuContainer = this.add.container(this.gameWidth / 2, this.gameHeight - 80);
        this.buildMenuContainer.setScrollFactor(0).setDepth(99997).setVisible(false);

        const buildMenuBg = this.add.rectangle(0, 0, this.gameWidth, 160, 0x000000, 0.9);
        this.buildMenuContainer.add(buildMenuBg);

        // Build menu title
        this.buildMenuTitle = this.add.text(0, -60, 'SELECT BUILDING TO PLACE', {
            fontSize: '14px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        this.buildMenuContainer.add(this.buildMenuTitle);

        // Close button (X) for build menu
        this.buildMenuCloseButton = this.add.text(this.gameWidth / 2 - 40, -60, '✕', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#D32F2F',
            padding: { x: 8, y: 2 }
        }).setOrigin(0.5).setInteractive().setScrollFactor(0);

        this.buildMenuCloseButton.on('pointerover', () => {
            this.buildMenuCloseButton.setStyle({ backgroundColor: '#F44336', color: '#FFD700' });
        });

        this.buildMenuCloseButton.on('pointerout', () => {
            this.buildMenuCloseButton.setStyle({ backgroundColor: '#D32F2F', color: '#ffffff' });
        });

        this.buildMenuCloseButton.on('pointerdown', () => {
            console.log('❌ Build menu close button clicked');

            // Clear selection and preview first
            this.selectedBuilding = null;
            if (this.buildingPreview) {
                this.buildingPreview.destroy();
                this.buildingPreview = null;
            }

            // Then close build mode and hide menu
            this.buildMode = false;
            this.buildMenuContainer.setVisible(false);

            // No need to call updateBuildingButtonStates() since menu is hidden
        });

        this.buildMenuContainer.add(this.buildMenuCloseButton);

        // Building categories
        this.buildingCategories = {
            residential: [
                { type: 'house', label: '🏠 House', price: '$100', color: '#FF6B6B' },
                { type: 'apartment', label: '🏢 Apartment', price: '$400', color: '#FF8C94' },
                { type: 'hotel', label: '🏨 Hotel', price: '$600', color: '#9C27B0' }
            ],
            shops: [
                { type: 'clothingShop', label: '👔 Clothing', price: '$200', color: '#FF69B4' },
                { type: 'electronicsShop', label: '💻 Electronics', price: '$250', color: '#2196F3' },
                { type: 'groceryStore', label: '🥬 Grocery', price: '$180', color: '#8BC34A' },
                { type: 'bookstore', label: '📚 Bookstore', price: '$150', color: '#9C27B0' },
                { type: 'bakery', label: '🥐 Bakery', price: '$180', color: '#FFE4B5' }
            ],
            restaurants: [
                { type: 'chinese_restaurant', label: '🥡 Chinese', price: '$300', color: '#DC143C' },
                { type: 'italian_restaurant', label: '🍝 Italian', price: '$320', color: '#228B22' },
                { type: 'diner', label: '🍔 Diner', price: '$250', color: '#4682B4' },
                { type: 'sub_shop', label: '🥖 Sub Shop', price: '$200', color: '#FFD700' }
            ],
            entertainment: [
                { type: 'arcade', label: '🕹️ Arcade', price: '$350', color: '#FF00FF' },
                { type: 'themePark', label: '🎡 Theme Park', price: '$18000', color: '#FF1493' },
                { type: 'movieTheater', label: '🎬 Movie Theater', price: '$8000', color: '#8B0000' }
            ],
            services: [
                { type: 'library', label: '📖 Library', price: '$400', color: '#8B4513' },
                { type: 'museum', label: '🏛️ Museum', price: '$800', color: '#D4AF37' },
                { type: 'school', label: '🏫 School', price: '$8000', color: '#FFC107' },
                { type: 'subwayStation', label: '🚇 Subway Station', price: '$5000', color: '#607D8B' },
                { type: 'officeBuilding', label: '🏢 Office Building', price: '$15000', color: '#607D8B' },
                { type: 'fireStation', label: '🚒 Fire Station', price: '$10000', color: '#D32F2F' },
                { type: 'policeStation', label: '🚔 Police Station', price: '$12000', color: '#1565C0' },
                { type: 'hospital', label: '🏥 Hospital', price: '$18000', color: '#FFFFFF' },
                { type: 'trainStation', label: '🚂 Train Station', price: '$15000', color: '#795548' }
            ],
            resources: [
                { type: 'bank', label: '🏦 Bank', price: '$500', color: '#2E7D32' },
                { type: 'market', label: '🏪 Market', price: '$150', color: '#FF9800' },
                { type: 'lumbermill', label: '🌲 Lumber Mill', price: '$250', color: '#8D6E63' },
                { type: 'brickfactory', label: '🧱 Brick Factory', price: '$250', color: '#D84315' }
            ],
            recreation: [
                { type: 'park', label: '🌳 Park', price: '$500', color: '#4CAF50' },
                { type: 'playground', label: '🎪 Playground', price: '$800', color: '#FF9800' },
                { type: 'fountain', label: '⛲ Fountain', price: '$1200', color: '#2196F3' }
            ]
        };

        this.currentCategory = 'residential';

        // Category dropdown
        this.categoryDropdown = this.add.text(-400, -40, '📂 Category: Residential ▼', {
            fontSize: '14px',
            color: '#FFFFFF',
            backgroundColor: '#424242',
            padding: { x: 12, y: 6 }
        }).setOrigin(0, 0.5).setInteractive().setScrollFactor(0);

        this.categoryDropdown.on('pointerover', () => {
            this.categoryDropdown.setStyle({ backgroundColor: '#616161' });
        });

        this.categoryDropdown.on('pointerout', () => {
            this.categoryDropdown.setStyle({ backgroundColor: '#424242' });
        });

        this.categoryDropdown.on('pointerdown', () => {
            this.cycleBuildCategory();
        });

        this.buildMenuContainer.add(this.categoryDropdown);

        // Container for building buttons (will be populated based on category)
        this.buildingButtonsContainer = this.add.container(0, 0);
        this.buildMenuContainer.add(this.buildingButtonsContainer);

        this.buildingButtons = {};
        this.updateBuildingCategoryDisplay();

        // Demolish mode UI (simple overlay)
        this.demolishUI = this.add.text(this.gameWidth / 2, this.gameHeight - 60, '💥 DEMOLISH MODE - Click any building to delete it', {
            fontSize: '18px',
            color: '#ffffff',
            backgroundColor: '#D32F2F',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(9998).setVisible(false);

        // Building placement confirmation UI
        this.buildConfirmContainer = this.add.container(this.gameWidth / 2, this.gameHeight / 2);
        this.buildConfirmContainer.setScrollFactor(0).setDepth(10001).setVisible(false);

        const buildConfirmBg = this.add.rectangle(0, 0, 400, 180, 0x1976D2, 1);
        this.buildConfirmContainer.add(buildConfirmBg);

        this.buildConfirmUI = this.add.text(0, -40, '', {
            fontSize: '16px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        this.buildConfirmContainer.add(this.buildConfirmUI);

        this.buildConfirmButton = this.add.text(-80, 40, 'PLACE', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#2E7D32',
            padding: { x: 20, y: 8 }
        }).setOrigin(0.5).setInteractive().setScrollFactor(0);
        this.buildConfirmContainer.add(this.buildConfirmButton);

        this.buildCancelButton = this.add.text(80, 40, 'CANCEL', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#424242',
            padding: { x: 20, y: 8 }
        }).setOrigin(0.5).setInteractive().setScrollFactor(0);
        this.buildConfirmContainer.add(this.buildCancelButton);

        this.buildConfirmButton.on('pointerover', () => this.buildConfirmButton.setStyle({ backgroundColor: '#4CAF50' }));
        this.buildConfirmButton.on('pointerout', () => this.buildConfirmButton.setStyle({ backgroundColor: '#2E7D32' }));
        this.buildCancelButton.on('pointerover', () => this.buildCancelButton.setStyle({ backgroundColor: '#616161' }));
        this.buildCancelButton.on('pointerout', () => this.buildCancelButton.setStyle({ backgroundColor: '#424242' }));

        this.buildConfirmButton.on('pointerdown', () => {
            console.log('✅ PLACE button clicked');
            console.log('Current buildConfirmShowing:', this.buildConfirmShowing);
            console.log('Container visible before processing?', this.buildConfirmContainer.visible);

            // Prevent double-clicks
            if (!this.buildConfirmShowing) {
                console.log('Dialog already hidden, ignoring click');
                return;
            }

            // Immediately disable button and hide dialog to prevent double-clicks
            this.buildConfirmButton.disableInteractive();
            this.buildCancelButton.disableInteractive();

            // Hide dialog immediately
            this.buildConfirmContainer.setVisible(false);
            this.buildConfirmShowing = false;
            console.log('Dialog hidden immediately at start of handler');

            try {
                const success = this.placeBuilding();
                console.log('placeBuilding returned:', success);

                // Only clear selection if building was successfully placed
                if (success !== false) {
                    // Clear the preview and selection after placing so user can pick another building
                    if (this.buildingPreview) {
                        this.buildingPreview.destroy();
                        this.buildingPreview = null;
                    }
                    this.selectedBuilding = null;
                    this.updateBuildingButtonStates(); // Update UI to show no building selected
                    // buildMode stays ON so user can continue building
                    console.log('Building placed successfully - buildMode:', this.buildMode);
                } else {
                    console.log('Building placement failed - keeping selection');
                }
            } catch (error) {
                console.error('Error placing building:', error);
                console.error('Stack:', error.stack);
            } finally {
                // Re-enable buttons for next use
                this.buildConfirmButton.setInteractive();
                this.buildCancelButton.setInteractive();
                console.log('Handler completed, buttons re-enabled');
            }
        });

        this.buildCancelButton.on('pointerdown', () => {
            console.log('❌ CANCEL button clicked');

            // Prevent double-clicks
            if (!this.buildConfirmShowing) {
                console.log('Dialog already hidden, ignoring cancel click');
                return;
            }

            // Immediately hide dialog and disable buttons
            this.buildConfirmContainer.setVisible(false);
            this.buildConfirmShowing = false;

            // Clear the preview and selection when canceling
            if (this.buildingPreview) {
                this.buildingPreview.destroy();
                this.buildingPreview = null;
            }
            this.selectedBuilding = null;
            this.updateBuildingButtonStates();

            console.log('Canceled - preview cleared, can select new building');
        });

        this.buildConfirmShowing = false;

        // Bank UI
        this.bankUI = this.add.text(this.gameWidth / 2 - 200, this.gameHeight / 2 - 100, '', {
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: '#2E7D32',
            padding: { x: 10, y: 8 }
        }).setScrollFactor(0).setDepth(9999);
        this.bankUI.setVisible(false);
        this.bankMenuOpen = false;
        this.nearBank = null; // Track which bank player is near

        // Tax collection popup flag
        this.taxPopupShowing = false;
        this.wasPausedBeforeTaxPopup = false;

        // Mailbox UI for rental applications
        this.mailboxUI = this.add.text(this.gameWidth / 2, this.gameHeight / 2, '', {
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: '#1976D2',
            padding: { x: 15, y: 12 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(9999);
        this.mailboxUI.setVisible(false);
        this.mailboxMenuOpen = false;
        this.currentApplicationIndex = 0; // Track which application is being viewed

        // Resource building UI
        this.resourceBuildingUI = this.add.text(this.gameWidth / 2 - 200, this.gameHeight / 2 - 100, '', {
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: '#FF9800',
            padding: { x: 10, y: 8 }
        }).setScrollFactor(0).setDepth(9999);
        this.resourceBuildingUI.setVisible(false);
        this.resourceBuildingMenuOpen = false;
        this.nearResourceBuilding = null; // Track which resource building player is near

        // Apartment viewing UI
        this.apartmentUI = this.add.text(this.gameWidth / 2, this.gameHeight / 2, '', {
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: '#5D4037',
            padding: { x: 15, y: 12 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(9999);
        this.apartmentUI.setVisible(false);

        // Shop Interior UI (full-screen overlay)
        this.shopInteriorContainer = this.add.container(0, 0);
        this.shopInteriorContainer.setScrollFactor(0).setDepth(15000).setVisible(false);

        // Interior background (full screen)
        const interiorBg = this.add.rectangle(this.gameWidth / 2, this.gameHeight / 2, this.gameWidth, this.gameHeight, 0xE8D4B0, 1);
        this.shopInteriorContainer.add(interiorBg);

        // Floor
        const floor = this.add.rectangle(this.gameWidth / 2, this.gameHeight - 100, this.gameWidth, 200, 0xB8956A, 1);
        this.shopInteriorContainer.add(floor);

        // Back wall
        const backWall = this.add.rectangle(this.gameWidth / 2, 150, this.gameWidth, 300, 0xF5E6D3, 1);
        this.shopInteriorContainer.add(backWall);

        // Counter (checkout counter at bottom center)
        const counter = this.add.graphics();
        counter.fillStyle(0x8B4513, 1);
        counter.fillRect(this.gameWidth / 2 - 150, this.gameHeight - 250, 300, 100);
        counter.lineStyle(3, 0x654321, 1);
        counter.strokeRect(this.gameWidth / 2 - 150, this.gameHeight - 250, 300, 100);
        this.shopInteriorContainer.add(counter);

        // Counter top (lighter wood)
        const counterTop = this.add.rectangle(this.gameWidth / 2, this.gameHeight - 250, 300, 15, 0xA0522D);
        this.shopInteriorContainer.add(counterTop);

        // Employee behind counter (simple sprite for now)
        const employee = this.add.container(this.gameWidth / 2, this.gameHeight - 280);

        // Employee body
        const empBody = this.add.rectangle(0, 0, 30, 40, 0x4CAF50);
        employee.add(empBody);

        // Employee head
        const empHead = this.add.circle(0, -30, 15, 0xFFDBAC);
        employee.add(empHead);

        // Employee eyes
        const empEyes = this.add.graphics();
        empEyes.fillStyle(0x000000, 1);
        empEyes.fillCircle(-5, -32, 2);
        empEyes.fillCircle(5, -32, 2);
        employee.add(empEyes);

        // Employee smile
        const empSmile = this.add.graphics();
        empSmile.lineStyle(2, 0x000000, 1);
        empSmile.arc(0, -25, 8, 0, Math.PI, false);
        empSmile.strokePath();
        employee.add(empSmile);

        this.shopInteriorContainer.add(employee);

        // Shelves on left side
        for (let i = 0; i < 3; i++) {
            const shelf = this.add.graphics();
            shelf.fillStyle(0x8B4513, 1);
            shelf.fillRect(50, 200 + (i * 120), 200, 80);
            shelf.lineStyle(2, 0x654321, 1);
            shelf.strokeRect(50, 200 + (i * 120), 200, 80);

            // Shelf items (colored boxes representing products)
            for (let j = 0; j < 4; j++) {
                const colors = [0xFF6B6B, 0x4ECDC4, 0xFFE66D, 0x95E1D3];
                shelf.fillStyle(colors[j % colors.length], 1);
                shelf.fillRect(60 + (j * 45), 210 + (i * 120), 35, 50);
                shelf.lineStyle(1, 0x000000, 1);
                shelf.strokeRect(60 + (j * 45), 210 + (i * 120), 35, 50);
            }

            this.shopInteriorContainer.add(shelf);
        }

        // Shelves on right side
        for (let i = 0; i < 3; i++) {
            const shelf = this.add.graphics();
            shelf.fillStyle(0x8B4513, 1);
            shelf.fillRect(this.gameWidth - 250, 200 + (i * 120), 200, 80);
            shelf.lineStyle(2, 0x654321, 1);
            shelf.strokeRect(this.gameWidth - 250, 200 + (i * 120), 200, 80);

            // Shelf items
            for (let j = 0; j < 4; j++) {
                const colors = [0xFF6B6B, 0x4ECDC4, 0xFFE66D, 0x95E1D3];
                shelf.fillStyle(colors[(j + 2) % colors.length], 1);
                shelf.fillRect(this.gameWidth - 240 + (j * 45), 210 + (i * 120), 35, 50);
                shelf.lineStyle(1, 0x000000, 1);
                shelf.strokeRect(this.gameWidth - 240 + (j * 45), 210 + (i * 120), 35, 50);
            }

            this.shopInteriorContainer.add(shelf);
        }

        // Exit prompt
        this.shopExitPrompt = this.add.text(this.gameWidth / 2, 50, 'Press E or ESC to exit shop', {
            fontSize: '16px',
            color: '#000000',
            backgroundColor: '#FFFFFF',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        this.shopInteriorContainer.add(this.shopExitPrompt);

        // Shop name label (will be updated when entering)
        this.shopNameLabel = this.add.text(this.gameWidth / 2, 100, '', {
            fontSize: '24px',
            color: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.shopInteriorContainer.add(this.shopNameLabel);

        // Player money display (hidden - using main resource UI instead)
        this.shopMoneyText = this.add.text(20, 120, '', {
            fontSize: '18px',
            color: '#FFFFFF',
            backgroundColor: '#4CAF50',
            padding: { x: 10, y: 5 },
            align: 'left'
        }).setOrigin(0, 0).setVisible(false); // Hidden since main resource UI shows money
        this.shopInteriorContainer.add(this.shopMoneyText);

        // Inventory info panel (upper left corner, below main resource UI)
        this.shopStockText = this.add.text(20, 120, '', {
            fontSize: '16px',
            color: '#FFFFFF',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: { x: 10, y: 5 },
            align: 'left'
        }).setOrigin(0, 0);
        this.shopInteriorContainer.add(this.shopStockText);

        this.shopEmployeeText = this.add.text(this.gameWidth - 30, 190, '', {
            fontSize: '14px',
            color: '#000000',
            backgroundColor: '#FFFFFF',
            padding: { x: 10, y: 5 },
            align: 'right'
        }).setOrigin(1, 0);
        this.shopInteriorContainer.add(this.shopEmployeeText);

        this.shopStatusText = this.add.text(this.gameWidth - 30, 225, '', {
            fontSize: '14px',
            color: '#000000',
            backgroundColor: '#FFFFFF',
            padding: { x: 10, y: 5 },
            align: 'right'
        }).setOrigin(1, 0);
        this.shopInteriorContainer.add(this.shopStatusText);

        // Restock button (bottom center)
        this.shopRestockButton = this.add.text(this.gameWidth / 2, this.gameHeight - 80, 'RESTOCK ($500)', {
            fontSize: '18px',
            color: '#FFFFFF',
            backgroundColor: '#2E7D32',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5, 0.5).setInteractive();
        this.shopRestockButton.setScrollFactor(0).setDepth(15001).setVisible(false);

        this.shopRestockButton.on('pointerover', () => {
            this.shopRestockButton.setStyle({ backgroundColor: '#43A047' });
        });
        this.shopRestockButton.on('pointerout', () => {
            this.shopRestockButton.setStyle({ backgroundColor: '#2E7D32' });
        });
        this.shopRestockButton.on('pointerdown', () => {
            this.shopSystem.restockShop();
        });

        // Hire Employee button (bottom center, above restock button)
        this.shopHireButton = this.add.text(this.gameWidth / 2, this.gameHeight - 140, 'HIRE EMPLOYEE ($1000)', {
            fontSize: '18px',
            color: '#FFFFFF',
            backgroundColor: '#1976D2',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5, 0.5).setInteractive();
        this.shopHireButton.setScrollFactor(0).setDepth(15001).setVisible(false);

        this.shopHireButton.on('pointerover', () => {
            this.shopHireButton.setStyle({ backgroundColor: '#2196F3' });
        });
        this.shopHireButton.on('pointerout', () => {
            this.shopHireButton.setStyle({ backgroundColor: '#1976D2' });
        });
        this.shopHireButton.on('pointerdown', () => {
            this.shopSystem.hireEmployee();
        });

        // Employee wage info (bottom center, above restock button)
        this.shopWageText = this.add.text(this.gameWidth / 2, this.gameHeight - 140, '', {
            fontSize: '16px',
            color: '#000000',
            backgroundColor: '#FFFFFF',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5, 0.5);
        this.shopWageText.setScrollFactor(0).setDepth(15001).setVisible(false);

        // Hotel Interior UI (full-screen overlay)
        this.insideHotel = false;
        this.currentHotel = null;
        this.nearHotel = null;

        this.hotelInteriorContainer = this.add.container(0, 0);
        this.hotelInteriorContainer.setScrollFactor(0).setDepth(15000).setVisible(false);

        // Hotel lobby background
        const hotelBg = this.add.rectangle(this.gameWidth / 2, this.gameHeight / 2, this.gameWidth, this.gameHeight, 0x8B7355, 1);
        this.hotelInteriorContainer.add(hotelBg);

        // Fancy floor
        const hotelFloor = this.add.rectangle(this.gameWidth / 2, this.gameHeight - 100, this.gameWidth, 200, 0x654321, 1);
        this.hotelInteriorContainer.add(hotelFloor);

        // Reception desk
        const desk = this.add.graphics();
        desk.fillStyle(0x5D4037, 1);
        desk.fillRect(this.gameWidth / 2 - 200, this.gameHeight - 300, 400, 120);
        desk.lineStyle(3, 0x3E2723, 1);
        desk.strokeRect(this.gameWidth / 2 - 200, this.gameHeight - 300, 400, 120);
        this.hotelInteriorContainer.add(desk);

        // Desk top (marble)
        const deskTop = this.add.rectangle(this.gameWidth / 2, this.gameHeight - 300, 400, 20, 0xE0E0E0);
        this.hotelInteriorContainer.add(deskTop);

        // Hotel employee (front desk clerk) - only visible when hired
        // Position so feet are on the floor (floor surface is at gameHeight - 100)
        const hotelEmployee = this.add.container(this.gameWidth / 2, this.gameHeight - 100);

        // Employee legs
        const hotelEmpLegs = this.add.graphics();
        hotelEmpLegs.fillStyle(0x1565C0, 1); // Darker blue for pants
        hotelEmpLegs.fillRect(-12, -50, 24, 50); // Left leg
        hotelEmpLegs.fillRect(-12, -50, 10, 50); // Left leg (narrower)
        hotelEmpLegs.fillRect(2, -50, 10, 50); // Right leg (narrower)
        hotelEmployee.add(hotelEmpLegs);

        // Employee shoes
        const hotelEmpShoes = this.add.graphics();
        hotelEmpShoes.fillStyle(0x000000, 1);
        hotelEmpShoes.fillEllipse(-7, -2, 12, 6); // Left shoe
        hotelEmpShoes.fillEllipse(7, -2, 12, 6); // Right shoe
        hotelEmployee.add(hotelEmpShoes);

        // Employee body (much larger, normal proportions)
        const hotelEmpBody = this.add.rectangle(0, -95, 60, 90, 0x1976D2); // Blue uniform
        hotelEmployee.add(hotelEmpBody);

        // Employee head (proportional to body)
        const hotelEmpHead = this.add.circle(0, -160, 25, 0xFFDBAC);
        hotelEmployee.add(hotelEmpHead);

        // Employee eyes
        const hotelEmpEyes = this.add.graphics();
        hotelEmpEyes.fillStyle(0x000000, 1);
        hotelEmpEyes.fillCircle(-8, -162, 3);
        hotelEmpEyes.fillCircle(8, -162, 3);
        hotelEmployee.add(hotelEmpEyes);

        // Employee smile
        const hotelEmpSmile = this.add.graphics();
        hotelEmpSmile.lineStyle(3, 0x000000, 1);
        hotelEmpSmile.arc(0, -152, 10, 0, Math.PI);
        hotelEmpSmile.strokePath();
        hotelEmployee.add(hotelEmpSmile);

        // Employee name tag (larger)
        const hotelNameTag = this.add.rectangle(0, -70, 35, 12, 0xFFD700);
        hotelEmployee.add(hotelNameTag);
        const hotelNameTagText = this.add.text(0, -70, 'STAFF', {
            fontSize: '8px',
            color: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        hotelEmployee.add(hotelNameTagText);

        hotelEmployee.setVisible(false); // Hidden until employee is hired
        this.hotelInteriorContainer.add(hotelEmployee);
        this.hotelEmployeeSprite = hotelEmployee; // Store reference

        // Hotel maid - only visible when hired
        // Position on the left side with feet on the floor (floor surface is at gameHeight - 100)
        const hotelMaid = this.add.container(this.gameWidth / 2 - 200, this.gameHeight - 100);

        // Cleaning cart (on the floor, to the right of maid)
        const cart = this.add.graphics();
        cart.fillStyle(0xC0C0C0, 1); // Silver cart
        cart.fillRect(80, -62, 50, 60);
        cart.lineStyle(2, 0x808080, 1);
        cart.strokeRect(80, -62, 50, 60);
        // Cart wheels (on the floor at y = 0)
        cart.fillStyle(0x404040, 1);
        cart.fillCircle(90, 0, 8);
        cart.fillCircle(120, 0, 8);
        hotelMaid.add(cart);

        // Maid legs
        const maidLegs = this.add.graphics();
        maidLegs.fillStyle(0x6D4C41, 1); // Brown stockings/pants
        maidLegs.fillRect(-12, -50, 10, 50); // Left leg
        maidLegs.fillRect(2, -50, 10, 50); // Right leg
        hotelMaid.add(maidLegs);

        // Maid shoes
        const maidShoes = this.add.graphics();
        maidShoes.fillStyle(0x000000, 1);
        maidShoes.fillEllipse(-7, -2, 12, 6); // Left shoe
        maidShoes.fillEllipse(7, -2, 12, 6); // Right shoe
        hotelMaid.add(maidShoes);

        // Maid body
        const maidBody = this.add.rectangle(0, -95, 55, 90, 0x8B4513); // Brown/tan uniform
        hotelMaid.add(maidBody);

        // White apron
        const apron = this.add.rectangle(0, -85, 50, 70, 0xFFFFFF);
        hotelMaid.add(apron);

        // Apron straps
        const apronStraps = this.add.graphics();
        apronStraps.lineStyle(3, 0xFFFFFF, 1);
        apronStraps.lineBetween(-15, -140, -10, -85);
        apronStraps.lineBetween(15, -140, 10, -85);
        hotelMaid.add(apronStraps);

        // Maid head
        const maidHead = this.add.circle(0, -160, 25, 0xFFDBAC);
        hotelMaid.add(maidHead);

        // Maid hair/cap
        const maidCap = this.add.graphics();
        maidCap.fillStyle(0xFFFFFF, 1);
        maidCap.fillEllipse(0, -175, 30, 15);
        hotelMaid.add(maidCap);

        // Maid eyes
        const maidEyes = this.add.graphics();
        maidEyes.fillStyle(0x000000, 1);
        maidEyes.fillCircle(-8, -162, 3);
        maidEyes.fillCircle(8, -162, 3);
        hotelMaid.add(maidEyes);

        // Maid smile
        const maidSmile = this.add.graphics();
        maidSmile.lineStyle(3, 0x000000, 1);
        maidSmile.arc(0, -152, 10, 0, Math.PI);
        maidSmile.strokePath();
        hotelMaid.add(maidSmile);

        hotelMaid.setVisible(false); // Hidden until maid is hired
        this.hotelInteriorContainer.add(hotelMaid);
        this.hotelMaidSprite = hotelMaid; // Store reference

        // Hotel chandelier
        const chandelier = this.add.graphics();
        chandelier.fillStyle(0xFFD700, 1);
        chandelier.fillCircle(this.gameWidth / 2, 100, 30);
        chandelier.lineStyle(2, 0xB8860B, 1);
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x = this.gameWidth / 2 + Math.cos(angle) * 25;
            const y = 100 + Math.sin(angle) * 25;
            chandelier.lineBetween(this.gameWidth / 2, 100, x, y);
        }
        this.hotelInteriorContainer.add(chandelier);

        // Potted plants
        const plant1 = this.add.graphics();
        plant1.fillStyle(0x8B4513, 1);
        plant1.fillRect(100, this.gameHeight - 220, 40, 60);
        plant1.fillStyle(0x2E7D32, 1);
        plant1.fillCircle(120, this.gameHeight - 230, 40);
        this.hotelInteriorContainer.add(plant1);

        const plant2 = this.add.graphics();
        plant2.fillStyle(0x8B4513, 1);
        plant2.fillRect(this.gameWidth - 140, this.gameHeight - 220, 40, 60);
        plant2.fillStyle(0x2E7D32, 1);
        plant2.fillCircle(this.gameWidth - 120, this.gameHeight - 230, 40);
        this.hotelInteriorContainer.add(plant2);

        // Exit prompt
        this.hotelExitPrompt = this.add.text(this.gameWidth / 2, 50, 'Press E or ESC to exit hotel', {
            fontSize: '16px',
            color: '#FFFFFF',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        this.hotelInteriorContainer.add(this.hotelExitPrompt);

        // Hotel name label
        this.hotelNameLabel = this.add.text(this.gameWidth / 2, 150, 'HOTEL LOBBY', {
            fontSize: '28px',
            color: '#FFD700',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.hotelInteriorContainer.add(this.hotelNameLabel);

        // Hotel info panel (upper left corner, below main resource UI)
        this.hotelInfoText = this.add.text(20, 120, '', {
            fontSize: '16px',
            color: '#FFFFFF',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: { x: 15, y: 10 },
            align: 'left'
        }).setOrigin(0, 0);
        this.hotelInteriorContainer.add(this.hotelInfoText);

        // Clean All Rooms button
        this.hotelCleanButton = this.add.text(this.gameWidth / 2, this.gameHeight / 2 + 50, '🧹 CLEAN ALL DIRTY ROOMS', {
            fontSize: '20px',
            color: '#FFFFFF',
            backgroundColor: '#E91E63',
            padding: { x: 25, y: 15 }
        }).setOrigin(0.5).setInteractive();
        this.hotelCleanButton.setScrollFactor(0).setDepth(15001).setVisible(false);

        this.hotelCleanButton.on('pointerover', () => {
            this.hotelCleanButton.setStyle({ backgroundColor: '#F06292' });
        });
        this.hotelCleanButton.on('pointerout', () => {
            this.hotelCleanButton.setStyle({ backgroundColor: '#E91E63' });
        });
        this.hotelCleanButton.on('pointerdown', () => {
            this.hotelSystem.cleanHotelRooms();
        });

        this.hotelInteriorContainer.add(this.hotelCleanButton);

        // Hire Employee button
        this.hotelHireButton = this.add.text(this.gameWidth / 2, this.gameHeight / 2 + 120, 'HIRE EMPLOYEE ($1000)', {
            fontSize: '18px',
            color: '#FFFFFF',
            backgroundColor: '#1976D2',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();
        this.hotelHireButton.setScrollFactor(0).setDepth(15001).setVisible(false);

        this.hotelHireButton.on('pointerover', () => {
            this.hotelHireButton.setStyle({ backgroundColor: '#2196F3' });
        });
        this.hotelHireButton.on('pointerout', () => {
            this.hotelHireButton.setStyle({ backgroundColor: '#1976D2' });
        });
        this.hotelHireButton.on('pointerdown', () => {
            this.hotelSystem.hireHotelEmployee();
        });

        this.hotelInteriorContainer.add(this.hotelHireButton);

        // Employee wage info
        this.hotelWageText = this.add.text(this.gameWidth / 2, this.gameHeight / 2 + 120, '', {
            fontSize: '16px',
            color: '#000000',
            backgroundColor: '#FFFFFF',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5);
        this.hotelWageText.setScrollFactor(0).setDepth(15001).setVisible(false);

        this.hotelInteriorContainer.add(this.hotelWageText);

        // Hire Maid button
        this.hotelHireMaidButton = this.add.text(this.gameWidth / 2, this.gameHeight / 2 + 165, 'HIRE MAID ($1000)', {
            fontSize: '18px',
            color: '#FFFFFF',
            backgroundColor: '#7B1FA2',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();
        this.hotelHireMaidButton.setScrollFactor(0).setDepth(15001).setVisible(false);

        this.hotelHireMaidButton.on('pointerover', () => {
            this.hotelHireMaidButton.setStyle({ backgroundColor: '#9C27B0' });
        });
        this.hotelHireMaidButton.on('pointerout', () => {
            this.hotelHireMaidButton.setStyle({ backgroundColor: '#7B1FA2' });
        });
        this.hotelHireMaidButton.on('pointerdown', () => {
            this.hotelSystem.hireHotelMaid();
        });

        this.hotelInteriorContainer.add(this.hotelHireMaidButton);

        // Maid wage info
        this.hotelMaidWageText = this.add.text(this.gameWidth / 2, this.gameHeight / 2 + 165, '', {
            fontSize: '16px',
            color: '#000000',
            backgroundColor: '#FFFFFF',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5);
        this.hotelMaidWageText.setScrollFactor(0).setDepth(15001).setVisible(false);

        this.hotelInteriorContainer.add(this.hotelMaidWageText);

        // Restaurant Interior UI (full-screen overlay)
        this.insideRestaurant = false;
        this.currentRestaurant = null;
        this.nearRestaurant = null;

        this.restaurantInteriorContainer = this.add.container(0, 0);
        this.restaurantInteriorContainer.setScrollFactor(0).setDepth(15000).setVisible(false);

        // Restaurant background (warm dining atmosphere)
        const restaurantBg = this.add.rectangle(this.gameWidth / 2, this.gameHeight / 2, this.gameWidth, this.gameHeight, 0xD2691E, 1);
        this.restaurantInteriorContainer.add(restaurantBg);

        // Floor
        const restaurantFloor = this.add.rectangle(this.gameWidth / 2, this.gameHeight - 100, this.gameWidth, 200, 0x8B4513, 1);
        this.restaurantInteriorContainer.add(restaurantFloor);

        // Bar/counter on the left side
        const bar = this.add.graphics();
        bar.fillStyle(0x654321, 1);
        bar.fillRect(50, this.gameHeight - 250, 150, 100);
        bar.lineStyle(3, 0x3E2723, 1);
        bar.strokeRect(50, this.gameHeight - 250, 150, 100);
        this.restaurantInteriorContainer.add(bar);

        // Bar top (polished wood)
        const barTop = this.add.rectangle(125, this.gameHeight - 250, 150, 15, 0x8B7355);
        this.restaurantInteriorContainer.add(barTop);

        // Waiter/Waitress sprite (only visible when hired)
        const waiter = this.add.container(150, this.gameHeight - 100);

        // Waiter legs
        const waiterLegs = this.add.graphics();
        waiterLegs.fillStyle(0x000000, 1);
        waiterLegs.fillRect(-12, -50, 10, 50);
        waiterLegs.fillRect(2, -50, 10, 50);
        waiter.add(waiterLegs);

        // Waiter shoes
        const waiterShoes = this.add.graphics();
        waiterShoes.fillStyle(0x000000, 1);
        waiterShoes.fillEllipse(-7, -2, 12, 6);
        waiterShoes.fillEllipse(7, -2, 12, 6);
        waiter.add(waiterShoes);

        // Waiter body (white shirt, black vest)
        const waiterBody = this.add.rectangle(0, -95, 60, 90, 0xFFFFFF);
        waiter.add(waiterBody);

        // Black vest
        const vest = this.add.rectangle(0, -95, 50, 80, 0x1a1a1a);
        waiter.add(vest);

        // Waiter head
        const waiterHead = this.add.circle(0, -160, 25, 0xFFDBAC);
        waiter.add(waiterHead);

        // Waiter eyes
        const waiterEyes = this.add.graphics();
        waiterEyes.fillStyle(0x000000, 1);
        waiterEyes.fillCircle(-8, -162, 3);
        waiterEyes.fillCircle(8, -162, 3);
        waiter.add(waiterEyes);

        // Waiter smile
        const waiterSmile = this.add.graphics();
        waiterSmile.lineStyle(3, 0x000000, 1);
        waiterSmile.arc(0, -152, 10, 0, Math.PI);
        waiterSmile.strokePath();
        waiter.add(waiterSmile);

        // Bow tie
        const bowTie = this.add.graphics();
        bowTie.fillStyle(0xFF0000, 1);
        bowTie.fillTriangle(-15, -135, 0, -140, -7, -145);
        bowTie.fillTriangle(15, -135, 0, -140, 7, -145);
        waiter.add(bowTie);

        waiter.setVisible(false);
        this.restaurantInteriorContainer.add(waiter);
        this.restaurantWaiterSprite = waiter;

        // Chandelier
        const restaurantLight = this.add.graphics();
        restaurantLight.fillStyle(0xFFD700, 1);
        restaurantLight.fillCircle(this.gameWidth / 2, 80, 25);
        restaurantLight.lineStyle(2, 0xB8860B, 1);
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = this.gameWidth / 2 + Math.cos(angle) * 20;
            const y = 80 + Math.sin(angle) * 20;
            restaurantLight.lineBetween(this.gameWidth / 2, 80, x, y);
        }
        this.restaurantInteriorContainer.add(restaurantLight);

        // Exit prompt
        this.restaurantExitPrompt = this.add.text(this.gameWidth / 2, 50, 'Press E or ESC to exit restaurant', {
            fontSize: '16px',
            color: '#FFFFFF',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        this.restaurantInteriorContainer.add(this.restaurantExitPrompt);

        // Restaurant name label
        this.restaurantNameLabel = this.add.text(this.gameWidth / 2, 130, 'RESTAURANT', {
            fontSize: '28px',
            color: '#FFD700',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.restaurantInteriorContainer.add(this.restaurantNameLabel);

        // Restaurant info panel (upper left corner, below main resource UI)
        this.restaurantInfoText = this.add.text(20, 120, '', {
            fontSize: '16px',
            color: '#FFFFFF',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: { x: 15, y: 10 },
            align: 'left'
        }).setOrigin(0, 0);
        this.restaurantInteriorContainer.add(this.restaurantInfoText);

        // Hire Day Waiter button
        this.restaurantHireDayButton = this.add.text(this.gameWidth / 2 - 150, this.gameHeight / 2 + 100, 'HIRE DAY WAITER ($800)', {
            fontSize: '16px',
            color: '#FFFFFF',
            backgroundColor: '#1976D2',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setInteractive();
        this.restaurantHireDayButton.setScrollFactor(0).setDepth(15001).setVisible(false);

        this.restaurantHireDayButton.on('pointerover', () => {
            this.restaurantHireDayButton.setStyle({ backgroundColor: '#2196F3' });
        });
        this.restaurantHireDayButton.on('pointerout', () => {
            this.restaurantHireDayButton.setStyle({ backgroundColor: '#1976D2' });
        });
        this.restaurantHireDayButton.on('pointerdown', () => {
            this.restaurantSystem.hireRestaurantWaiter('day');
        });

        this.restaurantInteriorContainer.add(this.restaurantHireDayButton);

        // Hire Night Waiter button
        this.restaurantHireNightButton = this.add.text(this.gameWidth / 2 + 150, this.gameHeight / 2 + 100, 'HIRE NIGHT WAITER ($800)', {
            fontSize: '16px',
            color: '#FFFFFF',
            backgroundColor: '#7B1FA2',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setInteractive();
        this.restaurantHireNightButton.setScrollFactor(0).setDepth(15001).setVisible(false);

        this.restaurantHireNightButton.on('pointerover', () => {
            this.restaurantHireNightButton.setStyle({ backgroundColor: '#9C27B0' });
        });
        this.restaurantHireNightButton.on('pointerout', () => {
            this.restaurantHireNightButton.setStyle({ backgroundColor: '#7B1FA2' });
        });
        this.restaurantHireNightButton.on('pointerdown', () => {
            this.restaurantSystem.hireRestaurantWaiter('night');
        });

        this.restaurantInteriorContainer.add(this.restaurantHireNightButton);

        // Waiter wage text
        this.restaurantWageText = this.add.text(this.gameWidth / 2, this.gameHeight / 2 + 160, '', {
            fontSize: '14px',
            color: '#000000',
            backgroundColor: '#FFFFFF',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5);
        this.restaurantWageText.setScrollFactor(0).setDepth(15001).setVisible(false);

        this.restaurantInteriorContainer.add(this.restaurantWageText);

        // Container for restaurant tables (will be populated when entering)
        this.restaurantTablesContainer = this.add.container(0, 0);
        this.restaurantTablesContainer.setScrollFactor(0).setDepth(15000);
        this.restaurantInteriorContainer.add(this.restaurantTablesContainer);

        // Restart confirmation UI (container with buttons)
        this.restartConfirmContainer = this.add.container(this.gameWidth / 2, this.gameHeight / 2);
        this.restartConfirmContainer.setScrollFactor(0).setDepth(30000).setVisible(false);

        // Background rectangle - make it interactive to block clicks to game behind
        const restartBg = this.add.rectangle(0, 0, 400, 180, 0xC62828, 1);
        restartBg.setInteractive();
        this.restartConfirmContainer.add(restartBg);

        this.restartConfirmUI = this.add.text(0, -40, '', {
            fontSize: '18px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        this.restartConfirmContainer.add(this.restartConfirmUI);

        this.restartConfirmButton = this.add.text(-80, 40, 'CONFIRM', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#D32F2F',
            padding: { x: 20, y: 8 }
        }).setOrigin(0.5).setInteractive();
        this.restartConfirmContainer.add(this.restartConfirmButton);

        this.restartCancelButton = this.add.text(80, 40, 'CANCEL', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#424242',
            padding: { x: 20, y: 8 }
        }).setOrigin(0.5).setInteractive();
        this.restartConfirmContainer.add(this.restartCancelButton);

        this.restartConfirmButton.on('pointerover', () => this.restartConfirmButton.setStyle({ backgroundColor: '#EF5350' }));
        this.restartConfirmButton.on('pointerout', () => this.restartConfirmButton.setStyle({ backgroundColor: '#D32F2F' }));
        this.restartCancelButton.on('pointerover', () => this.restartCancelButton.setStyle({ backgroundColor: '#616161' }));
        this.restartCancelButton.on('pointerout', () => this.restartCancelButton.setStyle({ backgroundColor: '#424242' }));

        this.restartConfirmButton.on('pointerdown', () => {
            this.resetGame();
        });

        this.restartCancelButton.on('pointerdown', () => {
            this.restartConfirmShowing = false;
            this.restartConfirmContainer.setVisible(false);
        });

        this.restartConfirmShowing = false;

        // Delete confirmation UI (container with buttons)
        this.deleteConfirmContainer = this.add.container(this.gameWidth / 2, this.gameHeight / 2);
        this.deleteConfirmContainer.setScrollFactor(0).setDepth(10000).setVisible(false);

        const deleteBg = this.add.rectangle(0, 0, 400, 180, 0xFF5722, 1);
        this.deleteConfirmContainer.add(deleteBg);

        this.deleteConfirmUI = this.add.text(0, -40, '', {
            fontSize: '18px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        this.deleteConfirmContainer.add(this.deleteConfirmUI);

        this.deleteConfirmButton = this.add.text(-80, 40, 'DELETE', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#D32F2F',
            padding: { x: 20, y: 8 }
        }).setOrigin(0.5).setInteractive().setScrollFactor(0);
        this.deleteConfirmContainer.add(this.deleteConfirmButton);

        this.deleteCancelButton = this.add.text(80, 40, 'CANCEL', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#424242',
            padding: { x: 20, y: 8 }
        }).setOrigin(0.5).setInteractive().setScrollFactor(0);
        this.deleteConfirmContainer.add(this.deleteCancelButton);

        this.deleteConfirmButton.on('pointerover', () => this.deleteConfirmButton.setStyle({ backgroundColor: '#EF5350' }));
        this.deleteConfirmButton.on('pointerout', () => this.deleteConfirmButton.setStyle({ backgroundColor: '#D32F2F' }));
        this.deleteCancelButton.on('pointerover', () => this.deleteCancelButton.setStyle({ backgroundColor: '#616161' }));
        this.deleteCancelButton.on('pointerout', () => this.deleteCancelButton.setStyle({ backgroundColor: '#424242' }));

        this.deleteConfirmButton.on('pointerdown', () => {
            if (this.buildingToDelete) {
                this.deleteBuilding(this.buildingToDelete);
                this.buildingToDelete = null;
            }
            this.deleteConfirmShowing = false;
            this.deleteConfirmContainer.setVisible(false);
        });

        this.deleteCancelButton.on('pointerdown', () => {
            this.deleteConfirmShowing = false;
            this.deleteConfirmContainer.setVisible(false);
            this.buildingToDelete = null;
        });

        this.deleteConfirmShowing = false;
        this.buildingToDelete = null;

        // District travel UI (container with buttons)
        this.districtTravelContainer = this.add.container(this.gameWidth / 2, this.gameHeight / 2);
        this.districtTravelContainer.setScrollFactor(0).setDepth(10000).setVisible(false);

        const travelBg = this.add.rectangle(0, 0, 500, 280, 0x1976D2, 1);
        this.districtTravelContainer.add(travelBg);

        this.districtTravelUI = this.add.text(0, -100, '🚌 FAST TRAVEL 🚌\nClick a district to travel:', {
            fontSize: '18px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        this.districtTravelContainer.add(this.districtTravelUI);

        // Residential button
        this.residentialButton = this.add.text(0, -40, '🏠 Residential District', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#FF6B6B',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive().setScrollFactor(0);
        this.districtTravelContainer.add(this.residentialButton);

        // Downtown button
        this.downtownButton = this.add.text(0, 10, '🏢 Downtown', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#4ECDC4',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive().setScrollFactor(0);
        this.districtTravelContainer.add(this.downtownButton);

        // Industrial button
        this.industrialButton = this.add.text(0, 60, '🏭 Industrial District', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#8D6E63',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive().setScrollFactor(0);
        this.districtTravelContainer.add(this.industrialButton);

        // Close button
        this.travelCloseButton = this.add.text(0, 110, 'CLOSE', {
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: '#424242',
            padding: { x: 20, y: 8 }
        }).setOrigin(0.5).setInteractive().setScrollFactor(0);
        this.districtTravelContainer.add(this.travelCloseButton);

        // Add hover effects
        [this.residentialButton, this.downtownButton, this.industrialButton].forEach(btn => {
            const originalBg = btn.style.backgroundColor;
            btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#FFD700', color: '#000000' }));
            btn.on('pointerout', () => btn.setStyle({ backgroundColor: originalBg, color: '#ffffff' }));
        });

        this.travelCloseButton.on('pointerover', () => this.travelCloseButton.setStyle({ backgroundColor: '#616161' }));
        this.travelCloseButton.on('pointerout', () => this.travelCloseButton.setStyle({ backgroundColor: '#424242' }));

        // Add click handlers
        this.residentialButton.on('pointerdown', () => {
            console.log('Teleporting to Residential District at', this.districts.residential.centerX);
            this.player.x = this.districts.residential.centerX;
            this.player.body.x = this.districts.residential.centerX;
            this.playerVisual.x = this.player.x;
            this.cameras.main.scrollX = this.player.x - this.gameWidth / 2;
            this.districtTravelMenuOpen = false;
            this.districtTravelContainer.setVisible(false);
        });

        this.downtownButton.on('pointerdown', () => {
            console.log('Teleporting to Downtown at', this.districts.downtown.centerX);
            this.player.x = this.districts.downtown.centerX;
            this.player.body.x = this.districts.downtown.centerX;
            this.playerVisual.x = this.player.x;
            this.cameras.main.scrollX = this.player.x - this.gameWidth / 2;
            this.districtTravelMenuOpen = false;
            this.districtTravelContainer.setVisible(false);
        });

        this.industrialButton.on('pointerdown', () => {
            console.log('Teleporting to Industrial District at', this.districts.industrial.centerX);
            this.player.x = this.districts.industrial.centerX;
            this.player.body.x = this.districts.industrial.centerX;
            this.playerVisual.x = this.player.x;
            this.cameras.main.scrollX = this.player.x - this.gameWidth / 2;
            this.districtTravelMenuOpen = false;
            this.districtTravelContainer.setVisible(false);
        });

        this.travelCloseButton.on('pointerdown', () => {
            this.districtTravelMenuOpen = false;
            this.districtTravelContainer.setVisible(false);
        });

        // Pause UI
        this.pauseUI = this.add.text(this.gameWidth / 2, this.gameHeight / 2, '', {
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 30, y: 20 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(10000);
        this.pauseUI.setVisible(false);

        // Spawn initial buses
        this.spawnBuses();

        // Spawn initial citizens
        this.citizenSystem.spawnCitizens();

        // Load saved game if exists
        this.saveSystem.loadGame();

        // Update building visibility for multi-street system after loading
        this.buildings.forEach(building => {
            const isOnCurrentStreet = (building.streetNumber || 1) === this.currentStreet;
            if (building.graphics) building.graphics.setVisible(isOnCurrentStreet);
            if (building.sprite) building.sprite.setVisible(isOnCurrentStreet);
            if (building.bonusIndicator) building.bonusIndicator.setVisible(isOnCurrentStreet);
            if (building.sign) building.sign.setVisible(isOnCurrentStreet);
            if (building.vacancySigns) {
                building.vacancySigns.forEach(sign => {
                    if (sign && sign.setVisible) sign.setVisible(isOnCurrentStreet);
                });
            }
            if (building.windowLights) {
                building.windowLights.forEach(light => {
                    if (light && light.setVisible) light.setVisible(false); // Hide until nighttime
                });
            }
        });

        // Check for vacant apartments after loading and generate applications
        this.checkVacantApartmentsAfterLoad();

        // Debug: Check localStorage on startup
        console.log('=== GAME STARTUP DEBUG ===');
        const savedData = localStorage.getItem('mainstreetmayor_save');
        if (savedData) {
            const parsed = JSON.parse(savedData);
            console.log('Save data exists:', parsed);
            console.log('Buildings in save:', parsed.buildings);
        } else {
            console.log('No save data found in localStorage');
        }
        console.log('Buildings loaded into game:', this.buildings.length);
        console.log('=== END DEBUG ===');
    }

    isShop(buildingType) {
        return ['clothingShop', 'electronicsShop', 'groceryStore', 'bookstore', 'bakery'].includes(buildingType);
    }

    isRestaurant(buildingType) {
        return ['chinese_restaurant', 'italian_restaurant', 'diner', 'sub_shop'].includes(buildingType);
    }

    isEntertainment(buildingType) {
        return ['arcade', 'themePark', 'movieTheater'].includes(buildingType);
    }

    isService(buildingType) {
        return ['library', 'museum'].includes(buildingType);
    }

    calculateParkBoost(building) {
        // Calculate income boost from nearby parks/playgrounds/fountains
        let totalBoost = 0;

        for (let park of this.buildings) {
            const parkType = this.buildingTypes[park.type];

            // Check if this is a park/recreation building with boost
            if (!parkType || !parkType.boostRadius) continue;

            // Calculate distance
            const distance = Math.abs(building.x - park.x);

            // If within boost radius
            if (distance <= parkType.boostRadius) {
                // Check if this park has a specific boost type restriction
                if (parkType.boostType) {
                    // Only boost specific building types (e.g., playground only boosts residential)
                    const buildingType = this.buildingTypes[building.type];
                    if (buildingType && buildingType.district === parkType.boostType) {
                        totalBoost += parkType.boostPercent;
                    }
                } else {
                    // No restriction - boost all buildings in range
                    totalBoost += parkType.boostPercent;
                }
            }
        }

        return totalBoost; // Returns combined boost (e.g., 0.15 for 15% boost)
    }

    handleScheduledTraffic(hour, minute, day) {
        // Initialize tracking if not exists
        if (!this.trafficState) {
            this.trafficState = {
                lastHour: hour,
                schoolArrivalSpawned: false,
                schoolDepartureSpawned: false,
                schoolLunchSpawned: false,
                officeArrivalSpawned: false,
                officeDepartureSpawned: false,
                officeLunchSpawned: false,
                officeBreakSpawned: false,
                movieShowtimes: {}, // Track which showtimes have spawned
                fieldTripDay: -1, // Last day a field trip occurred
                fieldTripScheduled: false
            };
        }

        // Reset daily flags when hour changes
        if (hour !== this.trafficState.lastHour) {
            this.trafficState.lastHour = hour;

            // Reset school flags
            if (hour < 7 || hour >= 16) {
                this.trafficState.schoolArrivalSpawned = false;
                this.trafficState.schoolDepartureSpawned = false;
                this.trafficState.schoolLunchSpawned = false;
            }

            // Reset office flags
            if (hour < 8 || hour >= 18) {
                this.trafficState.officeArrivalSpawned = false;
                this.trafficState.officeDepartureSpawned = false;
                this.trafficState.officeLunchSpawned = false;
                this.trafficState.officeBreakSpawned = false;
            }
        }

        // === SCHOOL TRAFFIC ===
        for (let building of this.buildings) {
            if (building.type === 'school') {
                const buildingType = this.buildingTypes.school;
                const schedule = buildingType.schedule;

                // Morning arrival (7-9 AM)
                if (hour >= schedule.arrivalStart && hour < schedule.arrivalEnd && !this.trafficState.schoolArrivalSpawned) {
                    this.spawnSchoolStudents(building, buildingType.capacity * 0.8); // 80% of capacity
                    this.trafficState.schoolArrivalSpawned = true;
                    this.uiManager.addNotification('🎒 Students arriving at school!');
                }

                // Lunch time (12-1 PM) - some students go to nearby restaurants
                if (hour === schedule.lunchStart && !this.trafficState.schoolLunchSpawned) {
                    this.spawnLunchCrowd(building, buildingType.capacity * 0.3, 'student'); // 30% go out for lunch
                    this.trafficState.schoolLunchSpawned = true;
                }

                // Afternoon departure (3-4 PM)
                if (hour >= schedule.departureStart && hour < schedule.departureEnd && !this.trafficState.schoolDepartureSpawned) {
                    this.uiManager.addNotification('🏠 School dismissed! Students heading home');
                    this.trafficState.schoolDepartureSpawned = true;
                }

                // Field trip chance (once per week, during school hours)
                if (hour >= 9 && hour < 14 && this.trafficState.fieldTripDay !== day) {
                    if (Math.random() < buildingType.fieldTripChance / 24) { // Spread chance across hours
                        this.organizeFieldTrip(building);
                        this.trafficState.fieldTripDay = day;
                    }
                }
            }

            // === OFFICE BUILDING TRAFFIC ===
            if (building.type === 'officeBuilding') {
                const buildingType = this.buildingTypes.officeBuilding;
                const schedule = buildingType.schedule;

                // Morning arrival (8-9 AM)
                if (hour >= schedule.arrivalStart && hour < schedule.arrivalEnd && !this.trafficState.officeArrivalSpawned) {
                    this.spawnOfficeWorkers(building, buildingType.capacity * 0.9); // 90% of capacity
                    this.trafficState.officeArrivalSpawned = true;
                    this.uiManager.addNotification('💼 Workers arriving at office building');
                }

                // Lunch rush (12-1 PM)
                if (hour === schedule.lunchStart && !this.trafficState.officeLunchSpawned) {
                    this.spawnLunchCrowd(building, buildingType.capacity * 0.6, 'worker'); // 60% go out
                    this.trafficState.officeLunchSpawned = true;
                    this.uiManager.addNotification('🍽️ Lunch rush from office workers!');
                }

                // Afternoon break (3 PM)
                if (hour === schedule.breakTime && !this.trafficState.officeBreakSpawned) {
                    this.spawnLunchCrowd(building, buildingType.capacity * 0.2, 'worker'); // 20% take break
                    this.trafficState.officeBreakSpawned = true;
                }

                // Evening departure (5-6 PM)
                if (hour >= schedule.departureStart && hour < schedule.departureEnd && !this.trafficState.officeDepartureSpawned) {
                    this.uiManager.addNotification('🚗 Workers leaving office building');
                    this.trafficState.officeDepartureSpawned = true;
                }
            }

            // === MOVIE THEATER TRAFFIC ===
            if (building.type === 'movieTheater') {
                const buildingType = this.buildingTypes.movieTheater;

                // Check each showtime
                for (let showtime of buildingType.showtimes) {
                    const showtimeKey = `${day}-${showtime}`;

                    // Spawn moviegoers 30 minutes before showtime
                    if (hour === showtime && minute < 30 && !this.trafficState.movieShowtimes[showtimeKey]) {
                        const isPeakTime = buildingType.peakHours.includes(showtime);
                        const audienceSize = isPeakTime ? Phaser.Math.Between(15, 25) : Phaser.Math.Between(5, 12);
                        this.spawnMoviegoers(building, audienceSize);
                        this.trafficState.movieShowtimes[showtimeKey] = true;

                        const timeStr = `${showtime % 12 || 12}:00 ${showtime >= 12 ? 'PM' : 'AM'}`;
                        this.uiManager.addNotification(`🎬 ${timeStr} showing starting soon!`);
                    }
                }

                // Clean up old showtime tracking
                if (minute === 0) {
                    const currentKeys = Object.keys(this.trafficState.movieShowtimes);
                    for (let key of currentKeys) {
                        const [keyDay] = key.split('-').map(Number);
                        if (keyDay < day - 1) {
                            delete this.trafficState.movieShowtimes[key];
                        }
                    }
                }
            }
        }
    }

    spawnSchoolStudents(building, count) {
        for (let i = 0; i < count; i++) {
            this.citizenSystem.spawnNewCitizen();
        }
    }

    spawnOfficeWorkers(building, count) {
        for (let i = 0; i < count; i++) {
            this.citizenSystem.spawnNewCitizen();
        }
    }

    spawnLunchCrowd(building, count, type = 'citizen') {
        // Find nearby restaurants
        const nearbyRestaurants = this.buildings.filter(b =>
            this.isRestaurant(b.type) && Math.abs(b.x - building.x) < 1000
        );

        if (nearbyRestaurants.length === 0) return;

        for (let i = 0; i < count; i++) {
            this.citizenSystem.spawnNewCitizen();

            // Try to assign the most recently spawned citizen to the restaurant
            if (this.citizenSystem.citizens && this.citizenSystem.citizens.length > 0) {
                const citizen = this.citizenSystem.citizens[this.citizenSystem.citizens.length - 1];
                const targetRestaurant = Phaser.Utils.Array.GetRandom(nearbyRestaurants);
                citizen.targetBuilding = targetRestaurant;
                citizen.isDiningVisit = true;
            }
        }
    }

    spawnMoviegoers(building, count) {
        for (let i = 0; i < count; i++) {
            this.citizenSystem.spawnNewCitizen();

            // Try to assign the most recently spawned citizen to the theater
            if (this.citizenSystem.citizens && this.citizenSystem.citizens.length > 0) {
                const citizen = this.citizenSystem.citizens[this.citizenSystem.citizens.length - 1];
                citizen.targetBuilding = building;
                citizen.isEntertainmentVisit = true;
            }
        }
    }

    organizeFieldTrip(school) {
        // Find nearby museum or library
        const destinations = this.buildings.filter(b =>
            (b.type === 'library' || b.type === 'museum') &&
            Math.abs(b.x - school.x) < 2000
        );

        if (destinations.length === 0) return;

        const destination = Phaser.Utils.Array.GetRandom(destinations);
        const groupSize = Phaser.Math.Between(8, 15);

        // Spawn student group heading to destination
        for (let i = 0; i < groupSize; i++) {
            this.citizenSystem.spawnNewCitizen();

            // Try to assign the most recently spawned citizen to the destination
            if (this.citizenSystem.citizens && this.citizenSystem.citizens.length > 0) {
                const citizen = this.citizenSystem.citizens[this.citizenSystem.citizens.length - 1];
                citizen.targetBuilding = destination;
                citizen.isServiceVisit = true;
                citizen.isFieldTrip = true;
            }
        }

        const destName = destination.type === 'library' ? 'Library' : 'Museum';
        this.uiManager.addNotification(`🚌 School field trip to ${destName}!`);
    }

    handleResize(gameSize) {
        const newWidth = gameSize.width;
        const newHeight = gameSize.height;

        // Update stored dimensions
        const oldHeight = this.gameHeight;
        this.gameHeight = newHeight;
        this.gameWidth = newWidth;

        // Update world bounds
        this.physics.world.setBounds(0, 0, 12000, this.gameHeight);

        // Update camera bounds
        this.cameras.main.setBounds(0, 0, 12000, this.gameHeight);

        // Calculate new ground position
        const newGroundY = this.gameHeight - 50;
        const newPlatformY = this.gameHeight - 100;

        // Update ground position (only if initialized)
        if (this.ground) {
            this.ground.y = newGroundY;
        }
        this.groundY = newGroundY;

        // Update platform position (only if initialized)
        if (this.groundPlatformBody && this.groundPlatformBody.body) {
            this.groundPlatformBody.y = newPlatformY;
            this.groundPlatformBody.body.reset(1500, newPlatformY);
        }
        this.platformY = newPlatformY;

        // Reposition all buildings
        for (let building of this.buildings) {
            const buildingType = this.buildingTypes[building.type];
            const newBuildingY = this.gameHeight - 100;

            // Skip redrawing sprite-based buildings (clothing shop)
            if (building.sprite) {
                // Just reposition the sprite (accounting for 1.5x scale)
                const spriteHeight = buildingType.height * 1.5;
                building.sprite.y = newBuildingY - spriteHeight / 2;
                building.y = newBuildingY;
                continue;
            }

            // Clear and redraw building
            building.graphics.clear();

            // Don't draw base rectangle for parks/recreation items and theme park (they draw everything custom)
            if (building.type !== 'park' && building.type !== 'playground' && building.type !== 'fountain' && building.type !== 'themePark') {
                building.graphics.fillStyle(buildingType.color, 1);
                building.graphics.fillRect(
                    building.x - buildingType.width/2,
                    newBuildingY - buildingType.height,
                    buildingType.width,
                    buildingType.height
                );
                building.graphics.lineStyle(3, 0x000000, 1);
                building.graphics.strokeRect(
                    building.x - buildingType.width/2,
                    newBuildingY - buildingType.height,
                    buildingType.width,
                    buildingType.height
                );
            }

            // Redraw building details
            this.buildingRenderer.drawBuildingDetails(building.graphics, building.type, building.x, newBuildingY, building.facadeVariation || 0);

            // Update building Y coordinate (no labels to update - we use signs now)
            building.y = newBuildingY;
        }

        // Keep player above ground
        if (this.player.y > newPlatformY - 50) {
            this.player.y = newPlatformY - 50;
            this.playerVisual.y = this.player.y;
        }

        // Reposition all citizens to new ground level
        const newCitizenY = newPlatformY - 30;
        for (let citizen of this.citizens) {
            if (citizen.container) {
                citizen.y = newCitizenY;
                citizen.container.y = newCitizenY;
            }
        }

        // Update background layers
        if (this.skyGraphics) {
            this.updateSky(); // Use dynamic sky based on time of day
        }

        // Redraw mountains at new height
        if (this.mountainGraphics) {
            this.mountainGraphics.clear();
            for (let i = 0; i < 8; i++) {
                const baseX = i * 500 - 200;
                const peakHeight = 150 + Math.random() * 100;
                const baseY = this.gameHeight - 100;

                this.mountainGraphics.fillStyle(0x8B7355, 1);
                this.mountainGraphics.beginPath();
                this.mountainGraphics.moveTo(baseX, baseY);
                this.mountainGraphics.lineTo(baseX + 250, baseY - peakHeight);
                this.mountainGraphics.lineTo(baseX + 500, baseY);
                this.mountainGraphics.closePath();
                this.mountainGraphics.fillPath();

                if (peakHeight > 200) {
                    this.mountainGraphics.fillStyle(0xFFFFFF, 0.8);
                    this.mountainGraphics.beginPath();
                    this.mountainGraphics.moveTo(baseX + 200, baseY - peakHeight + 30);
                    this.mountainGraphics.lineTo(baseX + 250, baseY - peakHeight);
                    this.mountainGraphics.lineTo(baseX + 300, baseY - peakHeight + 30);
                    this.mountainGraphics.closePath();
                    this.mountainGraphics.fillPath();
                }
            }
        }

        // Redraw distant city at new height
        if (this.cityGraphics) {
            this.cityGraphics.clear();
            for (let i = 0; i < 15; i++) {
                const x = i * 250 + Math.random() * 100;
                const buildingWidth = 60 + Math.random() * 80;
                const buildingHeight = 100 + Math.random() * 150;
                const baseY = this.gameHeight - 100;

                this.cityGraphics.fillStyle(0x4A5568, 0.6);
                this.cityGraphics.fillRect(x, baseY - buildingHeight, buildingWidth, buildingHeight);

                const windowRows = Math.floor(buildingHeight / 20);
                const windowCols = Math.floor(buildingWidth / 15);

                for (let row = 0; row < windowRows; row++) {
                    for (let col = 0; col < windowCols; col++) {
                        if (Math.random() > 0.3) {
                            this.cityGraphics.fillStyle(0xFFE66D, 0.7);
                            this.cityGraphics.fillRect(
                                x + col * 15 + 5,
                                baseY - buildingHeight + row * 20 + 8,
                                8,
                                10
                            );
                        }
                    }
                }
            }
        }

        // Update UI positions (time display, resource display, etc.)
        if (this.timeUI) {
            this.timeUI.x = this.gameWidth - 300;
        }
        // Save button (top right)
        if (this.saveButton) {
            this.saveButton.x = this.gameWidth - 600;
        }
        // Missions button is now on the left, doesn't need repositioning
        if (this.buildingTallyButton) {
            this.buildingTallyButton.x = this.gameWidth - 450;
        }
        // Update street name display position (bottom right)
        if (this.streetNameDisplay) {
            this.streetNameDisplay.x = this.gameWidth - 20;
            this.streetNameDisplay.y = this.gameHeight - 40;
        }
        if (this.settingsButton) {
            this.settingsButton.x = this.gameWidth - 130;
        }
        if (this.settingsDropdown) {
            this.settingsDropdown.x = this.gameWidth - 200;
        }

        // Update speed control button positions (keep them aligned with time UI)
        const speedButtonStartX = this.gameWidth - 300;
        const speedButtonSpacing = 45;
        if (this.speedPauseButton) {
            this.speedPauseButton.x = speedButtonStartX;
        }
        if (this.speed1xButton) {
            this.speed1xButton.x = speedButtonStartX + speedButtonSpacing;
        }
        if (this.speed2xButton) {
            this.speed2xButton.x = speedButtonStartX + speedButtonSpacing * 2;
        }
        if (this.speed3xButton) {
            this.speed3xButton.x = speedButtonStartX + speedButtonSpacing * 3;
        }
        if (this.buildMenuContainer) {
            this.buildMenuContainer.setPosition(this.gameWidth / 2, this.gameHeight - 80);
        }
        if (this.demolishUI) {
            this.demolishUI.setPosition(this.gameWidth / 2, this.gameHeight - 60);
        }
        if (this.bankUI) {
            this.bankUI.setPosition(this.gameWidth / 2 - 200, this.gameHeight / 2 - 100);
        }
        if (this.resourceBuildingUI) {
            this.resourceBuildingUI.setPosition(this.gameWidth / 2 - 200, this.gameHeight / 2 - 100);
        }
        if (this.restartConfirmContainer) {
            this.restartConfirmContainer.setPosition(this.gameWidth / 2, this.gameHeight / 2);
        }
        if (this.buildConfirmContainer) {
            this.buildConfirmContainer.setPosition(this.gameWidth / 2, this.gameHeight / 2);
        }
        if (this.districtTravelContainer) {
            this.districtTravelContainer.setPosition(this.gameWidth / 2, this.gameHeight / 2);
        }
        if (this.deleteConfirmContainer) {
            this.deleteConfirmContainer.setPosition(this.gameWidth / 2, this.gameHeight / 2);
        }

        // Update interior container backgrounds to fill screen
        if (this.shopInteriorContainer && this.shopInteriorContainer.list && this.shopInteriorContainer.list.length > 0) {
            const shopBg = this.shopInteriorContainer.list[0]; // First element is background
            if (shopBg && shopBg.setPosition && shopBg.setSize) {
                shopBg.setPosition(this.gameWidth / 2, this.gameHeight / 2);
                shopBg.setSize(this.gameWidth, this.gameHeight);
            }
            // Update floor
            if (this.shopInteriorContainer.list[1]) {
                const floor = this.shopInteriorContainer.list[1];
                if (floor.setPosition && floor.setSize) {
                    floor.setPosition(this.gameWidth / 2, this.gameHeight - 100);
                    floor.setSize(this.gameWidth, 200);
                }
            }
        }

        if (this.hotelInteriorContainer && this.hotelInteriorContainer.list && this.hotelInteriorContainer.list.length > 0) {
            const hotelBg = this.hotelInteriorContainer.list[0]; // First element is background
            if (hotelBg && hotelBg.setPosition && hotelBg.setSize) {
                hotelBg.setPosition(this.gameWidth / 2, this.gameHeight / 2);
                hotelBg.setSize(this.gameWidth, this.gameHeight);
            }
            // Update floor
            if (this.hotelInteriorContainer.list[1]) {
                const floor = this.hotelInteriorContainer.list[1];
                if (floor.setPosition && floor.setSize) {
                    floor.setPosition(this.gameWidth / 2, this.gameHeight - 100);
                    floor.setSize(this.gameWidth, 200);
                }
            }
        }

        if (this.restaurantInteriorContainer && this.restaurantInteriorContainer.list && this.restaurantInteriorContainer.list.length > 0) {
            const restaurantBg = this.restaurantInteriorContainer.list[0]; // First element is background
            if (restaurantBg && restaurantBg.setPosition && restaurantBg.setSize) {
                restaurantBg.setPosition(this.gameWidth / 2, this.gameHeight / 2);
                restaurantBg.setSize(this.gameWidth, this.gameHeight);
            }
            // Update floor
            if (this.restaurantInteriorContainer.list[1]) {
                const floor = this.restaurantInteriorContainer.list[1];
                if (floor.setPosition && floor.setSize) {
                    floor.setPosition(this.gameWidth / 2, this.gameHeight - 100);
                    floor.setSize(this.gameWidth, 200);
                }
            }
        }

        // Update standalone button positions
        if (this.shopRestockButton) {
            this.shopRestockButton.setPosition(this.gameWidth / 2, this.gameHeight - 80);
        }
        if (this.shopHireButton) {
            this.shopHireButton.setPosition(this.gameWidth / 2, this.gameHeight - 140);
        }
        if (this.shopWageText) {
            this.shopWageText.setPosition(this.gameWidth / 2, this.gameHeight - 140);
        }
        if (this.hotelCleanButton) {
            this.hotelCleanButton.setPosition(this.gameWidth / 2, this.gameHeight - 80);
        }
        if (this.hotelHireButton) {
            this.hotelHireButton.setPosition(this.gameWidth / 2, this.gameHeight - 140);
        }
        if (this.hotelHireMaidButton) {
            this.hotelHireMaidButton.setPosition(this.gameWidth / 2, this.gameHeight - 200);
        }
        if (this.restaurantHireDayButton) {
            this.restaurantHireDayButton.setPosition(this.gameWidth / 2, this.gameHeight - 80);
        }
        if (this.restaurantHireNightButton) {
            this.restaurantHireNightButton.setPosition(this.gameWidth / 2, this.gameHeight - 140);
        }

        console.log(`Resized to ${newWidth}x${newHeight}`);
    }

    createMountains() {
        // Create distant mountains with parallax effect
        this.mountainGraphics = this.add.graphics();
        this.mountainGraphics.setScrollFactor(0.1);
        this.mountainGraphics.setDepth(-80); // Behind city and clouds
        const mountainGraphics = this.mountainGraphics;

        // Multiple mountain peaks across the world
        for (let i = 0; i < 8; i++) {
            const baseX = i * 500 - 200;
            const peakHeight = 150 + Math.random() * 100;
            const baseY = this.gameHeight - 100;

            // Mountain gradient (darker at base, lighter at peak)
            mountainGraphics.fillStyle(0x8B7355, 1);
            mountainGraphics.beginPath();
            mountainGraphics.moveTo(baseX, baseY);
            mountainGraphics.lineTo(baseX + 250, baseY - peakHeight);
            mountainGraphics.lineTo(baseX + 500, baseY);
            mountainGraphics.closePath();
            mountainGraphics.fillPath();

            // Snow cap on taller peaks
            if (peakHeight > 200) {
                mountainGraphics.fillStyle(0xFFFFFF, 0.8);
                mountainGraphics.beginPath();
                mountainGraphics.moveTo(baseX + 200, baseY - peakHeight + 30);
                mountainGraphics.lineTo(baseX + 250, baseY - peakHeight);
                mountainGraphics.lineTo(baseX + 300, baseY - peakHeight + 30);
                mountainGraphics.closePath();
                mountainGraphics.fillPath();
            }
        }
    }

    createDistantCity() {
        // Create distant city skyline
        this.cityGraphics = this.add.graphics();
        this.cityGraphics.setScrollFactor(0.3);
        this.cityGraphics.setDepth(-70); // In front of mountains, behind main street
        const cityGraphics = this.cityGraphics;

        // Generate random buildings in the distance
        for (let i = 0; i < 15; i++) {
            const x = i * 250 + Math.random() * 100;
            const buildingWidth = 60 + Math.random() * 80;
            const buildingHeight = 100 + Math.random() * 150;
            const baseY = this.gameHeight - 100;

            // Building silhouette (darker, semi-transparent)
            cityGraphics.fillStyle(0x4A5568, 0.6);
            cityGraphics.fillRect(x, baseY - buildingHeight, buildingWidth, buildingHeight);

            // Windows (small yellow rectangles)
            const windowRows = Math.floor(buildingHeight / 20);
            const windowCols = Math.floor(buildingWidth / 15);

            for (let row = 0; row < windowRows; row++) {
                for (let col = 0; col < windowCols; col++) {
                    if (Math.random() > 0.3) { // Not all windows are lit
                        cityGraphics.fillStyle(0xFFE66D, 0.7);
                        cityGraphics.fillRect(
                            x + col * 15 + 5,
                            baseY - buildingHeight + row * 20 + 8,
                            8,
                            10
                        );
                    }
                }
            }
        }
    }

    createClouds() {
        // Create fluffy clouds
        this.clouds = [];
        for (let i = 0; i < 6; i++) {
            const cloudContainer = this.add.container(
                Math.random() * 3000,
                50 + Math.random() * (this.gameHeight * 0.3)
            );
            cloudContainer.setScrollFactor(0.15 + Math.random() * 0.1);
            cloudContainer.setDepth(-60); // In front of city, behind main street

            // Create cloud shape with multiple circles
            const cloudGraphics = this.add.graphics();
            cloudGraphics.fillStyle(0xFFFFFF, 0.8);

            // Main cloud body
            cloudGraphics.fillCircle(0, 0, 40);
            cloudGraphics.fillCircle(-30, 5, 35);
            cloudGraphics.fillCircle(30, 5, 35);
            cloudGraphics.fillCircle(-15, -10, 30);
            cloudGraphics.fillCircle(15, -10, 30);

            cloudContainer.add(cloudGraphics);
            this.clouds.push({
                container: cloudContainer,
                speed: 0.02 + Math.random() * 0.03,
                startX: cloudContainer.x
            });
        }
    }

    createSingleStreet() {
        // Create multiple streets (initially only street 1 is unlocked)
        const streetNames = ['Main Street', '2nd Avenue', '3rd Boulevard', '4th Plaza'];

        for (let i = 0; i < this.maxStreets; i++) {
            const streetNumber = i + 1;
            const groundY = this.gameHeight - 50;
            const platformY = this.gameHeight - 100;

            // Create ground (gray road) for each street
            const ground = this.add.rectangle(6000, groundY, 12000, 100, 0x555555);
            ground.setDepth(-10);
            ground.setVisible(streetNumber === this.currentStreet); // Only show current street

            // Create platform for physics for each street
            const platformGroup = this.physics.add.staticGroup();
            const platformBody = platformGroup.create(6000, platformY, null).setSize(12000, 20).setVisible(false);
            platformBody.refreshBody();

            // Store street data
            this.streets.push({
                number: streetNumber,
                name: streetNames[i],
                ground: ground,
                platform: platformGroup,
                platformBody: platformBody,
                groundY: groundY,
                platformY: platformY,
                unlocked: streetNumber === 1 // Only street 1 starts unlocked
            });
        }

        // Set references for current street (for backward compatibility)
        this.ground = this.streets[0].ground;
        this.groundPlatform = this.streets[0].platform;
        this.groundPlatformBody = this.streets[0].platformBody;
        this.groundY = this.streets[0].groundY;
        this.platformY = this.streets[0].platformY;

        // Add physics collision with player (if player exists)
        if (this.player) {
            this.physics.add.collider(this.player, this.groundPlatform);
        }

        // Temporarily unlock Street 2 for testing
        this.streets[1].unlocked = true;
        this.unlockedStreets = 2;

        console.log(`✅ Created ${this.maxStreets} streets (${this.unlockedStreets} unlocked)`);
    }


    createStars() {
        // Create twinkling stars (only visible at night)
        this.stars = [];
        for (let i = 0; i < 80; i++) {
            const star = this.add.circle(
                Math.random() * 3000,
                Math.random() * (this.gameHeight * 0.6),
                1 + Math.random() * 1.5,
                0xFFFFFF,
                0.8
            );
            star.setScrollFactor(0.02);
            star.setDepth(-95); // Between sky and sun/moon
            star.setVisible(false); // Hidden during day
            this.stars.push({
                circle: star,
                twinkleSpeed: 0.5 + Math.random() * 1.5,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    updateSky() {
        // Safety check
        if (!this.skyGraphics || this.gameTime === undefined || !this.gameHeight) {
            return;
        }

        // Calculate hour of day
        const totalMinutes = Math.floor(this.gameTime);
        const hour = Math.floor((totalMinutes % (24 * 60)) / 60);

        this.skyGraphics.clear();

        // Day colors (6am-6pm): bright blue
        // Night colors (6pm-6am): dark blue/purple
        let topColor, bottomColor;

        if (hour >= 6 && hour < 20) {
            // Daytime - bright blue sky (6am to 8pm)
            const dayProgress = (hour - 6) / 14; // 0 to 1 during day
            topColor = 0x87CEEB;
            bottomColor = 0xE0F6FF;
        } else {
            // Nighttime - dark sky (8pm to 6am)
            topColor = 0x0A1128; // Very dark blue
            bottomColor = 0x1B2845; // Slightly lighter dark blue
        }

        this.skyGraphics.fillGradientStyle(topColor, topColor, bottomColor, bottomColor, 1);
        this.skyGraphics.fillRect(0, 0, 3000, this.gameHeight);
    }

    addWindowLights(buildingData, buildingType) {
        // Create glowing window overlays for nighttime
        buildingData.windowLights = [];
        const x = buildingData.x;
        const y = buildingData.y;
        const isOnCurrentStreet = (buildingData.streetNumber || 1) === this.currentStreet;

        if (buildingData.type === 'house') {
            // Two-story house - 3 rows of 2 windows (bottom row removed to avoid door overlap)
            // Match exact coordinates from drawBuildingDetails
            const spacing = 25;
            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 2; col++) {
                    const wx = x - spacing + (col * spacing * 2);
                    const wy = y - buildingType.height + 50 + (row * 50);
                    const light = this.add.rectangle(wx, wy + 12, 20, 25, 0xFFD700, 0.5);
                    light.setDepth(10.1); // Just above building graphics, below street furniture
                    light.setVisible(false);
                    buildingData.windowLights.push(light);
                }
            }
        } else if (buildingData.type === 'apartment') {
            // 4 floors, 2 units per floor, 2 windows per unit
            const floorHeight = buildingType.height / 4;
            for (let floor = 0; floor < 4; floor++) {
                for (let unit = 0; unit < 2; unit++) {
                    const unitIndex = floor * 2 + unit;
                    const unitX = x - 50 + (unit * 100);
                    const unitY = y - buildingType.height + (floor * floorHeight) + 35;

                    for (let win = 0; win < 2; win++) {
                        const wx = unitX - 15 + (win * 30);
                        const light = this.add.rectangle(wx, unitY, 18, 20, 0xFFD700, 0.7);
                        light.setDepth(10.1); // Just above building graphics, below street furniture
                        light.setVisible(false);
                        light.unitIndex = unitIndex; // Tag with unit index for occupied check
                        buildingData.windowLights.push(light);
                    }
                }
            }
        } else if (buildingData.type === 'hotel') {
            // 5 floors, 2 rooms per floor, 2 windows per room
            const floorHeight = buildingType.height / 5;
            for (let floor = 0; floor < 5; floor++) {
                for (let room = 0; room < 2; room++) {
                    const roomIndex = floor * 2 + room;
                    const roomX = x - 60 + (room * 120);
                    const roomY = y - buildingType.height + (floor * floorHeight) + 40;

                    for (let win = 0; win < 2; win++) {
                        const wx = roomX - 20 + (win * 40);
                        const light = this.add.rectangle(wx, roomY, 20, 22, 0xFFD700, 0.7);
                        light.setDepth(10.1); // Just above building graphics, below street furniture
                        light.setVisible(false);
                        light.roomIndex = roomIndex; // Tag with room index for occupied check
                        buildingData.windowLights.push(light);
                    }
                }
            }
        }
    }

    updateCelestialBody() {
        // Calculate time of day (0-24 hours)
        const totalMinutes = Math.floor(this.gameTime);
        const hour = Math.floor((totalMinutes % (24 * 60)) / 60);

        // Clear previous drawing
        this.celestialBody.clear();

        // Position in sky (moves across the sky during day)
        const skyArcProgress = (hour % 24) / 24; // 0 to 1
        const sunX = 300 + skyArcProgress * 2400;
        const sunY = this.gameHeight * 0.2 + Math.sin(skyArcProgress * Math.PI) * -50;

        // Day time (6am to 6pm) - Show sun
        if (hour >= 6 && hour < 18) {
            // Sun
            this.celestialBody.fillStyle(0xFFD700, 1);
            this.celestialBody.fillCircle(sunX, sunY, 40);

            // Sun rays
            this.celestialBody.lineStyle(3, 0xFFE66D, 0.8);
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
                const rayLength = 60;
                this.celestialBody.lineBetween(
                    sunX + Math.cos(angle) * 45,
                    sunY + Math.sin(angle) * 45,
                    sunX + Math.cos(angle) * rayLength,
                    sunY + Math.sin(angle) * rayLength
                );
            }
        } else {
            // Night time - Show moon
            this.celestialBody.fillStyle(0xE8E8E8, 1);
            this.celestialBody.fillCircle(sunX, sunY, 35);

            // Moon craters
            this.celestialBody.fillStyle(0xD0D0D0, 0.5);
            this.celestialBody.fillCircle(sunX - 10, sunY - 8, 8);
            this.celestialBody.fillCircle(sunX + 12, sunY + 5, 6);
            this.celestialBody.fillCircle(sunX - 5, sunY + 12, 5);
        }
    }

    addBuildingSign(buildingData, buildingType) {
        // Create text signs for specific buildings that need them
        const x = buildingData.x;
        const y = buildingData.y;
        const type = buildingData.type;

        // ALWAYS destroy old sign if it exists to prevent duplicates
        if (buildingData.sign) {
            try {
                if (buildingData.sign.destroy) {
                    buildingData.sign.destroy();
                }
            } catch (e) {
                console.warn('Could not destroy old sign:', e);
            }
            buildingData.sign = null;
        }

        if (type === 'house') {
            // "HOUSE" text on the sign plaque
            const houseSign = this.add.text(x, y - buildingType.height + 24, 'HOUSE', {
                fontSize: '12px',
                color: '#654321',
                fontStyle: 'bold',
                fontFamily: 'Arial',
                resolution: 2
            }).setOrigin(0.5).setDepth(11);
            buildingData.sign = houseSign;
        } else if (type === 'apartment') {
            // Apartment sign at top
            const aptSign = this.add.text(x, y - buildingType.height + 16, 'APARTMENTS', {
                fontSize: '14px',
                color: '#000000',
                fontStyle: 'bold',
                fontFamily: 'Arial',
                resolution: 2
            }).setOrigin(0.5).setDepth(11);
            buildingData.sign = aptSign;
        } else if (this.isEntertainment(type)) {
            // Entertainment sign (arcade, theme park, movie theater)
            let entertainmentName, signY, fontSize, color, bgColor;

            if (type === 'themePark') {
                entertainmentName = 'AMUSEMENT';
                signY = y - 305;
                fontSize = '24px';
                color = '#FFD700';
                bgColor = '#FF1493';
            } else if (type === 'movieTheater') {
                entertainmentName = 'MOVIE THEATER';
                signY = y - buildingType.height + 62; // Position in the black marquee area
                fontSize = '14px';
                color = '#FFD700';
                bgColor = 'transparent';
            } else {
                entertainmentName = buildingType.name.toUpperCase();
                signY = y - 225;
                fontSize = '18px';
                color = '#00FFFF';
                bgColor = '#000000';
            }

            const entertainmentSign = this.add.text(x, signY, entertainmentName, {
                fontSize: fontSize,
                color: color,
                fontStyle: 'bold',
                fontFamily: 'Arial',
                backgroundColor: bgColor,
                padding: { x: 10, y: 5 },
                resolution: 2
            }).setOrigin(0.5).setDepth(11);
            buildingData.sign = entertainmentSign;
        } else if (this.isService(type)) {
            // Service sign (library, museum)
            const serviceName = buildingType.name.toUpperCase();
            const serviceSign = this.add.text(x, y - 245, serviceName, {
                fontSize: '18px',
                color: '#FFD700',
                fontStyle: 'bold',
                fontFamily: 'Arial',
                backgroundColor: '#000000',
                padding: { x: 10, y: 5 },
                resolution: 2
            }).setOrigin(0.5).setDepth(11);
            buildingData.sign = serviceSign;
        } else if (type === 'school') {
            // School sign (on white sign area built into the building)
            const schoolSign = this.add.text(x, y - buildingType.height + 32, 'SCHOOL', {
                fontSize: '14px',
                color: '#000000',
                fontStyle: 'bold',
                fontFamily: 'Arial',
                resolution: 2
            }).setOrigin(0.5).setDepth(11);
            buildingData.sign = schoolSign;
        } else if (type === 'officeBuilding') {
            // Office building sign (at top)
            const officeSign = this.add.text(x, y - buildingType.height + 20, 'OFFICE', {
                fontSize: '18px',
                color: '#FFFFFF',
                fontStyle: 'bold',
                fontFamily: 'Arial',
                backgroundColor: '#37474F',
                padding: { x: 12, y: 6 },
                resolution: 2
            }).setOrigin(0.5).setDepth(11);
            buildingData.sign = officeSign;
        } else if (type === 'hotel') {
            // Hotel sign
            const hotelSign = this.add.text(x, y - buildingType.height + 20, 'HOTEL', {
                fontSize: '14px',
                color: '#000000',
                fontStyle: 'bold',
                fontFamily: 'Arial',
                resolution: 2
            }).setOrigin(0.5).setDepth(11);
            buildingData.sign = hotelSign;
        } else if (type === 'bakery') {
            // Bakery sign (above awning)
            const bakerySign = this.add.text(x, y - 140, 'BAKERY', {
                fontSize: '14px',
                color: '#FFFFFF',
                fontStyle: 'bold',
                fontFamily: 'Arial',
                backgroundColor: '#000000',
                padding: { x: 8, y: 4 },
                resolution: 2
            }).setOrigin(0.5).setDepth(11);
            buildingData.sign = bakerySign;
        } else if (type === 'groceryStore') {
            // Grocery store sign (above awning)
            const grocerySign = this.add.text(x, y - 150, 'GROCERY STORE', {
                fontSize: '14px',
                color: '#FFFFFF',
                fontStyle: 'bold',
                fontFamily: 'Arial',
                backgroundColor: '#2E7D32',
                padding: { x: 8, y: 4 },
                resolution: 2
            }).setOrigin(0.5).setDepth(11);
            buildingData.sign = grocerySign;
        } else if (this.isRestaurant(type)) {
            // Restaurant sign on red banner
            const restaurantName = buildingType.name.toUpperCase();
            const restaurantSign = this.add.text(x, y - 95, restaurantName, {
                fontSize: '16px',
                color: '#FFFFFF',
                fontStyle: 'bold',
                fontFamily: 'Arial',
                resolution: 2
            }).setOrigin(0.5).setDepth(11);
            buildingData.sign = restaurantSign;
        } else if (this.isShop(type)) {
            // Skip sign for clothing shop if using sprite (sign is in the pixel art)
            if (type === 'clothingShop' && buildingData.sprite) {
                // No sign needed - it's in the pixel art
            } else {
                // Shop sign on banner for other shops
                const shopName = buildingType.name.toUpperCase();
                const shopSign = this.add.text(x, y - 100, shopName, {
                    fontSize: '16px',
                    color: '#FFFFFF',
                    fontStyle: 'bold',
                    fontFamily: 'Arial',
                    backgroundColor: '#000000',
                    padding: { x: 8, y: 4 },
                    resolution: 2
                }).setOrigin(0.5).setDepth(11);
                buildingData.sign = shopSign;
            }
        }

        // Set initial visibility based on which street this building is on
        if (buildingData.sign) {
            const isOnCurrentStreet = (buildingData.streetNumber || 1) === this.currentStreet;
            buildingData.sign.setVisible(isOnCurrentStreet);
        }
    }

    createStreetFurniture() {
        const groundLevel = this.gameHeight - 100;

        // Add mailboxes at the start of each district (not random - strategic placement!)
        this.createMailbox(100, groundLevel);      // Start of Residential District
        this.createMailbox(4000, groundLevel);     // Start of Downtown
        this.createMailbox(8000, groundLevel);     // Start of Industrial District

        // Place furniture at intervals along the street
        // Avoid building positions (multiples of 240)
        for (let x = 120; x < 12000; x += 240) {
            const furnitureType = Math.floor(Math.random() * 3); // 0-2 for 3 types (lamp, bench, trash)

            // Randomly skip some positions for variety
            if (Math.random() > 0.6) continue;

            switch(furnitureType) {
                case 0:
                    this.createLampPost(x, groundLevel);
                    break;
                case 1:
                    this.createBench(x, groundLevel);
                    break;
                case 2:
                    this.createTrashCan(x, groundLevel);
                    break;
            }
        }

        // Create bus stops at strategic locations
        this.busStops = [];
        // Place a bus stop every 1500 pixels (about every 6 buildings)
        for (let x = 750; x < 12000; x += 1500) {
            this.createBusStop(x, groundLevel);
            this.busStops.push({ x: x, waitingCitizens: [] });
        }
    }

    createDistrictMarkers() {
        const groundLevel = this.gameHeight - 100;

        // Create a marker for each district at its center
        for (let districtKey in this.districts) {
            const district = this.districts[districtKey];
            const x = district.centerX;

            // Sign post
            const post = this.add.graphics();
            post.setDepth(5);
            post.fillStyle(0x654321, 1);
            post.fillRect(x - 6, groundLevel - 200, 12, 200);

            // Sign board background
            const signBoard = this.add.graphics();
            signBoard.setDepth(5);
            signBoard.fillStyle(district.color, 1);
            signBoard.fillRoundedRect(x - 120, groundLevel - 280, 240, 80, 8);
            signBoard.lineStyle(4, 0x000000, 1);
            signBoard.strokeRoundedRect(x - 120, groundLevel - 280, 240, 80, 8);

            // District name text
            const nameText = this.add.text(x, groundLevel - 260, district.name.toUpperCase(), {
                fontSize: '18px',
                color: '#ffffff',
                fontStyle: 'bold',
                fontFamily: 'Arial'
            }).setOrigin(0.5).setDepth(6);

            // Description text
            const descText = this.add.text(x, groundLevel - 235, district.description, {
                fontSize: '11px',
                color: '#ffffff',
                fontFamily: 'Arial'
            }).setOrigin(0.5).setDepth(6);

            // Add ground colored stripe for visual district separation
            const stripe = this.add.rectangle(
                district.startX + (district.endX - district.startX) / 2,
                groundLevel + 10,
                district.endX - district.startX,
                20,
                district.color,
                0.2
            );
            stripe.setDepth(-5);
        }
    }

    createLampPost(x, groundLevel) {
        const lampPost = this.add.graphics();
        lampPost.setDepth(5); // In front of ground, behind buildings

        // Post (dark gray pole)
        lampPost.fillStyle(0x404040, 1);
        lampPost.fillRect(x - 4, groundLevel - 120, 8, 120);

        // Base (wider bottom)
        lampPost.fillStyle(0x303030, 1);
        lampPost.fillRect(x - 8, groundLevel - 10, 16, 10);

        // Light fixture (top)
        lampPost.fillStyle(0x2C3E50, 1);
        lampPost.fillRect(x - 12, groundLevel - 130, 24, 12);

        // Light bulb (glowing) - separate circle for day/night control
        const lightBulb = this.add.circle(x, groundLevel - 124, 8, 0xFFE66D, 0.9);
        lightBulb.setDepth(6);
        lightBulb.setVisible(false); // Off during day

        // Light glow effect - larger circle for night glow
        const lightGlow = this.add.circle(x, groundLevel - 124, 20, 0xFFFFAA, 0.3);
        lightGlow.setDepth(6);
        lightGlow.setVisible(false); // Off during day

        // Store reference for day/night updates
        this.lampPosts.push({
            bulb: lightBulb,
            glow: lightGlow
        });
    }

    createBench(x, groundLevel) {
        const bench = this.add.graphics();
        bench.setDepth(5);

        // Seat (wooden brown)
        bench.fillStyle(0x8B4513, 1);
        bench.fillRect(x - 25, groundLevel - 25, 50, 8);

        // Backrest
        bench.fillStyle(0x8B4513, 1);
        bench.fillRect(x - 25, groundLevel - 50, 50, 8);

        // Vertical slats on backrest
        bench.fillStyle(0x654321, 1);
        for (let i = 0; i < 5; i++) {
            bench.fillRect(x - 20 + (i * 10), groundLevel - 48, 3, 23);
        }

        // Metal legs (dark gray)
        bench.fillStyle(0x505050, 1);
        bench.fillRect(x - 20, groundLevel - 25, 4, 25);
        bench.fillRect(x + 16, groundLevel - 25, 4, 25);

        // Armrests
        bench.fillStyle(0x654321, 1);
        bench.fillRect(x - 28, groundLevel - 35, 6, 10);
        bench.fillRect(x + 22, groundLevel - 35, 6, 10);
    }

    createTrashCan(x, groundLevel) {
        const trashCan = this.add.graphics();
        trashCan.setDepth(5);

        // Can body (green/blue city trash can)
        trashCan.fillStyle(0x2E7D32, 1);
        trashCan.fillRect(x - 12, groundLevel - 35, 24, 35);

        // Lid (darker green)
        trashCan.fillStyle(0x1B5E20, 1);
        trashCan.fillRect(x - 14, groundLevel - 40, 28, 5);

        // Lid handle
        trashCan.fillStyle(0x000000, 1);
        trashCan.fillCircle(x, groundLevel - 37, 3);

        // Recycling symbol (simplified)
        trashCan.lineStyle(2, 0xFFFFFF, 1);
        trashCan.strokeCircle(x, groundLevel - 18, 8);

        // Highlight/shine
        trashCan.fillStyle(0xFFFFFF, 0.3);
        trashCan.fillRect(x - 8, groundLevel - 32, 4, 20);
    }

    createMailbox(x, groundLevel) {
        const mailbox = this.add.graphics();
        mailbox.setDepth(15); // Well above buildings (which are depth 10)

        // Post (brown wooden post)
        mailbox.fillStyle(0x654321, 1);
        mailbox.fillRect(x - 3, groundLevel - 60, 6, 60);

        // Mailbox body (blue USPS style)
        mailbox.fillStyle(0x1976D2, 1);
        mailbox.fillRoundedRect(x - 15, groundLevel - 75, 30, 20, 3);

        // Mailbox flag (red)
        mailbox.fillStyle(0xD32F2F, 1);
        mailbox.fillRect(x + 12, groundLevel - 70, 8, 10);

        // Mail slot (black)
        mailbox.fillStyle(0x000000, 1);
        mailbox.fillRect(x - 10, groundLevel - 68, 20, 3);

        // White stripe on mailbox
        mailbox.fillStyle(0xFFFFFF, 1);
        mailbox.fillRect(x - 12, groundLevel - 67, 24, 2);

        // Mail indicator star (hidden by default)
        const mailIndicator = this.add.text(x, groundLevel - 95, '⭐', {
            fontSize: '20px'
        }).setOrigin(0.5).setDepth(16).setVisible(false);

        // Track this mailbox for interaction
        this.mailboxes.push({
            graphics: mailbox,
            x: x,
            y: groundLevel,
            hasApplications: false,
            indicator: mailIndicator
        });
    }

    createBusStop(x, groundLevel) {
        const busStop = this.add.graphics();
        busStop.setDepth(10.5); // Above buildings (10), but behind citizens (11) and buses (12)

        // Simple pole that goes to ground
        busStop.fillStyle(0x424242, 1);
        busStop.fillRect(x - 2, groundLevel - 110, 4, 110);

        // Bus stop sign (blue circle with bus icon)
        busStop.fillStyle(0x1976D2, 1);
        busStop.fillCircle(x, groundLevel - 120, 20);
        busStop.lineStyle(3, 0xFFFFFF, 1);
        busStop.strokeCircle(x, groundLevel - 120, 20);

        // Simple bus icon (white rectangle)
        busStop.fillStyle(0xFFFFFF, 1);
        busStop.fillRoundedRect(x - 10, groundLevel - 128, 20, 12, 2);
        busStop.fillRect(x - 12, groundLevel - 124, 4, 8); // Front windshield
        busStop.fillCircle(x - 6, groundLevel - 114, 2); // wheel
        busStop.fillCircle(x + 6, groundLevel - 114, 2); // wheel
    }

    spawnBuses() {
        // Spawn 2 buses on the single main street for better coverage
        const busY = (this.platformY || this.gameHeight - 100) - 40; // Position above the street platform

        // Bus 1 - starts at beginning
        this.createBus(500, busY, 1);

        // Bus 2 - starts at middle
        this.createBus(6000, busY, 1);

        console.log(`Spawned 2 buses on Main Street`);
    }

    createBus(startX, startY, direction) {
        const bus = this.add.container(startX, startY);
        bus.setDepth(12); // Above buildings (10), below player (100)

        // Bus body (big yellow/orange bus)
        const body = this.add.graphics();
        body.fillStyle(0xFFA726, 1); // Orange
        body.fillRoundedRect(-80, -40, 160, 80, 8);
        body.lineStyle(3, 0xE65100, 1); // Dark orange outline
        body.strokeRoundedRect(-80, -40, 160, 80, 8);
        bus.add(body);

        // Windows (blue tinted)
        const windowColor = 0x81D4FA;
        for (let i = 0; i < 4; i++) {
            const window = this.add.rectangle(-60 + (i * 35), -20, 25, 20, windowColor);
            bus.add(window);
        }

        // Windshield (front)
        const windshield = this.add.rectangle(70, -10, 15, 35, windowColor);
        bus.add(windshield);

        // Wheels
        const wheel1 = this.add.graphics();
        wheel1.fillStyle(0x212121, 1);
        wheel1.fillCircle(-50, 42, 12);
        wheel1.fillStyle(0x424242, 1);
        wheel1.fillCircle(-50, 42, 6);
        bus.add(wheel1);

        const wheel2 = this.add.graphics();
        wheel2.fillStyle(0x212121, 1);
        wheel2.fillCircle(50, 42, 12);
        wheel2.fillStyle(0x424242, 1);
        wheel2.fillCircle(50, 42, 6);
        bus.add(wheel2);

        // Headlights
        const headlight = this.add.circle(78, 20, 5, 0xFFEB3B);
        bus.add(headlight);

        // Door (darker rectangle on side)
        const door = this.add.rectangle(-70, 10, 20, 50, 0xE65100);
        bus.add(door);

        // Store bus data
        this.buses.push({
            container: bus,
            x: startX,
            y: startY,
            direction: direction, // 1 = right, -1 = left
            speed: 100, // pixels per second
            passengers: [],
            currentStopIndex: 0,
            nextStopIndex: 1,
            isAtStop: false,
            stopTimer: 0
        });
    }

    // Citizen functions moved to CitizenSystem.js

    generateRentalApplication(apartmentBuilding, unitIndex) {
        // Random name generation
        const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
                           'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
                           'Thomas', 'Sarah', 'Charles', 'Karen', 'Daniel', 'Nancy', 'Matthew', 'Lisa'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
                          'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
                          'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White'];

        // Random employment
        const jobs = ['Software Engineer', 'Teacher', 'Nurse', 'Accountant', 'Sales Manager', 'Chef',
                     'Graphic Designer', 'Marketing Specialist', 'Mechanic', 'Electrician', 'Dentist',
                     'Pharmacist', 'Police Officer', 'Firefighter', 'Construction Worker', 'Lawyer',
                     'Real Estate Agent', 'Retail Manager', 'Bank Teller', 'Insurance Agent'];

        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const job = jobs[Math.floor(Math.random() * jobs.length)];

        // Base rent for apartment unit
        const baseRent = this.buildingTypes.apartment.incomePerUnit;

        // Rent offer varies +/- 30% from base
        const rentVariation = 0.7 + (Math.random() * 0.6); // 0.7 to 1.3
        const rentOffer = Math.floor(baseRent * rentVariation);

        // Credit score (300-850)
        const creditScore = Math.floor(300 + Math.random() * 550);

        // Employment length (months)
        const employmentLength = Math.floor(6 + Math.random() * 60); // 6 months to 5 years

        return {
            name: `${firstName} ${lastName}`,
            job: job,
            rentOffer: rentOffer,
            creditScore: creditScore,
            employmentLength: employmentLength
        };
    }

    autoFillVacantUnit(apartmentBuilding, unitIndex) {
        // Auto-fill vacant units with random tenants after a short delay
        console.log(`🏢 Auto-filling vacant unit ${unitIndex + 1}...`);

        // Wait 3-8 seconds to simulate "listing time"
        const delay = 3000 + Math.random() * 5000;

        setTimeout(() => {
            // Check if unit is still vacant (might have been filled manually or building deleted)
            if (!apartmentBuilding.units || !apartmentBuilding.units[unitIndex] || apartmentBuilding.units[unitIndex].rented) {
                return;
            }

            // Generate random tenant
            const tenant = this.generateRentalApplication(apartmentBuilding, unitIndex);
            const unit = apartmentBuilding.units[unitIndex];

            // Move tenant in
            unit.rented = true;
            unit.tenant = tenant;
            unit.accumulatedIncome = 0;
            unit.lastIncomeTime = Date.now();
            unit.lastRiskCheck = Date.now();

            console.log(`✅ ${tenant.name} (${tenant.job}) moved into unit ${unitIndex + 1}!`);
            console.log(`   💰 Rent: $${tenant.rentOffer}/day | 📊 Credit: ${tenant.creditScore} | 💼 Employed: ${tenant.employmentLength} months`);

            // Save game to persist new tenant
            this.saveSystem.saveGame();
        }, delay);
    }

    checkVacantApartmentsAfterLoad() {
        // After loading, check all apartments for vacant units and auto-fill them
        console.log('🏢 Checking for vacant apartments after load...');

        for (let building of this.buildings) {
            // Check if this is an apartment building
            if (building.type === 'apartment' && building.units) {
                for (let i = 0; i < building.units.length; i++) {
                    const unit = building.units[i];
                    // If unit is not rented, auto-fill it
                    if (!unit.rented) {
                        console.log(`📭 Found vacant unit ${i + 1} in apartment building, auto-filling...`);
                        this.autoFillVacantUnit(building, i);
                    }
                }
            }
        }
    }

    checkTenantRisk(unit) {
        // Check if tenant might skip out on rent based on credit score
        if (!unit.tenant || !unit.rented) return;

        const now = Date.now();
        const timeSinceLastCheck = (now - unit.lastRiskCheck) / 1000 / 60; // minutes

        // Check once per game day (24 game hours)
        if (timeSinceLastCheck < 24 * 60) return;

        unit.lastRiskCheck = now;

        const creditScore = unit.tenant.creditScore;
        let skipChance = 0;

        // Calculate skip chance based on credit score
        if (creditScore >= 750) {
            skipChance = 0.001; // 0.1% chance - very reliable
        } else if (creditScore >= 650) {
            skipChance = 0.01; // 1% chance - mostly reliable
        } else if (creditScore >= 550) {
            skipChance = 0.05; // 5% chance - moderate risk
        } else {
            skipChance = 0.15; // 15% chance - high risk!
        }

        // Roll the dice
        if (Math.random() < skipChance) {
            // Tenant bolted! Lose accumulated income
            console.log(`⚠️ ${unit.tenant.name} skipped out on rent! Lost $${unit.accumulatedIncome}`);

            // Unit becomes vacant
            unit.rented = false;
            unit.tenant = null;
            unit.accumulatedIncome = 0;

            // Auto-fill with new tenant after a delay
            const building = this.buildings.find(b => b.units && b.units.includes(unit));
            const unitIndex = building.units.indexOf(unit);

            // Auto-fill the vacant unit
            this.autoFillVacantUnit(building, unitIndex);
        }
    }

    // drawBuildingDetails has been moved to BuildingRenderer.js

    cycleBuildCategory() {
        // Cycle through categories: residential → shops → restaurants → entertainment → services → resources → recreation → residential
        const categories = ['residential', 'shops', 'restaurants', 'entertainment', 'services', 'resources', 'recreation'];
        const currentIndex = categories.indexOf(this.currentCategory);
        const nextIndex = (currentIndex + 1) % categories.length;
        this.currentCategory = categories[nextIndex];

        // Update dropdown text
        const categoryNames = {
            residential: 'Residential',
            shops: 'Shops',
            restaurants: 'Restaurants',
            entertainment: 'Entertainment',
            services: 'Services',
            resources: 'Resources',
            recreation: 'Recreation'
        };
        this.categoryDropdown.setText(`📂 Category: ${categoryNames[this.currentCategory]} ▼`);

        // Update displayed buildings
        this.updateBuildingCategoryDisplay();
    }

    updateBuildingCategoryDisplay() {
        // Clear existing building buttons
        this.buildingButtonsContainer.removeAll(true);
        this.buildingButtons = {};

        // Get buildings for current category
        const categoryBuildings = this.buildingCategories[this.currentCategory];

        // Create buttons for current category
        categoryBuildings.forEach((building, index) => {
            const col = index % 4;
            const row = Math.floor(index / 4);
            const x = -300 + (col * 200);
            const y = 0 + (row * 35);

            const btn = this.add.text(x, y, `${building.label}\n${building.price}`, {
                fontSize: '12px',
                color: '#ffffff',
                backgroundColor: building.color,
                padding: { x: 10, y: 5 },
                align: 'center'
            }).setOrigin(0.5).setInteractive().setScrollFactor(0);

            btn.on('pointerdown', () => {
                console.log('🎯 Building button clicked:', building.type);
                this.selectedBuilding = building.type;
                this.updateBuildingButtonStates();
            });

            btn.on('pointerover', () => {
                if (this.selectedBuilding !== building.type) {
                    btn.setStyle({ backgroundColor: '#FFD700', color: '#000000' });
                }
            });

            btn.on('pointerout', () => {
                if (this.selectedBuilding !== building.type) {
                    btn.setStyle({ backgroundColor: building.color, color: '#ffffff' });
                }
            });

            this.buildingButtonsContainer.add(btn);
            this.buildingButtons[building.type] = { button: btn, originalColor: building.color };
        });
    }

    updateBuildingButtonStates() {
        // Safety check: only update if menu exists and is visible
        if (!this.buildMenuContainer || !this.buildMenuContainer.visible || !this.buildMode) {
            return;
        }

        // Safety check: make sure title exists
        if (!this.buildMenuTitle) {
            return;
        }

        // Update all building buttons to show which one is selected
        for (let buildingType in this.buildingButtons) {
            const btnData = this.buildingButtons[buildingType];
            if (btnData && btnData.button) {
                if (buildingType === this.selectedBuilding) {
                    btnData.button.setStyle({ backgroundColor: '#00FF00', color: '#000000' });
                } else {
                    btnData.button.setStyle({ backgroundColor: btnData.originalColor, color: '#ffffff' });
                }
            }
        }

        // Update build menu title
        try {
            if (this.selectedBuilding) {
                const buildingType = this.buildingTypes[this.selectedBuilding];
                if (buildingType && buildingType.district && this.districts[buildingType.district]) {
                    const suggestedDistrict = this.districts[buildingType.district].name;
                    this.buildMenuTitle.setText(`${buildingType.name} selected\nSuggested: ${suggestedDistrict} (20% bonus!)\nClick on the map to place`);
                }
            } else {
                this.buildMenuTitle.setText('SELECT A BUILDING TO PLACE');
            }
        } catch (error) {
            console.error('Error updating build menu title:', error);
        }
    }

    // UI functions moved to UIManager.js

    update() {
        // Update game time based on real time passed and speed multiplier (only if not paused)
        const now = Date.now();
        if (!this.isPaused) {
            const realTimePassed = (now - this.lastRealTime) / 1000; // seconds

            // Calculate current hour to determine day vs night
            const totalMinutes = Math.floor(this.gameTime);
            const hour = Math.floor((totalMinutes % (24 * 60)) / 60);
            const isNight = hour < 6 || hour >= 20; // Night is 8pm to 6am

            // Night goes double speed: 4 game minutes per real second vs 2 for day
            const timeMultiplier = isNight ? 4 : 2;
            const gameTimePassed = realTimePassed * this.timeSpeed * timeMultiplier;
            this.gameTime += gameTimePassed;
        }
        this.lastRealTime = now;

        // Calculate day, hour, minute
        const totalMinutes = Math.floor(this.gameTime);
        const day = Math.floor(totalMinutes / (24 * 60)) + 1;
        const hour = Math.floor((totalMinutes % (24 * 60)) / 60);
        const minute = totalMinutes % 60;

        // Update time UI
        const timeString = `Day ${day} - ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const speedIndicator = this.timeSpeed === 1 ? '▶' : this.timeSpeed === 2 ? '▶▶' : '▶▶▶';
        this.timeUI.setText(`⏰ ${timeString} ${speedIndicator}`);

        // Update sky color based on time of day
        this.updateSky();

        // Update celestial body (sun/moon) position
        this.updateCelestialBody();

        // Update stars visibility and twinkling
        const isNight = hour < 6 || hour >= 20; // Night is 8pm to 6am
        if (this.stars) {
            for (let star of this.stars) {
                star.circle.setVisible(isNight);
                if (isNight) {
                    // Twinkling effect
                    star.phase += star.twinkleSpeed * 0.05;
                    const alpha = 0.5 + Math.sin(star.phase) * 0.3;
                    star.circle.setAlpha(alpha);
                }
            }
        }

        // Update building window lights based on time and occupancy
        for (let building of this.buildings) {
            // Fix legacy buildings to have streetNumber (one-time fix for loaded saves)
            if (!building.streetNumber) {
                building.streetNumber = 1; // Default to street 1
            }

            if (building.windowLights) {

                if (building.type === 'house') {
                    // Houses: all windows lit at night (only if on current street)
                    for (let light of building.windowLights) {
                        light.setVisible(isNight);
                    }
                } else if (building.type === 'apartment') {
                    // Apartments: only lit if unit is occupied (rented) and on current street
                    for (let light of building.windowLights) {
                        const unitIndex = light.unitIndex;
                        const windowsPerUnit = 2;
                        const actualUnitIndex = Math.floor(building.windowLights.indexOf(light) / windowsPerUnit);
                        const isOccupied = building.units && building.units[actualUnitIndex] && building.units[actualUnitIndex].rented;
                        light.setVisible(isNight && isOccupied);
                    }
                } else if (building.type === 'hotel') {
                    // Hotel: only lit if room is occupied and on current street
                    for (let light of building.windowLights) {
                        const windowsPerRoom = 2;
                        const roomIndex = Math.floor(building.windowLights.indexOf(light) / windowsPerRoom);
                        const isOccupied = building.rooms && building.rooms[roomIndex] && building.rooms[roomIndex].status === 'occupied';
                        light.setVisible(isNight && isOccupied);
                    }
                }
            }
        }

        // Update street lamp lights
        if (this.lampPosts) {
            for (let lamp of this.lampPosts) {
                lamp.bulb.setVisible(isNight);
                lamp.glow.setVisible(isNight);
            }
        }

        // Animate clouds slowly drifting
        if (this.clouds) {
            for (let cloud of this.clouds) {
                cloud.container.x += cloud.speed;
                // Wrap around when cloud goes off screen
                if (cloud.container.x > 3000 + 100) {
                    cloud.container.x = -100;
                }
            }
        }

        // Time speed and creative mode are now controlled via settings menu (mouse clicks)

        // Handle time-based traffic patterns for schools, offices, and movie theaters
        if (!this.isPaused) {
            this.handleScheduledTraffic(hour, minute, day);
        }

        // Update income accumulation and resource regeneration for all buildings
        for (let building of this.buildings) {
            try {
                const buildingType = this.buildingTypes[building.type];

                if (!buildingType) {
                    console.error('Building type not found:', building.type, 'at position', building.x);
                    continue;
                }

                // Income accumulation for houses (NOT shops or restaurants - they only earn from customers)
                if (buildingType && buildingType.incomeRate && !this.isShop(building.type) && !this.isRestaurant(building.type)) {
                // Calculate time elapsed in minutes (adjusted for time speed)
                const elapsedMinutes = ((now - building.lastIncomeTime) / 60000) * this.timeSpeed;
                const districtBonus = building.districtBonus || 1.0;

                // Calculate park/recreation boost
                const parkBoost = this.calculateParkBoost(building);
                const streetBonus = building.streetBonus || 1.0;
                const totalBonus = districtBonus * (1 + parkBoost) * streetBonus;

                const incomeToAdd = elapsedMinutes * buildingType.incomeRate * totalBonus;

                building.accumulatedIncome = Math.min(
                    building.accumulatedIncome + incomeToAdd,
                    buildingType.maxIncome * totalBonus
                );
                building.lastIncomeTime = now;

                // Show $ indicator if income is ready to collect (> $5) and on current street

                // Automatic income collection (collect every $50 or every 5 game minutes, minimum $5)
                if (this.autoCollectionEnabled) {
                    if (!building.lastAutoCollectionTime) {
                        building.lastAutoCollectionTime = this.gameTime;
                    }

                    const autoCollectThreshold = 50; // Auto-collect when income reaches $50
                    const autoCollectInterval = 5; // Or every 5 game minutes
                    const minimumCollectionAmount = 5; // Don't collect less than $5 to avoid spam
                    const minutesSinceLastCollection = this.gameTime - building.lastAutoCollectionTime;

                    if (building.accumulatedIncome >= autoCollectThreshold ||
                        (building.accumulatedIncome >= minimumCollectionAmount && minutesSinceLastCollection >= autoCollectInterval)) {
                        // Auto-collect the income
                        const collectedAmount = Math.floor(building.accumulatedIncome);
                        this.money += collectedAmount;
                        this.money = Math.round(this.money);
                        building.accumulatedIncome = 0;
                        building.lastAutoCollectionTime = this.gameTime;

                        // Show notification
                        const buildingName = buildingType.name || building.type;
                        this.uiManager.addNotification(`💰 Auto-collected $${collectedAmount} from ${buildingName}`);
                        this.uiManager.updateMoneyUI();

                        // Hide income indicator
                        if (building.incomeIndicator) {
                            building.incomeIndicator.setVisible(false);
                        }
                    }
                }

                // Show $ indicator if income is accumulating (> $5) and on current street
                if (building.accumulatedIncome >= 5) {
                    if (!building.incomeIndicator) {
                        building.incomeIndicator = this.add.text(building.x, building.y - buildingType.height - 80, '💰', {
                            fontSize: '24px'
                        }).setOrigin(0.5);
                    } else {
                        building.incomeIndicator.setVisible(true);
                    }
                } else {
                    if (building.incomeIndicator) {
                        building.incomeIndicator.setVisible(false);
                    }
                }
            }

            // Resource regeneration for lumber mills and brick factories
            if (buildingType && buildingType.resourceType) {
                // Calculate time elapsed in minutes (adjusted for time speed)
                const elapsedMinutes = ((now - building.lastResourceTime) / 60000) * this.timeSpeed;
                const streetBonus = building.streetBonus || 1.0;
                const resourcesToAdd = elapsedMinutes * buildingType.regenRate * streetBonus;

                building.storedResources = Math.min(
                    building.storedResources + resourcesToAdd,
                    buildingType.maxStorage
                );
                building.lastResourceTime = now;

                // Show resource indicator if resources are available (>= 1) and on current street

                if (building.storedResources >= 1) {
                    const icon = buildingType.resourceType === 'wood' ? '🪵' : '🧱';
                    if (!building.resourceIndicator || !building.resourceIndicator.scene) {
                        building.resourceIndicator = this.add.text(building.x, building.y - buildingType.height - 80, icon, {
                            fontSize: '24px'
                        }).setOrigin(0.5).setDepth(12);
                    } else {
                        // Update position to stay above building
                        building.resourceIndicator.x = building.x;
                        building.resourceIndicator.y = building.y - buildingType.height - 80;
                        building.resourceIndicator.setVisible(true);
                    }
                } else {
                    if (building.resourceIndicator && building.resourceIndicator.scene) {
                        building.resourceIndicator.setVisible(false);
                    }
                }
            }

            // Apartment unit income generation and tenant risk checking
            if (building.type === 'apartment' && building.units) {
                const apartmentType = this.buildingTypes.apartment;
                const floorHeight = buildingType.height / 4; // 90px per floor

                for (let unitIndex = 0; unitIndex < building.units.length; unitIndex++) {
                    const unit = building.units[unitIndex];
                    const floor = Math.floor(unitIndex / 2); // 0-3
                    const unitPos = unitIndex % 2; // 0 or 1 (left or right)
                    const unitX = building.x - 50 + (unitPos * 100);
                    const unitY = building.y - buildingType.height + (floor * floorHeight) + 65;

                    if (unit.rented && unit.tenant) {
                        // Generate rent income
                        const elapsedMinutes = ((now - unit.lastIncomeTime) / 60000) * this.timeSpeed;
                        const districtBonus = building.districtBonus || 1.0;
                        const parkBoost = this.calculateParkBoost(building);
                        const streetBonus = building.streetBonus || 1.0;
                        const totalBonus = districtBonus * (1 + parkBoost) * streetBonus;
                        const incomeToAdd = elapsedMinutes * unit.tenant.rentOffer * totalBonus;

                        unit.accumulatedIncome = Math.min(
                            unit.accumulatedIncome + incomeToAdd,
                            apartmentType.maxIncomePerUnit * totalBonus
                        );
                        unit.lastIncomeTime = now;

                        // Check if tenant might skip out
                        this.checkTenantRisk(unit);

                        // Hide vacancy indicator if it exists
                        if (unit.vacancyIndicator && unit.vacancyIndicator.scene) {
                            unit.vacancyIndicator.setVisible(false);
                        }
                    } else {
                        // Unit is vacant - show vacancy indicator
                        if (!unit.vacancyIndicator || !unit.vacancyIndicator.scene) {
                            unit.vacancyIndicator = this.add.text(unitX, unitY, 'VACANT', {
                                fontSize: '8px',
                                color: '#FFFFFF',
                                backgroundColor: '#FF0000',
                                padding: { x: 3, y: 1 }
                            }).setOrigin(0.5).setDepth(11);
                        } else {
                            try {
                                unit.vacancyIndicator.setVisible(true);
                                unit.vacancyIndicator.x = unitX;
                                unit.vacancyIndicator.y = unitY;
                            } catch (error) {
                                // If updating fails, recreate the indicator
                                console.warn('Recreating vacancy indicator due to error');
                                unit.vacancyIndicator = this.add.text(unitX, unitY, 'VACANT', {
                                    fontSize: '8px',
                                    color: '#FFFFFF',
                                    backgroundColor: '#FF0000',
                                    padding: { x: 3, y: 1 }
                                }).setOrigin(0.5).setDepth(11);
                            }
                        }
                    }
                }
            }

            // Hotel room management and nightly income
            if (building.type === 'hotel' && building.rooms) {
                const hotelType = this.buildingTypes.hotel;
                const floorHeight = buildingType.height / 5; // 80px per floor

                // Calculate current hour and day
                const totalMinutes = Math.floor(this.gameTime);
                const currentHour = Math.floor((totalMinutes % (24 * 60)) / 60);
                const currentDay = Math.floor(this.gameTime / (24 * 60));

                // Check if it's check-in time (6pm-10pm) and we haven't processed today
                const lastProcessedDay = Math.floor(building.lastNightCheck / (24 * 60));
                const isCheckinTime = currentHour >= 18 && currentHour < 22; // 6pm-10pm

                if (isCheckinTime && currentDay > lastProcessedDay) {
                    // Check-in time! Process all rooms
                    console.log(`🌙 Check-in time at hotel! Hour: ${currentHour}:00, Day: ${currentDay}`);

                    for (let roomIndex = 0; roomIndex < building.rooms.length; roomIndex++) {
                        const room = building.rooms[roomIndex];

                        if (room.status === 'occupied' || room.isOccupied) {
                            // Guest stays one more night
                            room.nightsOccupied++;

                            // Generate nightly income
                            const streetBonus = building.streetBonus || 1.0;
                            const nightlyIncome = hotelType.nightlyRate * streetBonus;
                            building.accumulatedIncome += nightlyIncome;
                            console.log(`💵 Room ${roomIndex + 1} earned $${nightlyIncome} for night #${room.nightsOccupied}`);

                            // Checkout logic:
                            // - Regular guests (no room.guest): 40% chance after 1 night, 60% after 2 nights, 80% after 3 nights
                            // - Tourist guests with room.guest: They stay until their timer expires (handled in CitizenSystem)
                            //   BUT as a fallback, if they've stayed 5+ nights, force checkout (in case timer failed)

                            let shouldCheckout = false;

                            if (!room.guest) {
                                // Regular guest - higher checkout chances for better turnover
                                if (room.nightsOccupied === 1 && Math.random() < 0.6) {
                                    shouldCheckout = true;
                                } else if (room.nightsOccupied === 2 && Math.random() < 0.8) {
                                    shouldCheckout = true;
                                } else if (room.nightsOccupied >= 3) {
                                    shouldCheckout = true; // Always checkout after 3 nights
                                }
                            } else {
                                // Tourist guest - only force checkout if they've overstayed (5+ nights)
                                // This is a fallback in case the tourist timer system failed
                                if (room.nightsOccupied >= 5) {
                                    shouldCheckout = true;
                                    console.log(`⚠️ Tourist in room ${roomIndex + 1} overstayed ${room.nightsOccupied} nights - forcing checkout`);
                                }
                            }

                            if (shouldCheckout) {
                                // Guest checks out - room becomes dirty
                                room.status = 'dirty';
                                room.isOccupied = false;
                                room.guest = null; // Clear guest reference
                                room.nightsOccupied = 0;
                                room.lastCheckoutTime = this.gameTime; // Track when guest left
                                console.log(`Guest checked out of room ${roomIndex + 1}`);

                                // If maid is hired, clean the room immediately
                                if (building.hasMaid) {
                                    room.status = 'clean';
                                    console.log(`🧹 Maid immediately cleaned room ${roomIndex + 1} after checkout!`);

                                    // Update hotel UI if player is viewing this hotel
                                    if (this.insideHotel && this.currentHotel === building) {
                                        this.hotelSystem.updateHotelUI();
                                    }
                                }
                            }
                        } else if (room.status === 'clean' && !room.isOccupied) {
                            // Room is clean - check if enough time has passed since last guest
                            const timeSinceCheckout = this.gameTime - (room.lastCheckoutTime || 0);
                            const minVacancyTime = 120; // Room must be vacant for at least 2 game hours (120 minutes)

                            if (timeSinceCheckout >= minVacancyTime && Math.random() < 0.3) {
                                // 30% chance random guest checks in after cooldown
                                room.status = 'occupied';
                                room.nightsOccupied = 0; // Will become 1 on next night check
                                console.log(`New guest checked into room ${roomIndex + 1}`);
                            }
                        }
                        // Dirty rooms stay dirty until mayor cleans them
                    }

                    building.lastNightCheck = this.gameTime;
                }

                // Update dirty room indicators
                for (let roomIndex = 0; roomIndex < building.rooms.length; roomIndex++) {
                    const room = building.rooms[roomIndex];
                    const floor = Math.floor(roomIndex / 2); // 0-4
                    const roomPos = roomIndex % 2; // 0 or 1 (left or right)
                    const roomX = building.x - 60 + (roomPos * 120);
                    const roomY = building.y - buildingType.height + (floor * floorHeight) + 75;

                    if (room.status === 'dirty') {
                        // Show dirty indicator
                        if (!room.dirtyIndicator || !room.dirtyIndicator.scene) {
                            // Create new indicator if it doesn't exist or was destroyed
                            room.dirtyIndicator = this.add.text(roomX, roomY, 'DIRTY', {
                                fontSize: '8px',
                                color: '#FFFFFF',
                                backgroundColor: '#8B4513',
                                padding: { x: 3, y: 1 }
                            }).setOrigin(0.5).setDepth(11);
                        } else {
                            room.dirtyIndicator.setVisible(true);
                            room.dirtyIndicator.x = roomX;
                            room.dirtyIndicator.y = roomY;
                        }
                    } else {
                        // Hide dirty indicator if room is clean/occupied
                        if (room.dirtyIndicator && room.dirtyIndicator.scene) {
                            room.dirtyIndicator.setVisible(false);
                        }
                    }
                }

                // Show income indicator if income is ready to collect and on current street

                if (building.accumulatedIncome >= 1) {
                    if (!building.incomeIndicator || !building.incomeIndicator.scene) {
                        building.incomeIndicator = this.add.text(building.x, building.y - buildingType.height - 80, '💰', {
                            fontSize: '24px'
                        }).setOrigin(0.5).setDepth(11);
                    } else {
                        building.incomeIndicator.setVisible(true);
                    }
                } else {
                    if (building.incomeIndicator && building.incomeIndicator.scene) {
                        building.incomeIndicator.setVisible(false);
                    }
                }
            }

            // Entertainment and service building income indicators (arcade, library, museum)

            if ((this.isEntertainment(building.type) || this.isService(building.type)) && building.accumulatedIncome >= 1) {
                if (!building.incomeIndicator || !building.incomeIndicator.scene) {
                    building.incomeIndicator = this.add.text(building.x, building.y - buildingType.height - 80, '💰', {
                        fontSize: '24px'
                    }).setOrigin(0.5).setDepth(11);
                } else {
                    building.incomeIndicator.setVisible(true);
                }
            } else if (this.isEntertainment(building.type) || this.isService(building.type)) {
                if (building.incomeIndicator && building.incomeIndicator.scene) {
                    building.incomeIndicator.setVisible(false);
                }
            }

            // Initialize shop inventory if missing (for legacy shops)
            if (this.isShop(building.type) && !building.inventory) {
                console.log(`🔧 Initializing missing inventory for ${building.type}`);
                building.inventory = {
                    stock: 50,
                    maxStock: 100,
                    restockCost: 5,
                    salesPerCustomer: 5
                };
                building.hasEmployee = building.hasEmployee || false;
                building.isOpen = building.isOpen || false;
                building.dailyWage = building.dailyWage || 0;
                building.lastWageCheck = building.lastWageCheck || this.gameTime;
            }

            // Ensure shop is open if it has an employee (sync status)
            if (this.isShop(building.type) && building.hasEmployee && !building.isOpen) {
                building.isOpen = true;
                // Only log once per building
                if (!building._shopStatusFixed) {
                    console.log(`🔧 Fixed shop status: ${building.type} has employee but was closed - now open`);
                    building._shopStatusFixed = true;
                }
            }

            // Shop auto-collection and low stock alerts
            if (this.isShop(building.type)) {
                // Auto-collection (only if enabled)
                if (this.autoCollectionEnabled) {
                    // Initialize auto-collection tracking
                    if (!building.lastAutoCollectionTime) {
                        building.lastAutoCollectionTime = this.gameTime;
                    }

                    // Auto-collect shop income every $100 or every 5 game minutes (minimum $10 to avoid spam)
                    const autoCollectThreshold = 100;
                    const autoCollectInterval = 5;
                    const minimumCollectionAmount = 10; // Don't collect less than $10
                    const minutesSinceLastCollection = this.gameTime - building.lastAutoCollectionTime;

                    if (building.accumulatedIncome >= autoCollectThreshold ||
                        (building.accumulatedIncome >= minimumCollectionAmount && minutesSinceLastCollection >= autoCollectInterval)) {
                        const collectedAmount = Math.floor(building.accumulatedIncome);
                        this.money += collectedAmount;
                        this.money = Math.round(this.money);
                        building.accumulatedIncome = 0;
                        building.lastAutoCollectionTime = this.gameTime;

                        const shopName = buildingType.name || building.type;
                        this.uiManager.addNotification(`💰 Auto-collected $${collectedAmount} from ${shopName}`);
                        this.uiManager.updateMoneyUI();

                        // Hide income indicator
                        if (building.incomeIndicator) {
                            building.incomeIndicator.setVisible(false);
                        }
                    }
                }

                // Low stock alert system
                if (building.inventory && building.inventory.stock <= 10 && building.inventory.stock > 0) {
                    // Track if we've already alerted for this stock level
                    if (!building.lowStockAlerted || building.lastAlertStock !== building.inventory.stock) {
                        const shopName = buildingType.name || building.type;
                        this.uiManager.addNotification(`⚠️ ${shopName} is LOW ON STOCK! (${building.inventory.stock} remaining)`);
                        building.lowStockAlerted = true;
                        building.lastAlertStock = building.inventory.stock;

                        // Show popup warning
                        this.showLowStockPopup(building, shopName);
                    }
                } else if (building.inventory && building.inventory.stock > 10) {
                    // Reset alert flag when stock is replenished
                    building.lowStockAlerted = false;
                    building.lastAlertStock = null;
                }
            }

            // Shop employee wage payment (daily)
            if (this.isShop(building.type) && building.hasEmployee && building.dailyWage > 0) {
                const currentDay = Math.floor(this.gameTime / (24 * 60)); // Current day number
                const lastDay = Math.floor((building.lastWageCheck || 0) / (24 * 60));

                // Check if we've crossed into a new day
                if (currentDay > lastDay) {
                    // New day has started! Pay employee wage
                    this.money -= building.dailyWage;
                    this.money = Math.round(this.money);
                    console.log(`💵 Paid $${building.dailyWage} wage to shop employee. Day #${currentDay}`);
                    this.uiManager.addNotification(`💵 Shop wages: -$${building.dailyWage}`);

                    building.lastWageCheck = this.gameTime;

                    // Update money UI
                    this.uiManager.updateMoneyUI();

                    // Update shop UI if player is viewing this shop
                    if (this.insideShop && this.currentShop === building) {
                        this.shopSystem.updateShopInventoryUI();
                    }
                }
            }

            // Hotel auto-collection
            if (building.type === 'hotel' && this.autoCollectionEnabled) {
                // Initialize auto-collection tracking
                if (!building.lastAutoCollectionTime) {
                    building.lastAutoCollectionTime = this.gameTime;
                }

                // Auto-collect hotel income every $150 or every 5 game minutes (minimum $50 to avoid spam)
                const autoCollectThreshold = 150;
                const autoCollectInterval = 5;
                const minimumCollectionAmount = 50; // Don't collect less than $50
                const minutesSinceLastCollection = this.gameTime - building.lastAutoCollectionTime;

                if (building.accumulatedIncome >= autoCollectThreshold ||
                    (building.accumulatedIncome >= minimumCollectionAmount && minutesSinceLastCollection >= autoCollectInterval)) {
                    const collectedAmount = Math.floor(building.accumulatedIncome);
                    this.money += collectedAmount;
                    this.money = Math.round(this.money);
                    building.accumulatedIncome = 0;
                    building.lastAutoCollectionTime = this.gameTime;

                    const hotelName = buildingType.name || 'Hotel';
                    this.uiManager.addNotification(`💰 Auto-collected $${collectedAmount} from ${hotelName}`);
                    this.uiManager.updateMoneyUI();

                    // Hide income indicator
                    if (building.incomeIndicator) {
                        building.incomeIndicator.setVisible(false);
                    }
                }
            }

            // Entertainment and service building auto-collection (arcade, library, museum, theme park, movie theater)
            if ((this.isEntertainment(building.type) || this.isService(building.type)) && this.autoCollectionEnabled) {
                // Initialize auto-collection tracking
                if (!building.lastAutoCollectionTime) {
                    building.lastAutoCollectionTime = this.gameTime;
                }

                // Auto-collect income every $50 or every 5 game minutes (minimum $10 to avoid spam)
                const autoCollectThreshold = 50;
                const autoCollectInterval = 5;
                const minimumCollectionAmount = 10; // Don't collect less than $10
                const minutesSinceLastCollection = this.gameTime - building.lastAutoCollectionTime;

                if (building.accumulatedIncome >= autoCollectThreshold ||
                    (building.accumulatedIncome >= minimumCollectionAmount && minutesSinceLastCollection >= autoCollectInterval)) {
                    const collectedAmount = Math.floor(building.accumulatedIncome);
                    this.money += collectedAmount;
                    this.money = Math.round(this.money);
                    building.accumulatedIncome = 0;
                    building.lastAutoCollectionTime = this.gameTime;

                    const buildingName = buildingType.name || building.type;
                    this.uiManager.addNotification(`💰 Auto-collected $${collectedAmount} from ${buildingName}`);
                    this.uiManager.updateMoneyUI();

                    // Hide income indicator
                    if (building.incomeIndicator) {
                        building.incomeIndicator.setVisible(false);
                    }
                }
            }

            // Hotel employee wage payment and auto-clean (daily)
            if (building.type === 'hotel' && building.hasEmployee && building.dailyWage > 0 && building.rooms) {
                const currentDay = Math.floor(this.gameTime / (24 * 60)); // Current day number
                const lastWageDay = Math.floor((building.lastWageCheck || 0) / (24 * 60));
                const lastCleanDay = Math.floor((building.lastAutoClean || 0) / (24 * 60));

                // Pay wage at start of new day
                if (currentDay > lastWageDay) {
                    this.money -= building.dailyWage;
                    this.money = Math.round(this.money);
                    console.log(`💵 Paid $${building.dailyWage} wage to hotel employee. Day #${currentDay}`);
                    this.uiManager.addNotification(`💵 Hotel wages: -$${building.dailyWage}`);
                    building.lastWageCheck = this.gameTime;
                    this.uiManager.updateMoneyUI();

                    // Update hotel UI if player is viewing this hotel
                    if (this.insideHotel && this.currentHotel === building) {
                        this.hotelSystem.updateHotelUI();
                    }
                }

                // Auto-clean one dirty room per day
                if (currentDay > lastCleanDay) {
                    // Find first dirty room
                    const dirtyRoom = building.rooms.find(room => room.status === 'dirty');
                    if (dirtyRoom) {
                        dirtyRoom.status = 'clean';
                        console.log(`🧹 Hotel employee auto-cleaned a room. Day #${currentDay}`);

                        // Update hotel UI if player is viewing this hotel
                        if (this.insideHotel && this.currentHotel === building) {
                            this.hotelSystem.updateHotelUI();
                        }
                    }
                    building.lastAutoClean = this.gameTime;
                }
            }

            // Hotel maid wage payment and progressive cleaning
            if (building.type === 'hotel' && building.hasMaid && building.maidDailyWage > 0 && building.rooms) {
                const currentDay = Math.floor(this.gameTime / (24 * 60)); // Current day number
                const lastMaidWageDay = Math.floor((building.lastMaidWageCheck || 0) / (24 * 60));

                // Pay maid wage at start of new day
                if (currentDay > lastMaidWageDay) {
                    this.money -= building.maidDailyWage;
                    this.money = Math.round(this.money);
                    console.log(`💵 Paid $${building.maidDailyWage} wage to hotel maid. Day #${currentDay}`);
                    this.uiManager.addNotification(`💵 Maid wages: -$${building.maidDailyWage}`);
                    building.lastMaidWageCheck = this.gameTime;
                    this.uiManager.updateMoneyUI();

                    // Update hotel UI if player is viewing this hotel
                    if (this.insideHotel && this.currentHotel === building) {
                        this.hotelSystem.updateHotelUI();
                    }
                }

                // Maid now cleans rooms immediately when guests check out (see checkout logic above)
                // No need for time-interval cleaning anymore!
            }

            // Restaurant auto-collection
            if (this.isRestaurant(building.type) && this.autoCollectionEnabled) {
                // Initialize auto-collection tracking
                if (!building.lastAutoCollectionTime) {
                    building.lastAutoCollectionTime = this.gameTime;
                }

                // Auto-collect restaurant income every $100 or every 5 game minutes (minimum $15 to avoid spam)
                const autoCollectThreshold = 100;
                const autoCollectInterval = 5;
                const minimumCollectionAmount = 15; // Don't collect less than $15
                const minutesSinceLastCollection = this.gameTime - building.lastAutoCollectionTime;

                if (building.accumulatedIncome >= autoCollectThreshold ||
                    (building.accumulatedIncome >= minimumCollectionAmount && minutesSinceLastCollection >= autoCollectInterval)) {
                    const collectedAmount = Math.floor(building.accumulatedIncome);
                    this.money += collectedAmount;
                    this.money = Math.round(this.money);
                    building.accumulatedIncome = 0;
                    building.lastAutoCollectionTime = this.gameTime;

                    const restaurantName = buildingType.name || building.type;
                    this.uiManager.addNotification(`💰 Auto-collected $${collectedAmount} from ${restaurantName}`);
                    this.uiManager.updateMoneyUI();

                    // Hide income indicator
                    if (building.incomeIndicator) {
                        building.incomeIndicator.setVisible(false);
                    }
                }
            }

            // Restaurant waiter wage payment
            if (this.isRestaurant(building.type) && building.tables) {
                const currentDay = Math.floor(this.gameTime / (24 * 60)); // Current day number
                const lastWageDay = Math.floor((building.lastWageCheck || 0) / (24 * 60));

                // Pay wages at start of new day
                if (currentDay > lastWageDay) {
                    let totalWages = 0;

                    if (building.hasDayWaiter && building.dayWaiterWage > 0) {
                        this.money -= building.dayWaiterWage;
                        this.money = Math.round(this.money);
                        totalWages += building.dayWaiterWage;
                        console.log(`💵 Paid $${building.dayWaiterWage} wage to day waiter. Day #${currentDay}`);
                    }

                    if (building.hasNightWaiter && building.nightWaiterWage > 0) {
                        this.money -= building.nightWaiterWage;
                        this.money = Math.round(this.money);
                        totalWages += building.nightWaiterWage;
                        console.log(`💵 Paid $${building.nightWaiterWage} wage to night waiter. Day #${currentDay}`);
                    }

                    if (totalWages > 0) {
                        this.uiManager.addNotification(`💵 Restaurant wages: -$${totalWages}`);
                        building.lastWageCheck = this.gameTime;
                        this.uiManager.updateMoneyUI();

                        // Update restaurant UI if player is viewing this restaurant
                        if (this.insideRestaurant && this.currentRestaurant === building) {
                            this.restaurantSystem.updateRestaurantUI();
                        }
                    }
                }
            }

            // Shop opening hours (7am-9pm if has employee)
            if (this.isShop(building.type) && building.hasEmployee) {
                const totalMinutes = Math.floor(this.gameTime);
                const hour = Math.floor((totalMinutes % (24 * 60)) / 60);

                // Shop is open from 7am (hour 7) to 9pm (hour 21)
                const shouldBeOpen = hour >= 7 && hour < 21;

                // Update shop status
                if (building.isOpen !== shouldBeOpen) {
                    building.isOpen = shouldBeOpen;

                    // Update shop UI if player is viewing this shop
                    if (this.insideShop && this.currentShop === building) {
                        this.shopSystem.updateShopInventoryUI();
                    }
                }
            }

            // Restaurant waiter cleaning (clean dirty tables when on duty)
            if (this.isRestaurant(building.type) && building.tables) {
                const totalMinutes = Math.floor(this.gameTime);
                const hour = Math.floor((totalMinutes % (24 * 60)) / 60);
                const isDayTime = hour >= 6 && hour < 20; // 6am-8pm is day shift

                // Check if appropriate waiter is on duty
                const waiterOnDuty = (isDayTime && building.hasDayWaiter) || (!isDayTime && building.hasNightWaiter);

                if (waiterOnDuty) {
                    // Clean dirty tables (one at a time, periodically)
                    const dirtyTables = building.tables.filter(t => t.status === 'dirty');
                    if (dirtyTables.length > 0) {
                        // Initialize last clean time if not set
                        if (!building.lastTableClean) {
                            building.lastTableClean = this.gameTime;
                        }

                        const timeSinceLastClean = this.gameTime - building.lastTableClean;
                        const cleaningInterval = 5; // Clean one table every 5 game minutes

                        if (timeSinceLastClean >= cleaningInterval) {
                            // Clean the first dirty table
                            dirtyTables[0].status = 'available';
                            building.lastTableClean = this.gameTime;
                            console.log(`🧹 Waiter cleaned a table. ${dirtyTables.length - 1} dirty tables remaining.`);

                            // Update UI if player is viewing this restaurant
                            if (this.insideRestaurant && this.currentRestaurant === building) {
                                this.restaurantSystem.updateRestaurantUI();
                            }
                        }
                    }
                }
            }
            } catch (error) {
                console.error('Error processing building:', building.type, 'at', building.x, error);
                console.error('Error stack:', error.stack);
                // Continue to next building
            }
        }

        // Apply daily savings interest if there's money in the bank
        if (this.bankBalance > 0 && !this.isPaused) {
            const currentDay = Math.floor(this.gameTime / (24 * 60)); // Current day number
            const lastInterestDay = Math.floor(this.lastInterestPayment / (24 * 60));

            // Check if we've crossed into a new day
            if (currentDay > lastInterestDay) {
                // Calculate daily interest (5% annual = 0.0137% daily)
                const dailyRate = this.savingsInterestRate / 365;
                const interestEarned = Math.max(1, Math.round(this.bankBalance * dailyRate)); // Minimum $1/day

                this.bankBalance += interestEarned;
                this.bankBalance = Math.round(this.bankBalance);
                console.log(`💰 Bank paid $${interestEarned} interest on savings! Day #${currentDay}. New balance: $${this.bankBalance}`);
                this.uiManager.addNotification(`💰 Bank interest: +$${interestEarned}`);

                this.lastInterestPayment = this.gameTime;
            }
        }

        // Collect daily property taxes
        if (!this.isPaused && this.buildings.length > 0) {
            const currentDay = Math.floor(this.gameTime / (24 * 60)); // Current day number
            const lastTaxDay = Math.floor(this.lastTaxCollection / (24 * 60));

            // Check if we've crossed into a new day
            if (currentDay > lastTaxDay) {
                let totalTax = 0;
                let totalMaintenance = 0;

                // Calculate tax and maintenance for each building
                for (let building of this.buildings) {
                    const buildingType = this.buildingTypes[building.type];
                    if (buildingType && buildingType.cost) {
                        const buildingTax = Math.floor(buildingType.cost * this.propertyTaxRate);
                        totalTax += buildingTax;
                    }

                    // Check for maintenance costs (emergency services, schools, etc.)
                    if (buildingType && buildingType.maintenanceCost) {
                        totalMaintenance += buildingType.maintenanceCost;
                    }
                }

                // Deduct property taxes
                if (totalTax > 0) {
                    this.money -= totalTax;
                    this.money = Math.round(this.money);
                    console.log(`🏛️ Property taxes collected: $${totalTax} for ${this.buildings.length} properties. Day #${currentDay}`);
                    this.uiManager.addNotification(`🏛️ Property tax: -$${totalTax}`);
                }

                // Deduct maintenance costs
                if (totalMaintenance > 0) {
                    this.money -= totalMaintenance;
                    this.money = Math.round(this.money);
                    console.log(`🔧 Daily maintenance: $${totalMaintenance}. Day #${currentDay}`);
                    this.uiManager.addNotification(`🔧 Maintenance: -$${totalMaintenance}`);
                }

                // Show popup if there are any expenses
                if (totalTax > 0 || totalMaintenance > 0) {
                    this.uiManager.showTaxCollectionPopup(totalTax, totalMaintenance);
                }

                this.lastTaxCollection = this.gameTime;
            }
        }

        // Update resource UI
        this.uiManager.updateMoneyUI();

        // Update building tooltips (show info on hover)
        if (!this.buildMode && !this.deleteMode) {
            const pointer = this.input.activePointer;
            const worldX = pointer.x + this.cameras.main.scrollX;
            const worldY = pointer.y + this.cameras.main.scrollY;

            let hoveredBuilding = null;
            for (let building of this.buildings) {
                const buildingType = this.buildingTypes[building.type];
                if (!buildingType) continue;

                const width = buildingType.width || 100;
                const height = buildingType.height || 100;

                if (worldX >= building.x && worldX <= building.x + width &&
                    worldY >= building.y && worldY <= building.y + height) {
                    hoveredBuilding = building;
                    break;
                }
            }

            if (hoveredBuilding) {
                this.uiManager.showBuildingTooltip(hoveredBuilding, pointer.x, pointer.y);
            } else {
                this.uiManager.hideBuildingTooltip();
            }
        } else {
            this.uiManager.hideBuildingTooltip();
        }

        // Update buses
        if (!this.isPaused) {
            try {
                this.updateBuses();
            } catch (error) {
                console.error('Error updating buses:', error);
            }
        }

        // Update event system (parades, festivals)
        if (!this.isPaused) {
            try {
                const deltaTime = 1/60; // Approximate frame time
                this.eventSystem.update(deltaTime);
                this.resourceBuildingSystem.update(deltaTime);
            } catch (error) {
                console.error('Error updating events:', error);
            }
        }

        // Update school system
        if (!this.isPaused) {
            try {
                this.schoolSystem.update();
            } catch (error) {
                console.error('Error updating school system:', error);
            }
        }

        // Check missions (every few seconds)
        if (!this.isPaused && this.missionSystem) {
            if (!this.lastMissionCheck) this.lastMissionCheck = Date.now();
            const now = Date.now();
            if (now - this.lastMissionCheck >= 3000) { // Check every 3 seconds
                this.missionSystem.checkMissions();
                this.lastMissionCheck = now;
            }
        }

        // Update emergency vehicle system
        if (!this.isPaused) {
            try {
                this.emergencyVehicleSystem.update();
            } catch (error) {
                console.error('Error updating emergency vehicle system:', error);
            }
        }

        // Update train system
        if (!this.isPaused) {
            try {
                this.trainSystem.update();
            } catch (error) {
                console.error('Error updating train system:', error);
            }
        }

        // Check milestones for automatic upgrade prompts
        if (!this.isPaused && this.gameTime % 60 === 0) { // Check every 60 game ticks
            try {
                if (this.fireStationSystem) {
                    this.fireStationSystem.checkMilestones();
                }
                if (this.policeStationSystem) {
                    this.policeStationSystem.checkMilestones();
                }
                if (this.trainSystem) {
                    this.trainSystem.checkMilestones();
                }
                if (this.schoolSystem) {
                    this.schoolSystem.checkMilestones();
                }
                if (this.librarySystem) {
                    this.librarySystem.checkMilestones();
                }
                if (this.museumSystem) {
                    this.museumSystem.checkMilestones();
                }
                if (this.hospitalSystem) {
                    this.hospitalSystem.checkMilestones();
                }
                if (this.entertainmentSystem) {
                    this.entertainmentSystem.checkMilestones();
                }
            } catch (error) {
                console.error('Error checking milestones:', error);
            }
        }

        // Update citizens
        if (!this.isPaused) {
            try {
                this.citizenSystem.updateCitizens();
            } catch (error) {
                console.error('Error updating citizens:', error);
            }

            // Spawn pending citizens gradually (one every 5 seconds)
            if (this.pendingCitizens > 0) {
                const now = Date.now();
                if (now - this.lastCitizenSpawnTime >= 5000) {
                    this.citizenSystem.spawnNewCitizen();
                    this.pendingCitizens--;
                    this.population++;
                    this.lastCitizenSpawnTime = now;
                    this.uiManager.updateMoneyUI();
                    console.log(`👤 New citizen arrived! Population: ${this.population}/${this.populationCapacity}`);
                }
            }
        }

        // Restart is now controlled via settings menu (mouse clicks)

        // Delete confirmation is now handled by clickable buttons

        // Pause and travel are now controlled via settings menu (mouse clicks)

        // Handle tax collection popup
        if (this.taxPopupShowing) {
            if (Phaser.Input.Keyboard.JustDown(this.enterKey) || Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
                this.uiManager.closeTaxCollectionPopup();
            }
            // Return early to prevent other inputs while popup is showing
            return;
        }

        // Toggle delete mode
        if (Phaser.Input.Keyboard.JustDown(this.xKey) && !this.restartConfirmShowing && !this.deleteConfirmShowing) {
            this.deleteMode = !this.deleteMode;
            this.buildMode = false;  // Exit build mode if entering delete mode
            if (!this.deleteMode) {
                this.selectedBuilding = null;
                if (this.buildingPreview) {
                    this.buildingPreview.destroy();
                    this.buildingPreview = null;
                }
            }
        }

        // Toggle build mode with B key
        if (Phaser.Input.Keyboard.JustDown(this.bKey) && !this.insideShop && !this.insideHotel && !this.insideRestaurant && !this.insideApartment && !this.schoolSystem.insideSchool && !this.bankMenuOpen && !this.restartConfirmShowing && !this.deleteConfirmShowing && !this.buildConfirmShowing) {
            this.buildMode = !this.buildMode;
            this.deleteMode = false;  // Exit delete mode if entering build mode
            this.buildMenuContainer.setVisible(this.buildMode);

            if (!this.buildMode) {
                this.selectedBuilding = null;
                if (this.buildingPreview) {
                    this.buildingPreview.destroy();
                    this.buildingPreview = null;
                }
            }
        }

        // Toggle bird's eye view with V key
        if (Phaser.Input.Keyboard.JustDown(this.vKey)) {
            try {
                this.birdsEyeView = !this.birdsEyeView;
                console.log('Toggling bird\'s eye view:', this.birdsEyeView);

                if (this.birdsEyeView) {
                    // Enable bird's eye view - zoom out
                    this.cameras.main.stopFollow();
                    this.cameras.main.setZoom(this.birdsEyeZoom);

                    // Center camera horizontally on player's current location
                    const newScrollX = this.player.x - (this.gameWidth / this.birdsEyeZoom / 2);
                    this.cameras.main.scrollX = newScrollX;

                    // Center camera vertically to show all unlocked streets
                    // Calculate the vertical span of all unlocked streets
                    const topStreetY = this.gameHeight - 50 - ((this.unlockedStreets - 1) * this.streetSpacing);
                    const bottomStreetY = this.gameHeight - 50;
                    const streetSpan = bottomStreetY - topStreetY;
                    const centerY = (topStreetY + bottomStreetY) / 2;

                    // Set scrollY to center on all streets
                    this.cameras.main.scrollY = centerY - (this.gameHeight / this.birdsEyeZoom / 2);

                    // Hide background layers (mountains, clouds, stars - confusing in bird's eye view)
                    try {
                        if (this.skyGraphics) this.skyGraphics.setVisible(false);
                        if (this.celestialBody) this.celestialBody.setVisible(false);
                        if (this.mountainGraphics) this.mountainGraphics.setVisible(false);
                        if (this.cityGraphics) this.cityGraphics.setVisible(false);
                        if (this.clouds) {
                            this.clouds.forEach(cloud => cloud.setVisible(false));
                        }
                        if (this.stars) {
                            this.stars.forEach(star => star.setVisible(false));
                        }
                    } catch (bgError) {
                        console.warn('Error hiding backgrounds:', bgError);
                    }

                    if (this.uiManager) {
                        this.uiManager.addNotification('📐 Bird\'s Eye View - Use arrows to pan, V to exit');
                    }
                } else {
                    // Return to normal view
                    this.cameras.main.setZoom(this.normalZoom);
                    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

                    // Show background layers again
                    try {
                        if (this.skyGraphics) this.skyGraphics.setVisible(true);
                        if (this.celestialBody) this.celestialBody.setVisible(true);
                        if (this.mountainGraphics) this.mountainGraphics.setVisible(true);
                        if (this.cityGraphics) this.cityGraphics.setVisible(true);
                        if (this.clouds) {
                            this.clouds.forEach(cloud => cloud.setVisible(true));
                        }
                        if (this.stars) {
                            this.stars.forEach(star => {
                                // Stars only visible at night
                                const hour = Math.floor((this.gameTime % (24 * 60)) / 60);
                                star.setVisible(hour < 6 || hour >= 20);
                            });
                        }
                    } catch (bgError) {
                        console.warn('Error showing backgrounds:', bgError);
                    }

                    if (this.uiManager) {
                        this.uiManager.addNotification('👤 Street View ON');
                    }
                }
            } catch (error) {
                console.error('Error toggling bird\'s eye view:', error);
                this.birdsEyeView = false;
                this.cameras.main.setZoom(this.normalZoom);
                this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
            }
        }

        // Camera panning in bird's eye view
        if (this.birdsEyeView) {
            const panSpeed = 15;

            // Horizontal panning
            if (this.cursors.left.isDown || this.aKey.isDown) {
                this.cameras.main.scrollX -= panSpeed;
            }
            if (this.cursors.right.isDown || this.dKey.isDown) {
                this.cameras.main.scrollX += panSpeed;
            }

            // Vertical panning (to navigate between streets)
            if (this.cursors.up.isDown || this.wKey.isDown) {
                this.cameras.main.scrollY -= panSpeed;
            }
            if (this.cursors.down.isDown || this.sKey.isDown) {
                this.cameras.main.scrollY += panSpeed;
            }

            // Keep camera within bounds
            this.cameras.main.scrollX = Phaser.Math.Clamp(this.cameras.main.scrollX, 0, 12000 - this.gameWidth / this.birdsEyeZoom);

            // Vertical bounds based on unlocked streets
            const topStreetY = this.gameHeight - 50 - ((this.unlockedStreets - 1) * this.streetSpacing);
            const minScrollY = topStreetY - 200; // Extra padding above top street
            const maxScrollY = this.gameHeight - (this.gameHeight / this.birdsEyeZoom) + 100; // Extra padding below bottom street
            this.cameras.main.scrollY = Phaser.Math.Clamp(this.cameras.main.scrollY, minScrollY, maxScrollY);
        }


        // Start holiday parade with P key (for testing/fun)
        if (Phaser.Input.Keyboard.JustDown(this.pKey) && !this.insideShop && !this.insideHotel && !this.insideRestaurant && !this.insideApartment && !this.schoolSystem.insideSchool && !this.bankMenuOpen) {
            // Only start parade if no event is active
            if (!this.eventSystem.activeEvent) {
                this.eventSystem.startHolidayParade();
            } else {
                this.uiManager.addNotification('An event is already in progress!');
            }
        }

        // Build mode can also be controlled via clickable menu at bottom of screen
        // Update building preview if in build mode (freeze position during confirmation but keep visible)
        if (this.buildMode) {
            if (!this.buildConfirmShowing) {
                this.updateBuildingPreview();
            }
            // Keep preview visible even during confirmation so user can see where it will be placed
        } else {
            // Clear preview when exiting build mode
            if (this.buildingPreview) {
                this.buildingPreview.destroy();
                this.buildingPreview = null;
            }
        }

        // Update delete mode UI
        if (this.deleteMode) {
            this.demolishUI.setVisible(true);
        } else {
            this.demolishUI.setVisible(false);
        }

        // Delete mode click detection is now handled in the pointerdown event listener above
        // (removed old polling-based code that didn't work)


        // Check if player is near a bank
        // Find the CLOSEST one, not just the first one
        this.nearBank = null;
        let closestBankDistance = 250;
        for (let building of this.buildings) {
            if (building.type === 'bank' && building.streetNumber === this.currentStreet) {
                const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, building.x, building.y);
                if (distance < closestBankDistance) {
                    this.nearBank = building;
                    closestBankDistance = distance;
                }
            }
        }

        // Bank interaction
        if (this.nearBank && !this.bankMenuOpen && !this.buildMode && !this.restartConfirmShowing) {
            // Show prompt above the bank building
            const bankType = this.buildingTypes[this.nearBank.type];
            if (!this.bankPrompt) {
                this.bankPrompt = this.add.text(this.nearBank.x, this.nearBank.y - bankType.height - 100, 'Press E to use Bank', {
                    fontSize: '12px',
                    color: '#ffffff',
                    backgroundColor: '#2E7D32',
                    padding: { x: 5, y: 3 }
                }).setOrigin(0.5);
            } else {
                this.bankPrompt.x = this.nearBank.x;
                this.bankPrompt.y = this.nearBank.y - bankType.height - 100;
                this.bankPrompt.setVisible(true);
            }

            // Open bank menu
            if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
                this.openBankMenu();
            }
        } else {
            if (this.bankPrompt) {
                this.bankPrompt.setVisible(false);
            }
        }

        // Check if player is near a shop (only when NOT inside a building)
        if (!this.insideShop && !this.insideHotel && !this.insideRestaurant && !this.insideApartment) {
            this.nearShop = null;
            let closestShopDistance = 150;
            for (let building of this.buildings) {
                if (this.isShop(building.type) && building.streetNumber === this.currentStreet) {
                    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, building.x, building.y);
                    if (distance < closestShopDistance) {
                        this.nearShop = building;
                        closestShopDistance = distance;
                    }
                }
            }

            // Shop interaction - Enter shop
            if (this.nearShop && !this.buildMode && !this.deleteMode && !this.bankMenuOpen && !this.mailboxMenuOpen) {
                // Show prompt above the shop building
                const shopType = this.buildingTypes[this.nearShop.type];
                if (!this.shopPrompt) {
                    this.shopPrompt = this.add.text(this.nearShop.x, this.nearShop.y - shopType.height - 180, 'Press E to enter Shop', {
                        fontSize: '12px',
                        color: '#ffffff',
                        backgroundColor: '#4ECDC4',
                        padding: { x: 5, y: 3 }
                    }).setOrigin(0.5).setDepth(1000);
                } else {
                    this.shopPrompt.x = this.nearShop.x;
                    this.shopPrompt.y = this.nearShop.y - shopType.height - 180;
                    this.shopPrompt.setVisible(true);
                }

                // Enter shop
                if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
                    this.shopSystem.enterShop(this.nearShop);
                }
            } else {
                if (this.shopPrompt) {
                    this.shopPrompt.setVisible(false);
                }
            }
        }

        // Check if player is near a hotel (only when NOT inside a building)
        if (!this.insideHotel && !this.insideShop && !this.insideRestaurant && !this.insideApartment) {
            this.nearHotel = null;
            let closestHotelDistance = 150;
            for (let building of this.buildings) {
                if (building.type === 'hotel' && building.streetNumber === this.currentStreet) {
                    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, building.x, building.y);
                    if (distance < closestHotelDistance) {
                        this.nearHotel = building;
                        closestHotelDistance = distance;
                    }
                }
            }

            // Hotel interaction - Enter hotel
            if (this.nearHotel && !this.buildMode && !this.deleteMode && !this.bankMenuOpen && !this.mailboxMenuOpen) {
                // Show prompt above the hotel building
                const hotelType = this.buildingTypes[this.nearHotel.type];
                if (!this.hotelPrompt) {
                    this.hotelPrompt = this.add.text(this.nearHotel.x, this.nearHotel.y - hotelType.height - 180, 'Press E to enter Hotel', {
                        fontSize: '12px',
                        color: '#ffffff',
                        backgroundColor: '#9C27B0',
                        padding: { x: 5, y: 3 }
                    }).setOrigin(0.5).setDepth(1000);
                } else {
                    this.hotelPrompt.x = this.nearHotel.x;
                    this.hotelPrompt.y = this.nearHotel.y - hotelType.height - 100;
                    this.hotelPrompt.setVisible(true);
                }

                // Enter hotel
                if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
                    this.hotelSystem.enterHotel(this.nearHotel);
                }
            } else {
                if (this.hotelPrompt) {
                    this.hotelPrompt.setVisible(false);
                }
            }
        }

        // Check if player is near a restaurant (only when NOT inside a building)
        if (!this.insideRestaurant && !this.insideHotel && !this.insideShop && !this.insideApartment) {
            this.nearRestaurant = null;
            let closestRestaurantDistance = 150;
            for (let building of this.buildings) {
                if (this.isRestaurant(building.type) && building.streetNumber === this.currentStreet) {
                    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, building.x, building.y);
                    if (distance < closestRestaurantDistance) {
                        this.nearRestaurant = building;
                        closestRestaurantDistance = distance;
                    }
                }
            }

            // Restaurant interaction - Enter restaurant
            if (this.nearRestaurant && !this.buildMode && !this.deleteMode && !this.bankMenuOpen && !this.mailboxMenuOpen) {
                // Show prompt above the restaurant building
                const restaurantType = this.buildingTypes[this.nearRestaurant.type];
                if (!this.restaurantPrompt) {
                    this.restaurantPrompt = this.add.text(this.nearRestaurant.x, this.nearRestaurant.y - restaurantType.height - 180, 'Press E to enter Restaurant', {
                        fontSize: '12px',
                        color: '#ffffff',
                        backgroundColor: '#FFE66D',
                        padding: { x: 5, y: 3 }
                    }).setOrigin(0.5).setDepth(1000);
                } else {
                    this.restaurantPrompt.x = this.nearRestaurant.x;
                    this.restaurantPrompt.y = this.nearRestaurant.y - restaurantType.height - 100;
                    this.restaurantPrompt.setVisible(true);
                }

                // Enter restaurant
                if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
                    this.restaurantSystem.enterRestaurant(this.nearRestaurant);
                }
            } else {
                if (this.restaurantPrompt) {
                    this.restaurantPrompt.setVisible(false);
                }
            }
        }

        // Check if player is near a school (only when NOT inside a building)
        if (!this.insideShop && !this.insideHotel && !this.insideRestaurant && !this.insideApartment && !this.schoolSystem.insideSchool) {
            let nearSchool = null;
            let closestSchoolDistance = 150;
            for (let building of this.buildings) {
                if (building.type === 'school' && building.streetNumber === this.currentStreet) {
                    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, building.x, building.y);
                    if (distance < closestSchoolDistance) {
                        nearSchool = building;
                        closestSchoolDistance = distance;
                    }
                }
            }

            // School interaction - Enter school
            if (nearSchool && !this.buildMode && !this.deleteMode && !this.bankMenuOpen && !this.mailboxMenuOpen) {
                // Initialize school data if not already done
                if (!nearSchool.schoolData) {
                    this.schoolSystem.initializeSchool(nearSchool);
                }

                // Show prompt above the school building
                const schoolType = this.buildingTypes[nearSchool.type];
                if (!this.schoolPrompt) {
                    this.schoolPrompt = this.add.text(nearSchool.x, nearSchool.y - schoolType.height - 180, 'Press E to enter School', {
                        fontSize: '12px',
                        color: '#ffffff',
                        backgroundColor: '#FFC107',
                        padding: { x: 5, y: 3 }
                    }).setOrigin(0.5).setDepth(1000);
                } else {
                    this.schoolPrompt.x = nearSchool.x;
                    this.schoolPrompt.y = nearSchool.y - schoolType.height - 100;
                    this.schoolPrompt.setVisible(true);
                }

                // Enter school
                if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
                    this.schoolSystem.enterSchool(nearSchool);
                }
            } else {
                if (this.schoolPrompt) {
                    this.schoolPrompt.setVisible(false);
                }
            }

            // Subway station interaction - Travel to other streets
            let nearSubwayStation = null;
            let closestSubwayDistance = 150;
            for (let building of this.buildings) {
                if (building.type === 'subwayStation' && building.streetNumber === this.currentStreet) {
                    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, building.x, building.y);
                    if (distance < closestSubwayDistance) {
                        nearSubwayStation = building;
                        closestSubwayDistance = distance;
                    }
                }
            }

            if (nearSubwayStation && !this.buildMode && !this.deleteMode && !this.bankMenuOpen && !this.mailboxMenuOpen) {
                // Show prompt above the subway station
                const stationType = this.buildingTypes[nearSubwayStation.type];
                if (!this.subwayPrompt) {
                    this.subwayPrompt = this.add.text(nearSubwayStation.x, nearSubwayStation.y - stationType.height - 100, 'Press E to Travel 🚇', {
                        fontSize: '12px',
                        color: '#ffffff',
                        backgroundColor: '#607D8B',
                        padding: { x: 5, y: 3 }
                    }).setOrigin(0.5).setDepth(1000);
                } else {
                    this.subwayPrompt.x = nearSubwayStation.x;
                    this.subwayPrompt.y = nearSubwayStation.y - stationType.height - 100;
                    this.subwayPrompt.setVisible(true);
                }

                // Open subway travel menu
                if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
                    this.openSubwayTravelMenu();
                }
            } else {
                if (this.subwayPrompt) {
                    this.subwayPrompt.setVisible(false);
                }
            }
        }

        // Check if player is near a fire station
        if (!this.insideShop && !this.insideHotel && !this.insideRestaurant && !this.insideApartment && !this.schoolSystem.insideSchool) {
            let nearFireStation = null;
            let closestFireStationDistance = 150;
            for (let building of this.buildings) {
                if (building.type === 'fireStation') {
                    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, building.x, building.y);
                    if (distance < closestFireStationDistance) {
                        nearFireStation = building;
                        closestFireStationDistance = distance;
                    }
                }
            }

            // Fire station prompt disabled - upgrades now automatic via milestones
            // if (nearFireStation && !this.buildMode && !this.deleteMode && !this.bankMenuOpen && !this.mailboxMenuOpen) {
            //     const buildingType = this.buildingTypes[nearFireStation.type];
            //     if (!this.fireStationPrompt) {
            //         this.fireStationPrompt = this.add.text(nearFireStation.x, nearFireStation.y - buildingType.height - 100, 'Press E to manage Fire Station', {
            //             fontSize: '12px',
            //             color: '#ffffff',
            //             backgroundColor: '#D32F2F',
            //             padding: { x: 5, y: 3 }
            //         }).setOrigin(0.5).setDepth(1000);
            //     } else {
            //         this.fireStationPrompt.x = nearFireStation.x;
            //         this.fireStationPrompt.y = nearFireStation.y - buildingType.height - 100;
            //         this.fireStationPrompt.setVisible(true);
            //     }

            //     // Fire station UI disabled - upgrades now automatic via milestones
            //     // if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
            //     //     this.fireStationSystem.showFireStationUI(nearFireStation);
            //     // }
            // } else {
            //     if (this.fireStationPrompt) {
            //         this.fireStationPrompt.setVisible(false);
            //     }
            // }
        }

        // Check if player is near a police station
        if (!this.insideShop && !this.insideHotel && !this.insideRestaurant && !this.insideApartment && !this.schoolSystem.insideSchool) {
            let nearPoliceStation = null;
            let closestPoliceStationDistance = 150;
            for (let building of this.buildings) {
                if (building.type === 'policeStation') {
                    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, building.x, building.y);
                    if (distance < closestPoliceStationDistance) {
                        nearPoliceStation = building;
                        closestPoliceStationDistance = distance;
                    }
                }
            }

            // Police station prompt disabled - upgrades now automatic via milestones
            // if (nearPoliceStation && !this.buildMode && !this.deleteMode && !this.bankMenuOpen && !this.mailboxMenuOpen) {
            //     const buildingType = this.buildingTypes[nearPoliceStation.type];
            //     if (!this.policeStationPrompt) {
            //         this.policeStationPrompt = this.add.text(nearPoliceStation.x, nearPoliceStation.y - buildingType.height - 100, 'Press E to manage Police Station', {
            //             fontSize: '12px',
            //             color: '#ffffff',
            //             backgroundColor: '#1976D2',
            //             padding: { x: 5, y: 3 }
            //         }).setOrigin(0.5).setDepth(1000);
            //     } else {
            //         this.policeStationPrompt.x = nearPoliceStation.x;
            //         this.policeStationPrompt.y = nearPoliceStation.y - buildingType.height - 100;
            //         this.policeStationPrompt.setVisible(true);
            //     }

            //     // Police station UI disabled - upgrades now automatic via milestones
            //     // if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
            //     //     this.policeStationSystem.showPoliceStationUI(nearPoliceStation);
            //     // }
            // } else {
            //     if (this.policeStationPrompt) {
            //         this.policeStationPrompt.setVisible(false);
            //     }
            // }
        }

        // Check if player is near a train station
        if (!this.insideShop && !this.insideHotel && !this.insideRestaurant && !this.insideApartment && !this.schoolSystem.insideSchool) {
            let nearTrainStation = null;
            let closestTrainStationDistance = 150;
            for (let building of this.buildings) {
                if (building.type === 'trainStation') {
                    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, building.x, building.y);
                    if (distance < closestTrainStationDistance) {
                        nearTrainStation = building;
                        closestTrainStationDistance = distance;
                    }
                }
            }

            // Train station prompt disabled - now just informational popups via milestones
            // if (nearTrainStation && !this.buildMode && !this.deleteMode && !this.bankMenuOpen && !this.mailboxMenuOpen) {
            //     const buildingType = this.buildingTypes[nearTrainStation.type];
            //     if (!this.trainStationPrompt) {
            //         this.trainStationPrompt = this.add.text(nearTrainStation.x, nearTrainStation.y - buildingType.height - 100, 'Press E to view Train Statistics', {
            //             fontSize: '12px',
            //             color: '#ffffff',
            //             backgroundColor: '#795548',
            //             padding: { x: 5, y: 3 }
            //         }).setOrigin(0.5).setDepth(1000);
            //     } else {
            //         this.trainStationPrompt.x = nearTrainStation.x;
            //         this.trainStationPrompt.y = nearTrainStation.y - buildingType.height - 100;
            //         this.trainStationPrompt.setVisible(true);
            //     }

            //     // Train station UI disabled - now just informational popups via milestones
            //     // if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
            //     //     this.showTrainStationUI(nearTrainStation);
            //     // }
            // } else {
            //     if (this.trainStationPrompt) {
            //         this.trainStationPrompt.setVisible(false);
            //     }
            // }
        }

        // Exit shop if inside
        if (this.insideShop) {
            if (Phaser.Input.Keyboard.JustDown(this.eKey) || this.input.keyboard.addKey('ESC').isDown) {
                this.shopSystem.exitShop();
            }
        }

        // Exit resource building if inside
        if (this.resourceBuildingSystem.insideBuilding) {
            if (Phaser.Input.Keyboard.JustDown(this.eKey) || this.input.keyboard.addKey('ESC').isDown) {
                this.resourceBuildingSystem.exitBuilding();
            }
        }

        // Exit hotel if inside
        if (this.insideHotel) {
            if (Phaser.Input.Keyboard.JustDown(this.eKey) || this.input.keyboard.addKey('ESC').isDown) {
                this.hotelSystem.exitHotel();
            }
        }

        // Exit restaurant if inside
        if (this.insideRestaurant) {
            if (Phaser.Input.Keyboard.JustDown(this.eKey) || this.input.keyboard.addKey('ESC').isDown) {
                this.restaurantSystem.exitRestaurant();
            }
        }

        // Exit school if inside
        if (this.schoolSystem.insideSchool) {
            if (Phaser.Input.Keyboard.JustDown(this.eKey) || this.input.keyboard.addKey('ESC').isDown) {
                this.schoolSystem.exitSchool();
            }
        }

        // Check if player is near an apartment building (only when NOT inside anything)
        if (!this.insideApartment && !this.insideShop && !this.insideHotel && !this.insideRestaurant) {
            this.nearApartment = null;
            let closestApartmentDistance = 150;
            for (let building of this.buildings) {
                if (building.type === 'apartment' && building.streetNumber === this.currentStreet) {
                    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, building.x, building.y);
                    if (distance < closestApartmentDistance) {
                        this.nearApartment = building;
                        closestApartmentDistance = distance;
                    }
                }
            }

            // Apartment interaction - View tenants (only if no rent to collect)
            if (this.nearApartment && !this.buildMode && !this.deleteMode && !this.bankMenuOpen && !this.nearIncomeBuilding) {
                // Calculate total rent available
                let totalRent = 0;
                if (this.nearApartment.units) {
                    for (let unit of this.nearApartment.units) {
                        if (unit.rented && unit.accumulatedIncome) {
                            totalRent += unit.accumulatedIncome;
                        }
                    }
                }

                // Only show "enter apartment" if there's no rent to collect
                if (totalRent < 1) {
                    const apartmentType = this.buildingTypes[this.nearApartment.type];
                    if (!this.apartmentPrompt) {
                        this.apartmentPrompt = this.add.text(this.nearApartment.x, this.nearApartment.y - apartmentType.height - 180, 'Press E to enter Apartment', {
                            fontSize: '12px',
                            color: '#ffffff',
                            backgroundColor: '#795548',
                            padding: { x: 5, y: 3 }
                        }).setOrigin(0.5).setDepth(1000);
                    } else {
                        this.apartmentPrompt.setText('Press E to enter Apartment');
                        this.apartmentPrompt.x = this.nearApartment.x;
                        this.apartmentPrompt.y = this.nearApartment.y - apartmentType.height - 100;
                        this.apartmentPrompt.setVisible(true);
                    }

                    // Enter apartment view
                    if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
                        this.enterApartment(this.nearApartment);
                    }
                } else {
                    // There's rent to collect, hide the view tenants prompt
                    if (this.apartmentPrompt) {
                        this.apartmentPrompt.setVisible(false);
                    }
                }
            } else {
                if (this.apartmentPrompt) {
                    this.apartmentPrompt.setVisible(false);
                }
            }
        }

        // Exit apartment if inside
        if (this.insideApartment) {
            if (Phaser.Input.Keyboard.JustDown(this.eKey) || this.input.keyboard.addKey('ESC').isDown) {
                this.exitApartment();
            }
        }

        // Update mailbox indicators - DISABLED (apartments now auto-fill)
        for (let mailbox of this.mailboxes) {
            if (mailbox.indicator) {
                mailbox.indicator.setVisible(false);
            }
        }

        // Check if player is near a mailbox
        this.nearMailbox = null;
        let closestMailboxDistance = 80;
        for (let mailbox of this.mailboxes) {
            const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, mailbox.x, mailbox.y);
            if (distance < closestMailboxDistance) {
                this.nearMailbox = mailbox;
                closestMailboxDistance = distance;
            }
        }

        // Mailbox interaction - DISABLED (apartments now auto-fill)
        // Mailboxes are still visible but not interactive
        if (this.mailboxPrompt) {
            this.mailboxPrompt.setVisible(false);
        }

        // Handle bank menu
        if (this.bankMenuOpen) {
            // Close bank menu
            if (Phaser.Input.Keyboard.JustDown(this.eKey) || Phaser.Input.Keyboard.JustDown(this.enterKey)) {
                this.closeBankMenu();
            }

            // Bank operations - prompt for custom amounts
            if (Phaser.Input.Keyboard.JustDown(this.key1)) {
                const amount = prompt('How much do you want to deposit?', '100');
                if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
                    this.depositMoney(parseFloat(amount));
                }
            }
            if (Phaser.Input.Keyboard.JustDown(this.key2)) {
                const amount = prompt('How much do you want to withdraw?', '100');
                if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
                    this.withdrawMoney(parseFloat(amount));
                }
            }
            if (Phaser.Input.Keyboard.JustDown(this.key3)) {
                const amount = prompt('How much do you want to borrow? (10% interest)', '500');
                if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
                    this.borrowMoney(parseFloat(amount));
                }
            }
        }

        // Handle mailbox menu
        if (this.mailboxMenuOpen && this.pendingApplications.length > 0) {
            // Close mailbox menu
            if (Phaser.Input.Keyboard.JustDown(this.eKey) || Phaser.Input.Keyboard.JustDown(this.escKey)) {
                this.closeMailboxMenu();
            }

            const currentBatch = this.pendingApplications[0];
            const numApplications = currentBatch.applications.length;

            // Navigate between applications
            if (Phaser.Input.Keyboard.JustDown(this.cursors.left) || Phaser.Input.Keyboard.JustDown(this.aKey)) {
                this.currentApplicationIndex = (this.currentApplicationIndex - 1 + numApplications) % numApplications;
                this.uiManager.updateMailboxUI();
            }
            if (Phaser.Input.Keyboard.JustDown(this.cursors.right) || Phaser.Input.Keyboard.JustDown(this.dKey)) {
                this.currentApplicationIndex = (this.currentApplicationIndex + 1) % numApplications;
                this.uiManager.updateMailboxUI();
            }

            // Accept application
            if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
                this.acceptApplication();
            }
        }

        // Check if player is near an income-generating building (House, Shop, Restaurant, Apartment)
        // Find the CLOSEST one with income ready, not just the first one
        this.nearIncomeBuilding = null;
        let closestIncomeDistance = 250;
        for (let building of this.buildings) {
            // Skip if not on current street
            if (building.streetNumber !== this.currentStreet) continue;

            // Skip if building type doesn't exist
            if (!building.type) continue;

            const buildingType = this.buildingTypes[building.type];
            if (!buildingType) {
                console.warn(`Building type ${building.type} not found in buildingTypes`);
                continue;
            }

            // Check regular buildings (House) - exclude shops and hotels (they auto-collect on entry)
            // Also check entertainment and service buildings (arcade, library, museum)
            const isCollectableBuilding = (buildingType.incomeRate && building.accumulatedIncome >= 1 && !this.isShop(building.type) && building.type !== 'hotel') ||
                                          (this.isEntertainment(building.type) && building.accumulatedIncome >= 1) ||
                                          (this.isService(building.type) && building.accumulatedIncome >= 1);

            if (isCollectableBuilding) {
                const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, building.x, building.y);
                if (distance < closestIncomeDistance) {
                    this.nearIncomeBuilding = building;
                    closestIncomeDistance = distance;
                }
            }

            // Hotels and shops auto-collect income when you enter them, so skip them here

            // Check apartment buildings (income from rented units)
            if (building.type === 'apartment' && building.units) {
                let totalApartmentIncome = 0;
                for (let unit of building.units) {
                    if (unit.rented && unit.accumulatedIncome) {
                        totalApartmentIncome += unit.accumulatedIncome;
                    }
                }
                if (totalApartmentIncome >= 1) {
                    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, building.x, building.y);
                    if (distance < closestIncomeDistance) {
                        this.nearIncomeBuilding = building;
                        closestIncomeDistance = distance;
                    }
                }
            }
        }

        // Check if player is near a resource building (Market, Lumber Mill, Brick Factory)
        // Find the CLOSEST one, not just the first one
        this.nearResourceBuilding = null;
        let closestResourceDistance = 251; // Start at max range + 1
        for (let building of this.buildings) {
            // Skip if not on current street
            if (building.streetNumber !== this.currentStreet) continue;

            if ((building.type === 'market' || building.type === 'lumbermill' || building.type === 'brickfactory')) {
                const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, building.x, building.y);
                if (distance < 250 && distance < closestResourceDistance) {
                    this.nearResourceBuilding = building;
                    closestResourceDistance = distance;
                }
            }
        }

        // Income building interaction (prioritize over resource buildings)
        if (this.nearIncomeBuilding && !this.buildMode && !this.bankMenuOpen && !this.resourceBuildingMenuOpen && !this.restartConfirmShowing) {
            // Validate building before showing prompt
            if (!this.nearIncomeBuilding.type) {
                console.error('nearIncomeBuilding has no type');
                this.nearIncomeBuilding = null;
                if (this.incomePrompt) this.incomePrompt.setVisible(false);
            } else {
                const buildingType = this.buildingTypes[this.nearIncomeBuilding.type];

                if (!buildingType) {
                    console.error(`Building type ${this.nearIncomeBuilding.type} not found`);
                    this.nearIncomeBuilding = null;
                    if (this.incomePrompt) this.incomePrompt.setVisible(false);
                } else {
                    // Calculate income (different for apartments vs regular buildings)
                    let income = 0;
                    if (this.nearIncomeBuilding.type === 'apartment' && this.nearIncomeBuilding.units) {
                        for (let unit of this.nearIncomeBuilding.units) {
                            if (unit.rented && unit.accumulatedIncome) {
                                income += unit.accumulatedIncome;
                            }
                        }
                    } else {
                        income = this.nearIncomeBuilding.accumulatedIncome || 0;
                    }
                    income = Math.floor(income);

                    if (!this.incomePrompt) {
                        this.incomePrompt = this.add.text(this.nearIncomeBuilding.x, this.nearIncomeBuilding.y - buildingType.height - 100, `Press E to collect $${income}`, {
                            fontSize: '12px',
                            color: '#ffffff',
                            backgroundColor: '#4CAF50',
                            padding: { x: 5, y: 3 }
                        }).setOrigin(0.5);
                    } else {
                        this.incomePrompt.setText(`Press E to collect $${income}`);
                        this.incomePrompt.x = this.nearIncomeBuilding.x;
                        this.incomePrompt.y = this.nearIncomeBuilding.y - buildingType.height - 100;
                        this.incomePrompt.setVisible(true);
                    }

                    // Collect income
                    if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
                        this.collectIncome(this.nearIncomeBuilding);
                    }
                }
            }
        } else {
            if (this.incomePrompt) {
                this.incomePrompt.setVisible(false);
            }
        }

        // Resource building interaction
        if (this.nearResourceBuilding && !this.resourceBuildingMenuOpen && !this.buildMode && !this.bankMenuOpen && !this.nearIncomeBuilding && !this.restartConfirmShowing) {
            const resourceType = this.buildingTypes[this.nearResourceBuilding.type];
            let promptText = '';

            // Different behavior for market vs lumber/brick
            if (this.nearResourceBuilding.type === 'market') {
                // Market opens a menu
                promptText = `Press E: ${resourceType.name}`;
            } else if (this.nearResourceBuilding.type === 'lumbermill') {
                // Lumber mill - collect accumulated resources
                const available = Math.floor(this.nearResourceBuilding.storedResources || 0);
                if (available >= 1) {
                    promptText = `🪵 Press E: Collect ${available} wood`;
                } else {
                    promptText = `🪵 Regenerating...`;
                }
            } else if (this.nearResourceBuilding.type === 'brickfactory') {
                // Brick factory - collect accumulated resources
                const available = Math.floor(this.nearResourceBuilding.storedResources || 0);
                if (available >= 1) {
                    promptText = `🧱 Press E: Collect ${available} bricks`;
                } else {
                    promptText = `🧱 Regenerating...`;
                }
            }

            if (!this.resourcePrompt) {
                this.resourcePrompt = this.add.text(this.nearResourceBuilding.x, this.nearResourceBuilding.y - resourceType.height - 100, promptText, {
                    fontSize: '14px',
                    color: '#ffffff',
                    backgroundColor: '#FF9800',
                    padding: { x: 8, y: 5 }
                }).setOrigin(0.5);
            } else {
                this.resourcePrompt.setText(promptText);
                this.resourcePrompt.x = this.nearResourceBuilding.x;
                this.resourcePrompt.y = this.nearResourceBuilding.y - resourceType.height - 100;
                this.resourcePrompt.setVisible(true);
            }

            // Handle E key press (collect resources or open menu)
            if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
                if (this.nearResourceBuilding.type === 'market') {
                    // Market opens menu
                    this.openResourceBuildingMenu();
                } else if (this.nearResourceBuilding.type === 'lumbermill') {
                    // Collect wood directly using cooldown system
                    this.resourceBuildingSystem.collectResources();
                } else if (this.nearResourceBuilding.type === 'brickfactory') {
                    // Collect bricks directly using cooldown system
                    this.resourceBuildingSystem.collectResources();
                }
            }
        } else {
            if (this.resourcePrompt) {
                this.resourcePrompt.setVisible(false);
            }
        }

        // Handle resource building menu
        if (this.resourceBuildingMenuOpen) {
            // Safety check: if nearResourceBuilding became null, close the menu
            if (!this.nearResourceBuilding) {
                this.closeResourceBuildingMenu();
                return;
            }

            // Close menu
            if (Phaser.Input.Keyboard.JustDown(this.eKey) || Phaser.Input.Keyboard.JustDown(this.enterKey)) {
                this.closeResourceBuildingMenu();
            }

            // Building-specific operations
            if (this.nearResourceBuilding.type === 'market') {
                if (Phaser.Input.Keyboard.JustDown(this.key1)) {
                    this.buyWood(10, 50);
                }
                if (Phaser.Input.Keyboard.JustDown(this.key2)) {
                    this.buyBricks(10, 75);
                }
            } else if (this.nearResourceBuilding.type === 'lumbermill') {
                if (Phaser.Input.Keyboard.JustDown(this.key1)) {
                    this.collectWood();
                }
            } else if (this.nearResourceBuilding.type === 'brickfactory') {
                if (Phaser.Input.Keyboard.JustDown(this.key1)) {
                    this.collectBricks();
                }
            }
        }

        // Sync visual with player
        try {
            this.playerVisual.x = this.player.x;
            this.playerVisual.y = this.player.y;

            // Movement (disabled when inside buildings, menus open, or restart confirmation showing)
            const movementBlocked = this.restartConfirmShowing || this.insideShop || this.insideHotel || this.insideRestaurant || this.insideApartment || this.schoolSystem.insideSchool ||
                                   this.bankMenuOpen || this.mailboxMenuOpen || this.buildConfirmShowing;

            // Debug logging if movement is blocked unexpectedly
            if (movementBlocked && (this.cursors.left.isDown || this.cursors.right.isDown || this.aKey.isDown || this.dKey.isDown)) {
                console.log('Movement blocked!', {
                    restartConfirmShowing: this.restartConfirmShowing,
                    insideShop: this.insideShop,
                    insideHotel: this.insideHotel,
                    insideRestaurant: this.insideRestaurant,
                    insideApartment: this.insideApartment,
                    bankMenuOpen: this.bankMenuOpen,
                    mailboxMenuOpen: this.mailboxMenuOpen,
                    buildConfirmShowing: this.buildConfirmShowing
                });
            }

            if (!movementBlocked) {
                if (this.cursors.left.isDown || this.aKey.isDown) {
                    this.player.setVelocityX(-200);
                    this.playerVisual.scaleX = -1;
                } else if (this.cursors.right.isDown || this.dKey.isDown) {
                    this.player.setVelocityX(200);
                    this.playerVisual.scaleX = 1;
                } else {
                    this.player.setVelocityX(0);
                }
            } else {
                this.player.setVelocityX(0);
            }

            // Jump - check if on ground (disabled when movement is blocked)
            if (!movementBlocked) {
                const onGround = this.player.body.touching.down ||
                                this.player.body.blocked.down ||
                                Math.abs(this.player.body.velocity.y) < 0.5;

                if ((this.cursors.up.isDown || this.wKey.isDown || this.spaceKey.isDown) && onGround) {
                    this.player.setVelocityY(-550);
                }
            }
        } catch (error) {
            console.error('Error in player movement:', error);
            console.error('Error stack:', error.stack);
        }
    }

    checkBuildingOverlap(x, width) {
        // LOT-BASED SYSTEM: Check if this lot is already occupied (only on current street)
        const LOT_SIZE = 250;
        const lotNumber = Math.round(x / LOT_SIZE);

        for (let existingBuilding of this.buildings) {
            // Only check buildings on the current street
            if (existingBuilding.streetNumber !== this.currentStreet) continue;

            const existingLotNumber = Math.round(existingBuilding.x / LOT_SIZE);

            if (lotNumber === existingLotNumber) {
                console.log(`❌ Lot ${lotNumber} is already occupied by ${existingBuilding.type} on street ${this.currentStreet}`);
                return true; // This lot is taken
            }
        }

        console.log(`✅ Lot ${lotNumber} at x=${x} is available on street ${this.currentStreet}`);
        return false; // No overlap
    }

    switchToStreet(streetNumber) {
        if (streetNumber < 1 || streetNumber > this.maxStreets) {
            console.error(`Invalid street number: ${streetNumber}`);
            return;
        }

        if (!this.streets[streetNumber - 1].unlocked) {
            this.uiManager.addNotification(`❌ Street ${streetNumber} is locked! Unlock it first.`);
            return;
        }

        console.log(`🚇 Switching from street ${this.currentStreet} to street ${streetNumber}`);

        const oldStreet = this.currentStreet;
        this.currentStreet = streetNumber;

        // Update street visibility
        this.streets.forEach((street, index) => {
            const isCurrentStreet = (index + 1) === this.currentStreet;
            street.ground.setVisible(isCurrentStreet);
        });

        // Update building visibility (hide buildings from old street, show buildings on new street)
        this.buildings.forEach(building => {
            const isOnCurrentStreet = building.streetNumber === this.currentStreet;
            if (building.graphics) building.graphics.setVisible(isOnCurrentStreet);
            if (building.sprite) building.sprite.setVisible(isOnCurrentStreet);
            if (building.bonusIndicator) building.bonusIndicator.setVisible(isOnCurrentStreet);
            if (building.incomeIndicator) building.incomeIndicator.setVisible(isOnCurrentStreet && building.accumulatedIncome >= 5);
            if (building.resourceIndicator) building.resourceIndicator.setVisible(isOnCurrentStreet);
            if (building.sign) building.sign.setVisible(isOnCurrentStreet);
            if (building.vacancySigns) {
                building.vacancySigns.forEach(sign => {
                    if (sign && sign.setVisible) sign.setVisible(isOnCurrentStreet);
                });
            }
            if (building.windowLights) {
                building.windowLights.forEach(light => {
                    if (light && light.setVisible) {
                        // Only show if on current street AND it's nighttime
                        const shouldShow = isOnCurrentStreet && light.visible;
                        light.setVisible(shouldShow);
                    }
                });
            }
        });

        // Update player physics collision to new street's platform
        if (this.player && this.groundPlatform) {
            this.physics.world.colliders.destroy(this.player.body, this.groundPlatformBody);
        }
        this.groundPlatform = this.streets[streetNumber - 1].platform;
        this.groundPlatformBody = this.streets[streetNumber - 1].platformBody;
        this.platformY = this.streets[streetNumber - 1].platformY;
        if (this.player) {
            this.physics.add.collider(this.player, this.groundPlatform);
        }

        // Update citizen/bus visibility (for now, keep them all visible - will fix later)
        // TODO: Filter citizens and buses by street

        // Notification
        const streetName = this.streets[streetNumber - 1].name;
        this.uiManager.addNotification(`🚇 Arrived at ${streetName}`);

        console.log(`✅ Now on ${streetName} (Street ${this.currentStreet})`);
    }

    openSubwayTravelMenu() {
        console.log('🚇 Opening subway travel menu');

        // Pause the game
        this.isPaused = true;

        // Create subway menu container
        this.subwayMenuContainer = this.add.container(this.gameWidth / 2, this.gameHeight / 2);
        this.subwayMenuContainer.setScrollFactor(0).setDepth(30000);

        // Semi-transparent background overlay
        const overlay = this.add.rectangle(0, 0, this.gameWidth, this.gameHeight, 0x000000, 0.7);
        overlay.setOrigin(0.5);
        overlay.setInteractive(); // Prevent clicks going through
        this.subwayMenuContainer.add(overlay);

        // Menu background
        const menuBg = this.add.rectangle(0, 0, 600, 400, 0x424242, 1);
        menuBg.setStrokeStyle(4, 0x607D8B);
        this.subwayMenuContainer.add(menuBg);

        // Title
        const title = this.add.text(0, -160, '🚇 SUBWAY TRAVEL', {
            fontSize: '28px',
            color: '#FFFFFF',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.subwayMenuContainer.add(title);

        // Subtitle
        const subtitle = this.add.text(0, -120, 'Select a street to travel to:', {
            fontSize: '16px',
            color: '#CCCCCC'
        }).setOrigin(0.5);
        this.subwayMenuContainer.add(subtitle);

        // Create buttons for each unlocked street
        let yOffset = -60;
        this.streets.forEach((street, index) => {
            const streetNum = index + 1;

            if (street.unlocked) {
                const isCurrent = streetNum === this.currentStreet;
                const buttonBg = isCurrent ? 0x4CAF50 : 0x607D8B;
                const buttonText = isCurrent ?
                    `${street.name} (Current)` :
                    `${street.name}`;

                const button = this.add.text(0, yOffset, buttonText, {
                    fontSize: '18px',
                    color: '#FFFFFF',
                    backgroundColor: buttonBg,
                    padding: { x: 40, y: 12 }
                }).setOrigin(0.5).setInteractive();

                button.on('pointerover', () => {
                    if (!isCurrent) button.setStyle({ backgroundColor: '#78909C' });
                });
                button.on('pointerout', () => {
                    if (!isCurrent) button.setStyle({ backgroundColor: buttonBg });
                });
                button.on('pointerdown', () => {
                    if (!isCurrent) {
                        this.switchToStreet(streetNum);
                        this.closeSubwayTravelMenu();
                    }
                });

                this.subwayMenuContainer.add(button);
                yOffset += 60;
            } else {
                // Locked street
                const lockedText = this.add.text(0, yOffset, `${street.name} 🔒 LOCKED`, {
                    fontSize: '18px',
                    color: '#999999',
                    backgroundColor: '#333333',
                    padding: { x: 40, y: 12 }
                }).setOrigin(0.5);
                this.subwayMenuContainer.add(lockedText);
                yOffset += 60;
            }
        });

        // Close button
        const closeButton = this.add.text(0, 150, 'CLOSE', {
            fontSize: '18px',
            color: '#FFFFFF',
            backgroundColor: '#D32F2F',
            padding: { x: 30, y: 10 }
        }).setOrigin(0.5).setInteractive();

        closeButton.on('pointerover', () => closeButton.setStyle({ backgroundColor: '#F44336' }));
        closeButton.on('pointerout', () => closeButton.setStyle({ backgroundColor: '#D32F2F' }));
        closeButton.on('pointerdown', () => this.closeSubwayTravelMenu());

        this.subwayMenuContainer.add(closeButton);
    }

    closeSubwayTravelMenu() {
        if (this.subwayMenuContainer) {
            this.subwayMenuContainer.destroy();
            this.subwayMenuContainer = null;
        }
        this.isPaused = false;
    }

    showLowStockPopup(building, shopName) {
        // Don't show popup if one is already showing
        if (this.lowStockPopupShowing) {
            return;
        }

        this.lowStockPopupShowing = true;

        // Create popup container
        const popupContainer = this.add.container(this.gameWidth / 2, this.gameHeight / 2);
        popupContainer.setScrollFactor(0).setDepth(25000);

        // Semi-transparent background overlay
        const overlay = this.add.rectangle(0, 0, this.gameWidth, this.gameHeight, 0x000000, 0.7);
        overlay.setOrigin(0.5);
        popupContainer.add(overlay);

        // Popup background
        const popupBg = this.add.rectangle(0, 0, 500, 250, 0xFF6B6B, 1);
        popupBg.setStrokeStyle(4, 0xFF0000);
        popupContainer.add(popupBg);

        // Warning icon
        const warningIcon = this.add.text(0, -70, '⚠️', {
            fontSize: '48px'
        }).setOrigin(0.5);
        popupContainer.add(warningIcon);

        // Title
        const title = this.add.text(0, -20, 'LOW STOCK WARNING', {
            fontSize: '24px',
            color: '#FFFFFF',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        popupContainer.add(title);

        // Message
        const stock = building.inventory.stock;
        const message = this.add.text(0, 20, `${shopName} is running low on stock!\n\nOnly ${stock} units remaining.`, {
            fontSize: '18px',
            color: '#FFFFFF',
            align: 'center'
        }).setOrigin(0.5);
        popupContainer.add(message);

        // OK button
        const okButton = this.add.text(0, 85, 'OK', {
            fontSize: '20px',
            color: '#FFFFFF',
            backgroundColor: '#4CAF50',
            padding: { x: 30, y: 10 }
        }).setOrigin(0.5).setInteractive();
        popupContainer.add(okButton);

        // Close popup on click
        okButton.on('pointerdown', () => {
            popupContainer.destroy();
            this.lowStockPopupShowing = false;
        });

        // Also close popup when clicking overlay
        overlay.setInteractive();
        overlay.on('pointerdown', () => {
            popupContainer.destroy();
            this.lowStockPopupShowing = false;
        });

        // Auto-close after 5 seconds
        this.time.delayedCall(5000, () => {
            if (popupContainer.scene) { // Check if still exists
                popupContainer.destroy();
                this.lowStockPopupShowing = false;
            }
        });
    }

    updateBuildingPreview() {
        if (!this.buildMode || !this.selectedBuilding) {
            return;
        }

        const building = this.buildingTypes[this.selectedBuilding];
        if (!building) {
            console.error('Building type not found:', this.selectedBuilding);
            return;
        }

        const mouseWorldX = this.input.activePointer.x + this.cameras.main.scrollX;

        // Snap to grid (every 250 pixels along the street for bigger buildings)
        const snappedX = Math.round(mouseWorldX / 250) * 250;
        // Use current street's ground level for building placement
        const buildingY = this.platformY || (this.gameHeight - 100);

        // Only recreate preview if position changed
        if (this.buildingPreview && this.buildingPreview.snappedX === snappedX && this.buildingPreview.buildingY === buildingY) {
            return; // Position hasn't changed, keep existing preview
        }

        // Remove old preview
        if (this.buildingPreview) {
            this.buildingPreview.destroy();
            this.buildingPreview = null;
        }

        // Create new preview in WORLD coordinates
        const previewGraphics = this.add.graphics();
        previewGraphics.setDepth(15); // Above buildings (10) but below UI (9998+)
        previewGraphics.setVisible(true);
        previewGraphics.setAlpha(0.7); // Semi-transparent

        // Draw the building preview at the actual world position
        previewGraphics.fillStyle(building.color, 1);
        previewGraphics.fillRect(snappedX - building.width/2, buildingY - building.height,
                                building.width, building.height);
        previewGraphics.lineStyle(3, 0x000000, 1);
        previewGraphics.strokeRect(snappedX - building.width/2, buildingY - building.height,
                                  building.width, building.height);

        // Draw building details (windows, doors, etc.) so user can see what they're placing
        try {
            this.buildingRenderer.drawBuildingDetails(previewGraphics, this.selectedBuilding, snappedX, buildingY, 0);
        } catch (error) {
            console.error('Error drawing building preview details:', error);
        }

        // Check for collisions with existing buildings
        const wouldOverlap = this.checkBuildingOverlap(snappedX, building.width);

        // Add outline - green if valid, red if overlapping
        const outlineColor = wouldOverlap ? 0xFF0000 : 0x00FF00;
        previewGraphics.lineStyle(5, outlineColor, 0.8);
        previewGraphics.strokeRect(snappedX - building.width/2, buildingY - building.height,
                                  building.width, building.height);

        this.buildingPreview = previewGraphics;
        this.buildingPreview.snappedX = snappedX;
        this.buildingPreview.buildingY = buildingY;
        this.buildingPreview.wouldOverlap = wouldOverlap;

        console.log('Preview created at', snappedX, buildingY, 'Overlap:', wouldOverlap);
    }

    deleteBuilding(building) {
        // Destroy graphics
        if (building.graphics) {
            building.graphics.destroy();
        }

        // Destroy sprite if it exists
        if (building.sprite) {
            building.sprite.destroy();
        }

        // (Labels removed - we use building signs now)

        // Destroy income indicator (with safety check)
        if (building.incomeIndicator && building.incomeIndicator.destroy) {
            building.incomeIndicator.destroy();
        }

        // Destroy resource indicator (with safety check)
        if (building.resourceIndicator && building.resourceIndicator.destroy) {
            building.resourceIndicator.destroy();
        }

        // Destroy vacancy indicators for apartments (with safety check)
        if (building.type === 'apartment' && building.units) {
            for (let unit of building.units) {
                if (unit.vacancyIndicator && unit.vacancyIndicator.destroy) {
                    unit.vacancyIndicator.destroy();
                }
            }
        }

        // Destroy dirty indicators for hotel rooms (with safety check)
        if (building.type === 'hotel' && building.rooms) {
            for (let room of building.rooms) {
                if (room.dirtyIndicator && room.dirtyIndicator.destroy) {
                    room.dirtyIndicator.destroy();
                }
            }
        }

        // Destroy window lights
        if (building.windowLights) {
            for (let light of building.windowLights) {
                light.destroy();
            }
        }

        // Remove from buildings array
        const index = this.buildings.indexOf(building);
        if (index > -1) {
            this.buildings.splice(index, 1);
        }

        console.log(`✅ Deleted ${building.type} - buildings array now has ${this.buildings.length} items`);

        // Save game
        this.saveSystem.saveGame();
    }

    placeBuilding() {
        if (!this.selectedBuilding) return;

        const building = this.buildingTypes[this.selectedBuilding];

        // Use the saved position from when confirmation was triggered
        let x = this.pendingBuildingX;

        // Check for overlaps with existing buildings (lot-based system)
        if (this.checkBuildingOverlap(x, building.width)) {
            console.log('❌ This lot is already occupied!');
            this.uiManager.addNotification('❌ This lot is already occupied! Move to an empty lot.');
            return false;
        }

        // Check if player has enough resources (skip in creative mode)
        if (!this.creativeMode) {
            if (this.money < building.cost || this.wood < building.wood || this.bricks < building.bricks) {
                console.log('Not enough resources! Need: $' + building.cost + ', Wood:' + building.wood + ', Bricks:' + building.bricks);
                console.log('You have: $' + this.money + ', Wood:' + this.wood + ', Bricks:' + this.bricks);
                this.uiManager.addNotification(`❌ Not enough resources! Need: $${building.cost}, 🪵${building.wood}, 🧱${building.bricks}`);
                return false; // Return false to indicate failure
            }

            // Deduct resources
            this.money -= building.cost;
            this.money = Math.round(this.money);
            this.wood -= building.wood;
            this.bricks -= building.bricks;
        }

        const y = this.pendingBuildingY;

        // Generate random facade variation before drawing
        const facadeVariation = Math.floor(Math.random() * 4);

        let newBuilding;
        let buildingSprite = null;

        // Use sprite for clothing shop if texture is loaded
        if (this.selectedBuilding === 'clothingShop' && this.textures.exists('clothingShop')) {
            // Create sprite for clothing shop
            // Make it 1.5x larger than default (300x360 instead of 200x240)
            const spriteWidth = building.width * 1.5;
            const spriteHeight = building.height * 1.5;

            buildingSprite = this.add.sprite(x, y - spriteHeight / 2, 'clothingShop');
            buildingSprite.setDepth(10);
            buildingSprite.setVisible(true);
            buildingSprite.setOrigin(0.5, 0.5);

            // Scale sprite larger for better visibility (pixel art stays crisp!)
            buildingSprite.setDisplaySize(spriteWidth, spriteHeight);

            // Create empty graphics object for consistency
            newBuilding = this.add.graphics();
            newBuilding.setDepth(10);
            newBuilding.setVisible(true);
        } else {
            // Use graphics for all other buildings
            newBuilding = this.add.graphics();
            newBuilding.setDepth(10); // Buildings are on top of background
            newBuilding.setVisible(true); // Building is on current street, so it should be visible

            // Don't draw base rectangle for parks/recreation items and theme park (they draw everything custom)
            if (this.selectedBuilding !== 'park' && this.selectedBuilding !== 'playground' && this.selectedBuilding !== 'fountain' && this.selectedBuilding !== 'themePark') {
                newBuilding.fillStyle(building.color, 1);
                newBuilding.fillRect(x - building.width/2, y - building.height, building.width, building.height);
                newBuilding.lineStyle(3, 0x000000, 1);
                newBuilding.strokeRect(x - building.width/2, y - building.height, building.width, building.height);
            }

            // Draw detailed building features (windows, doors, roof, etc.)
            this.buildingRenderer.drawBuildingDetails(newBuilding, this.selectedBuilding, x, y, facadeVariation);
        }

        // Building-specific decorations
        if (this.selectedBuilding === 'bank') {
            // Bank now has detailed classical architecture with columns built-in
            // No additional decorations needed
        } else if (this.selectedBuilding === 'market') {
            // Add market emoji
            const awning = this.add.text(x, y - building.height / 2, '🏪', {
                fontSize: '60px'
            }).setOrigin(0.5).setDepth(11);
        }

        // Determine which district the building is in
        let placedDistrict = null;
        for (let districtKey in this.districts) {
            const district = this.districts[districtKey];
            if (x >= district.startX && x < district.endX) {
                placedDistrict = districtKey;
                break;
            }
        }

        // Check if building is in its suggested district for bonus
        const inCorrectDistrict = placedDistrict === building.district;
        const districtBonus = inCorrectDistrict ? 1.2 : 1.0; // 20% bonus if in correct district

        // Add building with income and resource tracking
        const buildingData = {
            graphics: newBuilding,
            sprite: buildingSprite, // Store sprite reference if it exists
            type: this.selectedBuilding,
            x: x,
            y: y,
            streetNumber: this.currentStreet, // Track which street this building is on
            accumulatedIncome: 0,
            lastIncomeTime: Date.now(),
            storedResources: 0,  // For resource buildings (lumber mill, brick factory)
            lastResourceTime: Date.now(),
            placedDistrict: placedDistrict,
            districtBonus: districtBonus,
            facadeVariation: facadeVariation  // Use the variation we already generated
        };

        // Add visual indicator if building is in correct district
        if (inCorrectDistrict) {
            const bonusIndicator = this.add.text(x, y - building.height - 30, '⭐', {
                fontSize: '20px'
            }).setOrigin(0.5).setDepth(12);
            buildingData.bonusIndicator = bonusIndicator;
        }

        // Initialize apartment units if it's an apartment building
        if (this.selectedBuilding === 'apartment') {
            console.log(`🏢 Creating apartment building at (${x}, ${y}) with height ${building.height}`);
            buildingData.units = [];
            for (let i = 0; i < building.units; i++) {
                buildingData.units.push({
                    rented: false,  // All units start vacant
                    tenant: null,   // Current tenant info (name, credit score, etc.)
                    accumulatedIncome: 0,
                    lastIncomeTime: Date.now(),
                    lastRiskCheck: Date.now()  // For checking if tenant skips
                });
            }
            buildingData.vacancySigns = [];  // Will store vacancy sign graphics

            // Auto-fill all vacant units
            console.log('Auto-filling new apartment building with', building.units, 'units');
            for (let i = 0; i < building.units; i++) {
                this.autoFillVacantUnit(buildingData, i);
            }
        }

        // Initialize hotel rooms if it's a hotel building
        if (this.selectedBuilding === 'hotel') {
            buildingData.rooms = [];
            buildingData.lastNightCheck = this.gameTime; // Track last time we checked for night transition
            buildingData.accumulatedIncome = 0; // Total income from all rooms
            buildingData.hasEmployee = false;  // No front desk employee until hired
            buildingData.dailyWage = 0;  // No wage until employee is hired
            buildingData.lastWageCheck = this.gameTime;  // Track last time we paid wages
            buildingData.lastAutoClean = this.gameTime;  // Track last time employee auto-cleaned
            buildingData.hasMaid = false;  // No maid until hired
            buildingData.maidDailyWage = 0;  // No maid wage until hired
            buildingData.lastMaidWageCheck = this.gameTime;  // Track last time we paid maid
            buildingData.lastMaidClean = this.gameTime;  // Track last time maid cleaned a room

            for (let i = 0; i < building.rooms; i++) {
                buildingData.rooms.push({
                    status: 'clean',  // clean, dirty, or occupied
                    isOccupied: false,  // Is room occupied by a tourist
                    guest: null,  // Reference to tourist citizen
                    nightsOccupied: 0,  // How many nights has current guest stayed
                    lastStatusChange: Date.now()
                });
            }
        }

        // Initialize shop inventory if it's a shop
        if (this.isShop(this.selectedBuilding)) {
            buildingData.inventory = {
                stock: 50,  // Current stock level (0-100)
                maxStock: 100,  // Maximum stock capacity
                restockCost: 5,  // Cost per unit to restock
                salesPerCustomer: 5  // Stock consumed per customer visit
            };
            buildingData.hasEmployee = false;  // No employee until hired
            buildingData.isOpen = false;  // Closed until employee is hired
            buildingData.dailyWage = 0;  // No wage until employee is hired
            buildingData.lastWageCheck = this.gameTime;  // Track last time we paid wages
        }

        // Initialize restaurant tables if it's a restaurant
        if (this.isRestaurant(this.selectedBuilding)) {
            buildingData.tables = [];
            buildingData.hasDayWaiter = false;  // No day waiter until hired
            buildingData.hasNightWaiter = false;  // No night waiter until hired
            buildingData.dayWaiterWage = 0;  // No wage until day waiter is hired
            buildingData.nightWaiterWage = 0;  // No wage until night waiter is hired
            buildingData.lastWageCheck = this.gameTime;  // Track last time we paid wages
            buildingData.mealPrice = building.mealPrice || 25;  // Price per meal from building type

            // Create 6 tables
            for (let i = 0; i < 6; i++) {
                buildingData.tables.push({
                    status: 'available',  // available, occupied, or dirty
                    customer: null,  // Reference to citizen occupying table
                    mealStartTime: null,  // When customer started eating
                    mealDuration: 0  // How long they'll eat (in game minutes)
                });
            }
        }

        // Add window lights for nighttime
        this.addWindowLights(buildingData, building);

        // Add building sign
        this.addBuildingSign(buildingData, building);

        this.buildings.push(buildingData);

        // Special handling for subway stations: automatically build on all unlocked streets
        if (this.selectedBuilding === 'subwayStation') {
            console.log(`🚇 Building subway station on all ${this.unlockedStreets} unlocked streets at x=${x}`);

            // Create subway stations on all other unlocked streets at the same X position
            for (let i = 0; i < this.unlockedStreets; i++) {
                const streetNum = i + 1;

                // Skip the street we just built on
                if (streetNum === this.currentStreet) continue;

                // Check if there's already a subway station at this location on this street
                const existingStation = this.buildings.find(b =>
                    b.type === 'subwayStation' &&
                    b.streetNumber === streetNum &&
                    Math.abs(b.x - x) < 125 // Same lot
                );

                if (existingStation) {
                    console.log(`🚇 Subway station already exists on street ${streetNum} at this location`);
                    continue;
                }

                // Create matching subway station on this street
                const newStationGraphics = this.add.graphics();
                newStationGraphics.setDepth(10);
                newStationGraphics.fillStyle(building.color, 1);
                newStationGraphics.fillRect(x - building.width/2, y - building.height, building.width, building.height);
                newStationGraphics.lineStyle(3, 0x000000, 1);
                newStationGraphics.strokeRect(x - building.width/2, y - building.height, building.width, building.height);

                // Draw building details
                this.buildingRenderer.drawBuildingDetails(newStationGraphics, 'subwayStation', x, y, facadeVariation);

                const stationData = {
                    graphics: newStationGraphics,
                    type: 'subwayStation',
                    x: x,
                    y: y,
                    streetNumber: streetNum,
                    accumulatedIncome: 0,
                    lastIncomeTime: Date.now(),
                    storedResources: 0,
                    lastResourceTime: Date.now(),
                    placedDistrict: placedDistrict,
                    districtBonus: districtBonus,
                    facadeVariation: facadeVariation
                };

                // Set visibility based on current street
                newStationGraphics.setVisible(streetNum === this.currentStreet);

                // Add window lights and sign
                this.addWindowLights(stationData, building);
                this.addBuildingSign(stationData, building);

                this.buildings.push(stationData);
                console.log(`🚇 Created subway station on street ${streetNum}`);
            }

            this.uiManager.addNotification(`🚇 Subway station built on all ${this.unlockedStreets} unlocked streets!`);
        }

        // Increase population capacity for residential buildings
        if (building.district === 'residential') {
            this.addPopulationCapacity(this.selectedBuilding);
        }

        if (this.creativeMode) {
            console.log(`Built ${building.name} in CREATIVE MODE!`);
        } else {
            console.log(`Built ${building.name}! Resources: $${this.money}, Wood: ${this.wood}, Bricks: ${this.bricks}`);
        }

        // Calculate and apply street bonuses for all buildings
        this.calculateStreetBonuses();

        // Auto-save after building
        this.saveSystem.saveGame();
    }

    calculateStreetBonuses() {
        // Calculate bonuses based on building clustering on each street
        // Group buildings by street and type
        const streetGroups = {};

        for (let building of this.buildings) {
            const streetNum = building.streetNumber || 1;

            if (!streetGroups[streetNum]) {
                streetGroups[streetNum] = {};
            }

            const buildingType = this.buildingTypes[building.type];
            if (!buildingType) continue;

            const category = buildingType.district || 'other';

            if (!streetGroups[streetNum][category]) {
                streetGroups[streetNum][category] = [];
            }
            streetGroups[streetNum][category].push(building);
        }

        // Calculate and apply bonuses
        for (let building of this.buildings) {
            const buildingType = this.buildingTypes[building.type];
            if (!buildingType) continue;

            const category = buildingType.district || 'other';
            const buildingsInCategory = streetGroups[streetNum][category] || [];
            const count = buildingsInCategory.length;

            // Determine bonus based on category and count
            let bonus = 1.0;
            let bonusLabel = '';

            if (category === 'residential' && count >= 5) {
                bonus = 1.10; // +10% income for residential districts
                bonusLabel = '🏘️ Residential District';
            } else if (category === 'downtown' && count >= 5) {
                bonus = 1.15; // +15% income for business districts
                bonusLabel = '🏢 Business District';
            } else if (category === 'recreation' && count >= 3) {
                bonus = 1.20; // +20% income for entertainment districts
                bonusLabel = '🎭 Entertainment District';
            } else if (category === 'industrial' && count >= 2) {
                bonus = 1.25; // +25% production for industrial zones
                bonusLabel = '🏭 Industrial Zone';
            }

            building.streetBonus = bonus;
            building.streetBonusLabel = bonusLabel;
        }
    }

    addPopulationCapacity(buildingType) {
        // Each residential building attracts new citizens
        let newCitizens = 0;
        if (buildingType === 'house') {
            newCitizens = 2 + Math.floor(Math.random() * 2); // 2-3 citizens
        } else if (buildingType === 'apartment') {
            newCitizens = 4 + Math.floor(Math.random() * 3); // 4-6 citizens
        } else if (buildingType === 'hotel') {
            newCitizens = 3 + Math.floor(Math.random() * 3); // 3-5 citizens
        }

        this.populationCapacity += newCitizens;
        this.pendingCitizens += newCitizens;
        console.log(`📈 Population capacity increased! +${newCitizens} citizens (${this.population}/${this.populationCapacity})`);
        this.uiManager.updateMoneyUI();
    }

    // Restaurant functions moved to RestaurantSystem.js
    // Hotel functions moved to HotelSystem.js
    // Shop functions moved to ShopSystem.js
    // Save/load functions moved to SaveSystem.js

    showTrainStationUI(building) {
        // Create UI
        const ui = this.add.container(400, 150);
        ui.setDepth(1001);
        ui.setScrollFactor(0);

        // Background
        const bg = this.add.graphics();
        bg.fillStyle(0x1a1a1a, 0.95);
        bg.fillRoundedRect(0, 0, 700, 400, 10);
        bg.lineStyle(3, 0x795548, 1);
        bg.strokeRoundedRect(0, 0, 700, 400, 10);
        ui.add(bg);

        // Title
        const title = this.add.text(350, 20, '🚂 TRAIN STATION', {
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#795548',
            align: 'center'
        });
        title.setOrigin(0.5, 0);
        ui.add(title);

        // Statistics
        let yPos = 80;
        const stats = [
            `💰 Total Rail Revenue: $${this.trainSystem.totalRevenue}`,
            `👥 Total Passengers Served: ${this.trainSystem.totalPassengers}`,
            `🎫 Fare per Passenger: $${this.trainSystem.RAIL_FARE}`,
            ``,
            `🚂 Active Trains: ${this.trainSystem.trains.length}`,
            `⏱️ Train Interval: Every ${this.trainSystem.TRAIN_INTERVAL} minutes`,
            `🎒 Train Capacity: ${this.trainSystem.TRAIN_CAPACITY} passengers`,
        ];

        for (let stat of stats) {
            if (stat === '') {
                yPos += 20;
                continue;
            }
            const text = this.add.text(50, yPos, stat, {
                fontSize: '20px',
                color: '#ffffff'
            });
            ui.add(text);
            yPos += 35;
        }

        // Info message
        const info = this.add.text(350, 300, 'Trains automatically collect fares when passengers board.\nRevenue helps fund your city!', {
            fontSize: '16px',
            color: '#FFD700',
            align: 'center',
            fontStyle: 'italic'
        });
        info.setOrigin(0.5, 0);
        ui.add(info);

        // Close button - simpler approach
        const closeBtnBg = this.add.graphics();
        closeBtnBg.fillStyle(0x795548, 1);
        closeBtnBg.fillRoundedRect(200, 350, 300, 36, 5);
        closeBtnBg.lineStyle(2, 0xffffff, 1);
        closeBtnBg.strokeRoundedRect(200, 350, 300, 36, 5);
        closeBtnBg.setInteractive(new Phaser.Geom.Rectangle(200, 350, 300, 36), Phaser.Geom.Rectangle.Contains);
        closeBtnBg.on('pointerdown', () => {
            console.log('Closing train station UI');
            ui.destroy();
        });
        closeBtnBg.on('pointerover', () => {
            closeBtnBg.setAlpha(0.8);
        });
        closeBtnBg.on('pointerout', () => {
            closeBtnBg.setAlpha(1);
        });
        ui.add(closeBtnBg);

        const closeBtnText = this.add.text(350, 368, '✖ CLOSE', {
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#ffffff'
        });
        closeBtnText.setOrigin(0.5);
        ui.add(closeBtnText);

        this.currentUI = ui;
    }

    createSimpleButton(container, x, y, text, onClick, color = '#795548') {
        const btn = this.add.container(x, y);
        btn.setSize(300, 36);

        const bg = this.add.graphics();
        const colorValue = parseInt(color.replace('#', ''), 16);
        bg.fillStyle(colorValue, 1);
        bg.fillRoundedRect(-150, -18, 300, 36, 5);
        bg.lineStyle(2, 0xffffff, 1);
        bg.strokeRoundedRect(-150, -18, 300, 36, 5);
        btn.add(bg);

        const label = this.add.text(0, 0, text, {
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#ffffff'
        });
        label.setOrigin(0.5);
        btn.add(label);

        btn.setInteractive(
            new Phaser.Geom.Rectangle(-150, -18, 300, 36),
            Phaser.Geom.Rectangle.Contains
        );

        btn.on('pointerdown', () => {
            console.log('Train station close button clicked');
            onClick();
        });
        btn.on('pointerover', () => {
            bg.setAlpha(0.8);
            this.input.setDefaultCursor('pointer');
        });
        btn.on('pointerout', () => {
            bg.setAlpha(1);
            this.input.setDefaultCursor('default');
        });

        container.add(btn);
        return btn;
    }

    openBankMenu() {
        this.bankMenuOpen = true;
        this.uiManager.updateBankUI();
        this.bankUI.setVisible(true);
    }

    closeBankMenu() {
        this.bankMenuOpen = false;
        this.bankUI.setVisible(false);
    }

    enterApartment(apartment) {
        console.log('Viewing apartment tenants:', apartment);

        this.insideApartment = true;
        this.currentApartment = apartment;

        // Update and show apartment UI
        this.updateApartmentUI();
        this.apartmentUI.setVisible(true);

        // Hide apartment prompt
        if (this.apartmentPrompt) {
            this.apartmentPrompt.setVisible(false);
        }

        // Disable player movement
        this.player.setVelocityX(0);
        this.player.setVelocityY(0);
    }

    exitApartment() {
        console.log('Exiting apartment view');
        this.insideApartment = false;
        this.currentApartment = null;

        // Hide apartment UI
        this.apartmentUI.setVisible(false);
    }

    updateApartmentUI() {
        if (!this.currentApartment || !this.currentApartment.units) {
            console.log('No apartment or units data');
            return;
        }

        let menuText = '=== APARTMENT BUILDING ===\n\n';

        // List all units
        for (let i = 0; i < this.currentApartment.units.length; i++) {
            const unit = this.currentApartment.units[i];
            menuText += `Unit ${i + 1}: `;

            if (unit.rented && unit.tenant) {
                // Show tenant details
                menuText += `${unit.tenant.name}\n`;
                menuText += `  Job: ${unit.tenant.job}\n`;
                menuText += `  Rent: $${unit.tenant.rentOffer}/day\n`;
                menuText += `  Credit: ${unit.tenant.creditScore}`;

                // Credit rating
                if (unit.tenant.creditScore >= 750) menuText += ' ⭐ (Excellent)';
                else if (unit.tenant.creditScore >= 650) menuText += ' ✓ (Good)';
                else if (unit.tenant.creditScore >= 550) menuText += ' ⚠ (Fair)';
                else menuText += ' ❌ (Poor)';

                menuText += '\n';
            } else {
                menuText += 'VACANT (Auto-filling...)\n';
            }

            if (i < this.currentApartment.units.length - 1) {
                menuText += '\n';
            }
        }

        menuText += '\nE/ESC: Close';

        this.apartmentUI.setText(menuText);
    }

    showFloatingMessage(x, y, text, color) {
        const message = this.add.text(x, y, text, {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: color,
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setDepth(10000);

        // Animate the message floating up and fading out
        this.tweens.add({
            targets: message,
            y: y - 50,
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                message.destroy();
            }
        });
    }

    // Restaurant functions moved to RestaurantSystem.js
    // Hotel functions moved to HotelSystem.js
    // Shop functions moved to ShopSystem.js

    openMailboxMenu() {
        if (this.pendingApplications.length === 0) return;

        this.mailboxMenuOpen = true;
        this.currentApplicationIndex = 0;
        this.uiManager.updateMailboxUI();
        this.mailboxUI.setVisible(true);
    }

    closeMailboxMenu() {
        this.mailboxMenuOpen = false;
        this.mailboxUI.setVisible(false);
    }


    acceptApplication() {
        if (this.pendingApplications.length === 0) return;

        const currentBatch = this.pendingApplications[0];
        const applications = currentBatch.applications;
        const acceptedApp = applications[this.currentApplicationIndex];
        const apartmentBuilding = currentBatch.apartmentBuilding;
        const unitIndex = currentBatch.unitIndex;

        // Find the unit
        const unit = apartmentBuilding.units[unitIndex];

        // Move tenant in
        unit.rented = true;
        unit.tenant = {
            name: acceptedApp.name,
            job: acceptedApp.job,
            creditScore: acceptedApp.creditScore,
            rentOffer: acceptedApp.rentOffer
        };
        unit.lastIncomeTime = Date.now();
        unit.lastRiskCheck = Date.now();

        console.log(`✅ Accepted ${acceptedApp.name} for Apartment #${unitIndex + 1} at $${acceptedApp.rentOffer}/min`);

        // Remove this batch of applications
        this.pendingApplications.shift();

        // Close menu or show next batch
        if (this.pendingApplications.length > 0) {
            this.currentApplicationIndex = 0;
            this.uiManager.updateMailboxUI();
        } else {
            this.closeMailboxMenu();
        }

        // Save game
        this.saveSystem.saveGame();
    }


    depositMoney(amount) {
        if (this.money >= amount) {
            this.money -= amount;
            this.money = Math.round(this.money);
            this.bankBalance += amount;
            this.bankBalance = Math.round(this.bankBalance);
            console.log(`Deposited $${amount}. Bank balance: $${this.bankBalance}`);
            this.uiManager.updateBankUI();
            this.saveSystem.saveGame();
        } else {
            console.log('Not enough cash to deposit!');
        }
    }

    withdrawMoney(amount) {
        if (this.bankBalance >= amount) {
            this.bankBalance -= amount;
            this.bankBalance = Math.round(this.bankBalance);
            this.money += amount;
            this.money = Math.round(this.money);
            console.log(`Withdrew $${amount}. Bank balance: $${this.bankBalance}`);
            this.uiManager.updateBankUI();
            this.saveSystem.saveGame();
        } else {
            console.log('Not enough money in bank!');
        }
    }

    borrowMoney(amount) {
        const totalLoan = Math.round(amount * (1 + this.loanInterestRate));
        this.money += amount;
        this.money = Math.round(this.money);
        this.loanAmount += totalLoan;
        this.loanAmount = Math.round(this.loanAmount);
        console.log(`Borrowed $${amount}. You owe $${totalLoan} (including 10% interest). Total debt: $${this.loanAmount}`);
        this.uiManager.updateBankUI();
        this.saveSystem.saveGame();
    }

    resetGame() {
        // Clear save data
        localStorage.removeItem('mainstreetmayor_save');
        console.log('Game reset! Starting new game...');

        // Restart the scene
        this.scene.restart();
    }

    openResourceBuildingMenu() {
        this.resourceBuildingMenuOpen = true;
        this.uiManager.updateResourceBuildingUI();
        this.resourceBuildingUI.setVisible(true);
    }

    closeResourceBuildingMenu() {
        this.resourceBuildingMenuOpen = false;
        this.resourceBuildingUI.setVisible(false);
    }


    buyWood(amount, cost) {
        if (this.money >= cost) {
            this.money -= cost;
            this.money = Math.round(this.money);
            this.wood += amount;
            console.log(`Bought ${amount} wood for $${cost}. Wood: ${this.wood}, Money: $${this.money}`);
            this.uiManager.updateResourceBuildingUI();
            this.saveSystem.saveGame();
        } else {
            console.log('Not enough money!');
        }
    }

    buyBricks(amount, cost) {
        if (this.money >= cost) {
            this.money -= cost;
            this.money = Math.round(this.money);
            this.bricks += amount;
            console.log(`Bought ${amount} bricks for $${cost}. Bricks: ${this.bricks}, Money: $${this.money}`);
            this.uiManager.updateResourceBuildingUI();
            this.saveSystem.saveGame();
        } else {
            console.log('Not enough money!');
        }
    }

    collectWood() {
        const available = Math.floor(this.nearResourceBuilding.storedResources);
        if (available >= 1) {
            this.wood += available;
            this.nearResourceBuilding.storedResources = 0;
            this.nearResourceBuilding.lastResourceTime = Date.now();
            console.log(`Collected ${available} wood. Total wood: ${this.wood}`);

            // Hide resource indicator
            if (this.nearResourceBuilding.resourceIndicator && this.nearResourceBuilding.resourceIndicator.scene) {
                this.nearResourceBuilding.resourceIndicator.setVisible(false);
            }

            this.uiManager.updateResourceBuildingUI();
            this.saveSystem.saveGame();
        } else {
            console.log('No wood available yet. Wait for regeneration.');
        }
    }

    collectBricks() {
        const available = Math.floor(this.nearResourceBuilding.storedResources);
        if (available >= 1) {
            this.bricks += available;
            this.nearResourceBuilding.storedResources = 0;
            this.nearResourceBuilding.lastResourceTime = Date.now();
            console.log(`Collected ${available} bricks. Total bricks: ${this.bricks}`);

            // Hide resource indicator
            if (this.nearResourceBuilding.resourceIndicator && this.nearResourceBuilding.resourceIndicator.scene) {
                this.nearResourceBuilding.resourceIndicator.setVisible(false);
            }

            this.uiManager.updateResourceBuildingUI();
            this.saveSystem.saveGame();
        } else {
            console.log('No bricks available yet. Wait for regeneration.');
        }
    }

    showSaveFeedback() {
        // Show temporary "Game Saved!" message
        const savedText = this.add.text(
            this.gameWidth / 2,
            100,
            '✓ GAME SAVED!',
            {
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#4CAF50',
                backgroundColor: '#1a1a1a',
                padding: { x: 20, y: 12 }
            }
        ).setOrigin(0.5);

        savedText.setScrollFactor(0);
        savedText.setDepth(99999);

        // Fade out and destroy after 2 seconds
        this.tweens.add({
            targets: savedText,
            alpha: 0,
            duration: 2000,
            delay: 500,
            onComplete: () => {
                savedText.destroy();
            }
        });

        // Also add to notification ticker
        this.uiManager.addNotification('💾 Game saved successfully!');
    }

    collectIncome(building) {
        let income = 0;

        // For apartments, collect from all rented units
        if (building.type === 'apartment' && building.units) {
            for (let unit of building.units) {
                if (unit.rented && unit.accumulatedIncome) {
                    income += unit.accumulatedIncome;
                    unit.accumulatedIncome = 0;
                }
            }
        } else {
            // For regular buildings (house, shop, restaurant)
            income = building.accumulatedIncome;
            building.accumulatedIncome = 0;
            building.lastIncomeTime = Date.now();
        }

        income = Math.floor(income);

        if (income > 0) {
            this.money += income;
            this.money = Math.round(this.money);

            const buildingType = this.buildingTypes[building.type];
            console.log(`Collected $${income} from ${buildingType.name}! Total money: $${this.money}`);

            // Hide income indicator
            if (building.incomeIndicator && building.incomeIndicator.scene) {
                building.incomeIndicator.setVisible(false);
            }

            this.saveSystem.saveGame();
        }
    }


    updateBuses() {
        const deltaTime = 1/60; // Approximate 60 FPS

        for (let bus of this.buses) {
            // Update bus position
            const distance = bus.speed * deltaTime;
            bus.x += distance * bus.direction;
            bus.container.x = bus.x;

            // Check if at a bus stop
            for (let i = 0; i < this.busStops.length; i++) {
                const stop = this.busStops[i];
                const distanceToStop = Math.abs(bus.x - stop.x);

                // If bus is near a stop and moving toward it
                if (distanceToStop < 50 && !bus.isAtStop) {
                    bus.isAtStop = true;
                    bus.stopTimer = 3; // Wait 3 seconds at stop
                    bus.currentStopIndex = i;

                    // Drop off passengers
                    const droppingOff = [];
                    for (let j = bus.passengers.length - 1; j >= 0; j--) {
                        const passenger = bus.passengers[j];
                        // Some passengers randomly get off at stops
                        if (Math.random() < 0.3 || passenger.targetStopIndex === i) {
                            // Remove from bus
                            bus.passengers.splice(j, 1);

                            // If tourist is leaving town, destroy them completely
                            if (passenger.isLeavingTown) {
                                // Remove from citizens array
                                const citizenIndex = this.citizens.indexOf(passenger.citizen);
                                if (citizenIndex > -1) {
                                    this.citizens.splice(citizenIndex, 1);
                                }
                                // Destroy visual
                                if (passenger.citizen.container && passenger.citizen.container.destroy) {
                                    passenger.citizen.container.destroy();
                                }
                                console.log('👋 Tourist left town!');
                            } else {
                                // Regular passenger - place on street
                                passenger.citizen.container.setVisible(true);
                                passenger.citizen.x = stop.x + (Math.random() * 100 - 50);
                                passenger.citizen.container.x = passenger.citizen.x;
                                passenger.citizen.state = 'walking';
                            }
                        }
                    }

                    // Spawn tourists from out of town (20% chance per bus stop)
                    // Theme parks increase tourist spawns!
                    const hasThemePark = this.buildings.some(b => b.type === 'themePark');
                    let spawnChance = hasThemePark ? 0.6 : 0.2; // 3x more tourists with theme park!
                    const maxTourists = hasThemePark ? 6 : 3; // More tourists at once with theme park

                    if (Math.random() < spawnChance) {
                        const touristCount = 1 + Math.floor(Math.random() * maxTourists);
                        for (let t = 0; t < touristCount; t++) {
                            this.citizenSystem.spawnTourist(stop.x);
                        }
                        const parkBonus = hasThemePark ? ' 🎡' : '';
                        console.log(`🚌 ${touristCount} tourist(s) arrived from out of town!${parkBonus}`);
                    }

                    // Pick up waiting citizens
                    const waitingCitizens = stop.waitingCitizens.slice(); // Copy array
                    for (let citizen of waitingCitizens) {
                        if (bus.passengers.length < 20) { // Bus capacity
                            // Check if tourist is leaving town (has targetBusStop set)
                            // Note: Hotel checkout now happens in CitizenSystem when tourist time expires
                            const isLeavingTown = citizen.isTourist && citizen.targetBusStop;

                            bus.passengers.push({
                                citizen: citizen,
                                targetStopIndex: isLeavingTown ? -1 : Math.floor(Math.random() * this.busStops.length), // -1 means leaving town
                                isLeavingTown: isLeavingTown
                            });
                            citizen.container.setVisible(false); // Hide citizen while on bus
                            citizen.state = 'riding';

                            if (isLeavingTown) {
                                console.log('🚌 Tourist boarding bus to leave town');
                            }

                            // Remove from waiting list
                            const index = stop.waitingCitizens.indexOf(citizen);
                            if (index > -1) {
                                stop.waitingCitizens.splice(index, 1);
                            }
                        }
                    }
                }
            }

            // Handle stop timer
            if (bus.isAtStop) {
                bus.stopTimer -= deltaTime;
                if (bus.stopTimer <= 0) {
                    bus.isAtStop = false;
                }
            }

            // Reverse direction at ends of street
            if (bus.x > 11900) {
                bus.direction = -1;
                bus.container.setScale(-1, 1); // Flip bus sprite
            } else if (bus.x < 100) {
                bus.direction = 1;
                bus.container.setScale(1, 1); // Normal direction
            }
        }
    }

    // Citizen update function moved to CitizenSystem.js

    updateCityNameDisplay() {
        if (this.cityNameDisplay) {
            this.cityNameDisplay.setText(`🏙️ ${this.cityName}`);
        }
    }

    showCityNamePrompt() {
        const newName = prompt('Enter a name for your city:', this.cityName);
        if (newName && newName.trim().length > 0) {
            this.cityName = newName.trim();
            this.updateCityNameDisplay();
            this.uiManager.addNotification(`City renamed to: ${this.cityName}`);
        }
    }

    showHelpMenu() {
        // Create help window
        const helpWindow = this.add.container(this.gameWidth / 2, this.gameHeight / 2);
        helpWindow.setScrollFactor(0).setDepth(100001);

        // Background
        const bg = this.add.graphics();
        bg.fillStyle(0x1a1a1a, 0.98);
        bg.fillRoundedRect(-400, -300, 800, 600, 10);
        bg.lineStyle(3, 0x4CAF50, 1);
        bg.strokeRoundedRect(-400, -300, 800, 600, 10);
        helpWindow.add(bg);

        // Title
        const title = this.add.text(0, -270, '❓ KEYBOARD CONTROLS & HELP', {
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#4CAF50',
            align: 'center'
        });
        title.setOrigin(0.5, 0);
        helpWindow.add(title);

        // Help text
        const helpText = `
MOVEMENT & CAMERA:
  Arrow Keys / WASD - Move camera left/right
  V Key - Toggle Bird's Eye View (see all streets)
  Page Up / Page Down (or Shift+Up/Down Arrow) - Switch between streets

BUILD MODE:
  B Key - Toggle build mode
  Number Keys - Select building to place
  Click - Place selected building
  ESC - Exit build mode

DELETE MODE:
  X Key - Toggle delete/demolish mode
  Click - Delete selected building
  ESC - Exit delete mode

SPEED CONTROLS:
  Bottom-left buttons control game speed (Pause, 1x, 2x, 3x)

INTERACTIONS:
  E / Enter - Interact with buildings
    • Enter shops, hotels, restaurants to collect income
    • Use banks, markets, mills, factories
    • Check rental applications at mailboxes
  ESC - Close menus and windows

UI BUTTONS:
  📊 TALLY - View count of all buildings
  🏙️ City Name - Click to rename your city
  ⚙️ MENU - Settings (Restart, Creative, Travel, etc.)

MOUSE:
  Hover over buildings - See info tooltip
  Click & drag buildings in build mode

TIPS:
  • Build houses & apartments for residents
  • Bus stops bring tourists to your town
  • Approve rental applications at mailboxes
  • Banks pay 15% annual interest on savings
  • Property taxes collected daily
  • Emergency services improve city ratings
        `.trim();

        const text = this.add.text(-370, -220, helpText, {
            fontSize: '15px',
            color: '#ffffff',
            lineSpacing: 6
        });
        helpWindow.add(text);

        // Close button
        const closeBtn = this.add.text(0, 250, '✖ CLOSE', {
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#ffffff',
            backgroundColor: '#4CAF50',
            padding: { x: 30, y: 10 }
        }).setOrigin(0.5).setInteractive();

        closeBtn.on('pointerdown', () => {
            helpWindow.destroy();
        });

        closeBtn.on('pointerover', () => {
            closeBtn.setStyle({ backgroundColor: '#66BB6A' });
        });

        closeBtn.on('pointerout', () => {
            closeBtn.setStyle({ backgroundColor: '#4CAF50' });
        });

        helpWindow.add(closeBtn);

        // ESC key to close
        const escKey = this.input.keyboard.addKey('ESC');
        const escHandler = () => {
            helpWindow.destroy();
            escKey.off('down', escHandler);
        };
        escKey.on('down', escHandler);
    }
}

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    backgroundColor: '#1a1a1a',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false
        }
    },
    scene: [MainScene],
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    render: {
        pixelArt: false,  // Allow anti-aliasing for smooth text
        antialias: true,  // Enable anti-aliasing
        roundPixels: true // Round pixels to prevent blurry sub-pixel rendering
    }
};

const game = new Phaser.Game(config);
