import Image from "next/image";

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <Image
      src="/logo.ico"
      alt="Fish Wiki logo"
      width={size}
      height={size}
      className="rounded-sm"
      priority
    />
  );
}
