const cvs = document.querySelector('#c');
const ctx = cvs.getContext('2d');

cvs.width = 1080;
cvs.height = 620;

const CW = cvs.width;
const CH = cvs.height;
const CW2 = CW / 2;
const CH2 = CH / 2;

let angle = 0;
let cameraZ = 1000;
const fov = 500;


let cameraRotX = 0; // look up/down
let cameraRotY = 0; // look left/right

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

const drawLine = (x1, y1, x2, y2) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = "white";
    ctx.stroke();
}

const P = [];
const center = new Vector(CW2, CH2, 0);

class Cube {
    constructor({ x, y, z, size }) {
        this.size = size;
        this.x = x;
        this.y = y;
        this.z = z;

        this.V = []; // vertices
        this.T = [
            [0, 1, 2], [1, 3, 2],
            [5, 4, 7], [4, 6, 7],
            [4, 0, 6], [0, 2, 6],
            [1, 5, 3], [5, 7, 3],
            [4, 5, 0], [5, 1, 0],
            [2, 3, 6], [3, 7, 6]
        ]; // triangles
        this.setUp();
    }

    setUp() {
        this.V[0] = new Vector(-this.size + this.x, -this.size + this.y, -this.size + this.z);
        this.V[1] = new Vector(this.size + this.x, -this.size + this.y, -this.size + this.z);
        this.V[2] = new Vector(-this.size + this.x, this.size + this.y, -this.size + this.z);
        this.V[3] = new Vector(this.size + this.x, this.size + this.y, -this.size + this.z);
        this.V[4] = new Vector(-this.size + this.x, -this.size + this.y, this.size + this.z);
        this.V[5] = new Vector(this.size + this.x, -this.size + this.y, this.size + this.z);
        this.V[6] = new Vector(-this.size + this.x, this.size + this.y, this.size + this.z);
        this.V[7] = new Vector(this.size + this.x, this.size + this.y, this.size + this.z);
    }
}

class Plane {
    constructor({ isHor, x, y, z, size }) {
        this.isHor = isHor;
        this.x = x;
        this.y = y;
        this.z = z;
        this.size = size;
        this.V = []; // vertices
        this.T = [
            [0, 1, 2], [1, 3, 2],
        ]; // triangles
        this.setUp();
    }

    setUp() {
        if (this.isHor) {
            this.V[0] = new Vector(-this.size + this.x, -this.size + this.y, -this.size + this.z);
            this.V[1] = new Vector(this.size + this.x, -this.size + this.y, -this.size + this.z);
            this.V[2] = new Vector(-this.size + this.x, -this.size + this.y, this.size + this.z);
            this.V[3] = new Vector(this.size + this.x, -this.size + this.y, this.size + this.z);
        } else {
            this.V[0] = new Vector(-this.size + this.x, -this.size + this.y, -this.size + this.z);
            this.V[1] = new Vector(this.size + this.x, -this.size + this.y, -this.size + this.z);
            this.V[2] = new Vector(-this.size + this.x, this.size + this.y, -this.size + this.z);
            this.V[3] = new Vector(this.size + this.x, this.size + this.y, -this.size + this.z);
        }
    }
}


const cube1 = new Cube({x: 100, y: 100, z: 0, size: 50});
const cube2 = new Cube({x: -200, y: 100, z: 0, size: 150});
const cube3 = new Cube({x: 300, y: 200, z: 0, size: 100});

const plane1 = new Plane({isHor: true, x: 20, y: 850, z: 0, size: 600 });

const world = [
    cube1,cube2,cube3,plane1
];

const init = () => {
    
}

const projectWorld = (obj) => {
    const projected = [];

    for (let v of obj.V) {
        let translated = {
            x: v.x - cameraPos.x,
            y: v.y - cameraPos.y,
            z: v.z - cameraPos.z
        };


        let rotated = multMat(rotYMat(-cameraRotY), translated);
        rotated = multMat(rotXMat(-cameraRotX), rotated);

        let proj2D = perspectiveProject(rotated, fov, cameraZ);

        if (!proj2D) continue;

        proj2D.x -= cameraPos.x;
        proj2D.y -= cameraPos.y;
        proj2D.z -= cameraPos.z;

        projected.push(proj2D);
    }

    for (let tri of obj.T) {
        const p1 = projected[tri[0]];
        const p2 = projected[tri[1]];
        const p3 = projected[tri[2]];

        if (p1 && p2 && p3) {
            drawLine(p1.x, p1.y, p2.x, p2.y);
            drawLine(p2.x, p2.y, p3.x, p3.y);
            drawLine(p3.x, p3.y, p1.x, p1.y);
        }
    }
}

const engine = () => {
    // Camera control
    if (K.W) cameraRotX -= 0.02;
    if (K.S) cameraRotX += 0.02;
    if (K.A) cameraRotY -= 0.02;
    if (K.D) cameraRotY += 0.02;
    if (K.u) cameraZ -= 10;
    if (K.d) cameraZ += 10;
    if (K.l) {
        cameraPos.x -= Math.cos(cameraRotY) * 4;
        cameraPos.z += Math.sin(cameraRotY) * 4;
    }
    if (K.r) {
        cameraPos.x += Math.cos(cameraRotY) * 4;
        cameraPos.z -= Math.sin(cameraRotY) * 4;
    }


    ctx.clearRect(0, 0, cvs.width, cvs.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, cvs.width, cvs.height);

    for(let obj of world) {
        projectWorld(obj);
    }

    requestAnimationFrame(engine);
}

init();
engine();
