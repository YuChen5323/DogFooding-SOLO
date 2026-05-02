import { useEffect, useRef, useState } from 'react';
import { FlightDataType, ControlsType } from '../types/flight';

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

export function useFlightState() {
  const [flightData, setFlightData] = useState<FlightDataType>(initialFlightData);
  const [controls, setControls] = useState<ControlsType>(initialControls);
  const [isRecording, setIsRecording] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const recordedDataRef = useRef<FlightDataType[]>([]);

  useEffect(() => {
    try {
      const worker = new Worker(new URL('../workers/flightModel.worker.ts', import.meta.url));
      workerRef.current = worker;

      worker.onmessage = (event: MessageEvent) => {
        const { type, data } = event.data;
        if (type === 'FLIGHT_DATA') {
          setFlightData(data);
          if (isRecording) {
            recordedDataRef.current.push(data);
          }
        }
      };

      worker.postMessage({ type: 'START' });

      return () => {
        worker.postMessage({ type: 'STOP' });
        worker.terminate();
      };
    } catch (error) {
      console.error('Failed to create worker:', error);
    }
  }, []);

  useEffect(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'UPDATE_CONTROLS',
        data: controls,
      });
    }
  }, [controls]);

  const updateControls = (newControls: Partial<ControlsType>) => {
    setControls((prev) => ({ ...prev, ...newControls }));
  };

  const toggleRecording = () => {
    const newIsRecording = !isRecording;
    setIsRecording(newIsRecording);
    if (!newIsRecording) {
      saveRecording();
    } else {
      recordedDataRef.current = [];
    }
  };

  const saveRecording = async () => {
    if (recordedDataRef.current.length === 0) return;

    try {
      const response = await fetch('/api/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Flight Record ${new Date().toLocaleString()}`,
          startTime: recordedDataRef.current[0].time,
          endTime: recordedDataRef.current[recordedDataRef.current.length - 1].time,
          dataPoints: recordedDataRef.current,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save recording');
      }
    } catch (error) {
      console.error('Error saving recording:', error);
    }
  };

  const resetFlight = () => {
    setControls(initialControls);
    setFlightData(initialFlightData);
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'RESET' });
    }
  };

  return {
    flightData,
    controls,
    isRecording,
    updateControls,
    toggleRecording,
    resetFlight,
  };
}
