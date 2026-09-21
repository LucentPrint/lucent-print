import sharp from "sharp";

const width = 1200;
const height = 630;
const halfWidth = width / 2;

const [clicker, shirt] = await Promise.all([
  sharp("public/images/our-work/01-skull-pumpkin-cauldron.jpg")
    .resize(halfWidth, height, { fit: "cover" })
    .jpeg({ quality: 90 })
    .toBuffer(),
  sharp("public/images/our-work/inspirada-green-front.jpg")
    .resize(halfWidth, height, { fit: "cover" })
    .jpeg({ quality: 90 })
    .toBuffer(),
]);

const overlay = Buffer.from(`
  <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="52%" stop-color="#020617" stop-opacity="0"/>
        <stop offset="100%" stop-color="#020617" stop-opacity="0.88"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#shade)"/>
    <rect x="584" width="32" height="630" fill="#020617" fill-opacity="0.9"/>
    <rect x="40" y="440" width="1120" height="148" rx="26" fill="#020617" fill-opacity="0.82"/>
    <text x="600" y="500" text-anchor="middle" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="56" font-weight="700">LUCENT PRINT</text>
    <text x="600" y="554" text-anchor="middle" fill="#f0abfc" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="600">3D-PRINTED SENSORY TOYS + CUSTOM APPAREL</text>
  </svg>
`);

await sharp({
  create: {
    width,
    height,
    channels: 3,
    background: "#020617",
  },
})
  .composite([
    { input: clicker, left: 0, top: 0 },
    { input: shirt, left: halfWidth, top: 0 },
    { input: overlay, left: 0, top: 0 },
  ])
  .jpeg({ quality: 92, chromaSubsampling: "4:4:4" })
  .toFile("public/images/lucent-print-social-preview.jpg");

console.log("Generated public/images/lucent-print-social-preview.jpg");
