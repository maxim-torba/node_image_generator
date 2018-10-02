const args = require("args-parser")(process.argv);
const fabric = require('fabric').fabric;
const fs = require('fs');
const {exec} = require('child_process');
const request = require('request');

// let output = JSON.parse(args.output);
let configurationsText = fs.readFileSync('node_image_command_one_side_marking.txt', 'utf-8');//for testing

// let configurations = JSON.parse(args.configurations);

let configurations = JSON.parse(configurationsText);

let templateConfigurations = configurations.template_configurations;
let templateCustomizations = configurations.configurations;

let tmp_merge_marking = true;

for (let i in templateCustomizations) {
    if (!templateCustomizations.hasOwnProperty(i)) {
        return;
    }
    let customization = templateCustomizations[i];
    let configuration = templateConfigurations[i];

    // let imgName = `${new Date().getTime()}_${i}_.png`;
    let imgName = `${i}_.png`;
    renderCanvasFromCustomization(customization, configuration, imgName);
}

async function renderCanvasFromCustomization(customization, configuration, imgName) {//TODO check id of configuration bound
    let width = configuration.overlay.width;
    let height = configuration.overlay.height;

    let canvas = new fabric.Canvas(null, {
        width,
        height
    });

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

    for (let obj of customization.custom_object_group.custom_objects) {
        if (obj.type === 'image') {
            if (obj.image.imgType === 'src/imgs/raster') {
                await new Promise((resolve, reject) => {
                    new fabric.Image.fromObject(obj.image, (img) => {
                        canvas.add(img);
                        canvas.renderAll();
                        if (tmp_merge_marking) {
                            setMarking(resolve, img, canvas);
                        } else {
                            resolve();
                        }
                    });
                });
            } else if (obj.image.imgType === 'src/imgs/vector') {
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
            }
        } else if (obj.type === 'i-text') {
            /*   await new Promise((resolve, reject) => {
                   new fabric.IText.fromObject(obj.text, (text) => {
                       canvas.add(text);
                       canvas.renderAll();
                       resolve();
                   });
               });*/
            await new Promise((resolve, reject) => {
                let text = new fabric.Text(obj.text.text);
                text.setOptions(obj.text);
                canvas.add(text);
                canvas.renderAll();
                // console.log('obj.text.top: ', obj.text.top, 'text.top: ', text.top, 'text.scaleY: ', text.scaleY, 'obj.text.scaleY', obj.text.scaleY);
                resolve();
            });
        }
    }
    canvas.renderAll();
    await new Promise((resolve, reject) => {
        makeImage(imgName, canvas, resolve);
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

function setMarking(resolve, image, canvas) {
    let width = image.width * image.scaleX + 20;
    let height = image.height * image.scaleY + 20;

    let base64Marking = getBase64FromMarking(image.markingCanvasJson, width, height);
    // let svgMarking = getSvgFromMarking(image.markingCanvasJson, width, height);

    // console.log('base64: ', base64Marking, '\n svgMarking: ', svgMarking);

    fabric.Image.fromURL(base64Marking, (markingImage) => {
        markingImage.set({
            left: image.left,
            top: image.top,
            opacity: 0.4,
            scaleX: 0.95,
            scaleY: 0.95,
            stroke: 'black',
            strokeWidth: 1
        });
        canvas.add(markingImage);
        canvas.renderAll();
        resolve();
    });
}

function makeImage(name, canvas, resolve) {
    //  console.log(JSON.stringify(canvas.toJSON()));
    let out = fs.createWriteStream(__dirname + `/images/${name}`);
    let stream = canvas.createPNGStream();

    stream.on('data', (chunk) => {
        out.write(chunk);
    });

    stream.on('end', () => {
        console.log('finished');
        typeof resolve !== 'undefined' && resolve();
        // openGeneratedImage(name);//for testing
    });
}

function getBase64FromMarking(json, width, height) {
    let canvas = new fabric.Canvas(null, {
        width,
        height,
    });
    canvas.loadFromJSON(json);
    return canvas.toDataURL();
}

function getSvgFromMarking(json, width, height) {
    let canvas = new fabric.Canvas(null, {
        width,
        height
    });
    canvas.loadFromJSON(json);
    return canvas.toSVG();
}

function openGeneratedImage(name) {
    exec(`cd images && open ${name}`, (err, stdout, stderr) => {
        if (err) {
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
    });
}