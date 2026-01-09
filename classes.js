class Util {
  static DEBUG = false;
  static PREPROD = false;  
  static IsFullScreen = false; 

  static lerpAngle(a, b, t) {
    let diff = ((b - a + 540) % 360) - 180;
    return this.normalizeAngle360(a + diff * t);
  }

  static lerp(a, b, t) {
    return a + (b - a) * t;
  }

  static normalizeAngle360(angle) {
    return ((angle % 360) + 360) % 360;
  }

  static angleDelta(a, b) {
    let diff = this.normalizeAngle360(a) - this.normalizeAngle360(b);
    diff = ((diff + 180) % 360) - 180;
    return diff;
  }

  static random(min, max) {
    if (min > max) [min, max] = [max, min];
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  static randomFloat(min, max) {  
    if (min > max) [min, max] = [max, min];
    return (Math.random() * (max - min) + min);
  }

  static vibrate(duration = 30) {
    if (navigator.vibrate) {
      navigator.vibrate(duration);
    }
  }

  static isLandscape() {
    return window.innerWidth > window.innerHeight;
  }

  static openFullscreen() {
    console.log('[Util] openFullscreen');
    const elem = document.documentElement;

    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen(); // Safari
    }
    this.IsFullScreen = true;
  }

  static isEffectivelyFullscreen() {
    if(this.IsFullScreen) return true;

    if (document.fullscreenElement) {
      this.IsFullScreen = true;
    }
    else if (window.innerHeight > window.screen.height * 0.9) {
      this.IsFullScreen = true;
    }
    this.IsFullScreen = false;

    return this.IsFullScreen;
  }
  
  static showHint(text, { duration = 3000, style = "soft"} = {}) {   
    const layer = document.getElementById("hint-layer");
    const hint = document.createElement("div");
    hint.className = `hint ${style}`;
    hint.textContent = text;

    layer.appendChild(hint);

    requestAnimationFrame(() => {
      hint.classList.add("show");
    });

    setTimeout(() => {
      hint.classList.remove("show");
      setTimeout(() => hint.remove(), 800);
    }, duration);
  }
}
window.Util = Util;

console.log('v1.6');

// if(!Util.DEBUG && !Util.PREPROD) {
//   console.log = function() {};
// }

class Target {
  constructor(options = {}) {
    this.el = options.el;

    this.scale = options.scale ?? 1;
    this.baseScale = this.scale;

    const rect = this.el?.getBoundingClientRect();    
    this.width = options.size ?? options.width ?? (rect?.width ?? 0) * this.scale;
    this.height = options.size ?? options.height ?? (rect?.height ?? 0) * this.scale;
    this.baseWidth = this.width;
    this.baseHeight = this.height;
    this.size = options.size ?? Math.max(this.width, this.height);
    this.baseSize = this.size;

    this.distX = options.distX ?? 0;
    this.distY = options.distY ?? 0;

    this.x = (options.x ?? rect.x) + this.width * 0.5 + this.distX;
    this.y = (options.y ?? rect.y) + this.height * 0.5 + this.distY;

    this.baseX = this.x;
    this.baseY = this.y;
  }

  // update(width, height) {
  //   this.x = this.baseX ;
  //   this.y = this.baseY - height * 0.5;
  // }
}

class Obj {
  constructor(options = {}) {
      this.el = options.el;
      if(!this.el) {
        console.error('El bulunamadı.');
        return;
      }

      this.id = this.el?.id ?? this.el?.className;

      this.scale = options.scale ?? 1;
      this.baseScale = this.scale;
      this.endScale = options.endScale ?? this.scale;
      this.scaleOffset = options.scaleOffset ?? 0.002;

      const rect = this.el?.getBoundingClientRect();    
      this.width = options.size ?? options.width ?? rect?.width * this.scale;
      this.height = options.size ?? options.height ?? rect?.height * this.scale;
      if(this.width == 0 || this.height == 0) {
        console.error(`[Obj] ${this.id} => height ya da width alınamadı.`);
        return;
      }

      this.x = (options.x ?? rect?.x) - this.width * 0.5;
      this.y = (options.y ?? rect?.y) - this.height * 0.5;

      this.size = options.size ?? Math.max(this.width, this.height);
      this.baseSize = this.size;

      this.baseWidth = this.width;
      this.baseHeight = this.height;
      
      this.baseX = this.x;
      this.baseY = this.y;

      this.speed = options.speed ?? 1;
      this.speedX = options.speedX ?? this.speed;
      this.speedY = options.speedY ?? this.speed;
      this.baseSpeed = this.speed;
      this.baseSpeedX = this.speedX; 
      this.baseSpeedY = this.speedY;

      this.driftAngle = options.driftAngle ?? Util.randomFloat(4.4, 5.4);
      this.orbitAngle = null;
      this.drift = options.drift ?? Util.randomFloat(0.004, 0.005);
      this.dist = options.dist ?? Util.randomFloat(35, 45);
      this.t = options.t ?? Math.random() * Math.PI * 2;
      this.time = 0;
      this.progress = options.progress ?? 0;

      this.angle = options.angle ?? 0;
      this.startAngle = 360 - Util.normalizeAngle360(this.angle);
      this.endAngle = options.endAngle ?? this.angle;

      //console.log('startAngle: ', this.startAngle, this.angle);

      // element style adjustments
      if(this.el) {
        this.el.style.transform = `rotate(${this.angle}deg) scale(${this.scale})`;
        this.el.style.width = `${this.width}px`;
        this.el.style.height = `${this.height}px`;
        this.el.style.left = `${this.x}px`;
        this.el.style.top = `${this.y}px`;
        if(options.zIndex) {
          this.el.style.zIndex = options.zIndex;
        }
      }
  
      this.waveStrength = options.waveStrength ?? 0.15;
      this.waveSpeed = options.waveSpeed ?? 0.01;

      this.rotationSpeed = options.rotationSpeed ?? 0.003;
      this.finalRotationSpeed = options.finalRotationSpeed ?? 0.006;
      
      this.maxDist = null;
  }  

  getCenterX() {
    return this.baseWidth * 0.5;
  }
  getCenterY() {
    return this.baseHeight * 0.5;
  }
  getVisualX() {
    return this.x + this.getCenterX();
  }
  getVisualY() {
    return this.y + this.getCenterY();
  }
  moveTo(posX, posY) {
    this.x = posX;
    this.y = posY;
    this.moveBase();
  }
  move(speedX, speedY) {
    this.x += speedX;
    this.y += speedY; 
    this.moveBase();
  }

  moveBase() {
    this.el.style.left = this.x + "px";
    this.el.style.top = this.y + "px"; 
  }

  rotateTo(angle) {
    this.angle = angle;
    this.updateTransform();
  }

  rotate(angle) {
    this.angle += angle;
    this.updateTransform();
  }

  calculateDimensions() {
    this.width = this.baseWidth * this.scale;
    this.height = this.baseHeight * this.scale;
    this.size = Math.max(this.width, this.height);
    //this.x = this.x + this.width * 0.5;
    //this.y = this.y + this.height * 0.5;
  }

  scaleTo(scale) {
    this.scale = scale;
    this.calculateDimensions();
    this.updateTransform();
  }

  addScale(scale) {
    this.scale += scale;
    this.calculateDimensions();
    this.updateTransform();
  }

  updateTransform() {
    this.el.style.transform =`rotate(${this.angle}deg) scale(${this.scale})`;
  }
}
window.Obj = Obj;

class AnimationManager {
  constructor() {
    this.animations = {};
  }

  add(anim) {
    // if(this.animations[anim.name] != null) {
    //   console.warn(`${anim.name} Animasyonu zaten managerda ekli.`);
    //   return anim;
    // }
    this.animations[anim.name] = anim;
    return anim;
  }

  get(name) {
    const anim = this.animations[name];
    if(anim == null) {
      console.error(`${name} Animasyon bulunamadı.`);
      return;
    }
    return anim;
  }

  isRunning(name) {
    const anim = this.animations[name];
    if(anim == null) {
      console.error(`${name} Animasyon bulunamadı.`);
      return;
    }
    return anim.isRunning() == true;
  }

  onFinish(name, callback) {
    const anim = this.animations[name];
    if(anim == null) {
      console.error(`${name} Animasyon bulunamadı.`);
      return;
    }
    anim.onFinish(callback);
  }
  
  start(name) {
    const anim = this.animations[name];
    if(anim == null) {
      console.error(`${name} Animasyon bulunamadı.`);
      return;
    }
    return anim.start();
  }

  stop(name) {
    const anim = this.animations[name];
    if(anim == null) {
      console.error(`${name} Animasyon bulunamadı.`);
      return;
    }
    return anim.stop();
  }

  finish(name) {
    const anim = this.animations[name];
    if(anim == null) {
      console.error(`${name} Animasyon bulunamadı.`);
      return;
    }
    return anim.finish();
  }

  stopAll() {
    Object.values(this.animations).forEach(a => a.stop());
  }
}
window.AnimationManager = AnimationManager;

class Animationn {
  constructor(name) {
    this.name = name;
    this.rafId = null;
    this.running = false;
    this.lastTime = null;
    this.onFinishCallback = null;
  }
  
  isRunning() {
    return this.running;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = null;
    this.rafId = requestAnimationFrame(this.loop.bind(this));
    console.log(`${this.name} started.`);
    return this;
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    console.log(`${this.name} stopped.`);
    return this;
  }

  onFinish(onFinishCallback) {
    this.onFinishCallback = onFinishCallback;
  }

  finish() {
    this.stop();
    this.callFinishCallback();
    return this;
  }

  callFinishCallback() {
    if (typeof this.onFinishCallback === "function") {
      this.onFinishCallback();
    }
    console.log(`${this.name} finished.`);
    return this;
  }

  loop(time) {
    if (!this.running) return;

    if (this.lastTime === null) this.lastTime = time;
    const delta = (time - this.lastTime) / 16.67;
    this.lastTime = time;

    this.update(delta, time);
    this.rafId = requestAnimationFrame(this.loop.bind(this));
  }

  // override edilecek
  update(delta, time) {}
}
window.Animationn = Animationn;

class DriftStars extends Animationn {
  constructor(starList, speedX, speedY) {
    super("drift");
    this.stars = starList;
    this.speedX = speedX;
    this.speedY = speedY;
  }

  update(delta) {
    this.stars.forEach(obj => {
      if(obj.x > window.innerWidth + obj.size + 10) {
        obj.x = Util.random(0, 20);
      }
      else if(obj.x < -obj.size) {
        obj.x = window.innerWidth + obj.size + 5;
      }
      if(obj.y > window.innerHeight + obj.size + 10) {
        obj.y = Util.random(0, 20);
      }
      else if(obj.y < -obj.size) {
        obj.y = window.innerHeight + obj.size + 5;
      }
      obj.move(this.speedX ?? obj.speedX, this.speedY ?? obj.speedY);
    });
  }
}
window.DriftStars = DriftStars;

class Snow extends Animationn {
  constructor(objects, speedX, speedY) {
    super("snow");
    this.objects = objects;
    this.speedX = speedX;
    this.speedY = speedY;
    this.snowColumns = 60;
    this.snowMap = new Array(this.snowColumns).fill(0);
    this.groundEl = $('#snow-ground')[0];
  }

  updateGround() {
    const points = [];

    const smoothMap = this.smoothSnowMap(this.snowMap, 3);

    points.push(`0 100%`);

    for (let i = 0; i < smoothMap.length; i++) {
      const x = (i / (smoothMap.length - 1)) * 100;
      const y = 100 - (smoothMap[i] / 40) * 100;
      points.push(`${x}% ${y}%`);
    }

    points.push(`100% 100%`);

    this.groundEl.style.clipPath = `polygon(${points.join(',')})`;
  }

  smoothSnowMap(map, passes = 3) {
    const result = [...map];

    for (let p = 0; p < passes; p++) {
      for (let i = 1; i < result.length - 1; i++) {
        result[i] =
          (result[i - 1] +
          result[i] * 2 +
          result[i + 1]) / 4;
      }
    }

    return result;
  }

  update(delta) {
    let snowUpdated = false;

    this.objects.forEach(obj => {

      if (obj.y > window.innerHeight - 5) {

        const columnWidth = window.innerWidth / this.snowColumns;
        const colIndex = Math.max(0, Math.min(this.snowColumns - 1, Math.floor(obj.x / columnWidth)));

        const amount = Util.randomFloat(0.5, 0.75) * delta;

        this.snowMap[colIndex] += amount * 0.6;
        if (colIndex > 0) {
          this.snowMap[colIndex - 1] += amount * 0.2;
        }
        if (colIndex < this.snowColumns - 1) {
          this.snowMap[colIndex + 1] += amount * 0.2;
        }

        this.snowMap[colIndex] = Math.min(this.snowMap[colIndex], 40);

        obj.x = Util.random(5, window.innerWidth - 5);
        obj.y = Util.random(-20, 0);

        snowUpdated = true;
      }

      const sway = Math.sin(Date.now() * 0.001 + obj.x) * 0.2;

      obj.move(
        ((this.speedX ?? obj.speedX) + sway) * delta,
        (this.speedY ?? obj.speedY) * delta
      );
    });

    // 🔥 smoothing + gradient sadece 1 kez
    if (snowUpdated) {
      this.updateGround();
    }
  }
}
window.Snow = Snow;

class FloatObjects extends Animationn {
  constructor(objectList) {
    super("float");
    this.spawnOffset = 25;
    this.objects = objectList;
    console.log(this.objects);
  }

  spawnFromEdge(obj) {
    const edge = Util.random(0, 3);

    let x, y;
    switch (edge) {
      case 0: // LEFT
        x = -obj.baseSize - this.spawnOffset;
        y = Util.random(0, window.innerHeight + obj.baseSize + this.spawnOffset);
        obj.speedX = obj.baseSpeedX;
        obj.speedY = obj.baseSpeedY;
        obj.endAngle = 72;
        break;
      case 1: // RIGHT
        x = window.innerWidth + obj.baseSize + this.spawnOffset;
        y = Util.random(0, window.innerHeight + obj.baseSize + this.spawnOffset);
        obj.speedX = -obj.baseSpeedX;
        obj.speedY = obj.baseSpeedY;
        obj.endAngle = 0;
        break;
      case 2: // TOP
        x = Util.random(0, window.innerWidth + obj.baseSize + this.spawnOffset);
        y = -obj.baseSize - this.spawnOffset;
        obj.speedX = obj.baseSpeedX;
        obj.speedY = obj.baseSpeedY;
        obj.endAngle = 155;
        break;
      case 3: // BOTTOM
        x = Util.random(0, window.innerWidth + obj.baseSize + this.spawnOffset);
        y = window.innerHeight + obj.baseSize + this.spawnOffset;
        obj.speedX = obj.baseSpeedX;
        obj.speedY = -obj.baseSpeedY;
        obj.endAngle = 0;
        break;
    }

    obj.moveTo(x, y);
  }

  update(delta) {
    this.objects.forEach(obj => {
      obj.t += obj.baseSpeed * delta;

      if(obj.rotationSpeed != 0) {
        obj.rotate(obj.rotationSpeed);
      }
      else {
        obj.rotateTo(Util.lerpAngle(obj.angle, obj.endAngle, 0.005));
      }

      if(obj.scale < obj.endScale) {
        obj.addScale(delta * obj.scaleOffset);
      }
      else if(obj.scale > obj.endScale) {
        obj.addScale(-delta * obj.scaleOffset);
      }
      obj.move(obj.speedX * delta + Math.sin(obj.t) * 0.02
             , obj.speedY * delta + Math.cos(obj.t * 0.8) * 0.02);

      if (obj.x < -obj.baseSize - this.spawnOffset || obj.x > window.innerWidth + obj.baseSize + this.spawnOffset 
        || obj.y < -obj.baseSize - this.spawnOffset || obj.y > window.innerHeight + obj.baseSize + this.spawnOffset) {
        this.spawnFromEdge(obj);
      }
    });
  }
}
window.FloatObjects = FloatObjects;

class GatherStars extends Animationn {
  constructor(starList, options = {}) {
    super("gather");
    this.EFFECT_RADIUS = window.innerWidth / 15; // etki alanı (px)
    this.stars = starList;
    this.target = options.target;
    this.pull = options.pull ?? 0.02;
    this.maxDist = null;
    this.orbitCompleted = false;
  }

  update(delta) {
    let completed = true;
    this.stars.forEach(obj => {
      const dx = this.target.x - obj.getVisualX();
      const dy = this.target.y - obj.getVisualY();

      let dist = Math.hypot(dx, dy);
      if (!this.maxDist) this.maxDist = dist;
        
      if(obj.rotationSpeed != 0) {
        obj.rotate(obj.rotationSpeed);
      }

      const progress = 1 - Math.min(Math.max(dist - obj.dist, 0) / this.maxDist, 1);
      obj.scaleTo(Util.lerp(obj.baseScale, obj.endScale, progress));
      if (dist > obj.dist + 0.015) {  
        completed = false;    
        // console.log('\n', dist > obj.dist ? "moving" : "orbiting",
        //             '\n       dist: ', dist,
        //             '\n        obj.dist: ', obj.dist, 
        //             '\n     target: ', this.target,
        //           );

        const cos = Math.cos(obj.driftAngle);
        const sin = Math.sin(obj.driftAngle);

        const nx = dx / dist;
        const ny = dy / dist;

        const rtx = -ny * cos - nx * sin;
        const rty = -ny * sin + nx * cos;
        const moveX = nx * dist * this.pull + rtx * obj.drift * dist;
        const moveY = ny * dist * this.pull + rty * obj.drift * dist;
        obj.move(moveX, moveY);
      }
      else {
        obj.orbitAngle ??= Math.atan2(-dy, -dx);
        const drawX = this.target.x + Math.cos(obj.orbitAngle) * obj.dist;
        const drawY = this.target.y + Math.sin(obj.orbitAngle) * obj.dist;
        obj.orbitAngle += obj.drift;

        obj.move(drawX - obj.getVisualX(), drawY - obj.getVisualY());

        obj.el.classList.add('glow-strong');
        obj.el.classList.add('pulse');
      }  
    });

    // Hepsi geldiyse animasyonu durdur
    if (completed && !this.orbitCompleted) {
      this.orbitCompleted = true;
      console.log('gathering finished.');
      this.callFinishCallback();
    }
  }
}
window.GatherStars = GatherStars;

class InfinityStars extends Animationn {
  constructor(starList, options = {}) {
    super("infinity");
    this.stars = starList;
    this.target = options.target;
    this.seconds = options.seconds ?? 15;
    this.radiusX = options.radiusX ?? 200;
    this.radiusY = options.radiusY ?? 120;
    this.shapeSpeed = options.shapeSpeed ?? 0.001;
    this.speed = options.speed ?? 0.01;
    this.time = 0;
    this.phaseCompleted = false;
  }

  update(delta) {
    this.phaseCompleted = true;
    this.stars.forEach(obj => {
      // const targetX = this.target.x + 200 * Math.cos(obj.t);
      // const targetY = this.target.y + 120 * Math.sin(2 * obj.t) / 2;

      if (obj.progress < 1) {
        const targetX = this.target.x - obj.getVisualX() + this.radiusX * Math.cos(obj.t) * obj.progress;
        const targetY = this.target.y - obj.getVisualY() + this.radiusY * Math.sin(2 * obj.t) * 0.5 * obj.progress;

        this.phaseCompleted = false;
        obj.progress += this.shapeSpeed * delta;
        obj.move(targetX * obj.progress, targetY * obj.progress); 
      } 
      else {
        obj.t += this.speed * delta;

        const targetX = this.target.x - obj.getCenterX() + this.radiusX * Math.cos(obj.t);
        const targetY = this.target.y - obj.getCenterY() + this.radiusY * Math.sin(2 * obj.t) * 0.5;

        obj.moveTo(targetX, targetY);

        // const degree = Math.atan2(targetY, targetX) * 180;
        // let desiredAngle = degree / Math.PI - 25;
        // console.log(25, desiredAngle, Util.lerpAngle(obj.angle, desiredAngle, 1));
        // obj.rotateTo(Util.lerpAngle(obj.angle, desiredAngle, 1));     
      }

      const depth = 0.5 + Math.sin(obj.t) * 0.5;
      obj.el.style.opacity = 0.4 + depth * 0.6; 
    });
    if(this.phaseCompleted) {
      this.time += delta;
    }
    if(this.time >= this.seconds * 100) {
      this.finish();
      return;
    }
  }
}
window.InfinityStars = InfinityStars;

class DisperseStars extends Animationn {
  constructor(starList, speed = 0.03) {
    super("disperse");
    this.stars = starList;
    this.speed = speed;
  }

  update(delta) {
    let completed = true;
    this.stars.forEach(obj => {
        obj.move((obj.baseX - obj.getVisualX()) * this.speed, (obj.baseY - obj.getVisualY()) * this.speed);

        if(!(Math.abs(obj.baseX - obj.getVisualX()) <= 2 
            && Math.abs(obj.baseY - obj.getVisualY()) <= 2)) {
          completed = false;
        }
    });

    if (completed) {
      console.log('dispersing finished.');
      this.finish();
    }
  }
}
window.InfinityStars = InfinityStars;

class Fly extends Animationn {
  constructor(object, options = {}) {
    super("fly");
    this.object = object;
    this.target = options.target;
    this.maxDist = null;

    console.log('fly: ', this.target, this.object);
  }

  update(delta) {
    this.object.time += delta;

    let targetX = this.target.x;
    let targetY = this.target.y;

    const dx = targetX - this.object.getVisualX();
    const dy = targetY - this.object.getVisualY();

    const dist = Math.hypot(dx, dy);

    if (!this.maxDist) this.maxDist = dist;

    const slowFactorX = Math.max(0.3, Math.min(dist * this.object.speedX / 150, 1));
    const slowFactorY = Math.max(0.3, Math.min(dist * this.object.speedY / 150, 1));
  
    const nx = dx / dist;
    const ny = dy / dist;

    // tangent (yanal yön)
    const tx = -ny;
    const ty = nx;

    const wavePosX = Math.sin(this.object.time * this.object.waveSpeed) * this.object.waveStrength * slowFactorX;
    const wavePosY = Math.sin(this.object.time * this.object.waveSpeed) * this.object.waveStrength * slowFactorY;

    const degree = Math.atan2(dy, dx) * 180;
    let desiredAngle = degree / Math.PI + this.object.startAngle + wavePosX;

    //console.log(this.object.angle, desiredAngle);
    // console.log(Math.atan2(dy, -dx) * 180, Math.atan2(dy, -dx) * 180, Math.atan2(-dy, -dx) * 180);
    // console.log(Util.normalizeAngle360(Math.atan2(dy, -dx) * 180), 
    //             Util.normalizeAngle360(Math.atan2(dy, -dx) * 180), 
    //             Util.normalizeAngle360(Math.atan2(-dy, -dx) * 180));
    if (dist < 70) {
      //this.waveStrength *= 0.95;
      desiredAngle = this.object.endAngle;
      this.object.rotationSpeed = this.object.finalRotationSpeed;
    }

    //console.log(dist, Math.abs(Util.angleDelta(this.object.angle, desiredAngle)));
    if (dist < (Util.DEBUG ? 5 : 1) && Math.abs(Util.angleDelta(this.object.angle, desiredAngle)) < (Util.DEBUG ? 20 : 1)) {  
      this.finish();
      return;
    }
    // if (this.time > 666) {  
    //   this.finish();
    //   return;
    // }

    const progress = 1 - Math.min(dist / this.maxDist, 1);
    //console.log(this.object.baseScale, this.object.endScale, Util.lerp(this.object.baseScale, this.object.endScale, progress))
    this.object.scaleTo(Util.lerp(this.object.baseScale, this.object.endScale, progress));
    this.object.rotateTo(Util.lerpAngle(this.object.angle, desiredAngle, this.object.rotationSpeed));
    this.object.move(nx * this.object.speedX * slowFactorX * delta + tx * wavePosX
                    , ny * this.object.speedY * slowFactorY * delta + ty * wavePosY);
  }
}
window.Fly = Fly;

class EnergyBurst extends Animationn {
  constructor(options = {}) {
    super("burst");
    this.target = options.target;

    this.radius = 0;
    this.chargeSpeed = options.chargeSpeed ?? 0.003;
    this.explodeSpeed = options.explodeSpeed ?? 5;
    this.maxRadiusOffset = options.maxRadiusOffset ?? 250;
    this.maxRadius = Math.hypot(window.innerWidth + this.target.x, window.innerHeight + this.target.y) + this.maxRadiusOffset;

    this.charge = 0;
    this.opacity = 1;
    this.exploding = false;

    this.el = document.createElement("div");
    this.el.id = "energyBurst";
    this.el.style.position = "fixed";
    this.el.style.left = "0";
    this.el.style.top = "0";
    this.el.style.width = "100vw";
    this.el.style.height = "100vh";
    this.el.style.pointerEvents = "none";
    this.el.style.zIndex = "2";

    this.x = this.target.x;
    this.y = this.target.y;

    document.body.appendChild(this.el);
  }

  update(delta) {
    // 1️⃣ ŞİŞME / CHARGE
    if (!this.exploding) {
      this.charge += delta * this.chargeSpeed;
      this.charge = Math.min(this.charge, 1);

      this.radius = this.charge * 120;

      if (this.charge >= 1) {
        this.exploding = true;
      }
    }
    else {
      this.opacity += delta * 0.02;
      this.radius += delta * this.explodeSpeed;

      if (this.radius >= this.maxRadius) {
        // this.el.style.background = `background: radial-gradient(
        //                                         circle at top,
        //                                         #f5f8fb 0%,
        //                                         #e6ebf0 45%,
        //                                         #d9dee4 100%
        //                                       )`;
        //this.el.remove();
        this.finish();
      }
    }

    this.el.style.background = `radial-gradient(
        circle at ${this.x}px ${this.y}px,
        rgba(255,255,255,${1.0 * this.opacity}) 0px,
        rgba(255,255,255, ${0.9 * this.opacity}) ${this.radius * 0.1}px,
        rgba(255,255,255, ${0.6 * this.opacity}) ${this.radius * 0.40}px,
        rgba(255,255,255, ${0.25 * this.opacity}) ${this.radius * 0.67}px,
        rgba(255,255,255, ${0.05 * this.opacity}) ${this.radius}px
      )`;
  }
}
window.EnergyBurst = EnergyBurst;
