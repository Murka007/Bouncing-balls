function START() {

    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    function random(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    function randomRGB(min = 0, max = 255) {
        const r = random(min, max);
        const g = random(min, max);
        const b = random(min, max);
        return [r, g, b];
    }

    function randomHEX(min = 0, max = 255) {
        let [r, g, b] = randomRGB(min, max);
        r = ("00" + r.toString(16)).slice(-2);
        g = ("00" + g.toString(16)).slice(-2);
        b = ("00" + b.toString(16)).slice(-2);
        return "#" + r + g + b;
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    class Vector {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }

        static random2D(angle, length = 1) {
            return new Vector(length * Math.cos(angle), length * Math.sin(angle));
        }

        static collisionVector(b1, b2) {
            const dist = b1.position.dist(b2.position) ** 2;

            const position = b1.position.copySub(b2.position);
            const velocity = b1.velocity.copySub(b2.velocity);
            
            const product = velocity.dotProduct(position) / dist;
            const impulse = (2 * b2.sphereArea) / (b1.sphereArea + b2.sphereArea);
            const difference = position.copyMult(product).copyMult(impulse);

            return b1.velocity.copySub(difference);
        }

        static angle(v1, v2) {
            return Math.atan2(v1.y - v2.y, v1.x - v2.x);
        }

        static mass(m1, m2) {
            return (2 * m2) / (m1 + m2);
        }

        static sizeDiff(r1, r2) {
            return (r1 - r2) / (r1 + r2);
        }


        add(vector) {
            this.x += vector.x;
            this.y += vector.y;
            return this;
        }
      
        sub(vector) {
            this.x -= vector.x;
            this.y -= vector.y;
            return this;
        }
      
        mult(scalar) {
            this.x *= scalar;
            this.y *= scalar;
            return this;
        }

        div(value) {
            this.x /= value;
            this.y /= value;
            return this;
        }

        copyAdd(vector) {
            return new Vector(this.x + vector.x, this.y + vector.y);
        }
      
        copySub(vector) {
            return new Vector(this.x - vector.x, this.y - vector.y);
        }
      
        copyMult(scalar) {
            return new Vector(this.x * scalar, this.y * scalar);
        }

        copyDiv(value) {
            return new Vector(this.x / value, this.y / value);
        }
      
        dotProduct(vector) {
            return this.x * vector.x + this.y * vector.y;
        }

        dist(vector) {
            return this.copySub(vector).magnitude;
        }

        distNorm(vector) {
            const dist = this.dist(vector);
            return this.copySub(vector).copyDiv(dist);
        }

        normalize() {
            const mag = this.magnitude;
            if (mag > 0) this.div(mag);
            return this;
        }

        setMag(value) {
            return this.normalize().mult(value);
        }
        
        limit(max) {
            if (this.magnitude > max) this.setMag(max);
            return this;
        }

        setXY(vector) {
            this.x = vector.x;
            this.y = vector.y;
            return this;
        }

        rotate(angle) {
            const vx = this.x * Math.cos(angle) - this.y * Math.sin(angle);
            const vy = this.x * Math.sin(angle) + this.y * Math.cos(angle);
            return new Vector(vx, vy);
        }

        get magnitude() {
            return Math.sqrt(this.x ** 2 + this.y ** 2);
        }
    }

    // Bounce hit timer
    class Timer {
        constructor(time) {
            this.default = time;
            this.lifetime = 0;
        }

        get isAble() {
            return this.lifetime > 0;
        }
        get time() {
            return this.lifetime;
        }
        decrease() {
            if (this.isAble) this.lifetime -= 1;
        }
        reset() {
            this.lifetime = this.default;
        }
    }

    function map(value, start1, stop1, start2, stop2) {
        return (value - start1) / (stop1 - start1) * (stop2 - start2) + start2;
    }
    class Ball {
        constructor(x, y, radius) {
            this.velocity = Vector.random2D(Math.random() * Math.PI);
            this.velocity.setMag(random(5, 10));
            this.position = new Vector(x, y);
            this.radius = radius;
            this.color = randomHEX(50);
            this.timer = new Timer(10);
        }

        // keep ball in the canvas area
        clampPosition() {
            const pos = this.position;
            const r = this.radius;

            pos.x = clamp(pos.x, r, canvas.width - r);
            pos.y = clamp(pos.y, r, canvas.height - r);
        }

        resolveBounds() {
            const pos = this.position;
            const radius = this.radius;

            // if touching one of the canvas sides, reflect ball velocity
            if (pos.x < radius || pos.x > canvas.width - radius) {
                this.velocity.x *= -1
            }
            if (pos.y < radius || pos.y > canvas.height - radius) {
                this.velocity.y *= -1;
            }

            this.clampPosition();
        }

        isColliding(object) {
            const distance = this.position.dist(object.position);
            return distance < this.radius + object.radius;
        }

        update() {
            // add velocity to the position
            this.position.add(this.velocity);
            this.resolveBounds();
        }

        draw() {

            ctx.beginPath();
            ctx.fillStyle = this.timer.isAble ? "#ff2b2b" : this.color;
            ctx.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.closePath();

            this.timer.decrease();
        }
    }

    // Responsive canvas
    function resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const dpr = window.devicePixelRatio;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
    }
    window.addEventListener("resize", resize);
    resize();

    // Setup default balls
    const balls = [];
    for (let i=0;i<20;i++) {
        const radius = random(5, 25);
        const x = random(radius, canvas.width - radius);
        const y = random(radius, canvas.height - radius);
        balls[i] = new Ball(x, y, radius);
    }

    balls.push(new Ball(canvas.width / 2, canvas.height / 2, 150));

    // Add 5 new balls on click
    window.addEventListener("click", function({ clientX, clientY }) {
        const dpr = window.devicePixelRatio;
        for (let i=0;i<5;i++) {
            const posx = random((clientX - 100) * dpr, (clientX + 100) * dpr);
            const posy = random((clientY - 100) * dpr, (clientY + 100) * dpr);

            const radius = random(5, 25);
            const x = clamp(posx, radius, canvas.width - radius);
            const y = clamp(posy, radius, canvas.width - radius);
            balls.push(new Ball(x, y, radius));
        }
    })

    let timeStart = Date.now();
    let oldfps = 0;

    let timeout = Date.now();
    function loop() {
        window.requestAnimationFrame(loop);

        // FPS Counter, update value every 500 ms
        const currentTime = Date.now();
        const fps = Math.round(1000 / (currentTime - timeStart));

        if (currentTime - timeout > 500) {
            oldfps = fps;
            timeout = currentTime;
        }
        timeStart = currentTime;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const ball of balls) {

            // Ball collision
            for (const ball2 of balls) {
                if (ball !== ball2 && ball.isColliding(ball2)) {

                    const positionDifference = ball2.position.copySub(ball.position);
                    const velocityDifference = ball.velocity.copySub(ball2.velocity);
                    const product = positionDifference.dotProduct(velocityDifference);

                    // Collide only once
                    if (product >= 0) {

                        const angle = -Vector.angle(ball.position, ball2.position);
                        const v1 = ball.velocity.rotate(angle);
                        const v2 = ball2.velocity.rotate(angle);
                        const r1 = ball.radius;
                        const r2 = ball2.radius;


                        const m1 = Vector.mass(r1, r2);
                        const m2 = Vector.mass(r2, r1);
                        const s1 = Vector.sizeDiff(r1, r2);
                        const s2 = Vector.sizeDiff(r2, r1);


                        const u1 = new Vector(v1.x * s1 + v2.x * m1, v1.y).rotate(-angle);
                        const u2 = new Vector(v2.x * s2 + v1.x * m2, v2.y).rotate(-angle);


                        ball.velocity.setXY(u1);
                        ball2.velocity.setXY(u2);
                        ball.timer.reset();
                    }
                }
            }
            ball.update();
            ball.draw();
        }

        // Display FPS
        const text = "FPS: " + oldfps;
        ctx.fillStyle = "white";
        ctx.font = "bold 60px Arial";
        ctx.strokeStyle = "black";

        const height = parseInt(ctx.font.match(/\d+/)) * 0.8;
        ctx.fillText(text, 0, height);
        ctx.strokeText(text, 0, height);
    }
    window.requestAnimationFrame(loop);
}
START();