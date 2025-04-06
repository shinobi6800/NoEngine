const cvs = document.querySelector('#c');
const ctx = cvs.getContext('2d');

cvs.width = 1080;
cvs.height = 620;

const CW = cvs.width;
const CH = cvs.height;
const CW2 = CW / 2;
const CH2 = CH / 2;

let angle = 0;

const proj = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
];

const rotZMat = (angle) => {
    return [
        [Math.cos(angle), -Math.sin(angle), 0],
        [Math.sin(angle), Math.cos(angle), 0],
        [0 , 0, 1]
    ];
}

const rotXMat = (angle) => {
    return [
        [1, 0, 0],
        [0, Math.cos(angle), -Math.sin(angle)],
        [0 , Math.sin(angle), Math.cos(angle)]
    ];
}

const rotYMat = (angle) => {
    return [
        [Math.cos(angle), 0, Math.sin(angle)],
        [0, 1, 0],
        [-Math.sin(angle), 0, Math.cos(angle)]
    ];
}

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

class Vector {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

const drawVertex = (x, y) => {
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = "white";
    ctx.fill();
}

const drawLine = (x1, y1, x2, y2) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = "white";
    ctx.stroke();
}

const P = []; // vertices, points
const center = new Vector(CW2, CH2, 0);

const init = () => {
    P[0] = new Vector(400, 200, -100);
    P[1] = new Vector(600, 200, -100);
    P[2] = new Vector(400, 400, -100);
    P[3] = new Vector(600, 400, -100);
    P[4] = new Vector(400, 200, 100);
    P[5] = new Vector(600, 200, 100);
    P[6] = new Vector(400, 400, 100);
    P[7] = new Vector(600, 400, 100);
}

// Define the triangles (indices of vertices)
const triangles = [
    // Front face
    [0, 1, 2],
    [1, 3, 2],

    // Back face
    [5, 4, 7],
    [4, 6, 7],

    // Left face
    [4, 0, 6],
    [0, 2, 6],

    // Right face
    [1, 5, 3],
    [5, 7, 3],

    // Top face
    [4, 5, 0],
    [5, 1, 0],

    // Bottom face
    [2, 3, 6],
    [3, 7, 6],
];

const engine = () => {
    angle += 0.02;

    ctx.clearRect(0, 0, cvs.width, cvs.height);

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, cvs.width, cvs.height);

    const projected = [];

    // Apply transformations (rotation + projection)
    for (let v of P) {
        let translated = new Vector(v.x - center.x, v.y - center.y, v.z - center.z);
        let rotated = multMat(rotYMat(angle), translated);
        rotated = multMat(rotXMat(angle), rotated);
        rotated = multMat(rotZMat(angle), rotated);
        let movedBack = new Vector(rotated.x + center.x, rotated.y + center.y, rotated.z + center.z);
        let proj2D = multMat(proj, movedBack);
        projected.push(proj2D);
    }

    // Draw triangles
    for (let tri of triangles) {
        const p1 = projected[tri[0]];
        const p2 = projected[tri[1]];
        const p3 = projected[tri[2]];

        // Connect the vertices to draw triangles
        drawLine(p1.x, p1.y, p2.x, p2.y);
        drawLine(p2.x, p2.y, p3.x, p3.y);
        drawLine(p3.x, p3.y, p1.x, p1.y);
    }

    requestAnimationFrame(engine);
}

init();
engine();
