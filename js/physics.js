// Physics of the N-fold chain pendulum: equations of motion in mass-matrix
// form, solved with Gaussian elimination, integrated with RK4. Friction is
// optional (params.friction, 0 = none).
// Pure functions, no DOM – exposed as window.Pendulum.
(() => {
'use strict';

// ============ PHYSICS: general N-fold planar pendulum chain ============
// theta[i] measured from the downward vertical, positive clockwise.
// Standard chain-pendulum Lagrangian equations (mass matrix form):
//   M_ij = l_i*l_j*cos(t_i-t_j) * S_max(i,j)      (i != j)
//   M_ii = l_i^2 * S_i
//   b_i  = -sum_j l_i*l_j*sin(t_i-t_j)*w_j^2*S_max(i,j)  -  g*l_i*sin(t_i)*S_i
// where S_k = sum of masses from k..N-1 (this bob and everything below it).
// Friction: a damping term  -k*w_i*M_ii  on every joint, so each arm loses
// speed at roughly the rate k whatever its place in the chain.
const G = 9.81;

function buildSystem(theta, omega, m, l, k) {
  const N = theta.length;
  const S = new Array(N);
  let acc = 0;
  for (let i = N - 1; i >= 0; i--) { acc += m[i]; S[i] = acc; }
  const M = new Array(N), b = new Array(N);
  for (let i = 0; i < N; i++) {
    M[i] = new Array(N);
    for (let j = 0; j < N; j++) {
      const s = S[Math.max(i, j)];
      M[i][j] = (i === j)
        ? l[i] * l[j] * s
        : l[i] * l[j] * Math.cos(theta[i] - theta[j]) * s;
    }
    let c = 0;
    for (let j2 = 0; j2 < N; j2++) {
      if (j2 === i) continue;
      c += l[i] * l[j2] * Math.sin(theta[i] - theta[j2]) * omega[j2] * omega[j2] * S[Math.max(i, j2)];
    }
    b[i] = -c - G * l[i] * Math.sin(theta[i]) * S[i] - k * omega[i] * l[i] * l[i] * S[i];
  }
  return { M: M, b: b };
}

function solveLinear(M, b) {
  const n = b.length;
  const A = M.map((row) => { return row.slice(); });
  const x = b.slice();
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
    if (piv !== col) {
      const tmpRow = A[col]; A[col] = A[piv]; A[piv] = tmpRow;
      const tmpB = x[col]; x[col] = x[piv]; x[piv] = tmpB;
    }
    const pivVal = A[col][col];
    for (let r2 = col + 1; r2 < n; r2++) {
      const f = A[r2][col] / pivVal;
      for (let c = col; c < n; c++) A[r2][c] -= f * A[col][c];
      x[r2] -= f * x[col];
    }
  }
  for (let i = n - 1; i >= 0; i--) {
    let sum = x[i];
    for (let j = i + 1; j < n; j++) sum -= A[i][j] * x[j];
    x[i] = sum / A[i][i];
  }
  return x;
}

// state = [t0,w0,t1,w1,...]; params = {N,m,l,friction}
function deriv(state, p) {
  const N = p.N, theta = new Array(N), omega = new Array(N);
  for (let i = 0; i < N; i++) { theta[i] = state[2 * i]; omega[i] = state[2 * i + 1]; }
  const sys = buildSystem(theta, omega, p.m, p.l, p.friction || 0);
  const alpha = solveLinear(sys.M, sys.b);
  const out = new Array(2 * N);
  for (let i2 = 0; i2 < N; i2++) { out[2 * i2] = omega[i2]; out[2 * i2 + 1] = alpha[i2]; }
  return out;
}

function vecAddScaled(a, k, scale) {
  const out = new Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] + k[i] * scale;
  return out;
}

function rk4(state, dt, p) {
  const k1 = deriv(state, p);
  const k2 = deriv(vecAddScaled(state, k1, dt / 2), p);
  const k3 = deriv(vecAddScaled(state, k2, dt / 2), p);
  const k4 = deriv(vecAddScaled(state, k3, dt), p);
  const out = new Array(state.length);
  for (let i = 0; i < state.length; i++) {
    out[i] = state[i] + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
  }
  return out;
}

// Cumulative joint positions (meters, relative to pivot), pts[N-1] is the tip.
function jointPositions(state, p) {
  let x = 0, y = 0;
  const pts = [];
  for (let i = 0; i < p.N; i++) {
    const th = state[2 * i];
    x += p.l[i] * Math.sin(th);
    y += p.l[i] * Math.cos(th);
    pts.push({ x: x, y: y });
  }
  return pts;
}

function zeroState(n) { return new Array(2 * n).fill(0); }


window.Pendulum = { rk4, jointPositions, zeroState };
})();
