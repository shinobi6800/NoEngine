const cvs = document.querySelector('#c');
const ctx = cvs.getContext('2d');

cvs.width = 1080;
cvs.height = 620;

let player;
let utils;
let constructMap;
let is3D = true;
let projectTo3D;

const keys = {
  right: { pressed: false },
  left: { pressed: false },
  up: { pressed: false },
  down: { pressed: false }
};


const controls = () => {
  document.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowUp':
        if (keys.down.pressed === false) {
          keys.up.pressed = true;
        }
        break;
      case 'ArrowLeft':
        if (keys.right.pressed === false) {
          keys.left.pressed = true;
        }
        break;
      case 'ArrowRight':
        if (keys.left.pressed === false) {
          keys.right.pressed = true;
        }
        break;
      case 'ArrowDown':
        if (keys.up.pressed === false) {
          keys.down.pressed = true;
        }
        break;
    }
  });

  document.addEventListener('keyup', (e) => {
    switch (e.key) {
      case 'ArrowUp':
        keys.up.pressed = false;

        break;
      case 'ArrowLeft':
        keys.left.pressed = false;


        break;
      case 'ArrowRight':
        keys.right.pressed = false;

        break;
      case 'ArrowDown':
        keys.down.pressed = false;

        break;
    }
  });
}

const movement = () => {
  if (keys.up.pressed) {
    player.pos.x += player.dx;
    player.pos.y += player.dy;

  } else if (keys.down.pressed) {
    player.pos.x += -player.dx;
    player.pos.y += -player.dy;
  }
  if (keys.left.pressed) {
    player.rotVel = -player.rotSpeed;
  } else if (keys.right.pressed) {
    player.rotVel = player.rotSpeed;
  } else {
    player.dx = 0;
    player.dy = 0;
    player.rotVel = 0;
  }

  player.angle += player.rotVel;
}


controls();


class Ray {
  constructor() {
    this.color = "yellow";
    this.l = 200; // l for length
  }

  drawRay(angleOffset, pAngle, pWidth, pHeight, pX, pY) { // angleOffset is in degrees
    ctx.save();
    ctx.beginPath();
    ctx.translate(pX + pWidth / 2, pY + pHeight / 2);
    ctx.rotate((angleOffset + pAngle) * Math.PI / 180);
    ctx.rect((-pWidth / 2) + (pWidth / 2), (-pHeight / 2) + (pHeight / 2), this.l, 1);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }
}

class Player {
  constructor() {
    this.pos = {
      x: 400,
      y: 200
    }
    this.speed = 6;
    this.rotSpeed = 2.5;
    this.rotVel = 0;
    this.width = 30;
    this.height = 30;
    this.angle = 0; // in degrees
    this.dx = 0;
    this.dy = 0;

    this.defaultRayLength = cvs.width * 2;
    this.rayLenth = cvs.width * 2;
    this.rays = [];

    this.FOV = 90; // field of view
    this.numRays = 360;
    this.rayoffsetAngles = [1, this.FOV];
  }

  drawRotatingRect() {
    ctx.save();
    ctx.beginPath();
    ctx.translate(this.pos.x + this.width / 2, this.pos.y + this.height / 2);
    ctx.rotate(this.angle * Math.PI / 180);
    ctx.rect(-this.width / 2, -this.height / 2, this.width, this.height);
    ctx.fillStyle = "green";
    ctx.fill();
    ctx.restore();
  }

  drawRays() {
    for (let i = 0; i < this.rayoffsetAngles.length; i++) {
      let ray = new Ray();
      ray.angle = this.rayoffsetAngles[i];
      this.rays[i] = { d: ray.l, iP: ray.intersectionPoint, color: ray.lineIntersectionColor };
      ray.drawRay(this.rayoffsetAngles[i], this.angle, this.width, this.height, this.pos.x, this.pos.y);
    }
  }

  movement() {
    const angleInRadians = this.angle * (Math.PI / 180);
    this.dx = Math.cos(angleInRadians) * this.speed;
    this.dy = Math.sin(angleInRadians) * this.speed;
  }

  update() {
    if (!is3D) {
      this.drawRotatingRect();
      this.drawRays();
    }
    this.movement();
  }
}

player = new Player();


const map = {
  vertices: [
    { x: 120, y: 20 }, // 0
    { x: 700, y: 20 }, // 1
    { x: 700, y: 600 }, // 2
    { x: 120, y: 600 }, // 3
    { x: 900, y: 20 }, // 4 (Different sector)
    { x: 900, y: 600 }, // 5
  ],
  linedefs: [
    { v1: 0, v2: 1, sector: 0 },
    { v1: 1, v2: 2, sector: 0 },
    { v1: 2, v2: 3, sector: 0 },
    { v1: 3, v2: 0, sector: 0 },
    { v1: 1, v2: 4, sector: 1 },
    { v1: 4, v2: 5, sector: 1 },
    { v1: 5, v2: 2, sector: 1 },
  ],
  sectors: [
    { floorHeight: 0, ceilingHeight: 100, color: "red" }, // Sector 0
    { floorHeight: -50, ceilingHeight: 80, color: "blue" }, // Sector 1
  ],
};

class ConstructMap {
  constructor({ map }) {
    this.map = map;
  }

  drawLine({ x1, y1, x2, y2, color }) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.stroke();
  }

  drawMap() {
    let vertices = this.map.vertices;
    let linedefs = this.map.linedefs;
    let sectors = this.map.sectors;

    linedefs.forEach((ld) => {
      this.drawLine({ x1: vertices[ld.v1].x, y1: vertices[ld.v1].y, x2: vertices[ld.v2].x, y2: vertices[ld.v2].y, color: sectors[ld.sector].color });
    });
  }
}

constructMap = new ConstructMap({ map: map });


class _3DProjection {
  
  constructor() {}

  compute() {
    // do calculations
    
  }
  
  project() {
    // do project
  }

  update() {
    this.compute();
  }
}

projectTo3D = new _3DProjection();

const engine = () => {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, cvs.width, cvs.height);

  player.update();

  movement();

  if (!is3D) {
    constructMap.drawMap();
  }

  if(is3D) {
    projectTo3D.update();
  }

  requestAnimationFrame(engine);
}

engine();