# PWA Icons for ROUGEE.PLAY

## Required Icons

Create these icons with your logo/branding:

### Standard Icons
- `icon-72x72.png` - 72x72px
- `icon-96x96.png` - 96x96px
- `icon-128x128.png` - 128x128px
- `icon-144x144.png` - 144x144px (Windows tile)
- `icon-152x152.png` - 152x152px (iOS)
- `icon-192x192.png` - 192x192px (Android)
- `icon-384x384.png` - 384x384px
- `icon-512x512.png` - 512x512px (Android splash)

## Design Guidelines

### Logo Design
- **Background**: Black (#000000) or dark gray
- **Logo Color**: Neon green (#00ff00) - your brand color
- **Style**: Minimalist, tech/glitch aesthetic
- **Text**: "ROUGEE.PLAY" or just "ROUGEE" for smaller sizes

### Size-Specific Tips

**72x72 to 128x128**: 
- Simple icon only
- Avoid text (too small to read)
- Use recognizable symbol

**144x144 to 192x192**:
- Icon + abbreviated text ("R" or "RP")
- Good for home screen

**384x384 to 512x512**:
- Full logo with text
- Can include tagline
- Used for splash screens

### Maskable Icons
All icons should work as "maskable" icons (safe zones):
- Keep important content in center 80% of image
- Avoid corners (may be rounded/cut)

## Tools to Generate Icons

### Online Tools
1. **PWA Asset Generator**: https://www.pwabuilder.com/imageGenerator
   - Upload one 512x512 image
   - Downloads all sizes

2. **Favicon Generator**: https://realfavicongenerator.net/
   - Comprehensive favicon + PWA icons

3. **Squoosh**: https://squoosh.app/
   - Optimize PNG files for web

### Design Tools
1. **Figma/Canva**: Design at 512x512, export all sizes
2. **Photoshop**: Use batch processing for multiple sizes
3. **GIMP** (free): Create template, export various sizes

## Quick Start with ImageMagick

If you have a 512x512 source image (`logo-512.png`):

```bash
# Install ImageMagick, then run:
convert logo-512.png -resize 72x72 icon-72x72.png
convert logo-512.png -resize 96x96 icon-96x96.png
convert logo-512.png -resize 128x128 icon-128x128.png
convert logo-512.png -resize 144x144 icon-144x144.png
convert logo-512.png -resize 152x152 icon-152x152.png
convert logo-512.png -resize 192x192 icon-192x192.png
convert logo-512.png -resize 384x384 icon-384x384.png
cp logo-512.png icon-512x512.png
```

## Current Status
⚠️ **Icons needed!** Create these files in this directory.

## Testing
After adding icons:
1. Run dev server: `npm run dev`
2. Open Chrome DevTools → Application → Manifest
3. Check all icons load correctly
4. Test on real device: Add to Home Screen

