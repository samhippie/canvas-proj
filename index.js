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

/** @param {number} dimens 
 * @returns {number[][][]}
*/
function getEdges(dimens) {
    /** @type {number[][]} */
    const vertices = []
    for (let i = 0; i < (1 << dimens); i++) {
        const out = [];
        for (let b = 0; b < dimens; b++) {
            out.push((i & (1 << b)) !== 0 ? 1 : -1)
        }
        vertices.push(out);
    }

    /** @type {number[][][]} */
    const edges = [];
    for (let i = 0; i < (1 << dimens); i++) {
        for (let b = 0; b < dimens; b++) {
            if ((i & (1 << b)) !== 0) {
                edges.push([
                    vertices[i],
                    vertices[i & ~(1 << b)]
                ]);
            }
        }
    }
    return edges;
}

const edges2 = getEdges(2);
const edges3 = getEdges(3);
const edges4 = getEdges(4);

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

/*
function applyQuat(quat, point) {
    qlength = Math.sqrt(quat.reduce((a, b) => a + b*b));
    quat = quat.map(q => q / qlength);
    while (point.length < 4) {
        point = [0, ...point];
    }
    //const newpoint = ham(ham(quat, point), conj(quat));
    const newpoint = ham(quat, point);
    //console.log('transform', point, newpoint);
    return newpoint.reverse();
    //return newpoint;
}
*/

function applyQuat2(quat1, quat2, point) {
    const qlength1 = Math.sqrt(quat1.reduce((a, b) => a + b*b));
    quat1 = quat1.map(q => q / qlength1);
    qlength2 = Math.sqrt(quat2.reduce((a, b) => a + b*b));
    quat2 = quat2.map(q => q / qlength2);
    while (point.length < 4) {
        point = [0, ...point];
    }
    const newpoint = ham(ham(quat1, point), quat2);
    //const newpoint = ham(quat, point);

    //just return x and y
    return [newpoint[newpoint.length-1], newpoint[newpoint.length-2]];
}


/** @callback Transformation
 * @param {number[]} vertex
 * @returns {number[]}
 */


/** @param {CanvasRenderingContext2D} ctx
 *  @param {number[][]} matrix
 *  @param {Transformation} transformer
    @param {number[][]} points */
function renderPath(ctx, transformer, points) {
    if (points.length === 0) return;
    ctx.lineWidth = 0.01;
    ctx.beginPath();
    //ctx.moveTo(...transform(quat, points[0]))
    ctx.moveTo(...transformer(points[0]))
    for (const point of points.slice(1)) {
        //ctx.lineTo(...transform(quat, point));
        ctx.lineTo(...transformer(point));
    }
    ctx.stroke();
}

/**
 * 
 * @param {Transformation} transformer 
 */
function draw(transformer) {
    /**@type {HTMLCanvasElement} */
    const c = document.getElementById('main');
    const ctx = c.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.save();
    ctx.scale(0.25 * c.width, 0.25 * c.height);
    ctx.translate(2, 2);
    ctx.strokeStyle = 'blue';
    for (const edge of edges4) {
        renderPath(ctx, transformer, edge);
    }
    ctx.strokeStyle = 'red';
    for (const edge of edges3) {
        renderPath(ctx, transformer, edge);
    }
    ctx.strokeStyle = 'green';
    for (const edge of edges2) {
        renderPath(ctx, transformer, edge);
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
    const quat1Els = [
        document.querySelector('#q1 #quat-s'),
        document.querySelector('#q1 #quat-i'),
        document.querySelector('#q1 #quat-j'),
        document.querySelector('#q1 #quat-k'),
    ];
    const quat2Els = [
        document.querySelector('#q2 #quat-s'),
        document.querySelector('#q2 #quat-i'),
        document.querySelector('#q2 #quat-j'),
        document.querySelector('#q2 #quat-k'),
    ];
    const quat1ValueEl = document.getElementById('quat-1-value');
    const quat2ValueEl = document.getElementById('quat-2-value');
    const onUpdate = () => {
        const quat1 = quat1Els.map(q => parseFloat(q.value));
        const quat2 = quat2Els.map(q => parseFloat(q.value));
        const transformer = (p) => applyQuat2(quat1, quat2, p);
        draw(transformer);
        const [s1, i1, j1, k1] = quat1.map(f => f.toFixed(3));
        quat1ValueEl.innerText = `${s1} + ${i1}i + ${j1}j + ${k1}k`;
        const [s2, i2, j2, k2] = quat2.map(f => f.toFixed(3));
        quat2ValueEl.innerText = `${s2} + ${i2}i + ${j2}j + ${k2}k`;
    }
    document.getElementById('reset').addEventListener('click', () => {
        quat1Els[0].value = 1;
        quat1Els.slice(1).forEach(q => q.value = 0);
        quat2Els[0].value = 1;
        quat2Els.slice(1).forEach(q => q.value = 0);
        onUpdate();
    });
    [...quat1Els, ...quat2Els].forEach(e => e.addEventListener('input', onUpdate));
    onUpdate();
}
