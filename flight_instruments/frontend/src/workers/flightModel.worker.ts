/// <reference lib="webworker" />

import { FlightDataType, ControlsType } from '../types/flight';

const self = globalThis as unknown as DedicatedWorkerGlobalScope;

interface AircraftState {
  position: { x: number; y: number; z: number };
  velocity: { u: number; v: number; w: number };
  attitude: { pitch: number; roll: number; yaw: number };
  angularVelocity: { p: number; q: number; r: number };
  time: number;
}

interface AircraftParameters {
  mass: number;
  Ixx: number;
  Iyy: number;
  Izz: number;
  Ixz: number;
  wingArea: number;
  wingSpan: number;
  meanChord: number;
  CL0: number;
  CLalpha: number;
  CLq: number;
  CLde: number;
  CD0: number;
  CDalpha2: number;
  CM0: number;
  CMalpha: number;
  CMq: number;
  CMde: number;
  CYbeta: number;
  CYr: number;
  CYda: number;
  CYdr: number;
  Clbeta: number;
  Clp: number;
  Clda: number;
  Cldr: number;
  Cnbeta: number;
  Cnp: number;
  Cnr: number;
  Cnda: number;
  Cndr: number;
}

const aircraftParams: AircraftParameters = {
  mass: 1200,
  Ixx: 1000,
  Iyy: 2000,
  Izz: 2500,
  Ixz: 0,
  wingArea: 15,
  wingSpan: 10,
  meanChord: 1.5,
  CL0: 0.2,
  CLalpha: 4.5,
  CLq: 4.0,
  CLde: 0.3,
  CD0: 0.03,
  CDalpha2: 0.05,
  CM0: -0.02,
  CMalpha: -0.8,
  CMq: -12.0,
  CMde: -1.2,
  CYbeta: -0.4,
  CYr: 0.0,
  CYda: 0.0,
  CYdr: 0.2,
  Clbeta: -0.1,
  Clp: -0.5,
  Clda: 0.2,
  Cldr: 0.0,
  Cnbeta: 0.05,
  Cnp: 0.0,
  Cnr: -0.2,
  Cnda: 0.0,
  Cndr: -0.1,
};

let state: AircraftState = {
  position: { x: 0, y: 5000, z: 0 },
  velocity: { u: 120, v: 0, w: 0 },
  attitude: { pitch: 0, roll: 0, yaw: 0 },
  angularVelocity: { p: 0, q: 0, r: 0 },
  time: 0,
};

let controls: ControlsType = {
  elevator: 0,
  aileron: 0,
  rudder: 0,
  throttle: 50,
};

let isRunning = false;
let animationId: number | null = null;

const RHO = 1.225;
const G = 9.81;

function degToRad(deg: number): number {
  return deg * (Math.PI / 180);
}

function radToDeg(rad: number): number {
  return rad * (180 / Math.PI);
}

function calculateAerodynamicForces(
  state: AircraftState,
  controls: ControlsType,
  params: AircraftParameters
): { Fx: number; Fy: number; Fz: number; L: number; M: number; N: number } {
  const { velocity, attitude, angularVelocity } = state;
  const { elevator, aileron, rudder } = controls;

  const V = Math.sqrt(velocity.u ** 2 + velocity.v ** 2 + velocity.w ** 2);
  if (V < 1) {
    return { Fx: 0, Fy: 0, Fz: 0, L: 0, M: 0, N: 0 };
  }

  const dynamicPressure = 0.5 * RHO * V ** 2;

  const alpha = Math.atan2(velocity.w, velocity.u);
  const beta = Math.asin(velocity.v / V);

  const qBar = dynamicPressure * params.wingArea;
  const qBarS = qBar;
  const qBarSb = qBar * params.wingSpan;
  const qBarSc = qBar * params.meanChord;

  const pBar = angularVelocity.p * params.wingSpan / (2 * V);
  const qBar2 = angularVelocity.q * params.meanChord / (2 * V);
  const rBar = angularVelocity.r * params.wingSpan / (2 * V);

  const CL = params.CL0 + params.CLalpha * alpha + params.CLq * qBar2 + params.CLde * degToRad(elevator);
  const CD = params.CD0 + params.CDalpha2 * alpha ** 2;
  const CY = params.CYbeta * beta + params.CYr * rBar + params.CYda * degToRad(aileron) + params.CYdr * degToRad(rudder);

  const Cl = params.Clbeta * beta + params.Clp * pBar + params.Clda * degToRad(aileron) + params.Cldr * degToRad(rudder);
  const CM = params.CM0 + params.CMalpha * alpha + params.CMq * qBar2 + params.CMde * degToRad(elevator);
  const Cn = params.Cnbeta * beta + params.Cnp * pBar + params.Cnr * rBar + params.Cnda * degToRad(aileron) + params.Cndr * degToRad(rudder);

  const FAx = -CD * qBarS * Math.cos(alpha) + CL * qBarS * Math.sin(alpha);
  const FAy = CY * qBarS;
  const FAz = -CD * qBarS * Math.sin(alpha) - CL * qBarS * Math.cos(alpha);

  const thrust = controls.throttle * 2000;

  const FGx = params.mass * G * Math.sin(attitude.pitch);
  const FGy = -params.mass * G * Math.cos(attitude.pitch) * Math.sin(attitude.roll);
  const FGz = -params.mass * G * Math.cos(attitude.pitch) * Math.cos(attitude.roll);

  const Fx = FAx + thrust + FGx;
  const Fy = FAy + FGy;
  const Fz = FAz + FGz;

  const L = Cl * qBarSb;
  const M = CM * qBarSc;
  const N = Cn * qBarSb;

  return { Fx, Fy, Fz, L, M, N };
}

function updateState(dt: number): void {
  const { mass, Ixx, Iyy, Izz, Ixz } = aircraftParams;
  const forces = calculateAerodynamicForces(state, controls, aircraftParams);

  const { Fx, Fy, Fz, L, M, N } = forces;
  const { velocity, angularVelocity, attitude } = state;

  const uDot = (Fx / mass) - velocity.w * angularVelocity.q + velocity.v * angularVelocity.r;
  const vDot = (Fy / mass) - velocity.u * angularVelocity.r + velocity.w * angularVelocity.p;
  const wDot = (Fz / mass) - velocity.v * angularVelocity.p + velocity.u * angularVelocity.q;

  const gamma = Ixx * Izz - Ixz ** 2;
  const pDot = (Izz * L + Ixz * N + (Iyy - Izz) * Ixz * angularVelocity.q * angularVelocity.r
    - Ixz * (Iyy - Ixx) * angularVelocity.p * angularVelocity.q
    + Ixz ** 2 * angularVelocity.r ** 2 - Izz ** 2 * angularVelocity.q * angularVelocity.r
    + Ixx * Izz * angularVelocity.q * angularVelocity.r - Ixz ** 2 * angularVelocity.p * angularVelocity.q) / gamma;

  const qDot = (M + (Izz - Ixx) * angularVelocity.r * angularVelocity.p
    + Ixz * (angularVelocity.p ** 2 - angularVelocity.r ** 2)) / Iyy;

  const rDot = (Ixx * N + Ixz * L + (Ixx - Iyy) * Ixz * angularVelocity.p * angularVelocity.q
    + Ixz * (Iyy - Izz) * angularVelocity.q * angularVelocity.r
    + Ixz ** 2 * angularVelocity.p ** 2 - Ixx ** 2 * angularVelocity.p * angularVelocity.q
    + Ixx * Izz * angularVelocity.p * angularVelocity.q - Ixz ** 2 * angularVelocity.q * angularVelocity.r) / gamma;

  const phiDot = angularVelocity.p + Math.tan(attitude.pitch) * (angularVelocity.q * Math.sin(attitude.roll) + angularVelocity.r * Math.cos(attitude.roll));
  const thetaDot = angularVelocity.q * Math.cos(attitude.roll) - angularVelocity.r * Math.sin(attitude.roll);
  const psiDot = (angularVelocity.q * Math.sin(attitude.roll) + angularVelocity.r * Math.cos(attitude.roll)) / Math.cos(attitude.pitch);

  const cosPhi = Math.cos(attitude.roll);
  const sinPhi = Math.sin(attitude.roll);
  const cosTheta = Math.cos(attitude.pitch);
  const sinTheta = Math.sin(attitude.pitch);
  const cosPsi = Math.cos(attitude.yaw);
  const sinPsi = Math.sin(attitude.yaw);

  const xDot = velocity.u * (cosTheta * cosPsi)
    + velocity.v * (sinPhi * sinTheta * cosPsi - cosPhi * sinPsi)
    + velocity.w * (cosPhi * sinTheta * cosPsi + sinPhi * sinPsi);

  const yDot = velocity.u * (cosTheta * sinPsi)
    + velocity.v * (sinPhi * sinTheta * sinPsi + cosPhi * cosPsi)
    + velocity.w * (cosPhi * sinTheta * sinPsi - sinPhi * cosPsi);

  const zDot = -velocity.u * sinTheta
    + velocity.v * sinPhi * cosTheta
    + velocity.w * cosPhi * cosTheta;

  state.velocity.u += uDot * dt;
  state.velocity.v += vDot * dt;
  state.velocity.w += wDot * dt;

  state.angularVelocity.p += pDot * dt;
  state.angularVelocity.q += qDot * dt;
  state.angularVelocity.r += rDot * dt;

  state.attitude.roll += phiDot * dt;
  state.attitude.pitch += thetaDot * dt;
  state.attitude.yaw += psiDot * dt;

  state.position.x += xDot * dt;
  state.position.y += zDot * dt;
  state.position.z += yDot * dt;

  state.time += dt;

  state.attitude.roll = Math.atan2(Math.sin(state.attitude.roll), Math.cos(state.attitude.roll));
  state.attitude.pitch = Math.atan2(Math.sin(state.attitude.pitch), Math.cos(state.attitude.pitch));
  state.attitude.yaw = Math.atan2(Math.sin(state.attitude.yaw), Math.cos(state.attitude.yaw));
}

function convertToFlightData(): FlightDataType {
  const airspeed = Math.sqrt(state.velocity.u ** 2 + state.velocity.v ** 2 + state.velocity.w ** 2);
  const verticalSpeed = state.position.y / 1000;

  const latPerMeter = 1 / 111000;
  const lngPerMeter = 1 / (111000 * Math.cos(34.0 * Math.PI / 180));

  return {
    altitude: state.position.y,
    airspeed: airspeed * 1.944,
    pitch: radToDeg(state.attitude.pitch),
    roll: radToDeg(state.attitude.roll),
    heading: radToDeg(state.attitude.yaw) % 360,
    verticalSpeed: verticalSpeed * 60,
    turnRate: radToDeg(state.angularVelocity.r),
    lat: 34.0 + state.position.x * latPerMeter,
    lng: -118.0 + state.position.z * lngPerMeter,
    time: state.time,
  };
}

let lastTime = performance.now();

function gameLoop(): void {
  if (!isRunning) return;

  const currentTime = performance.now();
  const dt = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  const maxDt = 0.1;
  const steps = Math.ceil(dt / maxDt);
  const stepDt = dt / steps;

  for (let i = 0; i < steps; i++) {
    updateState(stepDt);
  }

  const flightData = convertToFlightData();
  self.postMessage({ type: 'FLIGHT_DATA', data: flightData });

  animationId = requestAnimationFrame(gameLoop);
}

self.onmessage = (event: MessageEvent) => {
  const { type, data } = event.data;

  switch (type) {
    case 'START':
      if (!isRunning) {
        isRunning = true;
        lastTime = performance.now();
        gameLoop();
      }
      break;

    case 'STOP':
      isRunning = false;
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
      break;

    case 'UPDATE_CONTROLS':
      controls = { ...controls, ...data };
      break;

    case 'RESET':
      state = {
        position: { x: 0, y: 5000, z: 0 },
        velocity: { u: 120, v: 0, w: 0 },
        attitude: { pitch: 0, roll: 0, yaw: 0 },
        angularVelocity: { p: 0, q: 0, r: 0 },
        time: 0,
      };
      controls = {
        elevator: 0,
        aileron: 0,
        rudder: 0,
        throttle: 50,
      };
      self.postMessage({ type: 'FLIGHT_DATA', data: convertToFlightData() });
      break;
  }
};
