window.addEventListener('load', main);

const face = [
    [1, 1],
    [1, -1],
    [-1, -1],
    [-1, 1],
    [1, 1],
]

/** @type {number[][][]} */
const faces = [0, 1, 2].flatMap(i => [
    face.map(f => [...f.slice(0, i), 1, ...f.slice(i)]),
    face.map(f => [...f.slice(0, i), -1, ...f.slice(i)]),
]);

const faces4 = [0, 1, 2, 3].flatMap(i => [
    faces.flatMap(fs => fs.map(f => [...f.slice(0, i), 1, ...f.slice(i)])),
    faces.flatMap(fs => fs.map(f => [...f.slice(0, i), -1, ...f.slice(i)])),
])

const vertices = []
for (let i = 0; i < 16; i++) {
    const out = [];
    for (let b = 0; b < 4; b++) {
        out.push(i & (1 << b) !== 0 ? 1 : -1)
    }
    vertices.push(out);
}

const edges = [];
for (let i = 0; i < 16; i++) {
    for (let b = 0; b < 4; b++) {
        if (i & (1 << b) !== 0) {
            edges.push([
                vertices[i],
                vertices[i & ~(1 << b)]
            ]);
        }
    }
}

function test_edges()
{
    for (const [a, b] of edges) {
        let diffs = 0;
        for (let i = 0; i < 4; i++) {
            if (a[i] != b[i]) {
                diffs++;
            }
        }
        if (diffs != 1) {
            console.log('uh oh');
        } else {
            console.log('good');
        }
    }
}

/**@param {number[]} point 
 * @returns {number[]}
*/
/*
function transform(matrix, point) {
    const out = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            out[i] += matrix[i][j] * point[j];
        }
    }
    return out;
}
*/

function ham(qa, qb) {
    //to match 
    //https://en.wikipedia.org/wiki/Quaternion#Hamilton_product
    [a1, b1, c1, d1] = qa;
    [a2, b2, c2, d2] = qb;
    return [
        a1*a2 - b1*b2 - c1*c2 - d1*d2,
        a1*b2 + b1*a2 + c1*d2 - d1*c2,
        a1*c2 - b1*d2 + c1*a2 + d1*b2,
        a1*d2 + b1*c2 - c1*b2 + d1*a2,
    ];
}

function conj(q) {
    [s, i, j, k] = q;
    return [s, -i, -j, -k];
}

function transform(quat, point) {
    //console.log('quat1', quat);
    qsum = quat.reduce((a, b) => a + b);
    quat = quat.map(q => q / qsum);
    //console.log('quat', quat);
    if (point.length === 3) {
        point = [0, ...point];
    }
    const newpoint = ham(ham(quat, point), conj(quat));
    //console.log(point, quat, newpoint);
    return newpoint.slice(1);
}

/** @param {CanvasRenderingContext2D} ctx
 *  @param {number[][]} matrix
    @param {number[][]} points */
function renderPath(ctx, quat, points) {
    if (points.length === 0) return;
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 0.01;
    ctx.beginPath();
    ctx.moveTo(...transform(quat, points[0]))
    for (const point of points.slice(1)) {
        ctx.lineTo(...transform(quat, point));
    }
    ctx.stroke();
}

function draw(quat) {
    /**@type {HTMLCanvasElement} */
    const c = document.getElementById('main');
    const ctx = c.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.save();
    ctx.scale(0.25 * c.width, 0.25 * c.height);
    ctx.translate(2, 2);
    for (const face of faces4) {
        renderPath(ctx, quat, face);
    }
    ctx.restore();
}

function mm(a, b) {
    const out = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
    ];
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            for (let k = 0; k < 3; k++) {
                out[i][j] += a[i][k] * b[k][j];
            }
        }
    }
    return out;
}

function updateCanvas(s, i, j, k) {
    /*
    yaw *= Math.PI / 180;
    pitch *= Math.PI / 180;
    roll *= Math.PI / 180;
    const m1 = [
        [Math.cos(yaw), -Math.sin(yaw), 0],
        [Math.sin(yaw), Math.cos(yaw), 0],
        [0, 0, 1],
    ];
    const m2 = [
        [Math.cos(pitch), 0, Math.sin(pitch)],
        [0, 1, 0],
        [-Math.sin(pitch), 0, Math.cos(pitch)],
    ];
    const m3 = [
        [1, 0, 0],
        [0, Math.cos(roll), -Math.sin(roll)],
        [0, Math.sin(roll), Math.cos(roll)],
    ];
    const matrix = mm(m1, mm(m2, m3));
    */
    draw([s, i, j, k]);
}

function main() {
    const quatEls = [
        document.getElementById('quat-s'),
        document.getElementById('quat-i'),
        document.getElementById('quat-j'),
        document.getElementById('quat-k'),
    ];
    const onUpdate = () => {
        draw(quatEls.map(q => parseFloat(q.value)));
    }
    document.getElementById('reset').addEventListener('click', () => {
        quatEls.forEach(q => q.value = 1);
        onUpdate();
    })
    quatEls.forEach(e => e.addEventListener('input', onUpdate));
    onUpdate();
}
