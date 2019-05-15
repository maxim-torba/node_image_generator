const fabric = require('fabric').fabric;
const fs = require('fs');

let simpleJson = fs.readFileSync('simple_json2.json', 'utf-8');

let canvas = new fabric.Canvas(null, {
    width: 960,
    height: 798
});

canvas.setZoom(0.75);

canvas.loadFromJSON(simpleJson, () => {
    let out = fs.createWriteStream(__dirname + `/images/from_json.png`);
    let stream = canvas.createPNGStream();

    stream.on('data', (chunk) => {
        out.write(chunk);
    });

    stream.on('end', () => {
        console.log('image successfully generated');
        // typeof resolve !== 'undefined' && resolve();
        // openGeneratedImage(name);//for testing
    });
});

