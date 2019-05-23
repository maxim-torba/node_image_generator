const fabric = require('fabric').fabric;
const fs = require('fs');

let canvasJson = fs.readFileSync('to_test_canvas_from_json_2_sides.json', 'utf-8');
let parsedCanvasJson = JSON.parse(canvasJson);
let width = parsedCanvasJson.overlayImage.width;
let height = parsedCanvasJson.overlayImage.height;

fabric.nodeCanvas.registerFont(__dirname + '/fonts/Lobster.otf', {family: 'Lobster'});
fabric.nodeCanvas.registerFont(__dirname + '/fonts/Architect.otf', {family: 'Architect'});

let canvas = new fabric.Canvas(null, {
    width,
    height
});

canvas.loadFromJSON(canvasJson, async (c) => {
    await new Promise((resolve => {
        makeImage(makeImageName(), canvas, resolve);
    }));
});


function makeImageName(i) {
    return `2sided_canvas_from_json_img_${i}.png`;
}

function makeImage(name, canvas, resolve) {
    let out = fs.createWriteStream(__dirname + `/images/${name}`);
    let stream = canvas.createPNGStream();

    stream.on('data', (chunk) => {
        out.write(chunk);
    });

    stream.on('end', () => {
        console.log('image successfully generated');
        resolve && resolve();
    });
}
