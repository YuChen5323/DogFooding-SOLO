interface TimerState {
  id: string;
  duration: number;
  remainingTime: number;
  isRunning: boolean;
  isPaused: boolean;
  intervalId?: number;
}

const timers = new Map<string, TimerState>();

function tick(timerId: string) {
  const timer = timers.get(timerId);
  if (!timer || !timer.isRunning || timer.isPaused) return;

  timer.remainingTime -= 1;

  self.postMessage({
    type: 'TICK',
    timerId,
    payload: { remainingTime: timer.remainingTime }
  });

  if (timer.remainingTime <= 0) {
    timer.isRunning = false;
    if (timer.intervalId) {
      clearInterval(timer.intervalId);
    }
    self.postMessage({
      type: 'COMPLETE',
      timerId
    });
  }
}

self.onmessage = function(e: MessageEvent) {
  const { type, timerId, payload } = e.data;

  switch (type) {
    case 'CREATE': {
      const duration = payload?.duration || 0;
      timers.set(timerId, {
        id: timerId,
        duration,
        remainingTime: duration,
        isRunning: false,
        isPaused: false
      });
      self.postMessage({
        type: 'CREATED',
        timerId,
        payload: { remainingTime: duration }
      });
      break;
    }

    case 'START': {
      const timer = timers.get(timerId);
      if (!timer) return;

      timer.isRunning = true;
      timer.isPaused = false;

      if (timer.intervalId) {
        clearInterval(timer.intervalId);
      }

      timer.intervalId = self.setInterval(() => tick(timerId), 1000);

      self.postMessage({
        type: 'STARTED',
        timerId,
        payload: { remainingTime: timer.remainingTime }
      });
      break;
    }

    case 'PAUSE': {
      const timer = timers.get(timerId);
      if (!timer) return;

      timer.isPaused = true;

      self.postMessage({
        type: 'PAUSED',
        timerId,
        payload: { remainingTime: timer.remainingTime }
      });
      break;
    }

    case 'RESUME': {
      const timer = timers.get(timerId);
      if (!timer) return;

      timer.isPaused = false;

      self.postMessage({
        type: 'RESUMED',
        timerId,
        payload: { remainingTime: timer.remainingTime }
      });
      break;
    }

    case 'STOP': {
      const timer = timers.get(timerId);
      if (!timer) return;

      timer.isRunning = false;
      timer.isPaused = false;
      if (timer.intervalId) {
        clearInterval(timer.intervalId);
      }

      self.postMessage({
        type: 'STOPPED',
        timerId,
        payload: { remainingTime: timer.duration }
      });
      break;
    }

    case 'RESET': {
      const timer = timers.get(timerId);
      if (!timer) return;

      timer.isRunning = false;
      timer.isPaused = false;
      timer.remainingTime = timer.duration;
      if (timer.intervalId) {
        clearInterval(timer.intervalId);
      }

      self.postMessage({
        type: 'RESET',
        timerId,
        payload: { remainingTime: timer.duration }
      });
      break;
    }

    case 'GET_STATUS': {
      const timer = timers.get(timerId);
      if (timer) {
        self.postMessage({
          type: 'STATUS',
          timerId,
          payload: {
            duration: timer.duration,
            remainingTime: timer.remainingTime,
            isRunning: timer.isRunning,
            isPaused: timer.isPaused
          }
        });
      }
      break;
    }
  }
};

export {};
