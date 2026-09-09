import NextImage, { type ImageProps } from "next/image";

/** CMS images may be remote or data URLs. Always reserve dimensions. */
export default function StoreImage({ alt, width, height, fill, unoptimized, ...props }: ImageProps) {
  const isRemote = typeof props.src === "string" && /^(https?:|data:)/.test(props.src);
  return <NextImage {...props} alt={alt} {...(fill ? { fill: true } : { width: width ?? 800, height: height ?? 800 })} unoptimized={unoptimized ?? isRemote} />;
}
