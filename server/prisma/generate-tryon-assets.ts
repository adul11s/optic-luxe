import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { PNG } from 'pngjs';

const OUT_DIR = '/Users/chairunnisa/Documents/Ayah/optic-luxe/client/public/assets/tryon';

const VARIANTS = [
  { name: 'Gold',       color: '#D4AF37', lensColor: [135, 206, 235] },
  { name: 'Silver',    color: '#C0C0C0', lensColor: [173, 216, 230] },
  { name: 'Rose Gold',  color: '#B76E79', lensColor: [255, 182, 193] },
  { name: 'Black',     color: '#1a1a1a', lensColor: [51, 51, 51] },
  { name: 'Tortoise',  color: '#8B6914', lensColor: [101, 67, 33] },
  { name: 'Gunmetal',  color: '#2A3439', lensColor: [85, 102, 119] },
  { name: 'Navy',      color: '#1e3a5f', lensColor: [51, 68, 102] },
  { name: 'Red',       color: '#DC2626', lensColor: [136, 34, 34] },
  { name: 'Blue',      color: '#3B82F6', lensColor: [34, 68, 136] },
  { name: 'Champagne', color: '#F7E7CE', lensColor: [230, 215, 180] },
  { name: 'Matte Black',color: '#1a1a1a', lensColor: [51, 51, 51] },
  { name: 'Teal',      color: '#14B8A6', lensColor: [34, 102, 102] },
  { name: 'Olive',     color: '#708238', lensColor: [80, 100, 60] },
  { name: 'Amber',     color: '#D97706', lensColor: [180, 130, 50] },
  { name: 'Sage Green',color: '#9CAF88', lensColor: [154, 175, 136] },
];

function hexToRgb(hex: string) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function generateSpritePng(colorHex: string, lensColor: number[], width = 800, height = 400): Buffer {
  const png = new PNG({ width, height });
  const { r: fc, g: bc, b: bcc } = hexToRgb(colorHex);
  const [lr, lg, lb] = lensColor;

  const cx = width / 2, cy = height / 2;
  const leftX = cx - 220, rightX = cx + 220;
  const lensRx = 115, lensRy = 85;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;

      const inLeftLens = Math.pow(x - leftX, 2) / Math.pow(lensRx, 2) + Math.pow(y - cy, 2) / Math.pow(lensRy, 2) <= 1;
      const inRightLens = Math.pow(x - rightX, 2) / Math.pow(lensRx, 2) + Math.pow(y - cy, 2) / Math.pow(lensRy, 2) <= 1;

      const bridgeDist = Math.abs(x - cx);
      const inBridge = bridgeDist < 90 && y > cy - 25 && y < cy + 8;

      const inLeftArm = x > 20 && x < leftX - 75 && y > cy - 18 && y < cy + 18;
      const inRightArm = x > rightX + 75 && x < width - 20 && y > cy - 18 && y < cy + 18;

      const inLeftFrame = Math.pow(x - leftX, 2) / Math.pow(lensRx + 9, 2) + Math.pow(y - cy, 2) / Math.pow(lensRy + 9, 2) <= 1 && !inLeftLens;
      const inRightFrame = Math.pow(x - rightX, 2) / Math.pow(lensRx + 9, 2) + Math.pow(y - cy, 2) / Math.pow(lensRy + 9, 2) <= 1 && !inRightLens;

      let alpha = 0, pr = fc, pg = bc, pb = bcc;

      if (inLeftLens || inRightLens) { alpha = 155; pr = lr; pg = lg; pb = lb; }
      else if (inLeftFrame || inRightFrame || inBridge) { alpha = 255; }
      else if (inLeftArm || inRightArm) { alpha = 255; }

      png.data[idx] = pr; png.data[idx+1] = pg; png.data[idx+2] = pb; png.data[idx+3] = alpha;
    }
  }
  return PNG.sync.write(png);
}

function buildGLB(colorHex: string): Buffer {
  const { r, g, b } = hexToRgb(colorHex);
  const c = [r / 255, g / 255, b / 255];

  const positions = new Float32Array([
    // Left lens front (4 verts) + back (4 verts) = 8 verts
    -0.55, 0.08, 0.01,  -0.45, 0.08, 0.01,  -0.45,-0.08, 0.01,  -0.55,-0.08, 0.01,
    -0.55, 0.08,-0.01,  -0.45, 0.08,-0.01,  -0.45,-0.08,-0.01,  -0.55,-0.08,-0.01,
    // Right lens front + back = 8 verts
     0.45, 0.08, 0.01,   0.55, 0.08, 0.01,   0.55,-0.08, 0.01,   0.45,-0.08, 0.01,
     0.45, 0.08,-0.01,   0.55, 0.08,-0.01,   0.55,-0.08,-0.01,   0.45,-0.08,-0.01,
    // Bridge 6 verts front
    -0.06, 0.07, 0.01,  0.0, 0.11, 0.01,  0.06, 0.07, 0.01,
    -0.06, 0.07,-0.01,  0.0, 0.11,-0.01,  0.06, 0.07,-0.01,
    // Temple left (4+4 verts)
    -1.08, 0.02, 0.01,  -1.0, 0.02, 0.01,  -1.0,-0.02, 0.01,  -1.08,-0.02, 0.01,
    -1.08, 0.02,-0.01,  -1.0, 0.02,-0.01,  -1.0,-0.02,-0.01,  -1.08,-0.02,-0.01,
    // Temple right (4+4 verts)
     1.0,  0.02, 0.01,   1.08, 0.02, 0.01,   1.08,-0.02, 0.01,   1.0,-0.02, 0.01,
     1.0,  0.02,-0.01,   1.08, 0.02,-0.01,   1.08,-0.02,-0.01,   1.0,-0.02,-0.01,
  ]);

  const normals = new Float32Array(positions.length);
  for (let i = 0; i < positions.length / 3; i++) normals[i * 3 + 2] = 1;

  const indices = new Uint16Array([
    // Left lens box faces (6 faces × 2 triangles)
    0,1,2, 0,2,3,  4,6,5, 4,7,6,  // top/bottom
    0,4,5, 0,5,1,  1,5,6, 1,6,2,  // front/back
    2,6,7, 2,7,3,  3,7,4, 3,4,0,  // left/right
    // Right lens
    8,9,10, 8,10,11,  12,14,13, 12,15,14,
    8,12,13, 8,13,9,  9,13,14, 9,14,10,
    10,14,15, 10,15,11, 11,15,12, 11,12,8,
    // Bridge
    16,17,18, 16,18,17,  19,21,20, 19,22,21,
    // Temple left
    24,25,26, 24,26,25,  28,29,30, 28,30,31,
    // Temple right
    32,33,34, 32,34,33,  36,37,38, 36,38,39,
  ]);

  const posBytes = positions.byteLength;
  const normBytes = normals.byteLength;
  const idxBytes = indices.byteLength;
  const totalBin = posBytes + normBytes + idxBytes;

  const bin = new ArrayBuffer(totalBin);
  const view = new DataView(bin);
  let off = 0;
  positions.forEach(v => { view.setFloat32(off, v, true); off += 4; });
  normals.forEach(v => { view.setFloat32(off, v, true); off += 4; });
  indices.forEach(v => { view.setUint16(off, v, true); off += 2; });

  const posCount = positions.length / 3;
  const idxCount = indices.length;

  const gltf: any = {
    asset: { version: '2.0', generator: 'OpticLuxe' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{
      primitives: [{
        attributes: { POSITION: 0, NORMAL: 1 },
        indices: 2,
        material: 0,
      }],
    }],
    materials: [
      { name: 'frame', pbrMetallicRoughness: { baseColorFactor: [...c, 1], metallicFactor: 0.85, roughnessFactor: 0.15 } },
      { name: 'lens', pbrMetallicRoughness: { baseColorFactor: [0.9, 0.95, 1, 0.5], metallicFactor: 0, roughnessFactor: 0.02 }, transparent: true },
    ],
    accessors: [
      { buffer: 0, byteOffset: 0,                       count: posCount, componentType: 5126, type: 'VEC3', max: [1.2, 1, 0.1], min: [-1.2, -1, -0.1] },
      { buffer: 0, byteOffset: posBytes,               count: posCount, componentType: 5126, type: 'VEC3' },
      { buffer: 0, byteOffset: posBytes + normBytes,     count: idxCount, componentType: 5123, type: 'SCALAR' },
    ],
    buffers: [{ byteLength: totalBin }],
    bufferViews: [
      { buffer: 0, byteOffset: 0,                       byteLength: posBytes,  target: 34962 },
      { buffer: 0, byteOffset: posBytes,                byteLength: normBytes, target: 34962 },
      { buffer: 0, byteOffset: posBytes + normBytes,    byteLength: idxBytes,  target: 34963 },
    ],
  };

  const jsonStr = JSON.stringify(gltf);
  const jsonBytes = Buffer.from(jsonStr, 'utf8');
  const jsonPadLen = Math.ceil(jsonBytes.length / 4) * 4;
  const jsonPad = Buffer.alloc(jsonPadLen);
  jsonBytes.copy(jsonPad);

  const binBuf = Buffer.from(bin);
  const binPadLen = Math.ceil(binBuf.length / 4) * 4;
  const binPad = Buffer.alloc(binPadLen);
  binBuf.copy(binPad);

  const jHdr = Buffer.alloc(8); jHdr.writeUInt32LE(jsonPadLen, 0); jHdr.writeUInt32LE(0x4E4F534A, 4);
  const bHdr = Buffer.alloc(8); bHdr.writeUInt32LE(binPad.length, 0); bHdr.writeUInt32LE(0x004E4942, 4);

  const totalLen = 12 + 8 + jsonPadLen + 8 + binPadLen;
  const header = Buffer.alloc(12);
  header.write('glTF', 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(totalLen, 8);

  return Buffer.concat([header, jHdr, jsonPad, bHdr, binPad]);
}

async function main() {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const products = await prisma.product.findMany({
    include: { variants: { where: { isDeleted: false } } },
  });

  console.log(`Generating assets for ${products.length} products...\n`);

  for (const product of products) {
    for (const variant of product.variants) {
      const colorName = variant.colorName || 'Black';
      const matched = VARIANTS.find(v => colorName.toLowerCase().includes(v.name.toLowerCase()));
      const color = matched?.color || '#1a1a1a';
      const lensColor = matched?.lensColor || [51, 51, 51];

      const slugKey = product.slug.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const colorKey = colorName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const base = `${slugKey}-${colorKey}`;

      writeFileSync(`${OUT_DIR}/${base}.png`, generateSpritePng(color, lensColor));
      writeFileSync(`${OUT_DIR}/${base}.glb`, buildGLB(color));
    }
  }

  await prisma.$disconnect();
  console.log('Done.  Files:', (products.reduce((s, p) => s + p.variants.length, 0) * 2), 'assets');
  console.log(OUT_DIR);
}

main().catch(console.error);