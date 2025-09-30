const rand = (min, max) => {
    return Math.random() * (max - min) + min;
}

const createPixel = (x, y, color, speed, delay, delayHide, step, boundSize) => {
    const p = {
        x,
        y,
        color,
        speed: rand(0.1, 0.9) * speed,
        size: 0,
        sizeStep: rand(0, 0.5),
        minSize: 0.5,
        maxSizeAvailable: boundSize || 2,
        maxSize: 0,
        sizeDirection: 1,
        delay,
        delayHide,
        counter: 0,
        counterHide: 0,
        counterStep: step,
        isHidden: false,
        isFlicking: false,
        draw: (ctx) => {
            const centerOffset = p.maxSizeAvailable * 0.5 - p.size * 0.5;
            ctx.fillStyle = p.color;
            ctx.fillRect(
                p.x + centerOffset,
                p.y + centerOffset,
                p.size,
                p.size
            );
        },
        show: () => {
            p.isHidden = false;
            p.counterHide = 0;
            if (p.counter <= p.delay) {
                p.counter += p.counterStep;
                return;
            }
            if (p.size >= p.maxSize) {
                p.isFlicking = true;
            }
            if (p.isFlicking) {
                p.flicking();
            } else {
                p.size += p.sizeStep;
            }
        },
        hide: () => {
            p.counter = 0;
            if (p.counterHide <= p.delayHide) {
                p.counterHide += p.counterStep;
                if (p.isFlicking) {
                    p.flicking();
                }
                return;
            }
            p.isFlicking = false;
            if (p.size <= 0) {
                p.size = 0;
                p.isHidden = true;
                return;
            } else {
                p.size -= 0.05;
            }
        },
        flicking: () => {
            if (p.size >= p.maxSize) {
                p.sizeDirection = -1;
            } else if (p.size <= p.minSize) {
                p.sizeDirection = 1;
            }
            p.size += p.sizeDirection * p.speed;
        }
    };
    p.maxSize = rand(p.minSize, p.maxSizeAvailable);
    return p;
}

const canvas = document.createElement("canvas");
const container = document.querySelector("#container");
const interval = 1000 / 60;

container.append(canvas);

const ctx = canvas.getContext("2d");

let width;
let height;
let pixels;
let request;
let lastTime;
let ticker;
let maxTicker = 360;
let animationDirection = 1;

const getDelay = (x, y, direction) => {
    let dx = x - width * 0.5;
    let dy = y - height;

    if (direction) {
        dy = y;
    }

    return Math.sqrt(dx ** 2 + dy ** 2);
}

const initPixels = () => {
    const h = Math.floor(rand(0, 360));
    const colorsLen = 5;
    const colors = Array.from({ length: colorsLen }, (_, index) => `hsl(${Math.floor(rand(h, h + (index + 1) * 10))} 100% ${rand(50, 100)}%)`);

    const gap = 6; // Math.floor(width * 0.025)
    const step = (width + height) * 0.005;
    const speed = rand(0.008, 0.25);
    const maxSize = Math.floor(gap * 0.5);

    pixels = [];

    for (let x = 0; x < width; x += gap) {
        for (let y = 0; y < height; y += gap) {
            if (x + maxSize > width || y + maxSize > height) {
                continue;
            }

            const color = colors[Math.floor(Math.random() * colorsLen)];
            const delay = getDelay(x, y);
            const delayHide = getDelay(x, y);

            pixels.push(createPixel(x, y, color, speed, delay, delayHide, step, maxSize));
        }
    }
}

const animate = () => {
    request = requestAnimationFrame(animate);

    const now = performance.now();
    const diff = now - (lastTime || 0);

    if (diff < interval) {
        return;
    }

    lastTime = now - (diff % interval);

    ctx.clearRect(0, 0, width, height);

    if (ticker >= maxTicker) {
        animationDirection = -1;
    } else if (ticker <= 0) {
        animationDirection = 1;
    }

    let allHidden = true;

    pixels.forEach((pixel) => {
        if (animationDirection > 0) {
            pixel.show();
        } else {
            pixel.hide();
            allHidden = allHidden && pixel.isHidden;
        }

        pixel.draw(ctx);
    });

    ticker += animationDirection;

    if (animationDirection < 0 && allHidden) {
        ticker = 0;
    }
}

const resize = () => {
    cancelAnimationFrame(request);

    const rect = container.getBoundingClientRect();

    width = Math.floor(rect.width);
    height = Math.floor(rect.height);

    canvas.width = width;
    canvas.height = height;

    initPixels();

    ticker = 0;

    animate();
}

new ResizeObserver(resize).observe(container);

document.addEventListener('click', resize);

