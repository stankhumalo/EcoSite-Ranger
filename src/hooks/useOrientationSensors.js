import { useState, useEffect } from 'react';
import { Magnetometer, Accelerometer } from 'expo-sensors';

export function useOrientationSensors(isActive = true) {
  const [heading, setHeading] = useState(null);
  const [cardinal, setCardinal] = useState('N');
  const [pitchLabel, setPitchLabel] = useState('Level');
  const [tiltDegrees, setTiltDegrees] = useState(0);
  const [sensorAvailable, setSensorAvailable] = useState(true);

  useEffect(() => {
    if (!isActive) return;

    let magSub = null;
    let accSub = null;

    const startSensors = async () => {
      try {
        const magAvailable = await Magnetometer.isAvailableAsync();
        const accAvailable = await Accelerometer.isAvailableAsync();
        if (!magAvailable && !accAvailable) {
          setSensorAvailable(false);
          return;
        }

        Magnetometer.setUpdateInterval(500);
        Accelerometer.setUpdateInterval(500);

        if (magAvailable) {
          magSub = Magnetometer.addListener(({ x, y }) => {
            let angle = Math.atan2(y, x) * (180 / Math.PI);
            angle = angle >= 0 ? angle : angle + 360;
            const rounded = Math.round(angle);
            setHeading(rounded);

            const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
            setCardinal(dirs[Math.round(rounded / 45) % 8]);
          });
        }

        if (accAvailable) {
          accSub = Accelerometer.addListener(({ y, z }) => {
            // Calculate vertical camera pitch (-90 = straight down, 0 = horizon, +90 = straight up)
            const pitchRad = Math.atan2(-z, Math.sqrt(y * y));
            const deg = Math.round(pitchRad * (180 / Math.PI));
            setTiltDegrees(deg);
             if (deg > 25) setPitchLabel('Pointing Down');
            else if (deg < -25) setPitchLabel('Pointing Up');
            else setPitchLabel('Horizon / Level');
          });
        }
      } catch (err) {
        setSensorAvailable(false);
      }
    };

    startSensors();

    return () => {
      magSub && magSub.remove();
      accSub && accSub.remove();
    };
  }, [isActive]);

  return {
    heading,
    cardinal,
    pitchLabel,
    tiltDegrees,
    sensorAvailable,
  };
}