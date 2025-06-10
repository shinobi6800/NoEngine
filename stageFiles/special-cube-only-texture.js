const cvs = document.querySelector('#c');
const ctx = cvs.getContext('2d');

cvs.width = 1080;
cvs.height = 620;

const CW = cvs.width;
const CH = cvs.height;
const CW2 = CW / 2;
const CH2 = CH / 2;

const texture = new Image();
texture.src = 'wall4.jpg';


let angle = 0;
let cameraZ = 1000;
const fov = 500;

const drawLine = (x1, y1, x2, y2) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = "white";
    ctx.stroke();
}

function drawTxOnFace(tl, bl, tr, br) {
    const steps = Math.ceil(Math.max(
        Math.hypot(bl.x - tl.x, bl.y - tl.y),
        Math.hypot(br.x - tr.x, br.y - tr.y)
    ));


    for (let i = 0; i < steps; i += 1) {
        const t = i / steps;
        const texY = Math.floor(t * texture.height);

        // Interpolate points across the face
        const leftX = tl.x + (bl.x - tl.x) * t;
        const leftY = tl.y + (bl.y - tl.y) * t;

        const rightX = tr.x + (br.x - tr.x) * t;
        const rightY = tr.y + (br.y - tr.y) * t;

        // Draw the texture strip at the interpolated position
        drawTextureLine(leftX, leftY, rightX, rightY, texY);
    }
}

function drawTextureLine(x1, y1, x2, y2, texY) {
    // Width of the interpolated line
    const width = Math.hypot(x2 - x1, y2 - y1);

    // Angle of the line
    const angle = Math.atan2(y2 - y1, x2 - x1);

    ctx.save();

    // Move to start point
    ctx.translate(x1, y1);
    ctx.rotate(angle);

    // Draw 1px strip from the texture onto the line
    ctx.drawImage(
        texture,
        0,
        texY,
        texture.width,
        1, // Source: 1 row from texture
        0,
        0,
        width,
        1           // Dest: stretch across the line
    );

    ctx.restore();
}


const proj = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
];

const rotZMat = (angle) => [
    [Math.cos(angle), -Math.sin(angle), 0],
    [Math.sin(angle), Math.cos(angle), 0],
    [0, 0, 1]
];

const rotXMat = (angle) => [
    [1, 0, 0],
    [0, Math.cos(angle), -Math.sin(angle)],
    [0, Math.sin(angle), Math.cos(angle)]
];

const rotYMat = (angle) => [
    [Math.cos(angle), 0, Math.sin(angle)],
    [0, 1, 0],
    [-Math.sin(angle), 0, Math.cos(angle)]
];

function multMat(matrix, vector) {
    const x = vector.x;
    const y = vector.y;
    const z = vector.z;

    return {
        x: matrix[0][0] * x + matrix[0][1] * y + matrix[0][2] * z,
        y: matrix[1][0] * x + matrix[1][1] * y + matrix[1][2] * z,
        z: matrix[2][0] * x + matrix[2][1] * y + matrix[2][2] * z
    };
}

function perspectiveProject(point, fov, viewerDistance) {
    const z = viewerDistance + point.z;

    // Prevent division by zero or negative scale
    if (z <= 1) return null;

    const scale = fov / z;
    return {
        x: point.x * scale + CW2,
        y: point.y * scale + CH2,
        z: point.z
    };
}

class Vector {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

let cameraPos = new Vector(0, 0, 0);

const P = [];
const center = new Vector(CW2, CH2, 0);


class Cube {
    constructor({ x, y, z, w = 200, h = 200, d = 200 }) {
        this.x = x;
        this.y = y;
        this.z = z;

        this.w = w / 2; // half width
        this.h = h / 2; // half height
        this.d = d / 2; // half depth

        this.V = [];
        this.F = [
            [0, 1, 3, 2], // front
            [4, 5, 7, 6], // back
            [0, 2, 6, 4], // left
            [1, 5, 7, 3], // right
            [0, 4, 5, 1], // top
            [2, 3, 7, 6]  // bottom
        ];

        this.setUp();
    }

    setUp() {
        const x = this.x;
        const y = this.y;
        const z = this.z;

        const w = this.w;
        const h = this.h;
        const d = this.d;

        this.V[0] = new Vector(-w + x, -h + y, -d + z); // top-left-front
        this.V[1] = new Vector(w + x, -h + y, -d + z);  // top-right-front
        this.V[2] = new Vector(-w + x, h + y, -d + z);  // bottom-left-front
        this.V[3] = new Vector(w + x, h + y, -d + z);   // bottom-right-front
        this.V[4] = new Vector(-w + x, -h + y, d + z);  // top-left-back
        this.V[5] = new Vector(w + x, -h + y, d + z);   // top-right-back
        this.V[6] = new Vector(-w + x, h + y, d + z);   // bottom-left-back
        this.V[7] = new Vector(w + x, h + y, d + z);    // bottom-right-back
    }
}

const cube1 = new Cube({ x: 400, y: 200, z: 0 });

const world = [
    cube1
];

const init = () => {

}

const projectWorld = (obj, queue) => {
    const projected = [];

    angle += 0.02;

    for (let v of obj.V) {
        let translated = new Vector(v.x - center.x, v.y - center.y, v.z - center.z);
        let rotated = multMat(rotYMat(angle), translated);
        rotated = multMat(rotXMat(angle), rotated);
        rotated = multMat(rotZMat(angle), rotated);
        let movedBack = new Vector(rotated.x + center.x, rotated.y + center.y, rotated.z + center.z);
        let proj2D = multMat(proj, movedBack);

        projected.push(proj2D);
    }

    for (let fac of obj.F) {
        let i1 = fac[0];
        let i2 = fac[1];
        let i3 = fac[2];
        let i4 = fac[3];

        let p1 = projected[i1];
        let p2 = projected[i2];
        let p3 = projected[i3];
        let p4 = projected[i4];

        if (p1 && p2 && p3 && p4) {
            const avgZ = (p1.z + p2.z + p3.z + p4.z) / 4;

            queue.push({
                p1,
                p2,
                p3,
                p4,
                z: avgZ,
                color: 'red'
            });
        }
    }
}

const engine = () => {

    ctx.clearRect(0, 0, cvs.width, cvs.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, cvs.width, cvs.height);

    let objQueue = [];

    for (let obj of world) {
        projectWorld(obj, objQueue);
    }

     // Sort triangles back to front
    objQueue.sort((a, b) => b.z - a.z);

    // Draw sorted faces
    for (let f of objQueue) {
        drawTxOnFace(f.p1, f.p4, f.p2, f.p3);
    }

    requestAnimationFrame(engine);
}

init();
engine();
