/**
 * MobileControls - Arrow buttons and touch controls for mobile devices
 */

export class MobileControls {
    constructor(scene) {
        this.scene = scene;
        this.enabled = false;
        this.movement = { x: 0, y: 0 };

        // Arrow button states
        this.arrowStates = {
            up: false,
            down: false,
            left: false,
            right: false
        };

        // Action button states
        this.actionButtonPressed = false;
        this.buildButtonPressed = false;

        // Check if device is touch-capable or running in Capacitor (iOS app)
        const hasTouch = 'ontouchstart' in window;
        const hasMaxTouchPoints = navigator.maxTouchPoints > 0;
        const hasCapacitor = window.Capacitor !== undefined;

        this.isTouchDevice = hasTouch || hasMaxTouchPoints || hasCapacitor;

        console.log('🎮 MobileControls - isTouchDevice:', this.isTouchDevice);

        if (this.isTouchDevice) {
            console.log('✅ Creating mobile controls');
            this.createArrowButtons();
            this.createActionButtons();
            this.enabled = true;
        } else {
            console.log('❌ Mobile controls disabled - not a touch device');
        }
    }

    createArrowButtons() {
        const buttonSize = 50;
        const spacing = 60;
        const leftMargin = 100;
        const bottomMargin = 140;

        // Use worldHeight for positioning (900 on mobile) instead of gameHeight (1180)
        const yBase = this.scene.worldHeight - bottomMargin;

        console.log('📍 Arrow button positioning - worldHeight:', this.scene.worldHeight, 'yBase:', yBase);

        // Container for arrow buttons
        this.arrowContainer = this.scene.add.container(0, 0);
        this.arrowContainer.setScrollFactor(0).setDepth(20000);

        this.arrowButtons = {};

        // Up arrow
        this.arrowButtons.up = this.scene.add.circle(
            leftMargin,
            yBase - spacing,
            buttonSize / 2,
            0x4CAF50,
            0.7
        );
        this.arrowButtons.up.setStrokeStyle(3, 0x66BB6A, 1);
        this.arrowButtons.up.setScrollFactor(0).setDepth(20000);

        const upText = this.scene.add.text(
            leftMargin,
            yBase - spacing,
            '▲',
            { fontSize: '28px', fontWeight: 'bold', color: '#ffffff' }
        );
        upText.setOrigin(0.5);
        upText.setScrollFactor(0).setDepth(20001);
        this.arrowButtons.upText = upText;

        // Down arrow
        this.arrowButtons.down = this.scene.add.circle(
            leftMargin,
            yBase + spacing,
            buttonSize / 2,
            0x4CAF50,
            0.7
        );
        this.arrowButtons.down.setStrokeStyle(3, 0x66BB6A, 1);
        this.arrowButtons.down.setScrollFactor(0).setDepth(20000);

        const downText = this.scene.add.text(
            leftMargin,
            yBase + spacing,
            '▼',
            { fontSize: '28px', fontWeight: 'bold', color: '#ffffff' }
        );
        downText.setOrigin(0.5);
        downText.setScrollFactor(0).setDepth(20001);
        this.arrowButtons.downText = downText;

        // Left arrow
        this.arrowButtons.left = this.scene.add.circle(
            leftMargin - spacing,
            yBase,
            buttonSize / 2,
            0x4CAF50,
            0.7
        );
        this.arrowButtons.left.setStrokeStyle(3, 0x66BB6A, 1);
        this.arrowButtons.left.setScrollFactor(0).setDepth(20000);

        const leftText = this.scene.add.text(
            leftMargin - spacing,
            yBase,
            '◄',
            { fontSize: '28px', fontWeight: 'bold', color: '#ffffff' }
        );
        leftText.setOrigin(0.5);
        leftText.setScrollFactor(0).setDepth(20001);
        this.arrowButtons.leftText = leftText;

        // Right arrow
        this.arrowButtons.right = this.scene.add.circle(
            leftMargin + spacing,
            yBase,
            buttonSize / 2,
            0x4CAF50,
            0.7
        );
        this.arrowButtons.right.setStrokeStyle(3, 0x66BB6A, 1);
        this.arrowButtons.right.setScrollFactor(0).setDepth(20000);

        const rightText = this.scene.add.text(
            leftMargin + spacing,
            yBase,
            '►',
            { fontSize: '28px', fontWeight: 'bold', color: '#ffffff' }
        );
        rightText.setOrigin(0.5);
        rightText.setScrollFactor(0).setDepth(20001);
        this.arrowButtons.rightText = rightText;

        // Make buttons interactive
        ['up', 'down', 'left', 'right'].forEach(direction => {
            this.arrowButtons[direction].setInteractive();

            this.arrowButtons[direction].on('pointerdown', () => {
                this.arrowStates[direction] = true;
                this.arrowButtons[direction].setAlpha(1);
                this.updateMovement();
            });

            this.arrowButtons[direction].on('pointerup', () => {
                this.arrowStates[direction] = false;
                this.arrowButtons[direction].setAlpha(0.7);
                this.updateMovement();
            });

            this.arrowButtons[direction].on('pointerout', () => {
                this.arrowStates[direction] = false;
                this.arrowButtons[direction].setAlpha(0.7);
                this.updateMovement();
            });
        });
    }

    updateMovement() {
        this.movement.x = 0;
        this.movement.y = 0;

        if (this.arrowStates.left) this.movement.x = -1;
        if (this.arrowStates.right) this.movement.x = 1;
        if (this.arrowStates.up) this.movement.y = -1;
        if (this.arrowStates.down) this.movement.y = 1;
    }

    createActionButtons() {
        const buttonSize = 60;
        const rightMargin = 100;
        const bottomMargin = 120;

        // Use worldHeight for positioning
        const yBase = this.scene.worldHeight - bottomMargin;

        // Action button (E key equivalent - Enter buildings, collect money, etc.)
        this.actionButton = this.scene.add.circle(
            this.scene.gameWidth - rightMargin,
            yBase,
            buttonSize / 2,
            0x4CAF50,
            0.8
        );
        this.actionButton.setStrokeStyle(3, 0x66BB6A, 1);
        this.actionButton.setScrollFactor(0).setDepth(20000).setAlpha(0);

        // Action button text
        this.actionButtonText = this.scene.add.text(
            this.scene.gameWidth - rightMargin,
            yBase,
            'E',
            { fontSize: '24px', fontWeight: 'bold', color: '#ffffff' }
        );
        this.actionButtonText.setOrigin(0.5);
        this.actionButtonText.setScrollFactor(0).setDepth(20001).setAlpha(0);

        // Make action button interactive
        this.actionButton.setInteractive();
        this.actionButton.on('pointerdown', () => {
            this.actionButtonPressed = true;
            this.actionButton.setAlpha(1);
        });
        this.actionButton.on('pointerup', () => {
            this.actionButtonPressed = false;
            this.actionButton.setAlpha(0.7);
        });
        this.actionButton.on('pointerout', () => {
            this.actionButtonPressed = false;
            this.actionButton.setAlpha(0.7);
        });

        // Space button (for building placement)
        this.spaceButton = this.scene.add.circle(
            this.scene.gameWidth - rightMargin,
            yBase - 80,
            buttonSize / 2,
            0x2196F3,
            0.8
        );
        this.spaceButton.setStrokeStyle(3, 0x42A5F5, 1);
        this.spaceButton.setScrollFactor(0).setDepth(20000).setAlpha(0);

        // Space button text
        this.spaceButtonText = this.scene.add.text(
            this.scene.gameWidth - rightMargin,
            yBase - 80,
            '⎵',
            { fontSize: '28px', fontWeight: 'bold', color: '#ffffff' }
        );
        this.spaceButtonText.setOrigin(0.5);
        this.spaceButtonText.setScrollFactor(0).setDepth(20001).setAlpha(0);

        // Make space button interactive
        this.spaceButton.setInteractive();
        this.spaceButton.on('pointerdown', () => {
            this.buildButtonPressed = true;
            this.spaceButton.setAlpha(1);
        });
        this.spaceButton.on('pointerup', () => {
            this.buildButtonPressed = false;
            this.spaceButton.setAlpha(0.7);
        });
        this.spaceButton.on('pointerout', () => {
            this.buildButtonPressed = false;
            this.spaceButton.setAlpha(0.7);
        });
    }

    getMovement() {
        if (!this.enabled) {
            return { x: 0, y: 0 };
        }
        return this.movement;
    }

    isActionButtonPressed() {
        const pressed = this.actionButtonPressed;
        if (pressed) {
            this.actionButtonPressed = false; // Reset after reading
        }
        return pressed;
    }

    isBuildButtonPressed() {
        const pressed = this.buildButtonPressed;
        if (pressed) {
            this.buildButtonPressed = false; // Reset after reading
        }
        return pressed;
    }

    showActionButton(show) {
        if (this.actionButton && this.actionButtonText) {
            this.actionButton.setAlpha(show ? 0.7 : 0);
            this.actionButtonText.setAlpha(show ? 1 : 0);
        }
    }

    showSpaceButton(show) {
        if (this.spaceButton && this.spaceButtonText) {
            this.spaceButton.setAlpha(show ? 0.7 : 0);
            this.spaceButtonText.setAlpha(show ? 1 : 0);
        }
    }

    isActive() {
        return this.enabled;
    }

    update() {
        // Update arrow button positions if screen resizes
        const leftMargin = 100;
        const bottomMargin = 140;
        const spacing = 60;
        const yBase = this.scene.worldHeight - bottomMargin;

        if (this.arrowButtons) {
            // Up arrow
            this.arrowButtons.up.x = leftMargin;
            this.arrowButtons.up.y = yBase - spacing;
            this.arrowButtons.upText.x = leftMargin;
            this.arrowButtons.upText.y = yBase - spacing;

            // Down arrow
            this.arrowButtons.down.x = leftMargin;
            this.arrowButtons.down.y = yBase + spacing;
            this.arrowButtons.downText.x = leftMargin;
            this.arrowButtons.downText.y = yBase + spacing;

            // Left arrow
            this.arrowButtons.left.x = leftMargin - spacing;
            this.arrowButtons.left.y = yBase;
            this.arrowButtons.leftText.x = leftMargin - spacing;
            this.arrowButtons.leftText.y = yBase;

            // Right arrow
            this.arrowButtons.right.x = leftMargin + spacing;
            this.arrowButtons.right.y = yBase;
            this.arrowButtons.rightText.x = leftMargin + spacing;
            this.arrowButtons.rightText.y = yBase;
        }

        // Update action button positions
        const rightMargin = 100;
        const actionBottomMargin = 120;
        const actionYBase = this.scene.worldHeight - actionBottomMargin;

        if (this.actionButton) {
            this.actionButton.x = this.scene.gameWidth - rightMargin;
            this.actionButton.y = actionYBase;
            this.actionButtonText.x = this.scene.gameWidth - rightMargin;
            this.actionButtonText.y = actionYBase;
        }

        if (this.spaceButton) {
            this.spaceButton.x = this.scene.gameWidth - rightMargin;
            this.spaceButton.y = actionYBase - 80;
            this.spaceButtonText.x = this.scene.gameWidth - rightMargin;
            this.spaceButtonText.y = actionYBase - 80;
        }
    }

    destroy() {
        if (this.arrowButtons) {
            Object.keys(this.arrowButtons).forEach(key => {
                if (this.arrowButtons[key] && this.arrowButtons[key].destroy) {
                    this.arrowButtons[key].destroy();
                }
            });
        }
        if (this.arrowContainer) {
            this.arrowContainer.destroy();
        }
    }

    setVisible(visible) {
        if (this.arrowButtons) {
            Object.keys(this.arrowButtons).forEach(key => {
                if (this.arrowButtons[key] && this.arrowButtons[key].setVisible) {
                    this.arrowButtons[key].setVisible(visible);
                }
            });
        }
    }
}
