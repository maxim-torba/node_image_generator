const {createCanvas, loadImage} = require('canvas');
const fs = require('fs');
const canvas = createCanvas(960, 798);
const ctx = canvas.getContext('2d');

// ctx.font = '30px Impact';
ctx.font = '30px Times New Roman';
// ctx.save();
// ctx.rotate(0.1);
ctx.fillText('Awesome!', 50, 100);
// ctx.strokeStyle = 'rgba(0,0,0,0.5)';
// ctx.restore();
// Draw line under text
// var text = ctx.measureText('Awesome!');
// ctx.strokeStyle = 'rgba(0,0,0,0.5)';
// ctx.beginPath();
// ctx.lineTo(50, 102);
// ctx.lineTo(50 + text.width, 102);
// ctx.stroke();

/*loadImage(__dirname + '/images/test_image.jpg').then((image) => {
    ctx.drawImage(image, 50, 0, 70, 70);
    var data = canvas.toDataURL().replace(/^data:image\/\w+;base64,/, "");
    var buf = new Buffer.from(data, 'base64');
    fs.writeFileSync(__dirname + '/images/from_node_canvas.png', buf);
});*/
var data = canvas.toDataURL().replace(/^data:image\/\w+;base64,/, "");
// console.log(canvas.toDataURL());
var buf = new Buffer.from(data, 'base64');
fs.writeFileSync(__dirname + '/images/from_node_canvas_1.png', buf);
