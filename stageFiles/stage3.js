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

const proj = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
];

const rotZMat = (angle) => [
    [Math.cos(angle), -Math.sin(angle), 0],
    [Math.sin(angle),  Math.cos(angle), 0],
    [0, 0, 1]
];

const rotXMat = (angle) => [
    [1, 0, 0],
    [0, Math.cos(angle), -Math.sin(angle)],
    [0, Math.sin(angle),  Math.cos(angle)]
];

const rotYMat = (angle) => [
    [ Math.cos(angle), 0, Math.sin(angle)],
    [0, 1, 0],
    [-Math.sin(angle), 0, Math.cos(angle)]
];

function multMat(matrix, vertex) {
    const x = vertex.x;
    const y = vertex.y;
    const z = vertex.z;

    return {
        x: matrix[0][0] * x + matrix[0][1] * y + matrix[0][2] * z,
        y: matrix[1][0] * x + matrix[1][1] * y + matrix[1][2] * z,
        z: matrix[2][0] * x + matrix[2][1] * y + matrix[2][2] * z
    };
}

function perspectiveProject(point, fov, viewerDistance) {
    const scale = fov / (viewerDistance + point.z);
    return {
        x: point.x * scale + CW2,
        y: point.y * scale + CH2,
        z: point.z
    };
}

class Vertex {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

const drawLine = (x1, y1, x2, y2) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = "white";
    ctx.stroke();
}

const P = [];
const center = new Vertex(CW2, CH2, 0);

const init = () => {
    P[0] = new Vertex(400, 200, -100);
    P[1] = new Vertex(600, 200, -100);
    P[2] = new Vertex(400, 400, -100);
    P[3] = new Vertex(600, 400, -100);
    P[4] = new Vertex(400, 200, 100);
    P[5] = new Vertex(600, 200, 100);
    P[6] = new Vertex(400, 400, 100);
    P[7] = new Vertex(600, 400, 100);
}

const triangles = [
    [0, 1, 2], [1, 3, 2],
    [5, 4, 7], [4, 6, 7],
    [4, 0, 6], [0, 2, 6],
    [1, 5, 3], [5, 7, 3],
    [4, 5, 0], [5, 1, 0],
    [2, 3, 6], [3, 7, 6]
];

const engine = () => {
    angle += 0.02;

    // Camera control
    if (K.W) cameraRotX -= 0.02;
    if (K.S) cameraRotX += 0.02;
    if (K.A) cameraRotY -= 0.02;
    if (K.D) cameraRotY += 0.02;
    if (K.u) cameraZ -= 20;
    if (K.d) cameraZ += 20;

    ctx.clearRect(0, 0, cvs.width, cvs.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, cvs.width, cvs.height);

    const projected = [];

    for (let v of P) {
        let translated = new Vertex(v.x - center.x, v.y - center.y, v.z - center.z);
        let rotated = multMat(rotYMat(angle), translated);
        rotated = multMat(rotXMat(angle), rotated);
        rotated = multMat(rotZMat(angle), rotated);
        let movedBack = new Vertex(rotated.x + center.x, rotated.y + center.y, rotated.z + center.z);
        let proj2D = multMat(proj, movedBack);
        
        // drawVertex(proj2D.x, proj2D.y);
        projected.push(proj2D);
    }

    for (let tri of triangles) {
        const p1 = projected[tri[0]];
        const p2 = projected[tri[1]];
        const p3 = projected[tri[2]];

        drawLine(p1.x, p1.y, p2.x, p2.y);
        drawLine(p2.x, p2.y, p3.x, p3.y);
        drawLine(p3.x, p3.y, p1.x, p1.y);
    }

    requestAnimationFrame(engine);
}

init();
engine();
