importScripts("libs/gl-matrix.js", 'vorld.js', "mesher.js");

onmessage = function(e) {
  Mesher.mesh(e.data.chunkData, postMessage);
  postMessage({ complete: true });
};
