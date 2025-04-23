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

function fillQuad(tl, tr, br, bl, color, alpha = 0.5, isL = false) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;

    if (isL) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 10; // adjust for strength of glow
    }

    ctx.beginPath();
    ctx.moveTo(tl.x, tl.y);
    ctx.lineTo(tr.x, tr.y);
    ctx.lineTo(br.x, br.y);
    ctx.lineTo(bl.x, bl.y);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}


function getFaceCenter(tl, tr, br, bl) {
    return {
        x: (tl.x + tr.x + br.x + bl.x) / 4,
        y: (tl.y + tr.y + br.y + bl.y) / 4,
        z: (tl.z + tr.z + br.z + bl.z) / 4,
    };
}

function getDistance3D(a, b) {
    return Math.sqrt(
        (a.x - b.x) ** 2 +
        (a.y - b.y) ** 2 +
        (a.z - b.z) ** 2
    );
}

function getLightIntensity(distance, radius = 300) {
    const falloff = distance / radius;
    return Math.max(0, 1 - falloff); // Linear falloff
}


const drawLine = (x1, y1, x2, y2) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = "white";
    ctx.stroke();
}

function isLineOnScreen(x1, y1, x2, y2, padding = 50) {
    // Pad the screen edges slightly to account for rotations and rounding
    const inBounds = (x, y) =>
        x >= -padding && x <= CW + padding &&
        y >= -padding && y <= CH + padding;

    return inBounds(x1, y1) || inBounds(x2, y2);
}

function isLineCompletelyOffScreen(x1, y1, x2, y2) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Bounding box of the line
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    // Entirely outside the screen
    return (
        maxX < 0 ||
        minX > w ||
        maxY < 0 ||
        minY > h
    );
}



function drawTxOnFace(tl, bl, tr, br) {
    const steps = Math.ceil(Math.max(
        Math.hypot(bl.x - tl.x, bl.y - tl.y),
        Math.hypot(br.x - tr.x, br.y - tr.y)
    ));


    for (let i = 0; i < steps; i += 1) {
        let t = i / steps;
        let texY = Math.floor(t * texture.height);

        // Interpolate points across the face
        let leftX = tl.x + (bl.x - tl.x) * t;
        let leftY = tl.y + (bl.y - tl.y) * t;

        let rightX = tr.x + (br.x - tr.x) * t;
        let rightY = tr.y + (br.y - tr.y) * t;

        // Draw the texture strip at the interpolated position
        if (isLineOnScreen(leftX, leftY, rightX, rightY) || !isLineCompletelyOffScreen(leftX, leftY, rightX, rightY)) {
            drawTextureLine(leftX, leftY, rightX, rightY, texY);
        }

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

function perspectiveProject(point, fov, viewerDistance, isL) {
    const z = viewerDistance + point.z;

    // Prevent division by zero or negative scale
    if (z <= 1) return null;

    const scale = fov / z;
    return {
        x: point.x * scale + CW2,
        y: point.y * scale + CH2,
        z: point.z,
        isL: isL
    };
}

class Vertex {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

let cameraPos = new Vertex(0, 0, 0);

const P = [];
const center = new Vertex(CW2, CH2, 0);

let lightPos = { x: 600, y: -100, z: -200 };


class Cube {
    constructor({ x, y, z, w = 100, h = 100, d = 100, isL = false }) {
        this.x = x;
        this.y = y;
        this.z = z;

        this.w = w / 2; // half width
        this.h = h / 2; // half height
        this.d = d / 2; // half depth

        this.isL = isL;

        this.V = [];
        this.F = [
            [0, 1, 3, 2], // front
            [4, 5, 7, 6], // back
            [0, 2, 6, 4], // left
            [1, 5, 7, 3], // right
            [0, 4, 5, 1], // top
            [2, 3, 7, 6]  // bottom
        ];

        this.faceBrightness = new Array(6).fill(1); // one brightness per face

        this.setUp();
        if (!this.isL) {
            this.calcLighting(lightPos);
        }
    }

    calcLighting(lightPos, intensity = 500) {
        for (let i = 0; i < 6; i++) {
            let face = this.F[i];

            // Get face center
            let v1 = this.V[face[0]];
            let v2 = this.V[face[1]];
            let v3 = this.V[face[2]];
            let v4 = this.V[face[3]];

            let center = new Vertex(
                (v1.x + v2.x + v3.x + v4.x) / 4,
                (v1.y + v2.y + v3.y + v4.y) / 4,
                (v1.z + v2.z + v3.z + v4.z) / 4
            );

            // Get distance from light
            let dx = center.x - lightPos.x;
            let dy = center.y - lightPos.y;
            let dz = center.z - lightPos.z;

            let dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            let brightness = Math.min(0.8, (dist * dist) / (intensity * intensity));

            this.faceBrightness[i] = brightness;
        }
    }

    setUp() {
        const x = this.x;
        const y = this.y;
        const z = this.z;

        const w = this.w;
        const h = this.h;
        const d = this.d;

        this.V[0] = new Vertex(-w + x, -h + y, -d + z); // top-left-front
        this.V[1] = new Vertex(w + x, -h + y, -d + z);  // top-right-front
        this.V[2] = new Vertex(-w + x, h + y, -d + z);  // bottom-left-front
        this.V[3] = new Vertex(w + x, h + y, -d + z);   // bottom-right-front
        this.V[4] = new Vertex(-w + x, -h + y, d + z);  // top-left-back
        this.V[5] = new Vertex(w + x, -h + y, d + z);   // top-right-back
        this.V[6] = new Vertex(-w + x, h + y, d + z);   // bottom-left-back
        this.V[7] = new Vertex(w + x, h + y, d + z);    // bottom-right-back
    }
}


const cube1 = new Cube({ x: 0, y: 0, z: 0, w: 200, h: 100, d: 300 });
const cube2 = new Cube({ x: -200, y: 0, z: 0, w: 100, h: 500, d: 100 });
const cube3 = new Cube({ x: 300, y: 200, z: 0 });
const cube4 = new Cube({ ...lightPos, w: 50, h: 50, d: 50, isL: true });

const cubes = [cube1, cube2, cube3, cube4];

const init = () => {

}


const projectWorld = (obj, objIndex, queue) => {
    let projected = [];

    for (let v of obj.V) {
        let translated = {
            x: v.x - cameraPos.x,
            y: v.y - cameraPos.y,
            z: v.z - cameraPos.z
        };

        let rotated = multMat(rotYMat(-cameraRotY), translated);
        rotated = multMat(rotXMat(-cameraRotX), rotated);

        let proj2D = perspectiveProject(rotated, fov, cameraZ, obj.isL);

        if (!proj2D) {
            projected.push(null);
            continue;
        }

        proj2D.x -= cameraPos.x;
        proj2D.y -= cameraPos.y;
        proj2D.z = rotated.z; // Keep rotated Z for depth

        projected.push(proj2D);
    }

    // for (let fac of obj.F) {
    obj.F.forEach((fac, index) => {
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
                isL: obj.isL,
                objIndex: objIndex,
                facIndex: index
            });
        }
    });
};

let lVelx = 0;
let lVelz = 0;

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

    let objQueue = [];

    cubes.forEach((c, i) => {
        projectWorld(c, i, objQueue);

        if (c.isL) {

            // circular light motion
            const radius = 300;
            const speed = 0.002; // radians per frame
            const angle = performance.now() * speed;

            c.x = Math.cos(angle) * radius;
            c.z = Math.sin(angle) * radius;

            c.setUp();
        } else {

            c.calcLighting({ x: cubes[3].x, y: cubes[3].y, z: cubes[3].z });
        }
    });

    // Sort triangles back to front
    objQueue.sort((a, b) => b.z - a.z);

    // Draw sorted faces
    for (let i = 0; i < objQueue.length; i++) {
        let oq = objQueue[i];

        if (!oq.isL) {
            drawTxOnFace(oq.p1, oq.p4, oq.p2, oq.p3);

            //calc brightness
            let obj = cubes[oq.objIndex];
            let bri = obj.faceBrightness[oq.facIndex];
            fillQuad(oq.p1, oq.p2, oq.p3, oq.p4, 'black', bri);

        } else {
            fillQuad(oq.p1, oq.p2, oq.p3, oq.p4, 'yellow', 1, true);
        }
    }


    requestAnimationFrame(engine);
}

init();
engine();
