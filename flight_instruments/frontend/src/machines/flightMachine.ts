import { createMachine, assign } from 'xstate';
import { FlightDataType, ControlsType } from '../types/flight';

interface FlightMachineContext {
  flightData: FlightDataType;
  controls: ControlsType;
  isRecording: boolean;
  recordedData: FlightDataType[];
  error: string | null;
}

type FlightMachineEvents =
  | { type: 'START' }
  | { type: 'STOP' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'START_RECORDING' }
  | { type: 'STOP_RECORDING' }
  | { type: 'UPDATE_CONTROLS'; controls: Partial<ControlsType> }
  | { type: 'UPDATE_FLIGHT_DATA'; flightData: FlightDataType }
  | { type: 'RESET' };

const initialFlightData: FlightDataType = {
  altitude: 5000,
  airspeed: 250,
  pitch: 0,
  roll: 0,
  heading: 0,
  verticalSpeed: 0,
  turnRate: 0,
  lat: 34.0,
  lng: -118.0,
  time: 0,
};

const initialControls: ControlsType = {
  elevator: 0,
  aileron: 0,
  rudder: 0,
  throttle: 50,
};

export const flightMachine = createMachine({
  id: 'flight',
  initial: 'idle',
  context: {
    flightData: initialFlightData,
    controls: initialControls,
    isRecording: false,
    recordedData: [],
    error: null,
  },
  states: {
    idle: {
      on: {
        START: 'running',
      },
    },
    running: {
      initial: 'normal',
      states: {
        normal: {
          on: {
            PAUSE: 'paused',
          },
        },
        paused: {
          on: {
            RESUME: 'normal',
          },
        },
      },
      on: {
        STOP: 'idle',
        UPDATE_CONTROLS: {
          actions: assign({
            controls: ({ context, event }) => ({
              ...context.controls,
              ...event.controls,
            }),
          }),
        },
        UPDATE_FLIGHT_DATA: {
          actions: assign({
            flightData: ({ context, event }) => {
              const newData = event.flightData;
              if (context.isRecording) {
                return {
                  ...newData,
                  recordedData: [...context.recordedData, newData],
                } as any;
              }
              return newData;
            },
            recordedData: ({ context, event }) => {
              if (context.isRecording) {
                return [...context.recordedData, event.flightData];
              }
              return context.recordedData;
            },
          }),
        },
        START_RECORDING: {
          actions: assign({
            isRecording: true,
            recordedData: [],
          }),
        },
        STOP_RECORDING: {
          actions: assign({
            isRecording: false,
          }),
        },
        RESET: {
          target: 'idle',
          actions: assign({
            flightData: initialFlightData,
            controls: initialControls,
            isRecording: false,
            recordedData: [],
            error: null,
          }),
        },
      },
    },
  },
});
