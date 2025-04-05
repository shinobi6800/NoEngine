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

const rotMat = (angle) => {
    return [
        [Math.cos(angle), -Math.sin(angle), 0],
        [Math.sin(angle), Math.cos(angle), 0],
        [0 , 0, 1]
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

const P = []; // points
const center = new Vector(CW2, CH2, 0);

const init = () => {
    P[0] = new Vector(400, 200, 0);
    P[1] = new Vector(600, 200, 0);
    P[2] = new Vector(400, 400, 0);
    P[3] = new Vector(600, 400, 0);
}

const engine = () => {
    angle += 0.01;

    ctx.clearRect(0, 0, cvs.width, cvs.height);

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, cvs.width, cvs.height);

    for (let v of P) {
        let translated = new Vector(v.x - center.x, v.y - center.y, v.z - center.z);
        let rotated = multMat(rotMat(angle), translated);
        let movedBack = new Vector(rotated.x + center.x, rotated.y + center.y, rotated.z + center.z);
        let proj2D = multMat(proj, movedBack);
        
        drawVertex(proj2D.x, proj2D.y);
    }

    requestAnimationFrame(engine);
}

init();
engine();
