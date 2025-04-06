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
        [0, 0, 1]
    ];
}

const rotXMat = (angle) => {
    return [
        [1, 0, 0],
        [0, Math.cos(angle), -Math.sin(angle)],
        [0, Math.sin(angle), Math.cos(angle)]
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

const drawVertex = (vertex) => {
    ctx.beginPath();
    ctx.arc(vertex.x, vertex.y, 5, 0, 2 * Math.PI);
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

// Define the triangles (indices of vertices)
const triangles = [];


const init = () => {
    P.length = 0; // Clear existing points
    const radius = 150;
    const segments = 20; // Higher = smoother
    const rings = 40;

    for (let i = 0; i <= segments; i++) {
        const theta = i * Math.PI / segments; // latitude

        for (let j = 0; j <= segments; j++) {
            const phi = j * 2 * Math.PI / segments; // longitude

            const x = radius * Math.sin(theta) * Math.cos(phi);
            const y = radius * Math.sin(theta) * Math.sin(phi);
            const z = radius * Math.cos(theta);

            P.push(new Vector(x, y, z)); // No center offset here!
        }
    }

    for (let i = 0; i < rings - 1; i++) {
        for (let j = 0; j < segments - 1; j++) {
            let a = i * segments + j;
            let b = a + 1;
            let c = a + segments;
            let d = c + 1;

            // triangle 1
            triangles.push([a, b, c]);

            // triangle 2
            triangles.push([b, d, c]);
        }
    }
};






const engine = () => {
    angle += 0.02;

    ctx.clearRect(0, 0, cvs.width, cvs.height);

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, cvs.width, cvs.height);

    // drawVertex(new Vector(100, 100, 100));

    const projected = [];

    // Apply transformations (rotation + projection)
    for (let v of P) {
        let rotated = multMat(rotXMat(angle), v);
        rotated = multMat(rotYMat(angle), rotated);
        rotated = multMat(rotZMat(angle), rotated);
        let movedBack = new Vector(rotated.x + center.x * 1, rotated.y + center.y * 1, rotated.z + center.z * 1);
        let proj2D = multMat(proj, movedBack);
        projected.push(proj2D);
    }

    // Draw triangles
    for (let tri of triangles) {
        const p1 = projected[tri[0]];
        const p2 = projected[tri[1]];
        const p3 = projected[tri[2]];

        // Connect the vertices to draw triangles
        if (p1 && p2 && p3) {
            drawLine(p1.x, p1.y, p2.x, p2.y);
            drawLine(p2.x, p2.y, p3.x, p3.y);
            drawLine(p3.x, p3.y, p1.x, p1.y);
        }
    }

    requestAnimationFrame(engine);
}

init();
engine();
