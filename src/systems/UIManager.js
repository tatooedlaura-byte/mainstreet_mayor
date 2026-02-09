/**
 * UIManager - Manages all UI updates and displays
 * Handles resource displays, prompts, menus, and notifications
 */
export class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.notifications = []; // Queue of notification messages
        this.maxNotifications = 5; // Show last 5 notifications
    }

    createNotificationTicker() {
        // Create notification ticker at bottom of screen
        this.scene.notificationTicker = this.scene.add.text(10, this.scene.gameHeight - 30, '', {
            fontSize: '14px',
            color: '#FFFFFF',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 },
            alpha: 0.8
        }).setScrollFactor(0).setDepth(20000).setOrigin(0, 0);
    }

    addNotification(message) {
        // Add timestamp
        const totalMinutes = Math.floor(this.scene.gameTime);
        const hour = Math.floor((totalMinutes % (24 * 60)) / 60);
        const minute = totalMinutes % 60;
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

        const notification = `[${timeStr}] ${message}`;
        this.notifications.push(notification);

        // Keep only last maxNotifications
        if (this.notifications.length > this.maxNotifications) {
            this.notifications.shift();
        }

        // Update ticker display
        this.updateNotificationTicker();
    }

    updateNotificationTicker() {
        if (!this.scene.notificationTicker) return;

        // Join notifications with line breaks
        const text = this.notifications.join('\n');
        this.scene.notificationTicker.setText(text);
    }

    updateMoneyUI() {
        // Count residents vs tourists
        const residentCount = this.scene.citizens.filter(c => !c.isTourist).length;
        const touristCount = this.scene.citizens.filter(c => c.isTourist).length;

        // Update resource UI with current money, wood, bricks, and population
        let resourceText = `💰 Cash: $${Math.round(this.scene.money)}  🪵 ${this.scene.wood}  🧱 ${this.scene.bricks}  👥 Residents: ${residentCount}/${this.scene.populationCapacity}  🧳 Tourists: ${touristCount}`;
        if (this.scene.creativeMode) resourceText += `  [CREATIVE MODE]`;
        if (this.scene.bankBalance > 0) resourceText += `\n🏦 Bank: $${Math.round(this.scene.bankBalance)}`;
        if (this.scene.loanAmount > 0) resourceText += `\n💳 Debt: $${Math.round(this.scene.loanAmount)}`;
        this.scene.resourceUI.setText(resourceText);

        // Main resource UI always shows current money (no need for separate cash on hand display)
    }

    updateSpeedButtons() {
        // Update speed button styles to highlight active speed
        const activeColor = '#2E7D32';  // Green for active
        const inactiveColor = '#424242'; // Gray for inactive

        // Update speed buttons
        this.scene.speed1xButton.setStyle({ backgroundColor: this.scene.timeSpeed === 1 ? activeColor : inactiveColor });
        this.scene.speed2xButton.setStyle({ backgroundColor: this.scene.timeSpeed === 2 ? activeColor : inactiveColor });
        this.scene.speed3xButton.setStyle({ backgroundColor: this.scene.timeSpeed === 3 ? activeColor : inactiveColor });

        // Dim all buttons if paused
        if (this.scene.isPaused) {
            this.scene.speed1xButton.setStyle({ backgroundColor: inactiveColor });
            this.scene.speed2xButton.setStyle({ backgroundColor: inactiveColor });
            this.scene.speed3xButton.setStyle({ backgroundColor: inactiveColor });
        }
    }

    showBuildingEntryMessage(buildingName, collectedIncome) {
        // Create temporary collection message if needed
        if (!this.scene.buildingEntryMessage) {
            this.scene.buildingEntryMessage = this.scene.add.text(this.scene.gameWidth / 2, 100, '', {
                fontSize: '20px',
                color: '#FFFFFF',
                backgroundColor: '#000000',
                padding: { x: 20, y: 10 },
                align: 'center'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(20000);
        }

        // Build temporary message (entered + collected)
        let tempMessage = `Entered ${buildingName}`;
        if (collectedIncome > 0) {
            tempMessage += `\n💰 Collected: $${collectedIncome}`;
        }

        // Show temporary message
        this.scene.buildingEntryMessage.setText(tempMessage);
        this.scene.buildingEntryMessage.setVisible(true);

        // Main resource UI stays visible (shows cash, wood, bricks, population)

        // Hide temporary message after 4 seconds
        this.scene.time.delayedCall(4000, () => {
            if (this.scene.buildingEntryMessage) {
                this.scene.buildingEntryMessage.setVisible(false);
            }
        });
    }

    updateMailboxUI() {
        // Safety check: only update if menu exists and is visible
        if (!this.scene.mailboxUI || !this.scene.mailboxUI.visible || !this.scene.mailboxMenuOpen) {
            return;
        }

        if (this.scene.pendingApplications.length === 0) {
            this.scene.closeMailboxMenu();
            return;
        }

        const currentBatch = this.scene.pendingApplications[0];
        const applications = currentBatch.applications;
        const currentApp = applications[this.scene.currentApplicationIndex];

        let menuText = `=== RENTAL APPLICATION ===\n`;
        menuText += `Unit: Apartment #${currentBatch.unitIndex + 1}\n`;
        menuText += `Application ${this.scene.currentApplicationIndex + 1} of ${applications.length}\n\n`;
        menuText += `Applicant: ${currentApp.name}\n`;
        menuText += `Occupation: ${currentApp.job}\n`;
        menuText += `Employment: ${currentApp.employmentLength} months\n`;
        menuText += `Credit Score: ${currentApp.creditScore}\n`;
        menuText += `Monthly Rent Offer: $${currentApp.rentOffer}/min\n\n`;

        // Credit rating
        let rating = '';
        if (currentApp.creditScore >= 750) rating = '⭐ Excellent (Very Low Risk)';
        else if (currentApp.creditScore >= 650) rating = '✓ Good (Low Risk)';
        else if (currentApp.creditScore >= 550) rating = '⚠ Fair (Moderate Risk)';
        else rating = '❌ Poor (HIGH RISK!)';
        menuText += `Rating: ${rating}\n\n`;

        menuText += `← → : View other applications\n`;
        menuText += `ENTER : Accept this applicant\n`;
        menuText += `ESC : Close mailbox\n`;

        try {
            this.scene.mailboxUI.setText(menuText);
        } catch (error) {
            console.error('Error updating mailbox UI:', error);
        }
    }

    updateBankUI() {
        let menuText = '=== MAIN STREET BANK ===\n';
        menuText += `💰 Cash on Hand: $${Math.round(this.scene.money)}\n`;
        menuText += `🏦 Bank Balance: $${Math.round(this.scene.bankBalance)} (15% interest)\n`;
        menuText += `💳 Loan Debt: $${Math.round(this.scene.loanAmount)}\n\n`;
        menuText += '1: Deposit (custom amount)\n';
        menuText += '2: Withdraw (custom amount)\n';
        menuText += '3: Borrow (custom amount, 10% interest)\n';
        menuText += 'E/Enter: Close';
        this.scene.bankUI.setText(menuText);
    }

    showTaxCollectionPopup(totalTax, totalMaintenance) {
        // Create popup if it doesn't exist
        if (!this.scene.taxPopup) {
            this.scene.taxPopup = this.scene.add.text(
                this.scene.gameWidth / 2,
                this.scene.gameHeight / 2,
                '',
                {
                    fontSize: '24px',
                    color: '#FFFFFF',
                    backgroundColor: '#000000',
                    padding: { x: 30, y: 20 },
                    align: 'center'
                }
            ).setOrigin(0.5).setScrollFactor(0).setDepth(30000);
        }

        // Build popup text
        let popupText = '=== DAILY EXPENSES ===\n\n';
        if (totalTax > 0) {
            popupText += `🏛️ Property Tax: -$${totalTax}\n`;
        }
        if (totalMaintenance > 0) {
            popupText += `🔧 Maintenance: -$${totalMaintenance}\n`;
        }
        popupText += `\nTotal: -$${totalTax + totalMaintenance}\n\n`;
        popupText += 'Press ENTER or SPACE to continue';

        this.scene.taxPopup.setText(popupText);
        this.scene.taxPopup.setVisible(true);

        // Set flag to pause game and wait for input
        this.scene.taxPopupShowing = true;
        this.scene.wasPausedBeforeTaxPopup = this.scene.isPaused;
        this.scene.isPaused = true;
    }

    closeTaxCollectionPopup() {
        if (this.scene.taxPopup) {
            this.scene.taxPopup.setVisible(false);
        }
        this.scene.taxPopupShowing = false;
        // Restore previous pause state
        this.scene.isPaused = this.scene.wasPausedBeforeTaxPopup;
    }

    showBuildingTally() {
        // Count buildings by type
        const tally = {};
        for (let building of this.scene.buildings) {
            const type = building.type;
            tally[type] = (tally[type] || 0) + 1;
        }

        // Create UI if it doesn't exist
        if (!this.scene.buildingTallyUI) {
            this.scene.buildingTallyUI = this.scene.add.container(20, 100);
            this.scene.buildingTallyUI.setScrollFactor(0).setDepth(9998);

            const bg = this.scene.add.graphics();
            bg.fillStyle(0x1a1a1a, 0.95);
            bg.fillRoundedRect(0, 0, 280, 500, 10);
            bg.lineStyle(3, 0x4CAF50, 1);
            bg.strokeRoundedRect(0, 0, 280, 500, 10);
            this.scene.buildingTallyUI.add(bg);

            const title = this.scene.add.text(140, 15, '📊 BUILDING TALLY', {
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#4CAF50',
                align: 'center'
            });
            title.setOrigin(0.5, 0);
            this.scene.buildingTallyUI.add(title);

            this.scene.buildingTallyText = this.scene.add.text(15, 50, '', {
                fontSize: '14px',
                color: '#ffffff',
                lineSpacing: 4
            });
            this.scene.buildingTallyUI.add(this.scene.buildingTallyText);
        }

        // Build text
        let text = '';
        const typeNames = {
            'house': '🏠 Houses',
            'apartment': '🏢 Apartments',
            'shop': '🏪 Shops',
            'hotel': '🏨 Hotels',
            'restaurant': '🍽️ Restaurants',
            'park': '🌳 Parks',
            'busstop': '🚌 Bus Stops',
            'market': '🛒 Markets',
            'lumbermill': '🪵 Lumber Mills',
            'brickfactory': '🧱 Brick Factories',
            'bank': '🏦 Banks',
            'trainstation': '🚂 Train Stations',
            'school': '🏫 Schools',
            'office': '🏢 Offices',
            'movietheater': '🎬 Movie Theaters',
            'firestation': '🚒 Fire Stations',
            'policestation': '👮 Police Stations',
            'hospital': '🏥 Hospitals',
            'arcade': '🎮 Arcades',
            'bakery': '🥐 Bakeries',
            'library': '📚 Libraries',
            'museum': '🏛️ Museums'
        };

        // Sort by count (descending)
        const sortedTypes = Object.entries(tally).sort((a, b) => b[1] - a[1]);

        for (let [type, count] of sortedTypes) {
            const name = typeNames[type] || type;
            text += `${name}: ${count}\n`;
        }

        if (sortedTypes.length === 0) {
            text = 'No buildings built yet!';
        } else {
            text += `\nTotal: ${this.scene.buildings.length} buildings`;
        }

        this.scene.buildingTallyText.setText(text);
        this.scene.buildingTallyUI.setVisible(true);
        this.scene.buildingTallyOpen = true;
    }

    hideBuildingTally() {
        if (this.scene.buildingTallyUI) {
            this.scene.buildingTallyUI.setVisible(false);
        }
        this.scene.buildingTallyOpen = false;
    }

    showBuildingTooltip(building, x, y) {
        // Create tooltip if it doesn't exist
        if (!this.scene.buildingTooltip) {
            this.scene.buildingTooltip = this.scene.add.container(0, 0);
            this.scene.buildingTooltip.setScrollFactor(0).setDepth(99999);

            const bg = this.scene.add.graphics();
            this.scene.buildingTooltip.bg = bg;
            this.scene.buildingTooltip.add(bg);

            const text = this.scene.add.text(0, 0, '', {
                fontSize: '14px',
                color: '#ffffff',
                padding: { x: 10, y: 8 },
                lineSpacing: 2
            });
            this.scene.buildingTooltip.text = text;
            this.scene.buildingTooltip.add(text);
        }

        // Get building info
        const buildingType = this.scene.buildingTypes[building.type];
        if (!buildingType) return;

        // Don't show tooltip if building doesn't have proper display info
        if (!buildingType.emoji || !buildingType.name) return;

        let tooltipText = `${buildingType.emoji} ${buildingType.name}\n`;

        // Add income info
        if (building.accumulatedIncome > 0) {
            tooltipText += `💰 Income: $${Math.round(building.accumulatedIncome)}\n`;
        }

        // Add occupancy info for apartments
        if (building.units && building.units.length > 0) {
            const occupied = building.units.filter(u => u.tenant).length;
            const total = building.units.length;
            tooltipText += `🏠 Occupied: ${occupied}/${total}\n`;
        }

        // Add occupancy info for hotels
        if (building.rooms && building.rooms.length > 0) {
            const occupied = building.rooms.filter(r => r.isOccupied).length;
            const total = building.rooms.length;
            tooltipText += `🛏️ Rooms: ${occupied}/${total} occupied\n`;
        }

        // Add resource info for lumber mill and brick factory
        if (building.storedResources !== undefined) {
            const available = Math.floor(building.storedResources);
            tooltipText += `📦 Available: ${available}\n`;
        }

        // Add school info
        if (building.schoolData) {
            tooltipText += `👨‍🎓 Students: ${building.schoolData.currentEnrollment}/${building.schoolData.capacity}\n`;
            tooltipText += `⭐ Rating: ${building.schoolData.rating}/100\n`;
        }

        // Add office info
        if (building.officeData) {
            tooltipText += `💼 Employees: ${building.officeData.employees}\n`;
        }

        // Add fire station info
        if (building.fireStationData) {
            tooltipText += `🚒 Trucks: ${building.fireStationData.trucks}\n`;
            tooltipText += `👨‍🚒 Staff: ${building.fireStationData.staff}\n`;
        }

        // Add police station info
        if (building.policeStationData) {
            tooltipText += `🚔 Vehicles: ${building.policeStationData.vehicles}\n`;
            tooltipText += `👮 Officers: ${building.policeStationData.officers}\n`;
        }

        // Add hospital info
        if (building.hospitalData) {
            tooltipText += `🛏️ Beds: ${building.hospitalData.beds}\n`;
            tooltipText += `👨‍⚕️ Doctors: ${building.hospitalData.doctors}\n`;
        }

        // Update tooltip
        this.scene.buildingTooltip.text.setText(tooltipText.trim());

        // Update background size
        const textBounds = this.scene.buildingTooltip.text.getBounds();
        this.scene.buildingTooltip.bg.clear();
        this.scene.buildingTooltip.bg.fillStyle(0x1a1a1a, 0.95);
        this.scene.buildingTooltip.bg.fillRoundedRect(-5, -5, textBounds.width + 20, textBounds.height + 16, 5);
        this.scene.buildingTooltip.bg.lineStyle(2, 0x4CAF50, 1);
        this.scene.buildingTooltip.bg.strokeRoundedRect(-5, -5, textBounds.width + 20, textBounds.height + 16, 5);

        // Position tooltip near mouse (screen coordinates)
        const screenX = x;
        const screenY = y;

        // Keep tooltip on screen
        let tooltipX = screenX + 15;
        let tooltipY = screenY + 15;

        if (tooltipX + textBounds.width + 30 > this.scene.gameWidth) {
            tooltipX = screenX - textBounds.width - 30;
        }
        if (tooltipY + textBounds.height + 20 > this.scene.gameHeight) {
            tooltipY = screenY - textBounds.height - 20;
        }

        this.scene.buildingTooltip.setPosition(tooltipX, tooltipY);
        this.scene.buildingTooltip.setVisible(true);
    }

    hideBuildingTooltip() {
        if (this.scene.buildingTooltip) {
            this.scene.buildingTooltip.setVisible(false);
        }
    }

    showMissionsPanel() {
        // Create missions panel if it doesn't exist
        if (!this.scene.missionsPanel) {
            this.scene.missionsPanel = this.scene.add.container(this.scene.gameWidth - 320, 120);
            this.scene.missionsPanel.setScrollFactor(0).setDepth(9998);

            const bg = this.scene.add.graphics();
            bg.fillStyle(0x1a1a1a, 0.95);
            bg.fillRoundedRect(0, 0, 300, 500, 10);
            bg.lineStyle(3, 0xFFD700, 1);
            bg.strokeRoundedRect(0, 0, 300, 500, 10);
            this.scene.missionsPanel.add(bg);

            const title = this.scene.add.text(150, 15, '🏆 MISSIONS', {
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#FFD700',
                align: 'center'
            });
            title.setOrigin(0.5, 0);
            this.scene.missionsPanel.add(title);

            this.scene.missionsText = this.scene.add.text(15, 50, '', {
                fontSize: '13px',
                color: '#ffffff',
                lineSpacing: 4,
                wordWrap: { width: 270 }
            });
            this.scene.missionsPanel.add(this.scene.missionsText);
        }

        // Build missions text
        const activeMissions = this.scene.missionSystem.getActiveMissions();
        const completedMissions = this.scene.missionSystem.getCompletedMissions();

        let text = '✨ ACTIVE MISSIONS:\n';
        if (activeMissions.length === 0) {
            text += 'All missions complete! 🎉\n\n';
        } else {
            for (let mission of activeMissions.slice(0, 4)) { // Show first 4
                const progress = this.scene.missionSystem.getMissionProgress(mission);
                const target = mission.target || 1;

                text += `\n⭕ ${mission.title}\n`;
                text += `${mission.description}\n`;
                text += `Progress: ${progress}/${target}`;

                // Show progress bar
                const percentage = Math.min(100, Math.floor((progress / target) * 100));
                const filled = Math.floor(percentage / 10);
                const empty = 10 - filled;
                text += `\n[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${percentage}%\n`;

                // Show rewards
                const rewards = [];
                if (mission.reward.money) rewards.push(`$${mission.reward.money}`);
                if (mission.reward.wood) rewards.push(`${mission.reward.wood}🪵`);
                if (mission.reward.bricks) rewards.push(`${mission.reward.bricks}🧱`);
                text += `Reward: ${rewards.join(', ')}\n`;
            }
        }

        text += `\n🏆 COMPLETED: ${completedMissions.length}/${this.scene.missionSystem.missions.length}`;

        // List recently completed missions
        if (completedMissions.length > 0) {
            text += '\n\nRecent completions:';
            for (let mission of completedMissions.slice(-3)) { // Last 3
                text += `\n✅ ${mission.title}`;
            }
        }

        this.scene.missionsText.setText(text);
        this.scene.missionsPanel.setVisible(true);
        this.scene.missionsMenuOpen = true;
    }

    hideMissionsPanel() {
        if (this.scene.missionsPanel) {
            this.scene.missionsPanel.setVisible(false);
        }
        this.scene.missionsMenuOpen = false;
    }

    showStatsPanel() {
        // Create stats panel if it doesn't exist
        if (!this.scene.statsPanel) {
            this.scene.statsPanel = this.scene.add.container(this.scene.gameWidth - 340, 120);
            this.scene.statsPanel.setScrollFactor(0).setDepth(9998);

            const bg = this.scene.add.graphics();
            bg.fillStyle(0x1a1a1a, 0.95);
            bg.fillRoundedRect(0, 0, 320, 550, 10);
            bg.lineStyle(3, 0x4CAF50, 1);
            bg.strokeRoundedRect(0, 0, 320, 550, 10);
            this.scene.statsPanel.add(bg);

            const title = this.scene.add.text(160, 15, '📊 CITY STATISTICS', {
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#4CAF50',
                align: 'center'
            });
            title.setOrigin(0.5, 0);
            this.scene.statsPanel.add(title);

            this.scene.statsText = this.scene.add.text(15, 50, '', {
                fontSize: '12px',
                color: '#ffffff',
                lineSpacing: 3,
                wordWrap: { width: 290 }
            });
            this.scene.statsPanel.add(this.scene.statsText);
        }

        // Calculate statistics
        let text = '';

        // Overall stats
        text += `🏙️ CITY OVERVIEW:\n`;
        text += `Total Buildings: ${this.scene.buildings.length}\n`;
        const residentCount = this.scene.citizens ? this.scene.citizens.filter(c => !c.isTourist).length : 0;
        const touristCount = this.scene.citizens ? this.scene.citizens.filter(c => c.isTourist).length : 0;
        text += `Residents: ${residentCount}/${this.scene.populationCapacity}\n`;
        text += `Tourists: ${touristCount}\n`;
        text += `Unlocked Streets: ${this.scene.unlockedStreets}\n\n`;

        // Financial summary
        text += `💰 INCOME POTENTIAL:\n`;

        // Calculate total accumulated income available to collect
        let totalAccumulated = 0;
        let potentialIncomeRate = 0; // Income per real minute at current speed

        for (let building of this.scene.buildings) {
            const buildingType = this.scene.buildingTypes[building.type];

            // Add accumulated income ready to collect
            if (building.accumulatedIncome) {
                totalAccumulated += building.accumulatedIncome;
            }

            // Calculate potential income rate
            if (buildingType && buildingType.incomeRate) {
                const streetBonus = building.streetBonus || 1.0;
                const districtBonus = building.districtBonus || 1.0;
                // Income per real minute at current timeSpeed
                potentialIncomeRate += buildingType.incomeRate * this.scene.timeSpeed * streetBonus * districtBonus;
            }

            // Add apartment income
            if (building.type === 'apartment' && building.units) {
                for (let unit of building.units) {
                    if (unit.accumulatedIncome) {
                        totalAccumulated += unit.accumulatedIncome;
                    }
                    if (unit.rented && unit.tenant) {
                        const streetBonus = building.streetBonus || 1.0;
                        const districtBonus = building.districtBonus || 1.0;
                        potentialIncomeRate += unit.tenant.rentOffer * this.scene.timeSpeed * streetBonus * districtBonus;
                    }
                }
            }

            // Hotels have nightly income
            if (building.accumulatedIncome && building.type === 'hotel') {
                totalAccumulated += building.accumulatedIncome;
            }
        }

        // Calculate daily expenses
        let dailyTaxes = 0;
        let dailyMaintenance = 0;

        for (let building of this.scene.buildings) {
            const buildingType = this.scene.buildingTypes[building.type];
            if (buildingType && buildingType.cost) {
                dailyTaxes += Math.floor(buildingType.cost * this.scene.propertyTaxRate);
            }
            if (buildingType && buildingType.maintenanceCost) {
                dailyMaintenance += buildingType.maintenanceCost;
            }
        }

        text += `Ready to collect: +$${Math.floor(totalAccumulated)}\n`;
        text += `Generation rate: +$${Math.floor(potentialIncomeRate)}/min\n`;
        text += `(at ${this.scene.timeSpeed}x speed)\n`;
        text += `\n💸 EXPENSES:\n`;
        text += `Property Tax: -$${dailyTaxes}/game-day\n`;
        if (dailyMaintenance > 0) {
            text += `Maintenance: -$${dailyMaintenance}/game-day\n`;
        }
        const totalExpenses = dailyTaxes + dailyMaintenance;
        text += `Total per day: -$${totalExpenses}\n`;
        text += `\n`;

        // Per-street breakdown
        text += `📍 PER-STREET BREAKDOWN:\n`;
        for (let i = 1; i <= this.scene.unlockedStreets; i++) {
            const street = this.scene.streets.find(s => s.number === i);
            const streetName = street ? street.name : `Street ${i}`;
            const streetBuildings = this.scene.buildings.filter(b => (b.streetNumber || 1) === i);

            text += `\n${streetName}:\n`;
            text += `  Buildings: ${streetBuildings.length}\n`;

            // Count buildings by district
            const districtCounts = {};
            for (let building of streetBuildings) {
                const buildingType = this.scene.buildingTypes[building.type];
                if (!buildingType) continue;
                const district = buildingType.district || 'other';
                districtCounts[district] = (districtCounts[district] || 0) + 1;
            }

            // Show district breakdown
            if (Object.keys(districtCounts).length > 0) {
                text += `  Districts:\n`;
                for (let [district, count] of Object.entries(districtCounts)) {
                    text += `    ${district}: ${count}\n`;
                }
            }

            // Show active bonuses
            const bonusBuildings = streetBuildings.filter(b => b.streetBonusLabel);
            if (bonusBuildings.length > 0) {
                const bonusLabel = bonusBuildings[0].streetBonusLabel;
                text += `  ✨ ${bonusLabel}\n`;
            }
        }

        // Building type counts
        text += `\n🏢 BUILDING TYPES:\n`;
        const typeCounts = {};
        for (let building of this.scene.buildings) {
            const buildingType = this.scene.buildingTypes[building.type];
            if (!buildingType) continue;
            const name = buildingType.name || building.type;
            typeCounts[name] = (typeCounts[name] || 0) + 1;
        }

        // Sort by count and show top types
        const sortedTypes = Object.entries(typeCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8);

        for (let [type, count] of sortedTypes) {
            text += `${type}: ${count}\n`;
        }

        this.scene.statsText.setText(text);
        this.scene.statsPanel.setVisible(true);
        this.scene.statsMenuOpen = true;
    }

    hideStatsPanel() {
        if (this.scene.statsPanel) {
            this.scene.statsPanel.setVisible(false);
        }
        this.scene.statsMenuOpen = false;
    }

    updateResourceBuildingUI() {
        let menuText = '';

        if (this.scene.nearResourceBuilding.type === 'market') {
            menuText = '=== MARKET ===\n';
            menuText += `💰 Cash: $${Math.round(this.scene.money)}\n`;
            menuText += `🪵 Wood: ${this.scene.wood}\n`;
            menuText += `🧱 Bricks: ${this.scene.bricks}\n\n`;
            menuText += '1: Buy 10 Wood ($50)\n';
            menuText += '2: Buy 10 Bricks ($75)\n';
            menuText += 'E/Enter: Close';
        } else if (this.scene.nearResourceBuilding.type === 'lumbermill') {
            const available = Math.floor(this.scene.nearResourceBuilding.storedResources);
            menuText = '=== LUMBER MILL ===\n';
            menuText += `🪵 Available: ${available} wood\n`;
            menuText += `Your Wood: ${this.scene.wood}\n\n`;
            if (available >= 1) {
                menuText += `1: Collect ${available} Wood (Free!)\n`;
            } else {
                menuText += '⏳ Regenerating... (1 wood/min)\n';
            }
            menuText += 'E/Enter: Close';
        } else if (this.scene.nearResourceBuilding.type === 'brickfactory') {
            const available = Math.floor(this.scene.nearResourceBuilding.storedResources);
            menuText = '=== BRICK FACTORY ===\n';
            menuText += `🧱 Available: ${available} bricks\n`;
            menuText += `Your Bricks: ${this.scene.bricks}\n\n`;
            if (available >= 1) {
                menuText += `1: Collect ${available} Bricks (Free!)\n`;
            } else {
                menuText += '⏳ Regenerating... (1 brick/min)\n';
            }
            menuText += 'E/Enter: Close';
        }

        this.scene.resourceBuildingUI.setText(menuText);
    }
}
