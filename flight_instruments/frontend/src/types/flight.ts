export interface FlightDataType {
  altitude: number;
  airspeed: number;
  pitch: number;
  roll: number;
  heading: number;
  verticalSpeed: number;
  turnRate: number;
  lat: number;
  lng: number;
  time: number;
}

export interface ControlsType {
  elevator: number;
  aileron: number;
  rudder: number;
  throttle: number;
}

export interface NavigationStation {
  id: number;
  name: string;
  lat: number;
  lng: number;
  type: 'VOR' | 'DME' | 'VORTAC';
  frequency: string;
}

export interface FlightRecord {
  id: number;
  name: string;
  startTime: number;
  endTime: number;
  dataPoints: FlightDataType[];
}

export interface NavigationExercise {
  id: number;
  name: string;
  targetRadial: number;
  targetDistance: number;
  startPosition: { lat: number; lng: number };
  navigationStationId: number;
}

export interface ExerciseScore {
  accuracy: number;
  time: number;
  totalScore: number;
}
