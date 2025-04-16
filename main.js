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

function drawScanline(y, xStart, xEnd) {
    ctx.beginPath();
    ctx.moveTo(xStart, y);
    ctx.lineTo(xEnd, y);
    ctx.strokeStyle = 'blue';
    ctx.stroke();
}

const drawTriangleScanlines = (p1, p2, p3) => {
    const points = [p1, p2, p3].sort((a, b) => a.y - b.y);
    const [v0, v1, v2] = points;

    const interp = (a, b, t) => a + (b - a) * t;

    function edge(x0, y0, x1, y1) {
        const points = [];
        const dy = y1 - y0;
        for (let y = Math.ceil(y0); y <= Math.floor(y1); y++) {
            const t = (y - y0) / dy;
            const x = interp(x0, x1, t);
            points.push({ x, y });
        }
        return points;
    }

    // Build edge lists
    const left = edge(v0.x, v0.y, v2.x, v2.y); // long edge
    const rightTop = edge(v0.x, v0.y, v1.x, v1.y);
    const rightBottom = edge(v1.x, v1.y, v2.x, v2.y);

    const fullRight = rightTop.concat(rightBottom);

    const ymin = Math.ceil(v0.y);
    const ymax = Math.floor(v2.y);

    for (let i = 0; i < ymax - ymin + 1; i++) {
        const leftX = left[i].x;
        const rightX = fullRight[i].x;
        const y = left[i].y;

        const xStart = Math.min(leftX, rightX);
        const xEnd = Math.max(leftX, rightX);

        drawScanline(y, xStart, xEnd);
    }
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


const cube1 = new Cube({ x: 100, y: 100, z: 0, size: 50 });
const cube2 = new Cube({ x: -200, y: 100, z: 0, size: 150 });
const cube3 = new Cube({ x: 300, y: 200, z: 0, size: 100 });

const plane1 = new Plane({ isHor: true, x: 20, y: 850, z: 0, size: 600 });

const cubes = [cube1, cube2, cube3];
const planes = [plane1];

const init = () => {

}

function drawTriangle(p1, p2, p3, fillColor = 'black') {
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.closePath();

    ctx.fillStyle = fillColor;
    ctx.fill();
}


const projectWorld = (obj, queue) => {
    let projected = [];

    for (let v of obj.V) {
        let translated = {
            x: v.x - cameraPos.x,
            y: v.y - cameraPos.y,
            z: v.z - cameraPos.z
        };

        let rotated = multMat(rotYMat(-cameraRotY), translated);
        rotated = multMat(rotXMat(-cameraRotX), rotated);

        let proj2D = perspectiveProject(rotated, fov, cameraZ);

        if (!proj2D) {
            projected.push(null);
            continue;
        }

        proj2D.x -= cameraPos.x;
        proj2D.y -= cameraPos.y;
        proj2D.z = rotated.z; // Keep rotated Z for depth

        projected.push(proj2D);
    }

    for (let tri of obj.T) {
        const p1 = projected[tri[0]];
        const p2 = projected[tri[1]];
        const p3 = projected[tri[2]];

        if (p1 && p2 && p3) {
            const avgZ = (p1.z + p2.z + p3.z) / 3;

            queue.push({
                p1,
                p2,
                p3,
                z: avgZ,
                color: 'red' // or get it from the object
            });
        }
    }
};

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

    let planeQueue = [];
    let objQueue = [];

    for (let p of planes) {
        projectWorld(p, planeQueue);
    }

    for (let c of cubes) {
        projectWorld(c, objQueue);
    }


    // Sort triangles back to front
    objQueue.sort((a, b) => b.z - a.z);
    planeQueue.sort((a, b) => b.z - a.z);

    // Draw sorted triangles
    for (let tri of planeQueue) {
        drawTriangle(tri.p1, tri.p2, tri.p3, tri.color);
        drawLine(tri.p1.x, tri.p1.y, tri.p2.x, tri.p2.y);
        drawLine(tri.p2.x, tri.p2.y, tri.p3.x, tri.p3.y);
        drawLine(tri.p3.x, tri.p3.y, tri.p1.x, tri.p1.y);
    }

    // Draw sorted triangles
    for (let tri of objQueue) {
        // drawTriangle(tri.p1, tri.p2, tri.p3, tri.color);
        drawLine(tri.p1.x, tri.p1.y, tri.p2.x, tri.p2.y);
        drawLine(tri.p2.x, tri.p2.y, tri.p3.x, tri.p3.y);
        drawLine(tri.p3.x, tri.p3.y, tri.p1.x, tri.p1.y);

        drawTriangleScanlines(tri.p1, tri.p2, tri.p3);

    }



    requestAnimationFrame(engine);
}

init();
engine();
