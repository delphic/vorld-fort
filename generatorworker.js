importScripts('vorld.js', 'generator.js');

onmessage = function(e) {
  postMessage({ stage: "Generating Vorld" });
  postMessage({ progress: 0 });

	var vorld = Generator.generate(e.data, function(progress) {
    postMessage({ progress: progress });
  });

	postMessage({ complete: true, vorld: vorld });
};
