// Voxel Paterrn Generator
var Generator = (function() {
	var exports = {};

	// Castle Generator Goals

	// Towers - DONE!
	// Walls - DONE!
	// Doorways	- DONE!
	// Portcullis / Entrance in one wall - DONE!
	// Internal pillars on wall floors
	// Expose generation variables. - DONE!
		// Choice of tower or fort  (fold this into footpint)
	// Auto spacing windows in larger towers - DONE!
	// Windows on Walls - auto spacing - DONE!
	// Block Type Varitions - Defer, arguably would be better to change the design rather than just swap out blocks
	// Pillars to support top wall floors
	// Supports on inter wall floors (but don't take space behind door)
	
	// Parameters

	// Add Window Spacing Parameter
	// Have wall width rather than tower spacing

	// Extensions

	// # New Block Meshes
	// Stairs, Doors, Posts, 45 degree pieces

	// ## Castle Shapes
	// Angled straight walls - feels like a minimum amount from tower should go straight out
	// then you could provide a number of steps to take on the axis you exitted the tower
	// per moving 1 in or out on the other axis
	// Curved Walls - similar to above but the number of steps to take decreases on a pattern
	// and when reaching one it swaps the axes (or starts increasing again but upping the
	// in / out step each time it itterates, whichever is cleaner)
	// Q: Is it worth us making a little canvas based interface for placing towers? and
	// connecting via walls? i.e. a footprint drawer?
	// Related: "Draw outline which builds walls with towers at the corners"

	// ## General
	// Walls should have a maximum depth - and should update door positions accordingly
	// Circular Land with peardrop shape to look like a floating island - DONE!
	// A "Keep" Tower next to entrance if walls large enough
	// Alternate trap door hole positions for thin Towers - DONE
	// Create Stair Cases for large towers
	// Fort Interior  stairs to walls
	// If Wall Floors == TowerFloors - add steps in battlements from wall to tower
	// Skybox or at least configurable clear colour - DONE

	// Draw outline which builds walls with towers at the corners
	// Ability to add foundations for slight variation in land height
	// Ability to have multiple levels of building to compensate for large changing in land height

	// TODO: Transform position output so that we don't need to define different methods we can just do a coordinate transform

	// TODO: Move to init method - requires us to add the vorld to all functions...
	var vorld = Vorld.create({ chunkSize: 32 });


	var addSection = function(x, z, y, size) {
		let half = Math.floor(size / 2);
		for (let k = 0; k < 4; k++) {
			addRing(x, z, k + y, size, VorldConfig.BlockIds.STONE);
			setCorners(x, z, k + y, size, VorldConfig.BlockIds.STONE_BLOCKS);
		}
	};

	var addRing = function(x, z, y, ringSize, block, predicate, flip) {
		let half = Math.floor(ringSize / 2);
		for(let i = 0; i < ringSize; i++) {
			for(let j = 0; j < ringSize; j++) {
				if (i === 0 || i === ringSize - 1 || j === 0 || j === ringSize - 1) {
					if (!predicate || predicate(i, j)) {
						Vorld.addBlock(vorld, x + i - half, y, z + j - half, block);
						if (flip) {
							Vorld.addBlockRotation(vorld, x + i - half, y, z + j - half, 1);
						}
					}
				}
			}
		}
	};

	var setCorners = function(x, z, y, size, block) {
		let half = Math.floor(size/2);
		Vorld.addBlock(vorld, x - half, y, z - half, block);
		Vorld.addBlock(vorld, x - half, y, z + half, block);
		Vorld.addBlock(vorld, x + half, y, z - half, block);
		Vorld.addBlock(vorld, x + half, y, z + half, block);
	};

	var setRectCorners = function(x, z, y, sizeX, sizeZ, block) {
		let halfX = Math.floor(sizeX/2);
		let halfZ = Math.floor(sizeZ/2);
		Vorld.addBlock(vorld, x - halfX, y, z - halfZ, block);
		Vorld.addBlock(vorld, x - halfX, y, z + halfZ, block);
		Vorld.addBlock(vorld, x + halfX, y, z - halfZ, block);
		Vorld.addBlock(vorld, x + halfX, y, z + halfZ, block);
	};

	var fill = function(x, z, y, size, block) {
		var offset = Math.floor(size/2);
		for(let i = 0; i < size; i++) {
			for(let j = 0; j < size; j++) {
				Vorld.addBlock(vorld, x+i-offset, y, z+j-offset, block);
			}
		}
	};

	var fillRect = function(xMin, xMax, zMin, zMax, y, block) {
		for (let i = 0, l = xMax - xMin; i <= l; i++) {
			for (let j = 0, n = zMax - zMin; j <= n; j++) {
				Vorld.addBlock(vorld, xMin + i, y, zMin + j, block);
			}
		}
	};

	var fillFloor = function(x, z, y, size, floorIndex, block) {
		let offset = -Math.floor(size / 2);
		let sign = floorIndex % 2 ? 1 : -1; // Alterate side so it's not just one huge drop
		fill(x, z, y, size, block);
		// Would be nice if we could have adjancy info to take into account
		Vorld.addBlock(vorld, x + sign *offset, y, z + offset, 0);
	};

	var buildTower = function(x, z, y, floors, towerWidth) {
		// Each floor is a section (height 4) and a ceiling (1 block)
		// So currently a floor 5 height except top floor which is 2 more
		// This should be able to be variable - maybe we should take
		// the expected ajoining heights?

		// Base
		fill(x, z, y++, towerWidth + 2,VorldConfig.BlockIds.STONE_BLOCKS);

		// Pillars (decoration)
		for(let k = 0; k < 7; k++) {
			let block = k == 6 ? VorldConfig.BlockIds.HALF_STONE_BLOCKS : VorldConfig.BlockIds.STONE_BLOCKS;
			setRectCorners(x, z, y + k, towerWidth+2, towerWidth, block);
			setRectCorners(x, z, y + k, towerWidth, towerWidth+2, block);
		}
		// Plus stairs peices on top?

		// Floors
		for (let i = 0; i < floors - 1; i++) {
			addSection(x, z, y, towerWidth);
			y += 4;
			addRing(x, z, y, towerWidth, VorldConfig.BlockIds.STONE_BLOCKS);
			fillFloor(x, z, y, towerWidth - 2, i, VorldConfig.BlockIds.PLANKS);
			y += 1;
		}

		// Top Floor
		addSection(x, z, y, towerWidth);
		y+= 4;
		addRing(x, z, y++, towerWidth, VorldConfig.BlockIds.STONE_BLOCKS);
		addRing(x, z, y++, towerWidth, VorldConfig.BlockIds.STONE_BLOCKS);
		addRing(x, z, y, towerWidth, VorldConfig.BlockIds.STONE_BLOCKS);
		fillFloor(x, z, y, towerWidth - 2, floors - 1, VorldConfig.BlockIds.PLANKS);
		y += 1;

		// Battlements
		addRing(x, z, y - 1, towerWidth + 2, VorldConfig.BlockIds.HALF_STONE_BLOCKS, (i, j) => { return i % 2 == 1 || j % 2 == 1; }, true);	// Upside down steps would be nice
		addRing(x, z, y, towerWidth + 2, VorldConfig.BlockIds.STONE_BLOCKS);
		setCorners(x, z, y, towerWidth+2, 0);
		y += 1;
		addRing(x, z, y, towerWidth + 2, VorldConfig.BlockIds.HALF_STONE_BLOCKS, (i, j) => { return i % 2 == 1 || j % 2 == 1; });	// Half-Blocks would be nice
		setCorners(x, z, y, towerWidth + 2, 0);
	};

	// TODO: Extract commonalities between windows and doors!
	var addTowerWindows = function(x, z, y, size, floors, adjaency) {
		let baseY = y + 1, half = Math.floor(size / 2);
		// Towers are currently always odd widths so spacing must be even to have sensible spacing
		let spacing = 4, windowCount = Math.max(1, Math.round((size - 6) / spacing));    // Want at least 2 black spots between edge and windows so 3 * 2
		// Arguably spacing should be dynamic based on number of windows - currently the gap between wall edges and walls aren't necessarily uniform when they could be
		let windowOffset = Math.ceil(0.5 * spacing * (windowCount - 1));
		for (let i = 0, l = floors.length; i < l; i++) {
			y = baseY + floors[i] * 5;
			for (let j = 1; j < 3; j++) {
			    for (let k = -windowOffset; k <= windowOffset; k += spacing) { 
    				if (j === 1 || j === 2) {
    					if (!adjaency || adjaency[0] || Math.abs(k) > 2)    // Make window if no adjancy info, have signal for adjaency or suitably far from door position (center)
    						Vorld.addBlock(vorld, x - half, j + y, z + k, VorldConfig.BlockIds.HALF_STONE_BLOCKS);
    					if (!adjaency || adjaency[1] || Math.abs(k) > 2)
    						Vorld.addBlock(vorld, x + half, j + y, z + k, VorldConfig.BlockIds.HALF_STONE_BLOCKS);
    					if (!adjaency || adjaency[2] || Math.abs(k) > 2)
    						Vorld.addBlock(vorld, x + k, j + y, z - half, VorldConfig.BlockIds.HALF_STONE_BLOCKS);
    					if (!adjaency || adjaency[3] || Math.abs(k) > 2)
    						Vorld.addBlock(vorld, x + k, j + y, z + half, VorldConfig.BlockIds.HALF_STONE_BLOCKS);
    				}
    				if (j === 2) {
    					if (!adjaency || adjaency[0] || Math.abs(k) > 2)
    						Vorld.addBlockRotation(vorld, x - half, j + y, z + k, 1);
    					if (!adjaency || adjaency[1] || Math.abs(k) > 2)
    						Vorld.addBlockRotation(vorld, x + half, j + y, z + k, 1);
    					if (!adjaency || adjaency[2] || Math.abs(k) > 2)
    						Vorld.addBlockRotation(vorld, x + k, j + y, z - half, 1);
    					if (!adjaency || adjaency[3] || Math.abs(k) > 2)
    						Vorld.addBlockRotation(vorld, x + k, j + y, z + half, 1);
    				}
			    }
			}
		}
	};

    // Places door in center of wall with adjaency marked
	var addTowerDoors = function(x, z, y, size, floors, adjaency) {
		let baseY = y + 1, half = Math.floor(size / 2);
		for (let i = 0, l = floors.length; i < l; i++) {
			y = baseY + floors[i] * 5;
			for (let k = 0; k < 3; k++) {
				if (k === 0 || k === 1) {
					if (!adjaency || adjaency[0])
						Vorld.addBlock(vorld, x - half, k + y, z, 0);
					if (!adjaency || adjaency[1])
						Vorld.addBlock(vorld, x + half, k + y, z, 0);
					if (!adjaency || adjaency[2])
						Vorld.addBlock(vorld, x, k + y, z - half, 0);
					if (!adjaency || adjaency[3])
						Vorld.addBlock(vorld, x, k + y, z + half, 0);
				}
				if (k === 2) {
					if (!adjaency || adjaency[0]) {
						Vorld.addBlock(vorld, x - half, k + y, z, VorldConfig.BlockIds.STONE_BLOCKS);
					}
					if (!adjaency || adjaency[1]) {
						Vorld.addBlock(vorld, x + half, k + y, z, VorldConfig.BlockIds.STONE_BLOCKS);
					}
					if (!adjaency || adjaency[2]) {
						Vorld.addBlock(vorld, x, k + y, z - half, VorldConfig.BlockIds.STONE_BLOCKS);
					}
					if (!adjaency || adjaency[3]) {
						Vorld.addBlock(vorld, x, k + y, z + half, VorldConfig.BlockIds.STONE_BLOCKS);
					}
				}
			}
		}
	};

	var addWallArchX = function(xMin, xMax, yMin, yMax, z) {
		for (let x = xMin; x <= xMax; x++) {
			for (let y = yMin; y <= yMax; y++) {
				let block = VorldConfig.BlockIds.PLANKS;
				if (x == xMin || x == xMax || y == yMax) {
					block = VorldConfig.BlockIds.STONE_BLOCKS;
				}
				Vorld.addBlock(vorld, x, y, z, block);
			}
		}
	};

	var addWallArchZ = function(x, yMin, yMax, zMin, zMax) {
		for (let z= zMin; z <= zMax; z++) {
			for (let y = yMin; y <= yMax; y++) {
				let block = VorldConfig.BlockIds.PLANKS;
				if (z == zMin || z == zMax || y == yMax) {
					block = VorldConfig.BlockIds.STONE_BLOCKS;
				}
				Vorld.addBlock(vorld, x, y, z, block);
			}
		}
	};

	var buildWall = function(xMin, xMax, zMin, zMax, y, floors, rotation) {
		// rotation - 0 => xMin is front, 1 => xMax is front, 2 => zMin, 3 => zMax
		// ^^ This is kinda crazy, "left, right, back, forward"? "forward, right, back, left" would make more sense

		// Base
		fillRect(xMin, xMax, zMin, zMax, y, VorldConfig.BlockIds.STONE_BLOCKS);
		y += 1;

		// Wall
		for (let index = 0; index < floors; index++) {
			// TODO: Pillars on internal side
			for(let k = 0; k < 5; k++) {
				if (rotation === 0) {
					// xMin is front
					// so pillars at zMin and zMax
					// fill in between
					for (let i = zMin; i <= zMax; i++) {
						Vorld.addBlock(vorld, xMin + 1, y+k, i, k == 4 || i == zMin || i == zMax ? VorldConfig.BlockIds.STONE_BLOCKS :  VorldConfig.BlockIds.STONE);
					}
				} else if (rotation === 1) {
					// xMax is front
					// so pillars at zMin and zMax
					// fill in between
					for (let i = zMin; i <= zMax; i++) {
						Vorld.addBlock(vorld, xMax - 1, y+k, i, k == 4 || i == zMin || i == zMax ? VorldConfig.BlockIds.STONE_BLOCKS :  VorldConfig.BlockIds.STONE);
					}
				} else if (rotation === 2) {
					// zMin is front
					// so pillars at xMin and xMax
					// fill in between
					for (let i = xMin ; i <= xMax; i++) {
						Vorld.addBlock(vorld, i, y+k, zMin + 1, k == 4 || i == xMin || i == xMax ? VorldConfig.BlockIds.STONE_BLOCKS :  VorldConfig.BlockIds.STONE);
					}
				} else if (rotation === 3) {
					// zMax is front
					// so pillars at xMin and xMax
					// fill in between
					for (let i = xMin ; i <= xMax; i++) {
						Vorld.addBlock(vorld, i, y+k, zMax - 1, k == 4 || i == xMin || i == xMax ? VorldConfig.BlockIds.STONE_BLOCKS :  VorldConfig.BlockIds.STONE);
					}
				}
			}
			
			if (index > 0) {
			    addWallWindows(xMin, xMax, zMin, zMax, y, index, rotation);
			}
			
			y += 5;

			// Battlements and Floor
			if (index + 1 == floors) {
			    buildWallTop(xMin, xMax, zMin, zMax, y, rotation);
			}
		}
	};

	var buildWallTop = function(xMin, xMax, zMin, zMax, y, rotation) {
	    switch(rotation) {
    		case 0:
    		{
    			fillRect(xMin+2, xMax-1, zMin, zMax, y-1, VorldConfig.BlockIds.PLANKS);	// TODO: Use predicate
    			fillLineZ(xMax, y-1, zMin, zMax, function(z) { return VorldConfig.BlockIds.STONE_BLOCKS; });
    			for (let j = y-1; j <= y + 1; j++)
    				fillLineZ(xMin, j, zMin, zMax,
    					function(z) { return j == y ? VorldConfig.BlockIds.STONE_BLOCKS : z%2 === 0 ? VorldConfig.BlockIds.HALF_STONE_BLOCKS : 0; },
    					function(z) { return j == y - 1 });
    			break;
    		}
    		case 1:
    		{
    			fillRect(xMin+1, xMax-2, zMin, zMax, y-1, VorldConfig.BlockIds.PLANKS);
    			fillLineZ(xMin, y-1, zMin, zMax, function(z) { return VorldConfig.BlockIds.STONE_BLOCKS; });
    			for (let j = y-1; j <= y + 1; j++)
    				fillLineZ(xMax, j, zMin, zMax,
    					function(z) { return j == y ? VorldConfig.BlockIds.STONE_BLOCKS : z%2 === 0 ? VorldConfig.BlockIds.HALF_STONE_BLOCKS : 0; },
    					function(z) { return j == y - 1 });
    			break;
    		}
    		case 2:
    		{
    			fillRect(xMin, xMax, zMin+2, zMax - 1, y-1, VorldConfig.BlockIds.PLANKS);
    			fillLineX(xMin, xMax, y-1, zMax, function(z) { return VorldConfig.BlockIds.STONE_BLOCKS; });
    			for (let j = y-1; j <= y + 1; j++)
    				fillLineX(xMin, xMax, j, zMin,
    					function(z) { return j == y ? VorldConfig.BlockIds.STONE_BLOCKS : z%2 === 0 ? VorldConfig.BlockIds.HALF_STONE_BLOCKS : 0; },
    					function(z) { return j == y - 1 });
    			break;
    		}
    		case 3:
    		{
    			fillRect(xMin, xMax, zMin+1, zMax-2, y-1, VorldConfig.BlockIds.PLANKS);
    			fillLineX(xMin, xMax, y-1, zMin, function(z) { return VorldConfig.BlockIds.STONE_BLOCKS; });
    			for (let j = y-1; j <= y + 1; j++)
    				fillLineX(xMin, xMax, j, zMax,
    					function(z) { return j == y ? VorldConfig.BlockIds.STONE_BLOCKS : z%2 === 0 ? VorldConfig.BlockIds.HALF_STONE_BLOCKS : 0; },
    					function(z) { return j == y - 1 });
    			break;
    		}
    	}
	};
	
	var addWallWindows = function(xMin, xMax, zMin, zMax, y, floorIndex, rotation) {
		// rotation - 0 => xMin is front, 1 => xMax is front, 2 => zMin, 3 => zMax

        // Create Ledge for looking out of windows, with alterating hole for ladder (health and safety and all that)
        switch(rotation) {
            case 0:
            {
                fillRect(xMin+2, xMin+2, zMin+floorIndex%2, zMax-((floorIndex+1)%2), y-1, VorldConfig.BlockIds.PLANKS);
                fillRect(xMin+3, xMin+3, zMin, zMax, y-1, VorldConfig.BlockIds.STONE_BLOCKS);
                break;
            }
            case 1:
            {
                fillRect(xMax-2, xMax-2, zMin+floorIndex%2, zMax-((floorIndex+1)%2), y-1, VorldConfig.BlockIds.PLANKS);
                fillRect(xMax-3, xMax-3, zMin, zMax, y-1, VorldConfig.BlockIds.STONE_BLOCKS);
                break;    
            }
            case 2:
            {
                fillRect(xMin+(floorIndex%2), xMax-((floorIndex+1)%2), zMin+2, zMin+2, y-1, VorldConfig.BlockIds.PLANKS);
                fillRect(xMin, xMax, zMin+3, zMin+3, y-1, VorldConfig.BlockIds.STONE_BLOCKS);
                break;    
            }
            case 3:
            {
                fillRect(xMin+(floorIndex%2), xMax-((floorIndex+1)%2), zMax-2, zMax-2, y-1, VorldConfig.BlockIds.PLANKS);
                fillRect(xMin, xMax, zMax-3, zMax - 3, y-1, VorldConfig.BlockIds.STONE_BLOCKS);
                break;    
            }
        }

	    let size = rotation < 2 ? Math.abs(zMax - zMin) : Math.abs(xMax - xMin); 
	    let midZ = Math.floor(0.5 * (zMax - zMin)) + zMin;
	    let midX = Math.floor(0.5 * (xMax - xMin)) + xMin; 
	    let spacing = 4, windowCount = Math.max(1, Math.round((size - 6) / spacing));
		let windowOffset = Math.ceil(0.5 * spacing * (windowCount - 1));
		
		for (let j = 1; j < 3; j++) {
		    for (let k = -windowOffset; k <= windowOffset; k += spacing) { 
    			if (j === 1 || j === 2) {
    				if (rotation === 0)
    					Vorld.addBlock(vorld, xMin + 1, j + y, midZ + k, VorldConfig.BlockIds.HALF_STONE_BLOCKS);
    				if (rotation === 1)
    					Vorld.addBlock(vorld, xMax - 1, j + y, midZ + k, VorldConfig.BlockIds.HALF_STONE_BLOCKS);
    				if (rotation === 2)
    					Vorld.addBlock(vorld, midX + k, j + y, zMin + 1, VorldConfig.BlockIds.HALF_STONE_BLOCKS);
    				if (rotation === 3)
    					Vorld.addBlock(vorld, midX + k, j + y, zMax - 1, VorldConfig.BlockIds.HALF_STONE_BLOCKS);
    			}
    			if (j === 2) {
    				if (rotation === 0)
    					Vorld.addBlockRotation(vorld, xMin + 1, j + y, midZ + k, 1);
    				if (rotation === 1)
    					Vorld.addBlockRotation(vorld, xMax - 1, j + y, midZ + k, 1);
    				if (rotation === 2)
    					Vorld.addBlockRotation(vorld, midX + k, j + y, zMin + 1, 1);
    				if (rotation === 3)
    					Vorld.addBlockRotation(vorld, midX + k, j + y, zMax - 1, 1);
    			}
		    }
		}

	};

	var fillLineX = function(xMin, xMax, y, z, blockPredicate, flipPredicate) {
		for (let i = xMin; i <= xMax; i++) {
			Vorld.addBlock(vorld, i, y, z, blockPredicate(i));
			if (flipPredicate && flipPredicate(i)) {
				Vorld.addBlockRotation(vorld, i, y, z, 1);
			}
		}
	};

	var fillLineZ = function(x, y, zMin, zMax, blockPredicate, flipPredicate) {
		for (let i = zMin; i <= zMax; i++) {
			Vorld.addBlock(vorld, x, y, i, blockPredicate(i));
			if (flipPredicate && flipPredicate(i)) {
				Vorld.addBlockRotation(vorld, x, y, i, 1);
			}
		}
	};

	var generateCastle = function(parameters, progressDelegate) {

		let spacing = 12, towerWidth = 9, towerFloors = 3, wallFloors = 2;
		if (parameters) {
			spacing = parameters.spacing;
			towerWidth = parameters.towerWidth;
			towerFloors = parameters.towerFloors;
			wallFloors = parameters.wallFloors;
		}

		if (towerWidth < 5) {
			towerWidth = 5;
			if (spacing < 4) {
				spacing = 4;
			}
		}

		if (towerWidth % 2 === 0) {
			// TODO Support even widthed towers
			towerWidth -= 1;
		}
		if (towerWidth + 1 >= spacing * 2) {
			// Arguably should just draw a single tower in this case
			towerWidth = 2 * spacing - 3;
		}

		if (towerFloors <= 0) {
			towerFloors = 1;
		}

		if (wallFloors <= 0) {
			wallFloors = 1;
		}

		if (wallFloors > towerFloors) {
			wallFloors = towerFloors;
		}

		let halfTowerWidth = Math.floor(towerWidth/2);

		// Ground
		let radius = spacing * 4;
		let y = -1, block = VorldConfig.BlockIds.GRASS;
		while (radius > 1) {
			for (let x = -radius; x <= radius; x++) {
				for (let z = -radius; z <= radius; z++) {
					if (x*x + z*z < radius * radius) {
						Vorld.addBlock(vorld, x, y, z, block);
					}
				}
			}
			block = VorldConfig.BlockIds.SOIL;
			y--;
			if (y < -5) {
				radius -= 2;
			}
		}

		// Towers
		buildTower(-spacing, -spacing, 0, towerFloors, towerWidth);
		buildTower(+spacing, -spacing, 0, towerFloors, towerWidth);
		buildTower(-spacing, +spacing, 0, towerFloors, towerWidth);
		buildTower(+spacing, +spacing, 0, towerFloors, towerWidth);

		progressDelegate(0.25);

		// Walls
		// -z -> +z @ -x => xMin is rotation
		buildWall(-spacing - halfTowerWidth, -spacing + halfTowerWidth - 1, -spacing + (halfTowerWidth + 1), spacing - (halfTowerWidth + 1), 0, wallFloors, 0);
		// -z -> +z @ +x => xMax is rotation
		buildWall(spacing - halfTowerWidth + 1, spacing + halfTowerWidth, -spacing + (halfTowerWidth + 1), spacing - (halfTowerWidth + 1), 0, wallFloors, 1);
		// -x -> +x @ -z => zMin is rotation
		buildWall(-spacing + (halfTowerWidth + 1), spacing - (halfTowerWidth + 1), -spacing - halfTowerWidth, -spacing + halfTowerWidth - 1, 0, wallFloors, 2);
		// -x -> +x @ +z => zMax is rotation
		buildWall(-spacing + (halfTowerWidth + 1), spacing - (halfTowerWidth + 1), spacing - halfTowerWidth + 1, spacing + halfTowerWidth, 0, wallFloors, 3);

		progressDelegate(0.5);

		// Windows and Doors
		let windowFloors = [], doorFloors = [];
		for (let i = 0; i < towerFloors; i++) {
			if (i !== 0 && i != wallFloors) {
				windowFloors.push(i);
			} else {
				doorFloors.push(i);
			}
		}
		addTowerWindows(-spacing, -spacing, 0, towerWidth, windowFloors);
		addTowerWindows(-spacing, -spacing, 0, towerWidth, doorFloors, [1,0,1,0]);
		addTowerDoors(-spacing, -spacing, 0, towerWidth, doorFloors, [0,1,0,1]);

		addTowerWindows(+spacing, -spacing, 0, towerWidth, windowFloors);
		addTowerWindows(+spacing, -spacing, 0, towerWidth, doorFloors, [0,1,1,0]);
		addTowerDoors(+spacing, -spacing, 0, towerWidth, doorFloors, [1,0,0,1]);

		addTowerWindows(-spacing, +spacing, 0, towerWidth, windowFloors);
		addTowerWindows(-spacing, +spacing, 0, towerWidth, doorFloors, [1,0,0,1]);
		addTowerDoors(-spacing, +spacing, 0, towerWidth, doorFloors, [0,1,1,0]);

		addTowerWindows(+spacing, +spacing, 0, towerWidth, windowFloors);
		addTowerWindows(+spacing, +spacing, 0, towerWidth, doorFloors, [0,1,0,1]);
		addTowerDoors(+spacing, +spacing, 0, towerWidth, doorFloors, [1,0,1,0]);

		progressDelegate(0.75);

		if (wallFloors > 0) {
			let wallWidth = 2 * spacing - towerWidth;
			let archWidth = Math.min(wallWidth - 2, 6);
			if (archWidth > 3) {
				addWallArchX(-Math.floor(archWidth/2), Math.floor(archWidth/2), 1, 5, spacing + halfTowerWidth - 1);
				for (let x = -Math.floor(archWidth/2)+1; x <= Math.floor(archWidth/2)-1; x++) {
					Vorld.addBlock(vorld, x, 0, spacing+halfTowerWidth + 1, VorldConfig.BlockIds.HALF_STONE_BLOCKS);
				}
			}
		}

		progressDelegate(1.0);
	};

	exports.generate = function(parameters, progressDelegate) {
		generateCastle(parameters, progressDelegate || function(progress) { console.log("Progress: " + progress); });
		return vorld;
	};

	exports.generateAsync = function(parameters, progressDelegate, callback) {
		let worker = new Worker('generatorworker.js');
		worker.onmessage = function(e) {
			progressDelegate(e.data);
			if (e.data.complete) {
				callback(e.data);
			}
		};
		worker.postMessage(parameters);
	};

	return exports;
})();
