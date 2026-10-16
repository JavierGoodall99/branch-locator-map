// What vite-imagetools returns for an import ending in `&as=picture`: one srcset per format, plus
// the fallback image with its pixel size, which the page uses to reserve space before it loads.
declare module '*&as=picture' {
  const picture: {
    sources: Record<string, string>
    img: { src: string; w: number; h: number }
  }
  export default picture
}
