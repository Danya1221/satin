import Image from "next/image";

type Direction = "right" | "left" | "up" | "down";

interface ArrowIconProps {
  className?: string;
  width?: number;
  height?: number;
  alt?: string;
  direction?: Direction;
}

export function ArrowIcon({
  className = "",
  width = 20,
  height = 20,
  alt = "arrow",
  direction = "right",
}: ArrowIconProps) {
  // Determine transform based on direction
  const getTransform = () => {
    switch (direction) {
      case "right":
        return "rotate(0deg)";
      case "left":
        return "scaleX(-1)"; // Зеркальное отображение для левой стрелки
      case "down":
        return "rotate(90deg)";
      case "up":
        return "rotate(270deg)";
      default:
        return "rotate(0deg)";
    }
  };

  return (
    <div 
      className="inline-flex"
      style={{ transform: getTransform() }}
    >
      <Image
        src="/arrow-right.png"
        alt={alt}
        width={width}
        height={height}
        className={className}
        priority={false}
      />
    </div>
  );
}
