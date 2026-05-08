import React, { useEffect, useState } from 'react';
import { Group, Image as KonvaImage, Line } from 'react-konva';
import { BackgroundPlan, Point } from '../../store/useStore';

interface BackgroundPlanLayerProps {
  plan: BackgroundPlan | null | undefined;
  /** Calibration in progress — show clicked points + connecting line. */
  calibrationPoints?: Point[];
}

/**
 * Renders the imported reference plan (e.g., architect's floor plan PNG)
 * behind walls/furniture so designers can trace over it. Image is positioned
 * in world-space using the room's `BackgroundPlan` calibration.
 */
export const BackgroundPlanLayer: React.FC<BackgroundPlanLayerProps> = ({ plan, calibrationPoints }) => {
  const [img, setImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!plan?.imageUrl) {
      setImg(null);
      return;
    }
    const image = new window.Image();
    image.src = plan.imageUrl;
    image.onload = () => setImg(image);
    return () => {
      image.onload = null;
    };
  }, [plan?.imageUrl]);

  if (!plan || !img) {
    return null;
  }

  const w = plan.naturalWidth * plan.mmPerPixel;
  const h = plan.naturalHeight * plan.mmPerPixel;

  return (
    <Group>
      <KonvaImage
        image={img}
        x={plan.originX}
        y={plan.originY}
        width={w}
        height={h}
        opacity={plan.opacity}
        listening={false}
      />
      {calibrationPoints && calibrationPoints.length > 0 && (
        <Group>
          {calibrationPoints.map((p, i) => (
            <Line
              key={`pt-${i}`}
              points={[p.x - 60, p.y, p.x + 60, p.y]}
              stroke="#06b6d4"
              strokeWidth={6}
            />
          ))}
          {calibrationPoints.length === 2 && (
            <Line
              points={[
                calibrationPoints[0].x,
                calibrationPoints[0].y,
                calibrationPoints[1].x,
                calibrationPoints[1].y,
              ]}
              stroke="#06b6d4"
              strokeWidth={4}
              dash={[20, 20]}
              opacity={0.85}
            />
          )}
        </Group>
      )}
    </Group>
  );
};
