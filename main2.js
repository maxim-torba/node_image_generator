const args = require("args-parser")(process.argv);
const fabric = require('fabric').fabric;
const fs = require('fs');
const {exec} = require('child_process');
const request = require('request');

// let configurationsText = fs.readFileSync('template_configuration_2_sides5.json', 'utf-8');//for testing
// let configurationsText = fs.readFileSync('template_configuration_2_sides_with_marking7.json', 'utf-8');//for testing
let configurationsText = fs.readFileSync('template_configuration_2_sides_usual5.json', 'utf-8');//for testing

let configurations;

let timesFont = new fabric.nodeCanvas.Font('Times New Roman', __dirname + '/fonts/Times.otf');
let chunkyFont = new fabric.nodeCanvas.Font('Chunky', __dirname + '/fonts/Chunky.otf');

try {
    configurations = JSON.parse(configurationsText).configurations;
    // console.log(configurations);
} catch (e) {
    console.error(e);
}

if (configurations) {
    for (let i = 0; i < configurations.length; i++) {
        renderCanvasFromConfiguration(configurations[i], i);
    }
}

async function renderCanvasFromConfiguration(configuration, index) {
    let width = configuration.overlay.width;
    let height = configuration.overlay.height;

    let canvas = new fabric.StaticCanvas(null, {
        width,
        height
    });

    canvas.contextContainer.addFont(timesFont);
    canvas.contextContainer.addFont(chunkyFont);

    await new Promise((resolve, reject) => {
        fabric.Image.fromObject(configuration.overlay, (img) => {
            setOverlay(resolve, img, canvas);
        });
    });

    await new Promise((resolve, reject) => {
        setWorkspace(configuration.workspace, canvas, resolve);
    });

    await new Promise((resolve, reject) => {
        fabric.Image.fromObject(configuration.background, (img) => {
            setBackground(resolve, img, canvas);
        });
    });


    for (let i = 0; i < configuration.custom_object_group.custom_objects.length; i++) {
        let obj = configuration.custom_object_group.custom_objects[i];
        if (obj.type === 'image') {
            if (obj.image.imgType === 'src/imgs/raster') {
                await new Promise((resolve, reject) => {
                    new fabric.Image.fromObject(obj.image, (img) => {
                        canvas.add(img);
                        canvas.renderAll();
                        if (img.markingCanvasJson) {
                            // setMarking(img, resolve);
                            setMarkingFromSvg(img, resolve)
                        } else {
                            resolve();
                        }
                        // resolve();
                    });
                });
            }
            /*else if (obj.image.imgType === 'src/imgs/vector') {
                           await new Promise((resolve, reject) => {
                               request(obj.image.src, {json: false}, (err, res, body) => {
                                   fabric.loadSVGFromString(body, (options, objects) => {
                                       let img = fabric.util.groupSVGElements(options, objects);
                                       Object.assign(img, obj.image);
                                       canvas.add(img);
                                       canvas.renderAll();
                                       resolve();
                                   });
                               });
                           });
                       }*/
        } else if (obj.type === 'i-text') {
         /*   await new Promise((resolve, reject) => {
                // obj.text.fontSize = obj.text.fontSize * Math.min(obj.text.scaleX, obj.text.scaleY);
                // obj.text.scaleX = 1;
                // obj.text.scaleY = 1;
                new fabric.IText.fromObject(obj.text, (text) => {
                    canvas.add(text);
                    canvas.renderAll();
                    resolve();
                });
            });*/
               await new Promise((resolve, reject) => {
                   let text = new fabric.Text(obj.text.text);
                   text.setOptions(obj.text);
                   // let newTextObj = Object.assign(text, obj.text);
                   // newTextObj.top = newTextObj.top - 10;
                   canvas.add(text);
                   canvas.renderAll();
                   // console.log(text.left, text.top, text.scaleX, text.scaleY);
                   // console.log('obj.text.top: ', obj.text.top, 'text.top: ', text.top, 'text.scaleY: ', text.scaleY, 'obj.text.scaleY', obj.text.scaleY);
                   resolve();
               });
        }
    }


    canvas.renderAll();
    await new Promise((resolve, reject) => {
        makeImage(makeImageName(index), canvas, resolve);
    });
    canvas.dispose();
}

function setOverlay(resolve, overlayImage, canvas) {
    canvas.setOverlayImage(overlayImage, () => {
        canvas.renderAll();
        typeof resolve !== 'undefined' && resolve();
    });
}

function setWorkspace(obj, canvas, resolve) {
    if (obj.type === 'circle') {
        new fabric.Circle.fromObject(obj, (workspace) => {
            typeof resolve !== 'undefined' && resolve();
            clipCanvas(workspace, canvas);
        });
    } else if (obj.type === 'rect') {
        new fabric.Rect.fromObject(obj, (workspace) => {
            typeof resolve !== 'undefined' && resolve();
            clipCanvas(workspace, canvas);
        });
    } else if (obj.type) {
        new fabric.Path.fromObject(obj, (workspace) => {
            typeof resolve !== 'undefined' && resolve();
            clipCanvas(workspace, canvas);
        });
    }
}

function clipCanvas(workspace, canvas) {
    workspace.objectCaching = false;
    canvas.clipTo = (ctx) => {
        workspace.render(ctx);
    };
}

function setBackground(resolve, backgroundImage, canvas) {
    canvas.setBackgroundImage(backgroundImage, () => {
        canvas.renderAll();
        typeof resolve !== 'undefined' && resolve();
    });
}

function makeImageName(index) {
    return `new_img_${index}.png`;
}

function setMarking(img, resolve) {
    // let width = image.width * image.scaleX;// + 20;
    // let height = image.height * image.scaleY;// + 20;
    // let width = img.getScaledWidth();
    // let height = img.getScaledHeight();
    // let width = img.width * img.canvas.getZoom() * img.scaleX;
    let width = img.width * img.canvas.getZoom() * img.scaleX * 0.75;
    // let height = img.height * img.canvas.getZoom() * img.scaleY;
    let height = img.height * img.canvas.getZoom() * img.scaleY * 0.75;
    let minX = img.aCoords.tl.x;
    let minY = img.aCoords.tl.y;
    // let base64Marking = getBase64FromMarking(img.markingCanvasJson, img.canvas.width, img.canvas.height);
    let base64Marking = getBase64FromMarking(img.markingCanvasJson, width, height);
    // let svgMarking = getSvgFromMarking(img.markingCanvasJson, width, height);

    // console.log('base64: ', base64Marking, '\n svgMarking: ', svgMarking);

    fabric.Image.fromURL(base64Marking, (markingImage) => {
        markingImage.set({
            left: img.left,
            top: img.top,
            opacity: 0.4,
            /* scaleX: 0.95,
             scaleY: 0.95,*/
            // stroke: 'black',
            // strokeWidth: 1
        });
        img.canvas.add(markingImage);
        img.canvas.renderAll();
        resolve();
    });
}

function setMarkingFromSvg(img, resolve) {
    let svgString = fs.readFileSync('marking.svg', 'utf-8');//for testing
    fabric.loadSVGFromString(svgString, (options, objects) => {
        let svgImg = fabric.util.groupSVGElements(options, objects);
        console.log('svgImg', svgImg);
        // img.canvas.add(svgImg);
        let newCanvas = new fabric.Canvas(null, {
            width: img.getScaledWidth(),
            height: img.getScaledHeight()
        });
        newCanvas.add(svgImg);
        newCanvas.renderAll();
        // img.canvas.renderAll();
        makeImage('only_marking2.png', newCanvas);
        resolve && resolve();
    });
}


function getBase64FromMarking(json, width, height) {
    // console.log(JSON.parse(json));
    let canvas = new fabric.Canvas(null, {
        width,
        height,
    });
    canvas.loadFromJSON(json);
    makeImage('only_marking.png', canvas);
    return canvas.toDataURL();
}

function makeImage(name, canvas, resolve) {
    let out = fs.createWriteStream(__dirname + `/images/${name}`);
    let stream = canvas.createPNGStream();

    stream.on('data', (chunk) => {
        out.write(chunk);
    });

    stream.on('end', () => {
        console.log('image successfully generated');
        typeof resolve !== 'undefined' && resolve();
        // openGeneratedImage(name);//for testing
    });
}
