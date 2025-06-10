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

const proj = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
];

const rotZMat = (angle) => {
    return [
        [Math.cos(angle), -Math.sin(angle), 0],
        [Math.sin(angle), Math.cos(angle), 0],
        [0, 0, 1]
    ]
}

const rotXMat = (angle) => {
    return [
        [1, 0, 0],
        [0, Math.cos(angle), -Math.sin(angle)],
        [0, Math.sin(angle), Math.cos(angle)]
    ]
}

const rotYMat = (angle) => {
    return [
        [Math.cos(angle), 0, Math.sin(angle)],
        [0, 1, 0],
        [-Math.sin(angle), 0, Math.cos(angle)]
    ];
}

function isLineOnScreen(x1, y1, x2, y2, padding = 50) {
    const inBounds = (x, y) =>
        x >= -padding && x <= CW + padding &&
        y >= -padding && y <= CH + padding;

    return inBounds(x1, y1) || inBounds(x2, y2);
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

function isLineCompletelyOffScreen(x1, y1, x2, y2) {
    const w = CW;
    const h = CH;
    const minX = Math.min(x1, x2);
    const maxX = Math.min(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.min(y1, y2);

    return (
        maxX < 0 ||
        minX > w ||
        maxY < 0 ||
        minY > h
    );
}

function fillQuad(tl, tr, br, bl, color, alpha = 0.5, isL = false) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;

    if (isL) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
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


function drawTxtOnFace(tl, bl, tr, br) {
    const steps = Math.ceil(Math.max(
        Math.hypot(bl.x - tl.x, bl.y - tl.y),
        Math.hypot(br.x - tr.x, br.y - tr.y)
    ));

    for (let i = 0; i < steps; i += 1) {
        let t = i / steps;
        let texY = Math.floor(t * texture.height);

        let leftX = tl.x + (bl.x - tl.x) * t;
        let leftY = tl.y + (bl.y - tl.y) * t;

        let rightX = tr.x + (br.x - tr.x) * t;
        let rightY = tr.y + (br.y - tr.y) * t;

        if (isLineOnScreen(leftX, leftY, rightX, rightY) || isLineCompletelyOffScreen(leftX, leftY, rightX, rightY)) {
            drawTextureLine(leftX, leftY, rightX, rightY, texY);
        }
    }
}

function drawTextureLine(x1, y1, x2, y2, texY) {
    const width = Math.hypot(x2 - x1, y2 - y1);
    const angle = Math.atan2(y2 - y1, x2 - x1);

    ctx.save();
    ctx.translate(x1, y1);
    ctx.rotate(angle);

    ctx.drawImage(
        texture,
        0,
        texY,
        texture.width,
        1,
        0,
        0,
        width,
        1
    );

    ctx.restore();
}


function multMat(m, v) {
    const { x, y, z } = v;

    return {
        x: m[0][0] * x + m[0][1] * y + m[0][2] * z,
        y: m[1][0] * x + m[1][1] * y + m[1][2] * z,
        z: m[2][0] * x + m[2][1] * y + m[2][2] * z
    };
}

class Vertex {
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

class Camera {
    constructor({ x, y, z }) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.camZ = 1000;
        this.fov = 500;
        this.rotX = 0;
        this.rotY = 0;
    }

    control() {
        if (K.W) this.rotX -= 0.02;
        if (K.S) this.rotX += 0.02;
        if (K.A) this.rotY -= 0.02;
        if (K.D) this.rotY += 0.02;
        if (K.u) this.camZ -= 10;
        if (K.d) this.camZ += 10;
        if (K.l) {
            this.x -= Math.cos(this.rotY) * 4;
        }
        if (K.r) {
            this.x += Math.cos(this.rotY) * 4;
        }
    }
}

const lightPos = { x: 250, y: -100, z: 200 };

class Cube {
    constructor({ x, y, z, w = 100, h = 100, d = 100, isL = false }) {
        this.x = x;
        this.y = y;
        this.z = z;

        this.w = w / 2;
        this.h = h / 2;
        this.d = d / 2;

        this.isL = isL // is light source

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
    }

    calcLighting(lightPos, intensity = 500) {
        for (let i = 0; i < 6; i++) {
            let face = this.F[i];

            let v1 = this.V[face[0]];
            let v2 = this.V[face[1]];
            let v3 = this.V[face[2]];
            let v4 = this.V[face[3]];

            let center = new Vertex(
                (v1.x + v2.x, v3.x, v4.x) / 4,
                (v1.y + v2.y, v3.y, v4.y) / 4,
                (v1.z + v2.z, v3.z, v4.z) / 4,
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

        this.V[0] = new Vertex(-w + x, -h + y, -d + z);
        this.V[1] = new Vertex(w + x, -h + y, -d + z);
        this.V[2] = new Vertex(-w + x, h + y, -d + z);
        this.V[3] = new Vertex(w + x, h + y, -d + z);
        this.V[4] = new Vertex(-w + x, -h + y, d + z);
        this.V[5] = new Vertex(w + x, -h + y, d + z);
        this.V[6] = new Vertex(-w + x, h + y, d + z);
        this.V[7] = new Vertex(w + x, h + y, d + z);
    }
}

class Sphere {
    constructor ({ x, y, z, r }) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.r = r;

        this.V = [];
        this.T = [];

        this.triangleBrightness = [];
        
        this.setUp();
    }

    calcLighting(lightPos, intensity = 500) {
        for (let i = 0; i < this.T.length; i++) {
            let t = this.T[i];

            let v1 = this.V[t[0]];
            let v2 = this.V[t[1]];
            let v3 = this.V[t[2]];

            let center = new Vertex(
                (v1.x + v2.x + v3.x) / 3,
                (v1.y + v2.y + v3.y) / 3,
                (v1.z + v2.z + v3.z) / 3
            );

            let dx = center.x - lightPos.x;
            let dy = center.y - lightPos.y;
            let dz = center.z - lightPos.z;

            let dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            let brightness = Math.min(0.8, (dist * dist) / (intensity * intensity));

            this.triangleBrightness[i] = brightness;
        }
    }

 setUp() {
        this.V.length = 0; // Clear existing points
        const segments = 20; // Higher = smoother

        for (let i = 0; i <= segments; i++) {
            const theta = i * Math.PI / segments; // latitude

            for (let j = 0; j <= segments; j++) {
                const phi = j * 2 * Math.PI / segments;

                const x = this.r * Math.sin(theta) * Math.cos(phi);
                const y = this.r * Math.sin(theta) * Math.sin(phi);
                const z = this.r * Math.cos(theta);

                this.V.push(new Vertex(x + this.x, y + this.y, z + this.z));
            }
        }

        const pointsPerRow = segments + 1;

        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < segments; j++) {
                const a = i * pointsPerRow + j;
                const b = a + 1;
                const c = a + pointsPerRow;
                const d = c + 1;

                // Triangle 1
                this.T.push([a, b, c]);
                // Triangle 2
                this.T.push([b, d, c]);

                // default lighting
                this.triangleBrightness.push(1);
            }
        }
    }
}



const camera = new Camera({ x: 0, y: 0, z: 0 });

const cube1 = new Cube({ x: 300, y: 100, z: 0, w: 200, h: 100, d: 300 });
const cube2 = new Cube({ x: 100, y: 100, z: 0, w: 100, h: 600, d: 100 });
const cube3 = new Cube({ x: 600, y: 300, z: 0 });
const cube4 = new Cube({ ...lightPos, w: 50, h: 50, d: 50, isL: true });

const cubes = [cube1, cube2, cube3, cube4];

function perspectiveProject(point, fov, viewerDistance) {
    const z = viewerDistance + point.z;

    if (z <= 1) return null;

    const scale = fov / z;

    return {
        x: point.x * scale + CW2,
        y: point.y * scale + CH2,
        z: point.z
    }
}

const projectWorld = (obj, objIndex, queue) => {
    let projected = [];

    for (let v of obj.V) {
        let translated = new Vertex(v.x - camera.x, v.y - camera.y, v.z - camera.z);
        let rotated = multMat(rotYMat(camera.rotY), translated);
        rotated = multMat(rotXMat(-camera.rotX), rotated);

        let proj2D = perspectiveProject(rotated, camera.fov, camera.camZ);

        if (!proj2D) continue;

        proj2D.x -= camera.x;
        proj2D.y -= camera.y;
        proj2D.z -= camera.z;

        projected.push(proj2D);
    }

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
                objIndex: objIndex,
                facIndex: index,
                isL: obj.isL
            });
        }
    });
}

const engine = () => {
    camera.control();

    ctx.clearRect(0, 0, CW, CH);

    let objQueue = [];

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, CW, CH);

    cubes.forEach((c, i) => {
        projectWorld(c, i, objQueue);

        if (c.isL) {
            // circular light motion
            const radius = 400;
            const speed = 0.001;
            const angle = performance.now() * speed;

            c.x = (Math.cos(angle) * radius) + lightPos.x;
            c.z = (Math.sin(angle) * radius) + lightPos.z;

            c.setUp();
        } else {
            c.calcLighting({ x: cubes[3].x, y: cubes[3].y, z: cubes[3].z });
        }
    });

    objQueue.sort((a, b) => b.z - a.z);

    for (let i = 0; i < objQueue.length; i++) {
        let oq = objQueue[i];

        if (!oq.isL) {
            drawTxOnFace(oq.p1, oq.p4, oq.p2, oq.p3);

            // calc brightness
            let obj = cubes[oq.objIndex];
            let bri = obj.faceBrightness[oq.facIndex];
            fillQuad(oq.p1, oq.p2, oq.p3, oq.p4, 'black', bri);
        } else {
            fillQuad(oq.p1, oq.p2, oq.p3, oq.p4, 'yellow', 1, true);
        }

    }

    requestAnimationFrame(engine);
}

engine();