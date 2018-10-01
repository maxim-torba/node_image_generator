const args = require("args-parser")(process.argv);
const fabric = require('fabric').fabric;
const fs = require('fs');
// console.log(JSON.parse( args.output));
let output = JSON.parse(args.output);
let configurations = JSON.parse(args.configurations);

let first_template = configurations.template_configurations[0];
let first_customization = configurations.configurations[0];
// console.log('first_customization', first_customization.custom_object_group.custom_objects);

//console.log('output', output, 'first_template', first_template, 'first_customization', first_customization);

let canvas = new fabric.Canvas(null, {width: 1920, height: 1080});

/*
let jsonOverlay = `{"type":"image","version":"2.3.6","originX":"left","originY":"top","left":0,"top":0,"width":898,"height":678,"fill":"rgb(0,0,0)","stroke":null,"strokeWidth":0,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":4,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","paintFirst":"fill","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"crossOrigin":"anonymous","cropX":0,"cropY":0,"src":"http://configurator-loc.com//storage/templates/overlayImage/5z0pXkzsc5HdqKnsGn24cfSD6nX6mvVvwfwBp05t.png","filters":[]}`;
fabric.Image.fromObject(JSON.parse(jsonOverlay), (img) => {
    canvas.setOverlayImage(img, () => {
        canvas.renderAll();
        let out = fs.createWriteStream(__dirname + '/out.png');
        let stream = canvas.createPNGStream();
        stream.on('data', function (chunk) {
            out.write(chunk);
        });
    });

});*/

async function setFistTemplate() {
    await new Promise((resolve, reject) => {
        fabric.Image.fromObject(first_template.overlay, (img) => {
            setOverlay(resolve, img);
        });
    });
    await new Promise((resolve, reject) => {
        fabric.Image.fromObject(first_template.background, (img) => {
            setBackground(resolve, img);
        });
    });
    for (let obj of first_customization.custom_object_group.custom_objects) {
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

    makeImage();
}

setFistTemplate();

function setOverlay(resolve, overlayImage) {
    canvas.setOverlayImage(overlayImage, () => {
        canvas.renderAll.bind(canvas);

        /*   let zoom = canvas.getWidth() / overlayImage.width;
           canvas.setZoom(zoom);
           console.log('overlay sets');*/

        typeof resolve !== 'undefined' && resolve();
    });
    /*
        , {
            originX: 'left',
            originY: 'top',
            crossOrigin: 'anonymous',
        }*/
}

function setBackground(resolve, backgroundImage) {
    canvas.setBackgroundImage(backgroundImage, () => {
        canvas.renderAll.bind(canvas);
        /*

                let zoom = canvas.getWidth() / overlayImage.width;
                canvas.setZoom(zoom);
                console.log('overlay sets');
        */

        typeof resolve !== 'undefined' && resolve();
    });
    /*
        , {
            originX: 'left',
            originY: 'top',
            crossOrigin: 'anonymous',
        }*/
}


function makeImage() {
    // console.log(canvas.toDataURL());
    canvas.renderAll();
    let out = fs.createWriteStream(__dirname + '/out_of_date.png');
    let stream = canvas.createPNGStream();
    stream.on('data', function (chunk) {
        out.write(chunk);
    });
}