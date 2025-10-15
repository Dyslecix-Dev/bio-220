import GlowingDots from "@/app/_components/_backgrounds/GlowingDots";

export default function GlowingDotsBackground() {
  return (
    <GlowingDots
      className="pointer-events-none mask-radial-to-90% mask-radial-at-center"
      opacity={1}
      gap={10}
      radius={1.6}
      colorLightVar="--color-neutral-500"
      glowColorLightVar="--color-neutral-600"
      colorDarkVar="--color-neutral-500"
      glowColorDarkVar="--color-sky-800"
      backgroundOpacity={0}
      speedMin={0.3}
      speedMax={1.6}
      speedScale={1}
    />
  );
}
