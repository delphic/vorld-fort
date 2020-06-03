var Mesher = (function() {
	// Voxel Mesher

	// Data is meshed by adding quads for each visible voxel face to a mesh
	// One mesh per 32 cubic 'chunk' of voxels.
	// Uses texture coordinates and an atlas to allow for multiple voxel types in
	// a single texture.
	// Has option of outputing texture coordinates as a tile lookup rather than uv mapping
	var exports = {};

	// Basic Cube Geometry JSON
	var cubeJson = {
		vertices: [ -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0 ],
		normals: [ 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0],
		textureCoordinates: [
			0.0, 0.0,
			1.0, 0.0,
			1.0, 1.0,
			0.0, 1.0,

			1.0, 0.0,
			1.0, 1.0,
			0.0, 1.0,
			0.0, 0.0,

			0.0, 1.0,
			0.0, 0.0,
			1.0, 0.0,
			1.0, 1.0,

			1.0, 1.0,
			0.0, 1.0,
			0.0, 0.0,
			1.0, 0.0,

			1.0, 0.0,
			1.0, 1.0,
			0.0, 1.0,
			0.0, 0.0,

			0.0, 0.0,
			1.0, 0.0,
			1.0, 1.0,
			0.0, 1.0 ],
		indices: [ 0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23 ]
	};

	var halfCubeJson = {
		vertices: [
			-1.0, -1.0, 1.0,
			1.0, -1.0, 1.0,
			1.0, 0.0, 1.0,
			-1.0, 0.0, 1.0,

			-1.0, -1.0, -1.0,
			-1.0, 0.0, -1.0,
			1.0, 0.0, -1.0,
			1.0, -1.0, -1.0,

			-1.0, 0.0, -1.0,
			-1.0, 0.0, 1.0,
			1.0, 0.0, 1.0,
			1.0, 0.0, -1.0,

			-1.0, -1.0, -1.0,
			1.0, -1.0, -1.0,
			1.0, -1.0, 1.0,
			-1.0, -1.0, 1.0,

			1.0, -1.0, -1.0,
			1.0, 0.0, -1.0,
			1.0, 0.0, 1.0,
			1.0, -1.0, 1.0,

			-1.0, -1.0, -1.0,
			-1.0, -1.0, 1.0,
			-1.0, 0.0, 1.0,
			-1.0, 0.0, -1.0 ],
		normals: [ 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0],
		textureCoordinates: [
			0.0, 0.0,
			1.0, 0.0,
			1.0, 0.5,
			0.0, 0.5,

			1.0, 0.0,
			1.0, 0.5,
			0.0, 0.5,
			0.0, 0.0,

			0.0, 1.0,
			0.0, 0.0,
			1.0, 0.0,
			1.0, 1.0,

			1.0, 1.0,
			0.0, 1.0,
			0.0, 0.0,
			1.0, 0.0,

			1.0, 0.0,
			1.0, 0.5,
			0.0, 0.5,
			0.0, 0.0,

			0.0, 0.0,
			1.0, 0.0,
			1.0, 0.5,
			0.0, 0.5 ],
		indices: [
			0, 1, 2,
			0, 2, 3,

			4, 5, 6,
			4, 6, 7,

			8, 9, 10,
			8, 10, 11,

			12, 13, 14,
			12, 14, 15,

			16, 17, 18,
			16, 18, 19,

			20, 21, 22,
			20, 22, 23 ]
	};

	var cubeFaces = {
		front: 0,
		back: 1,
		top: 2,
		bottom: 3,
		right: 4,
		left: 5
	};

	// Atlas Info
	var atlas = VorldConfig.getAtlasInfo();
	// Reusable quat and vec3 for identity, flip and vertex
	var identityRotation, flipRotation, vertex;
	identityRotation = quat.create();
	flipRotation = quat.setAxisAngle(quat.create(), [1,0,0], Math.PI);
	vertex = vec3.create();

	var adjustTextureCoords = function(textureArray, faceIndex, tileIndex) {
		for(var i = 8 * faceIndex, l = i + 8; i < l; i += 2) {
			// tile lookup
			textureArray[i] = tileIndex + 0.5;
			textureArray[i+1] = tileIndex + 0.5;
		}
	};

	var buildMesh = function(vorld, chunkI, chunkJ, chunkK) {
		var mesh = {
			vertices: [],
			normals: [],
			textureCoordinates: [],
			indices: []
		};

		var chunk = Vorld.getChunk(vorld, chunkI, chunkJ, chunkK);

		forEachBlock(chunk, function(chunk, i, j, k, x, y, z) {
			var block = Chunk.getBlock(chunk, i, j, k);
			var blockRotation = Chunk.getBlockRotation(chunk, i, j, k);

			// Exists?
			if(!block) { return; }

			// For Each Direction : Is Edge? Add quad to mesh!
			// Front
			if(!VorldConfig.isBlockSolid(Vorld.getBlockByIndex(vorld, i, j, k+1, chunkI, chunkJ, chunkK))) {
				if (!blockRotation) {
					addQuadToMesh(mesh, block, blockRotation, cubeFaces.front, x, y, z);
				} else {
					addQuadToMesh(mesh, block, blockRotation, cubeFaces.back, x, y, z);
				}
			}
			// Back
			if(!VorldConfig.isBlockSolid(Vorld.getBlockByIndex(vorld, i, j, k-1, chunkI, chunkJ, chunkK))) {
				if (!blockRotation) {
					addQuadToMesh(mesh, block, blockRotation, cubeFaces.back, x, y, z);
				} else {
					addQuadToMesh(mesh, block, blockRotation, cubeFaces.front, x, y, z);
				}
			}
			// Top
			if(!VorldConfig.isBlockSolid(Vorld.getBlockByIndex(vorld, i, j+1, k, chunkI, chunkJ, chunkK))) {
				if (!blockRotation) {
					addQuadToMesh(mesh, block, blockRotation, cubeFaces.top, x, y, z);
				} else {
					// HACK - because we're rotating the mesh data itself we need to put the opposite value if when flipping
					addQuadToMesh(mesh, block, blockRotation, cubeFaces.bottom, x, y, z);
				}
			}
			// Bottom
			if(!VorldConfig.isBlockSolid(Vorld.getBlockByIndex(vorld, i, j-1, k, chunkI, chunkJ, chunkK))) {
				if (!blockRotation) {
					addQuadToMesh(mesh, block, blockRotation, cubeFaces.bottom, x, y, z);
				} else {
					// HACK - because we're rotating the mesh data itself we need to put the opposite value if when flipping
					addQuadToMesh(mesh, block, blockRotation, cubeFaces.top, x, y, z);
				}
			}
			// Right
			if(!VorldConfig.isBlockSolid(Vorld.getBlockByIndex(vorld, i+1, j, k, chunkI, chunkJ, chunkK))) {
				addQuadToMesh(mesh, block, blockRotation, cubeFaces.right, x, y, z);
			}
			// Left
			if(!VorldConfig.isBlockSolid(Vorld.getBlockByIndex(vorld, i-1, j, k, chunkI, chunkJ, chunkK))) {
				addQuadToMesh(mesh, block, blockRotation, cubeFaces.left, x, y, z);
			}
		});

		return mesh;
	};

	var addQuadToMesh = function(mesh, block, blockRotation, faceIndex, x, y, z) {
		var tile, offset, n = mesh.vertices.length/3;
		var vertices, normals, textureCoordinates;
		var isHalf = VorldConfig.isHalfBlock(block);
		var jsonData = isHalf ? halfCubeJson : cubeJson;
		var rotation = blockRotation ? flipRotation : identityRotation;

		if(faceIndex == cubeFaces.top) {
			tile = atlas.tileIndices[block].top;
		} else if (faceIndex == cubeFaces.bottom) {
			tile = atlas.tileIndices[block].bottom;
		} else {
			tile = atlas.tileIndices[block].side;
		}

		offset = faceIndex * 12;
		vertices = jsonData.vertices.slice(offset, offset + 12);
		for(var i = 0; i < 4; i++) {
			vertex[0] = 0.5 * vertices[3*i];
			vertex[1] = 0.5 * vertices[3*i + 1];
			vertex[2] = 0.5 * vertices[3*i + 2];

			vec3.transformQuat(vertex, vertex, rotation);

			vertices[3*i] = vertex[0] + x;
			vertices[3*i + 1] = vertex[1] + y;
			vertices[3*i + 2] = vertex[2] + z;
		}

		normals = jsonData.normals.slice(offset, offset + 12);

		if (blockRotation) {
			for (var i = 0; i < 4; i++) {
				vertex[0] = normals[3*i];
				vertex[1] = normals[3*i + 1];
				vertex[2] = normals[3*i + 2];

				vec3.transformQuat(vertex, vertex, rotation);

				normals[3*i] = vertex[0];
				normals[3*i + 1] = vertex[1];
				normals[3*i + 2] = vertex[2];
			}
		}


		offset = faceIndex * 8;
		textureCoordinates = jsonData.textureCoordinates.slice(offset, offset + 8);
		adjustTextureCoords(textureCoordinates, 0, tile);

		concat(mesh.vertices, vertices);
		concat(mesh.normals, normals);
		concat(mesh.textureCoordinates, textureCoordinates);
		mesh.indices.push(n,n+1,n+2, n,n+2,n+3);
	};

	var concat = function(a, b) {
		// GC efficient concat
		for(var i = 0, l = b.length; i < l; i++) {
			a.push(b[i]);
		}
	};

	// delegate should be a function taking chunk, i, j, k, x, y, z
	var forEachBlock = function(chunk, delegate) {
		for(i = 0; i < chunk.size; i++) {
			x = i - Math.floor(chunk.size/2.0);
			for(j = 0; j < chunk.size; j++) {
				y = j - Math.floor(chunk.size/2.0);
				for(k = 0; k < chunk.size; k++) {
					z = k - Math.floor(chunk.size/2.0);
					delegate(chunk, i, j, k, x, y, z);
				}
			}
		}
	};

	exports.mesh = function(vorld, postMessage) {
		var keys = Object.keys(vorld.chunks);
		for(var i = 0, l = keys.length; i < l; i++) {
			var indices = vorld.chunks[keys[i]].indices;
			var mesh = buildMesh(vorld, indices[0], indices[1], indices[2]);
			if (mesh.indices.length > 0) {
				postMessage({
					mesh: mesh,
					offset: [indices[0] * vorld.chunkSize, indices[1] * vorld.chunkSize, indices[2] * vorld.chunkSize],
					progress: i / l
				});
			} else {
				postMessage({ progress: i / l });
			}
		}
	};

	return exports;
})();
