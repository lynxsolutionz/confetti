const retina = window.devicePixelRatio
const colors = [
    ["#df0049", "#660671"],
    ["#00e857", "#005291"],
    ["#2bebbc", "#05798a"],
    ["#ffd200", "#b06c00"]
];

const {
    PI,
    sqrt,
    random,
    cos,
    sin,
    round
} = Math

let rAF = window.requestAnimationFrame
let cAF = window.cancelAnimationFrame || window.cancelRequestAnimationFrame
let _now = Date.now || function () { return new Date().getTime(); };


( function (w) {
    let prev = _now();
    const fallback = (fn) => {
        let curr = _now();
        let ms = Math.max(0, 16 - (curr - prev));
        let req = setTimeout(fn, ms);
        prev = curr;
        return req;
    }

    var cancel = w.cancelAnimationFrame
        || w.webkitCancelAnimationFrame
        || w.clearTimeout;

    rAF = w.requestAnimationFrame
        || w.webkitRequestAnimationFrame
        || fallback;

    cAF = (id) => {
        cancel.call(w, id);
    };

}(window));

class Vector {
    x = 0
    y = 0

    constructor(_x, _y) {
        this.x = _x
        this.y = _y
    }

    Length = () => {
        return sqrt(this.SqrLength());
    }

    SqrLength = () => {
        return this.x * this.x + this.y * this.y;
    }

    Add = (_vec) => {
        this.x += _vec.x;
        this.y += _vec.y;
    }
    
    Sub = (_vec) => {
        this.x -= _vec.x;
        this.y -= _vec.y;
    }
    
    Div = (_f) => {
        this.x /= _f;
        this.y /= _f;
    }
    
    Mul = (_f) => {
        this.x *= _f;
        this.y *= _f;
    }

    Normalize = () => {
        const sqrLen = this.SqrLength();
        if (sqrLen != 0) {
            const factor = 1.0 / sqrt(sqrLen);
            this.x *= factor;
            this.y *= factor;
        }
    }
    
    Normalized = () => {
        const sqrLen = this.SqrLength();
        if (sqrLen != 0) {
            const factor = 1.0 / sqrt(sqrLen);
            return new Vector(this.x * factor, this.y * factor);
        }
        return new Vector(0, 0);
    }

    Lerp = function (_vec0, _vec1, _t) {
        return new Vector((_vec1.x - _vec0.x) * _t + _vec0.x, (_vec1.y - _vec0.y) * _t + _vec0.y);
    }

    Distance = function (_vec0, _vec1) {
        return sqrt(this.SqrDistance(_vec0, _vec1));
    }

    SqrDistance = function (_vec0, _vec1) {
        var x = _vec0.x - _vec1.x;
        var y = _vec0.y - _vec1.y;
        return (x * x + y * y );
    }

    Scale = (_vec0, _vec1) => {
        return new Vector(_vec0.x * _vec1.x, _vec0.y * _vec1.y);
    }

    Min = (_vec0, _vec1) => {
        return new Vector(Math.min(_vec0.x, _vec1.x), Math.min(_vec0.y, _vec1.y));
    }

    Max = (_vec0, _vec1) => {
        return new Vector(Math.max(_vec0.x, _vec1.x), Math.max(_vec0.y, _vec1.y));
    }

    ClampMagnitude = (_vec0, _len) => {
        var vecNorm = _vec0.Normalized;
        return new Vector(vecNorm.x * _len, vecNorm.y * _len);
    }

    SubVec = (_vec0, _vec1) => {
        return new Vector(_vec0.x - _vec1.x, _vec0.y - _vec1.y);
    }
}

document.addEventListener("DOMContentLoaded", function () {

    let speed = 50
    let duration = (1.0 / speed)
    let confettiRibbonCount = 11
    let ribbonPaperCount = 30
    let ribbonPaperDist = 8.0
    let ribbonPaperThick = 8.0
    let confettiPaperCount = 95
    let DEG_TO_RAD = PI / 180

    function EulerMass(_x, _y, _mass, _drag) {
        this.position = new Vector(_x, _y);
        this.mass = _mass;
        this.drag = _drag;
        this.force = new Vector(0, 0);
        this.velocity = new Vector(0, 0);
        this.AddForce = function (_f) {
            this.force.Add(_f);
        }
        this.Integrate = function (_dt) {
            var acc = this.CurrentForce(this.position);
            acc.Div(this.mass);
            var posDelta = new Vector(this.velocity.x, this.velocity.y);
            posDelta.Mul(_dt);
            this.position.Add(posDelta);
            acc.Mul(_dt);
            this.velocity.Add(acc);
            this.force = new Vector(0, 0);
        }
        this.CurrentForce = function (_pos, _vel) {
            var totalForce = new Vector(this.force.x, this.force.y);
            var speed = this.velocity.Length();
            var dragVel = new Vector(this.velocity.x, this.velocity.y);
            dragVel.Mul(this.drag * this.mass * speed);
            totalForce.Sub(dragVel);
            return totalForce;
        }
    }

    function ConfettiPaper(_x, _y) {
        this.pos = new Vector(_x, _y);
        this.rotationSpeed = (random() * 600 + 800);
        this.angle = DEG_TO_RAD * random() * 360;
        this.rotation = DEG_TO_RAD * random() * 360;
        this.cosA = 1.0;
        this.size = 5.0;
        this.oscillationSpeed = (random() * 1.5 + 0.5);
        this.xSpeed = 40.0;
        this.ySpeed = (random() * 60 + 50.0);
        this.corners = new Array();
        this.time = random();
        var ci = round(random() * (colors.length - 1));
        this.frontColor = colors[ci][0];
        this.backColor = colors[ci][1];
        for (var i = 0; i < 4; i++) {
            var dx = cos(this.angle + DEG_TO_RAD * (i * 90 + 45));
            var dy = sin(this.angle + DEG_TO_RAD * (i * 90 + 45));
            this.corners[i] = new Vector(dx, dy);
        }
        this.Update = function (_dt) {
            this.time += _dt;
            this.rotation += this.rotationSpeed * _dt;
            this.cosA = cos(DEG_TO_RAD * this.rotation);
            this.pos.x += cos(this.time * this.oscillationSpeed) * this.xSpeed * _dt
            this.pos.y += this.ySpeed * _dt;
            if (this.pos.y > ConfettiPaper.bounds.y) {
                this.pos.x = random() * ConfettiPaper.bounds.x;
                this.pos.y = 0;
            }
        }
        this.Draw = function (_g) {
            if (this.cosA > 0) {
                _g.fillStyle = this.frontColor;
            } else {
                _g.fillStyle = this.backColor;
            }
            _g.beginPath();
            _g.moveTo((this.pos.x + this.corners[0].x * this.size) * retina, (this.pos.y + this.corners[0].y * this.size * this.cosA) * retina);
            for (var i = 1; i < 4; i++) {
                _g.lineTo((this.pos.x + this.corners[i].x * this.size) * retina, (this.pos.y + this.corners[i].y * this.size * this.cosA) * retina);
            }
            _g.closePath();
            _g.fill();
        }
    }

    ConfettiPaper.bounds = new Vector(0, 0);

    function ConfettiRibbon(_x, _y, _count, _dist, _thickness, _angle, _mass, _drag) {
        this.particleDist = _dist;
        this.particleCount = _count;
        this.particleMass = _mass;
        this.particleDrag = _drag;
        this.particles = new Array();
        var ci = round(random() * (colors.length - 1));
        this.frontColor = colors[ci][0];
        this.backColor = colors[ci][1];
        this.xOff = (cos(DEG_TO_RAD * _angle) * _thickness);
        this.yOff = (sin(DEG_TO_RAD * _angle) * _thickness);
        this.position = new Vector(_x, _y);
        this.prevPosition = new Vector(_x, _y);
        this.velocityInherit = (random() * 2 + 4);
        this.time = random() * 100;
        this.oscillationSpeed = (random() * 2 + 2);
        this.oscillationDistance = (random() * 40 + 40);
        this.ySpeed = (random() * 40 + 80);
        for (var i = 0; i < this.particleCount; i++) {
            this.particles[i] = new EulerMass(_x, _y - i * this.particleDist, this.particleMass, this.particleDrag);
        }
        this.Update = function (_dt) {
            var i = 0;
            this.time += _dt * this.oscillationSpeed;
            this.position.y += this.ySpeed * _dt;
            this.position.x += cos(this.time) * this.oscillationDistance * _dt;
            this.particles[0].position = this.position;
            var dX = this.prevPosition.x - this.position.x;
            var dY = this.prevPosition.y - this.position.y;
            var delta = sqrt(dX * dX + dY * dY);
            this.prevPosition = new Vector(this.position.x, this.position.y);
            for (i = 1; i < this.particleCount; i++) {
                var dirP = new Vector(this.particles[i - 1].position, this.particles[i].position);
                dirP.Normalize();
                dirP.Mul((delta / _dt) * this.velocityInherit);
                this.particles[i].AddForce(dirP);
            }
            for (i = 1; i < this.particleCount; i++) {
                this.particles[i].Integrate(_dt);
            }
            for (i = 1; i < this.particleCount; i++) {
                var rp2 = new Vector().SubVec(this.particles[i].position.x, this.particles[i].position.y);
                rp2.Sub(this.particles[i - 1].position);
                rp2.Normalize();
                rp2.Mul(this.particleDist);
                rp2.Add(this.particles[i - 1].position);
                this.particles[i].position = rp2;
            }
            if (this.position.y > ConfettiRibbon.bounds.y + this.particleDist * this.particleCount) {
                this.Reset();
            }
        }
        this.Reset = function () {
            this.position.y = -random() * ConfettiRibbon.bounds.y;
            this.position.x = random() * ConfettiRibbon.bounds.x;
            this.prevPosition = new Vector(this.position.x, this.position.y);
            this.velocityInherit = random() * 2 + 4;
            this.time = random() * 100;
            this.oscillationSpeed = random() * 2.0 + 1.5;
            this.oscillationDistance = (random() * 40 + 40);
            this.ySpeed = random() * 40 + 80;
            var ci = round(random() * (colors.length - 1));
            this.frontColor = colors[ci][0];
            this.backColor = colors[ci][1];
            this.particles = new Array();
            for (var i = 0; i < this.particleCount; i++) {
                this.particles[i] = new EulerMass(this.position.x, this.position.y - i * this.particleDist, this.particleMass, this.particleDrag);
            }
        }
        this.Draw = function (_g) {
            for (var i = 0; i < this.particleCount - 1; i++) {
                var p0 = new Vector(this.particles[i].position.x + this.xOff, this.particles[i].position.y + this.yOff);
                var p1 = new Vector(this.particles[i + 1].position.x + this.xOff, this.particles[i + 1].position.y + this.yOff);
                if (this.Side(this.particles[i].position.x, this.particles[i].position.y, this.particles[i + 1].position.x, this.particles[i + 1].position.y, p1.x, p1.y) < 0) {
                    _g.fillStyle = this.frontColor;
                    _g.strokeStyle = this.frontColor;
                } else {
                    _g.fillStyle = this.backColor;
                    _g.strokeStyle = this.backColor;
                }
                if (i == 0) {
                    _g.beginPath();
                    _g.moveTo(this.particles[i].position.x * retina, this.particles[i].position.y * retina);
                    _g.lineTo(this.particles[i + 1].position.x * retina, this.particles[i + 1].position.y * retina);
                    _g.lineTo(((this.particles[i + 1].position.x + p1.x) * 0.5) * retina, ((this.particles[i + 1].position.y + p1.y) * 0.5) * retina);
                    _g.closePath();
                    _g.stroke();
                    _g.fill();
                    _g.beginPath();
                    _g.moveTo(p1.x * retina, p1.y * retina);
                    _g.lineTo(p0.x * retina, p0.y * retina);
                    _g.lineTo(((this.particles[i + 1].position.x + p1.x) * 0.5) * retina, ((this.particles[i + 1].position.y + p1.y) * 0.5) * retina);
                    _g.closePath();
                    _g.stroke();
                    _g.fill();
                } else if (i == this.particleCount - 2) {
                    _g.beginPath();
                    _g.moveTo(this.particles[i].position.x * retina, this.particles[i].position.y * retina);
                    _g.lineTo(this.particles[i + 1].position.x * retina, this.particles[i + 1].position.y * retina);
                    _g.lineTo(((this.particles[i].position.x + p0.x) * 0.5) * retina, ((this.particles[i].position.y + p0.y) * 0.5) * retina);
                    _g.closePath();
                    _g.stroke();
                    _g.fill();
                    _g.beginPath();
                    _g.moveTo(p1.x * retina, p1.y * retina);
                    _g.lineTo(p0.x * retina, p0.y * retina);
                    _g.lineTo(((this.particles[i].position.x + p0.x) * 0.5) * retina, ((this.particles[i].position.y + p0.y) * 0.5) * retina);
                    _g.closePath();
                    _g.stroke();
                    _g.fill();
                } else {
                    _g.beginPath();
                    _g.moveTo(this.particles[i].position.x * retina, this.particles[i].position.y * retina);
                    _g.lineTo(this.particles[i + 1].position.x * retina, this.particles[i + 1].position.y * retina);
                    _g.lineTo(p1.x * retina, p1.y * retina);
                    _g.lineTo(p0.x * retina, p0.y * retina);
                    _g.closePath();
                    _g.stroke();
                    _g.fill();
                }
            }
        }
        this.Side = function (x1, y1, x2, y2, x3, y3) {
            return ((x1 - x2) * (y3 - y2) - (y1 - y2) * (x3 - x2));
        }
    }
    ConfettiRibbon.bounds = new Vector(0, 0);

    class Confetti {

        canvas = null
        canvasWidth = null
        canvasHeight = null
        canvarParent = null
        interval = null
        confettiRibbons = new Array()
        confettiPapers = new Array();
        context = null

        constructor(id) {
            this.canvas = document.getElementById(id);
            this.canvasParent = this.canvas.parentNode;
            this.canvasWidth = this.canvasParent.offsetWidth;
            this.canvasHeight = this.canvasParent.offsetHeight;
            this.canvas.width = this.canvasWidth * retina;
            this.canvas.height = this.canvasHeight * retina;
            this.context = this.canvas.getContext('2d');

            this.InitilizeConfettiStuff()
            
        }

        InitilizeConfettiStuff = () => {
            ConfettiRibbon.bounds = new Vector(this.canvasWidth, this.canvasHeight);
            for (let i = 0; i < confettiRibbonCount; i++) {
                this.confettiRibbons[i] = new ConfettiRibbon(random() * this.canvasWidth, -random() * this.canvasHeight * 2, ribbonPaperCount, ribbonPaperDist, ribbonPaperThick, 45, 1, 0.05);
            }
            ConfettiPaper.bounds = new Vector(this.canvasWidth, this.canvasHeight);
            for (let i = 0; i < confettiPaperCount; i++) {
                this.confettiPapers[i] = new ConfettiPaper(random() * this.canvasWidth, random() * this.canvasHeight);
            }
        }

        resize = function () {
            this.canvasWidth = canvasParent.offsetWidth;
            this.canvasHeight = canvasParent.offsetHeight;
            this.canvas.width = this.canvasWidth * retina;
            this.canvas.height = this.canvasHeight * retina;
            ConfettiPaper.bounds = new Vector(canvasWidth, this.canvasHeight);
            ConfettiRibbon.bounds = new Vector(canvasWidth, this.canvasHeight);
        }

        start = () => {
            this.stop()
            this.update();
        }
        
        stop = () => {
            cAF(this.interval);
        }
        
        update = () => {

            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

            for (let i = 0; i < confettiPaperCount; i++) {
                this.confettiPapers[i].Update(duration);
                this.confettiPapers[i].Draw(this.context);
            }
            for (let i = 0; i < confettiRibbonCount; i++) {
                this.confettiRibbons[i].Update(duration);
                this.confettiRibbons[i].Draw(this.context);
            }
            this.interval = rAF(() => {
                this.update();
            });
        }

    }

    confetti = new Confetti('confetti');
    confetti.start();
    window.addEventListener('resize', function (event) {
        confetti.stop();
    });
});