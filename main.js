const args = require("args-parser")(process.argv);
const fabric = require('fabric').fabric;
const fs = require('fs');
const {exec} = require('child_process');

// let output = JSON.parse(args.output);
let configurations = JSON.parse(args.configurations);

let templateConfigurations = configurations.template_configurations;
let templateCustomizations = configurations.configurations;

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

async function renderCanvasFromCustomization(customization, configuration, imgName) {
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
            await new Promise((resolve, reject) => {
                new fabric.Image.fromObject(obj.image, (img) => {
                    canvas.add(img);
                    canvas.renderAll();
                    resolve();
                });
            });
        } else if (obj.type === 'i-text') {
            await new Promise((resolve, reject) => {
                new fabric.IText.fromObject(obj.text, (text) => {
                    canvas.add(text);
                    canvas.renderAll();
                    resolve();
                });
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

function makeImage(name, canvas, resolve) {
    let out = fs.createWriteStream(__dirname + `/images/${name}`);
    let stream = canvas.createPNGStream();

    stream.on('data', (chunk) => {
        out.write(chunk);
    });

    stream.on('end', () => {
        console.log('finished');
        typeof resolve !== 'undefined' && resolve();
        // openImage(name);//for testing
    });
}

function openImage(name) {
    exec(`cd images && open ${name}`, (err, stdout, stderr) => {
        if (err) {
            return;
        }

        // the *entire* stdout and stderr (buffered)
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
    });
}