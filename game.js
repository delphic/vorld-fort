"use strict";
var vec3 = window.vec3;
var quat = window.quat;
var $ = window.$;
var Fury = window.Fury;
var VorldConfig = window.VorldConfig;
var VoxelShader = window.VoxelShader;
var Generator = window.Generator;
var debug = false;

// Vorld - Procedural Generation Experiements

// glMatrix extension
quat.rotate = (function() {
	var i = quat.create();
	return function(out, q, rad, axis) {
		quat.setAxisAngle(i, axis, rad);
		return quat.multiply(out, i, q);
	};
})();

var shouldAutoScale = true;
var resolutionFactor = 1; // Lower this for low-spec devices
var cameraRatio = 16 / 9;
var updateCanvasSize = function() {
	// Remove any scaling of width / height as a result of using CSS to size the canvas
	var glCanvas = document.getElementById("fury");
	glCanvas.width = resolutionFactor * glCanvas.clientWidth;
	glCanvas.height = resolutionFactor * glCanvas.clientHeight;
	cameraRatio = glCanvas.clientWidth / glCanvas.clientHeight;
	if (camera && camera.ratio) {
    	camera.ratio = cameraRatio;
	}
};
$(window).resize(function(){
	updateCanvasSize();
});
updateCanvasSize();

Fury.init("fury");
var Input = Fury.Input;

var atlas = VorldConfig.getAtlasInfo();
var shader = Fury.Shader.create(VoxelShader.create(atlas));

var atlasMaterial = Fury.Material.create({ shader: shader });
// Use upscaled texture to allow for reasonable resolution closeup
// when using mipmaps to prevent artifacts at distance.

// Regeneration Variables and form details
var generationConfig = {
	spacing: 12,
	towerWidth: 9,
	towerFloors: 3,
	wallFloors: 2
};

var getGenerationVariables = function() {
	var keys = Object.keys(generationConfig);
	for (let i = 0; i < keys.length; i++) {
		generationConfig[keys[i]] =  parseInt($("#"+ keys[i]).val(), 10);
	}
};

var hexToRgb = function(hex) {
    var value = parseInt(hex, 16);
    var r = (value >> 16) & 255;
    var g = (value >> 8) & 255;
    var b = value & 255;
    return [r, g, b];
};

var color32ToColor = function(out, color32) {
    out[0] = color32[0] / 255;
    out[1] = color32[1] / 255;
    out[2] = color32[2] / 255;
};

$(document).ready(function(){
	$("#hideControls").click(function() {
		$("#controls").hide();
	});

    $("#showLightingForm").click(function() {
        $("#lightingForm").show();
        $("#showFormButtons").hide();
    });
    $("#hideLightingForm").click(function() {
        $("#lightingForm").hide();
        $("#showFormButtons").show();
    });

	$("#showGenerationForm").click(function() {
		$("#generationForm").show();
		$("#showFormButtons").hide();
	});
	$("#hideGenerationForm").click(function() {
		$("#generationForm").hide();
		$("#showFormButtons").show();
	});

	// Some presets on this might be nice

	$("#skyColor").change(function() {
	    var rgb = hexToRgb(this.value.substring(1));
	    setClearColor(rgb[0], rgb[1], rgb[2]);
	    color32ToColor(atlasMaterial.fogColor, rgb);
	    atlasMaterial.dirty = true;
	});
	$("#lightColor").change(function() {
	    var rgb = hexToRgb(this.value.substring(1));
	    color32ToColor(atlasMaterial.lightColor, rgb);
	    atlasMaterial.dirty = true;
	});
	$("#ambientColor").change(function() {
	    var rgb = hexToRgb(this.value.substring(1));
	    color32ToColor(atlasMaterial.ambientColor, rgb);
	    atlasMaterial.dirty = true;
	});
	$("#fogDensity").change(function() {
	    atlasMaterial.fogDensity = parseFloat(this.value);
	    $("#fogDensityVal").html(atlasMaterial.fogDensity.toFixed(3));
	    atlasMaterial.dirty = true;
	});

	var updateLightDirection = function() {
	    atlasMaterial.lightDir[0] = parseFloat($("#lightDirX").val());
	    $("#lightDirXVal").html(atlasMaterial.lightDir[0].toFixed(1));
	    atlasMaterial.lightDir[1] = parseFloat($("#lightDirY").val());
	    $("#lightDirYVal").html(atlasMaterial.lightDir[1].toFixed(1));
	    atlasMaterial.lightDir[2] = parseFloat($("#lightDirZ").val());
	    $("#lightDirZVal").html(atlasMaterial.lightDir[2].toFixed(1));
	    atlasMaterial.dirty = true;
	};

	$("#lightDirX").change(updateLightDirection);
	$("#lightDirY").change(updateLightDirection);
	$("#lightDirZ").change(updateLightDirection);

	$("#regen").click(function(event){
		$("#progressDisplay").show();
		$("#generationParameters").hide();

		getGenerationVariables();
		clear();
		generateVorld();
	});

	var keys = Object.keys(generationConfig);
	for (let i = 0; i < keys.length; i++) {
		$("#"+ keys[i]).val(generationConfig[keys[i]]);
	}

	if (debug) {
		$("#controls").hide();
	}
});

// Create Camera & Scene
var rotateRate = 0.1 * Math.PI, maxRotatePerFrame = 0.2 * rotateRate;
var zoomRate = 16;
var initalRotation = quat.create();
var camera = Fury.Camera.create({ near: 0.1, far: 1000000.0, fov: 45.0, ratio: cameraRatio, position: vec3.fromValues(10.0, 10.0, 20.0), rotation: quat.fromValues(-0.232, 0.24, 0.06, 0.94) });
var scene = Fury.Scene.create({ camera: camera });
var meshes = [];

var lastTime = Date.now();

var clear = function() {
	if(meshes.length > 0) {
		for(var i = 0, l = meshes.length; i < l; i++) {
			meshes[i].remove();
		}
		meshes.length = 0;
	}
};

var setClearColor = function(r, g, b) {
	Fury.Renderer.clearColor(r/255, g/255, b/255, 1.0);
};

var awake = function() {
	// Note this needs to happen after materials loaded so that when they are copied the textures have loaded.
	// Perhaps textures should be stored at the Fury (Fury.Engine) level and thus loading callbacks will provide the texture to all materials
	// who have that texture id and this will work even if they've been copied prior to texture load
	// More sensible would giving Fury this awake / update functionality so we don't need to write it each time.
	setClearColor(99, 115, 255);
	generateVorld();
	loop();
};

var generateVorld = function() {
	$("#progressStage").html("Generating Voxel Data");
	$("#progressBarInner").width("0%");

	Generator.generateAsync(generationConfig, function(data) {
		if (data.stage) {
			$("#progressStage").html(data.stage);
		}

		if (data.progress !== undefined) {
			$("#progressBarInner").width((data.progress * 100) + "%");
		}
	}, function(data) {
		generateMeshes(data.vorld);
	});
};

var generateMeshes = function(vorld) {
	$("#progressStage").html("Generating Meshes");
	$("#progressBarInner").width("0%");

	var mesher = new Worker('mesherworker.js');
	mesher.onmessage = function(e) {
		if (e.data.mesh) {
			var mesh = Fury.Mesh.create(e.data.mesh);
			mesh.tileBuffer = Fury.Renderer.createBuffer(e.data.mesh.tileIndices, 1);
			var meshObject = scene.add({ static: true, mesh: mesh, material: atlasMaterial, position: vec3.clone(e.data.offset) });
			// ^^ TODO: Update Fury so that static is used
			meshes.push(meshObject);
		}
		if (e.data.progress !== undefined) {
			$("#progressBarInner").width((e.data.progress * 100) + "%");
		}
		if (e.data.complete) {
			$("#progressDisplay").hide();
			$("#generationParameters").show();
		}
	};
	mesher.postMessage({
		chunkData: vorld
	});
};

var lightDirection;
var framesInLastSecond = 0;
var timeSinceLastFrame = 0;
var lowFpsCounter = 0;

// TODO: on lose focus pause and stop counter

var loop = function() {
	var elapsed = Date.now() - lastTime;
	lastTime += elapsed;
	elapsed /= 1000;

	timeSinceLastFrame += elapsed;
	framesInLastSecond++;
	if(timeSinceLastFrame >= 1)
	{
	    if (shouldAutoScale) {
    	    if (framesInLastSecond < 30) {
    	        lowFpsCounter++;
    	    } else {
    	        lowFpsCounter--;
    	    }

    	    if (lowFpsCounter > 5) {
    	        lowFpsCounter = 0;
    	        resolutionFactor *= 0.5;
    	        updateCanvasSize();
    	        console.log("FPS consistently below 30, reducing rendering resolution");
    	    }
	    }

		// This is where you'd set the value in an FPS counter, if there was one
		framesInLastSecond = 0;
		timeSinceLastFrame = 0;
	}
	handleInput(elapsed);
	scene.render();
	window.requestAnimationFrame(loop);
};

var localx = vec3.create();
var localy = vec3.create();
var localz = vec3.create();
var unitx = vec3.fromValues(1,0,0);
var unity = vec3.fromValues(0,1,0);
var unitz = vec3.fromValues(0,0,1);
var prevX = 0;
var prevY = 0;

// https://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles
var getRoll = function(q) {
    // Note: glMatrix is x,y,z,w where as wiki assumes w,x,y,z!
    let sinr_cosp = 2 * (q[3] * q[0] + q[1] * q[2]);
    let cosr_cosp = 1 - 2 * (q[0] * q[0] + q[1] * q[1]);
    return Math.atan(sinr_cosp / cosr_cosp);
    // If you want to know sector you need atan2(sinr_cosp, cosr_cosp)
    // but we don't in this case.
};

var handleInput = function(elapsed) {
	var q = camera.rotation;
	var p = camera.position;
	vec3.transformQuat(localx, unitx, q);
	vec3.transformQuat(localy, unity, q);
	vec3.transformQuat(localz, unitz, q);

	var mousePos = Input.MousePosition;
	var deltaX = mousePos[0] - prevX;
	var deltaY = mousePos[1] - prevY;
	prevX = mousePos[0];
	prevY = mousePos[1];

	if (Input.mouseDown(2)) {
	    let xRotation = deltaX*rotateRate*elapsed;
	    if (Math.abs(xRotation) > maxRotatePerFrame) {
            xRotation = Math.sign(xRotation) * maxRotatePerFrame;
	    }
	    let yRotation = deltaY*rotateRate*elapsed;
	    if (Math.abs(yRotation) > maxRotatePerFrame) {
	        yRotation = Math.sign(yRotation) * maxRotatePerFrame;
	    }
		quat.rotate(q, q, -xRotation, unity);

		let roll = getRoll(q);
		let clampAngle = 10 * Math.PI/180;
	    if (Math.sign(roll) == Math.sign(yRotation) || Math.abs(roll - yRotation) < 0.5*Math.PI - clampAngle) {
    		quat.rotateX(q, q, -yRotation);
	    }
	}

	if(Input.keyDown("w")) {
		vec3.scaleAndAdd(p, p, localz, -zoomRate*elapsed);
	}
	if(Input.keyDown("s")) {
		vec3.scaleAndAdd(p, p, localz, zoomRate*elapsed);
	}
	if(Input.keyDown("a")) {
		vec3.scaleAndAdd(p, p, localx, -zoomRate*elapsed);
	}
	if(Input.keyDown("d")) {
		vec3.scaleAndAdd(p, p, localx, zoomRate*elapsed);
	}
	if (Input.keyDown("q")) {
		vec3.scaleAndAdd(p, p, localy, -zoomRate*elapsed);
	}
	if (Input.keyDown("e")) {
		vec3.scaleAndAdd(p, p, localy, zoomRate*elapsed);
	}
};

// Create Texture
// TODO: Use atlas builder with array of images so we don't have to manually upscale or manually configure config
let image = new Image();
image.onload = function() {
	var texture = Fury.Renderer.createTextureArray(image, 64, 64, 13, "pixel", true);
	atlasMaterial.textures["uSampler"] = texture;
	atlasMaterial.lightDir = vec3.fromValues(-1.0, 2.0, 1.0); // Was -1, 2, 1
	atlasMaterial.lightColor = vec3.fromValues(1.0, 1.0, 1.0);
	atlasMaterial.ambientColor = vec3.fromValues(1.0, 1.0, 1.0);
	atlasMaterial.fogColor = vec3.fromValues(99/255, 115/255, 255/255); // Initial Sky Color
	atlasMaterial.fogDensity = 0.01;
	awake();
};
image.src = "images/atlas_array.png";
