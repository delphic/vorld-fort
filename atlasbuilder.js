// Builds a padded atlas, with upscaling based on an input atlas
var AtlasBuilder = (function() {
  var exports = {};

  exports.build = function(params) {
    let upscale = params.upscale, size = params.size, offset = params.padding;
    let image = new Image();
    image.onload = function() {
      atlasCanvas = document.createElement("canvas");
      document.body.appendChild(atlasCanvas);
      atlasCanvas.style = "display: none";
      atlasCanvas.width = image.width * upscale;
      atlasCanvas.height = image.height * upscale;


      let ctx = atlasCanvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      let tileSize = image.width / size;
      for(let i = 0; i < size - 1; i++) {
        for (let j = 0; j < size - 1; j++) {
          let dx = i*(tileSize + 2 * offset),
              dy = j*(tileSize + 2 * offset);

          for (let o = offset; o > 0; o--) {
            ctx.drawImage(image,
              i*tileSize, j*tileSize, tileSize, tileSize,
              (image.width + dx - o) % image.width, (image.height + dy - o)%image.height, tileSize, tileSize);
            ctx.drawImage(image,
              i*tileSize, j*tileSize, tileSize, tileSize,
              dx + o, (image.height + dy - o)%image.height, tileSize, tileSize);
            ctx.drawImage(image,
              i*tileSize, j*tileSize, tileSize, tileSize,
              (image.width + dx - o) % image.width, dy + o, tileSize, tileSize);
            ctx.drawImage(image,
              i*tileSize, j*tileSize, tileSize, tileSize,
              dx + o, dy + o, tileSize, tileSize);

            ctx.drawImage(image,
              i*tileSize, j*tileSize, tileSize, tileSize,
              (image.width + dx - o) % image.width, dy, tileSize, tileSize);
            ctx.drawImage(image,
              i*tileSize, j*tileSize, tileSize, tileSize,
              dx + o, dy, tileSize, tileSize);

            ctx.drawImage(image,
              i*tileSize, j*tileSize, tileSize, tileSize,
              dx, (image.height + dy - o) % image.height, tileSize, tileSize);
            ctx.drawImage(image,
              i*tileSize, j*tileSize, tileSize, tileSize,
              dx, dy + o, tileSize, tileSize);
          }

          ctx.drawImage(image,
            i*tileSize, j*tileSize, tileSize, tileSize,
            dx, dy, tileSize, tileSize);
        }
      }

      if (upscale > 1) {
        ctx.drawImage(
          atlasCanvas, 0, 0, image.width, image.height,
          0, 0, atlasCanvas.width, atlasCanvas.height);
      }

      // TODO: Ability to update the voxel config to match atlas built!

      params.callback(atlasCanvas);
    };
    image.src = params.atlasSrc;
  };

  return exports;
})();
