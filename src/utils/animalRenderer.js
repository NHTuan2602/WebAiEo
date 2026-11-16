import {
  ANIMAL_CHARACTERS,
  CREWMATE_COLORS,
  normalizeAccessoryId,
  normalizeAnimalId
} from '../constants/seedData';

function drawPolygon(ctx, points) {
  if (!points || points.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0], points[i][1]);
  }
  ctx.closePath();
}

/**
 * Draw an animal pilot head/portrait centered at (0, 0) on a Canvas 2D context.
 */
export function drawAnimalPortraitCanvas(
  ctx,
  {
    animalId = 'cat',
    accessoryId = 'none',
    colorId = 'cyan',
    radius = 15,
    timeMs = 0,
    avatarImg = null,
    showShoulderSuit = false
  } = {}
) {
  const safeAnimal = normalizeAnimalId(animalId);
  const safeAcc = normalizeAccessoryId(accessoryId);
  const species = ANIMAL_CHARACTERS.find(a => a.id === safeAnimal) || ANIMAL_CHARACTERS[0];
  const shipPalette = CREWMATE_COLORS.find(c => c.id === colorId) || CREWMATE_COLORS[1];
  const r = radius;

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Optional tiny pilot suit shoulders when sitting inside cockpit
  if (showShoulderSuit) {
    ctx.fillStyle = shipPalette.fill;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = Math.max(1.2, r * 0.12);
    ctx.beginPath();
    ctx.ellipse(0, r * 0.92, r * 0.85, r * 0.45, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Little cockpit collar
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.72, r * 0.56, r * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 1. Back Layer: Mane (Lion) or Ears (Rabbit, Cat, Shiba, Panda, Fox)
  const strokeW = Math.max(1.2, r * 0.11);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = strokeW;

  if (safeAnimal === 'lion') {
    const bumps = 10;
    ctx.fillStyle = species.accent;
    ctx.beginPath();
    for (let i = 0; i < bumps * 2; i++) {
      const ang = (i * Math.PI) / bumps;
      const rad = i % 2 === 0 ? r * 1.32 : r * 1.08;
      const px = Math.cos(ang) * rad;
      const py = Math.sin(ang) * rad - r * 0.04;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  if (safeAnimal === 'bunny') {
    for (const dir of [-1, 1]) {
      ctx.save();
      ctx.translate(dir * r * 0.42, -r * 0.85);
      ctx.rotate(dir * 0.16);
      ctx.fillStyle = species.body;
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.42, r * 0.28, r * 0.66, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = species.innerEar;
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.4, r * 0.14, r * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else if (safeAnimal === 'panda') {
    for (const dir of [-1, 1]) {
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(dir * r * 0.72, -r * 0.68, r * 0.34, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  } else if (safeAnimal === 'cat' || safeAnimal === 'shiba' || safeAnimal === 'fox') {
    for (const dir of [-1, 1]) {
      ctx.fillStyle = safeAnimal === 'fox' ? '#991b1b' : species.body;
      drawPolygon(ctx, [
        [dir * r * 0.26, -r * 0.76],
        [dir * r * 0.86, -r * 1.18],
        [dir * r * 0.9, -r * 0.34]
      ]);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = species.innerEar;
      drawPolygon(ctx, [
        [dir * r * 0.38, -r * 0.72],
        [dir * r * 0.77, -r * 1.0],
        [dir * r * 0.79, -r * 0.46]
      ]);
      ctx.fill();
    }
  } else if (safeAnimal === 'frog') {
    for (const dir of [-1, 1]) {
      ctx.fillStyle = species.body;
      ctx.beginPath();
      ctx.arc(dir * r * 0.48, -r * 0.78, r * 0.34, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  // 2. Main Head Circle
  ctx.fillStyle = species.body;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.0, r * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Avatar face override inside animal head if chosen
  const hasLoadedAvatar = Boolean(
    colorId === 'avatar' &&
    avatarImg &&
    avatarImg.complete &&
    avatarImg.naturalWidth > 0
  );

  if (hasLoadedAvatar) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.84, r * 0.76, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatarImg, -r * 0.86, -r * 0.78, r * 1.72, r * 1.56);
    ctx.restore();
  } else {
    // 3. Species-specific facial fur markings
    if (safeAnimal === 'shiba') {
      ctx.fillStyle = species.belly;
      ctx.beginPath();
      ctx.ellipse(0, r * 0.24, r * 0.78, r * 0.56, 0, 0, Math.PI * 2);
      ctx.fill();
      // Shiba eyebrows
      ctx.fillStyle = species.belly;
      ctx.beginPath();
      ctx.ellipse(-r * 0.34, -r * 0.34, r * 0.14, r * 0.09, -0.2, 0, Math.PI * 2);
      ctx.ellipse(r * 0.34, -r * 0.34, r * 0.14, r * 0.09, 0.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (safeAnimal === 'fox') {
      ctx.fillStyle = species.belly;
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(dir * r * 0.45, r * 0.26, r * 0.46, r * 0.38, dir * 0.25, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (safeAnimal === 'penguin') {
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(-r * 0.24, r * 0.1, r * 0.45, r * 0.55, 0, 0, Math.PI * 2);
      ctx.ellipse(r * 0.24, r * 0.1, r * 0.45, r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (safeAnimal === 'lion' || safeAnimal === 'bunny' || safeAnimal === 'cat') {
      ctx.fillStyle = species.belly;
      ctx.beginPath();
      ctx.ellipse(0, r * 0.28, r * 0.44, r * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (safeAnimal === 'frog') {
      ctx.fillStyle = species.belly;
      ctx.beginPath();
      ctx.ellipse(0, r * 0.26, r * 0.65, r * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Panda dark eye patches
    if (safeAnimal === 'panda') {
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.ellipse(-r * 0.36, -r * 0.08, r * 0.24, r * 0.28, 0.3, 0, Math.PI * 2);
      ctx.ellipse(r * 0.36, -r * 0.08, r * 0.24, r * 0.28, -0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Blinking Cute Eyes
    const blinkCycle = timeMs % 3600;
    const isBlinking = blinkCycle > 3430;
    const eyeY = safeAnimal === 'frog' ? -r * 0.78 : -r * 0.08;
    const eyeX = safeAnimal === 'frog' ? r * 0.48 : r * 0.35;
    const eyeRad = safeAnimal === 'frog' ? r * 0.22 : r * 0.14;

    if (safeAnimal === 'frog') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-eyeX, eyeY, eyeRad, 0, Math.PI * 2);
      ctx.arc(eyeX, eyeY, eyeRad, 0, Math.PI * 2);
      ctx.fill();
    }

    if (isBlinking && safeAnimal !== 'frog') {
      ctx.strokeStyle = safeAnimal === 'panda' ? '#ffffff' : '#0f172a';
      ctx.lineWidth = Math.max(1.4, r * 0.1);
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(dir * eyeX - eyeRad, eyeY);
        ctx.lineTo(dir * eyeX + eyeRad, eyeY);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = '#0f172a';
      const pupilR = safeAnimal === 'frog' ? eyeRad * 0.6 : eyeRad;
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(dir * eyeX, eyeY, pupilR, 0, Math.PI * 2);
        ctx.fill();
        // Sparkle dot
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(dir * eyeX - pupilR * 0.3, eyeY - pupilR * 0.3, pupilR * 0.36, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
      }
    }

    // Rosy cheeks
    ctx.fillStyle = 'rgba(244, 114, 182, 0.48)';
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(dir * r * 0.56, r * 0.2, r * 0.16, r * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Nose / Beak & Cute Smile
    if (safeAnimal === 'penguin') {
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = Math.max(1, r * 0.08);
      drawPolygon(ctx, [
        [-r * 0.2, r * 0.12],
        [r * 0.2, r * 0.12],
        [0, r * 0.36]
      ]);
      ctx.fill();
      ctx.stroke();
    } else if (safeAnimal === 'frog') {
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = Math.max(1.2, r * 0.09);
      ctx.beginPath();
      ctx.arc(0, r * 0.18, r * 0.32, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    } else {
      ctx.fillStyle = safeAnimal === 'bunny' ? '#f43f5e' : '#0f172a';
      ctx.beginPath();
      ctx.ellipse(0, r * 0.16, r * 0.13, r * 0.09, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = Math.max(1.1, r * 0.08);
      ctx.beginPath();
      ctx.arc(-r * 0.1, r * 0.26, r * 0.1, 0, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(r * 0.1, r * 0.26, r * 0.1, 0, Math.PI);
      ctx.stroke();
    }

    // Cat whiskers
    if (safeAnimal === 'cat') {
      ctx.strokeStyle = '#431407';
      ctx.lineWidth = Math.max(1, r * 0.06);
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(dir * r * 0.62, r * 0.12);
        ctx.lineTo(dir * r * 1.06, r * 0.04);
        ctx.moveTo(dir * r * 0.62, r * 0.24);
        ctx.lineTo(dir * r * 1.06, r * 0.28);
        ctx.stroke();
      }
    }
  }

  // 5. Accessories Overlay!
  if (safeAcc === 'glasses') {
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = Math.max(1, r * 0.08);
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.roundRect(dir * r * 0.36 - r * 0.25, -r * 0.24, r * 0.5, r * 0.3, r * 0.08);
      ctx.fill();
      ctx.stroke();
      // White glare
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath();
      ctx.moveTo(dir * r * 0.36 - r * 0.14, -r * 0.16);
      ctx.lineTo(dir * r * 0.36 - r * 0.02, -r * 0.02);
      ctx.stroke();
      ctx.strokeStyle = '#f8fafc';
    }
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = Math.max(1.4, r * 0.1);
    ctx.beginPath();
    ctx.moveTo(-r * 0.12, -r * 0.1);
    ctx.lineTo(r * 0.12, -r * 0.1);
    ctx.stroke();
  } else if (safeAcc === 'headphones') {
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = Math.max(2, r * 0.18);
    ctx.beginPath();
    ctx.arc(0, -r * 0.08, r * 1.05, Math.PI * 1.06, Math.PI * 1.94);
    ctx.stroke();

    for (const dir of [-1, 1]) {
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = Math.max(1.2, r * 0.1);
      ctx.beginPath();
      ctx.roundRect(dir * r * 0.94 - r * 0.18, -r * 0.28, r * 0.36, r * 0.58, r * 0.14);
      ctx.fill();
      ctx.stroke();
    }
  } else if (safeAcc === 'crown') {
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = Math.max(1.1, r * 0.09);
    drawPolygon(ctx, [
      [-r * 0.44, -r * 0.78],
      [-r * 0.52, -r * 1.24],
      [-r * 0.2, -r * 0.98],
      [0, -r * 1.34],
      [r * 0.2, -r * 0.98],
      [r * 0.52, -r * 1.24],
      [r * 0.44, -r * 0.78]
    ]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, -r * 0.93, r * 0.09, 0, Math.PI * 2);
    ctx.fill();
  } else if (safeAcc === 'grad_cap') {
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = Math.max(1.1, r * 0.09);
    // Cap base
    ctx.beginPath();
    ctx.roundRect(-r * 0.42, -r * 1.0, r * 0.84, r * 0.28, r * 0.06);
    ctx.fill();
    ctx.stroke();
    // Diamond board
    drawPolygon(ctx, [
      [0, -r * 1.32],
      [r * 0.78, -r * 1.06],
      [0, -r * 0.82],
      [-r * 0.78, -r * 1.06]
    ]);
    ctx.fill();
    ctx.stroke();
    // Gold tassel
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = Math.max(1.4, r * 0.1);
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.06);
    ctx.lineTo(r * 0.65, -r * 0.95);
    ctx.lineTo(r * 0.68, -r * 0.56);
    ctx.stroke();
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(r * 0.68, -r * 0.54, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (safeAcc === 'bow') {
    ctx.fillStyle = '#ec4899';
    ctx.strokeStyle = '#831843';
    ctx.lineWidth = Math.max(1, r * 0.08);
    ctx.save();
    ctx.translate(r * 0.46, -r * 0.74);
    ctx.rotate(0.32);
    drawPolygon(ctx, [
      [0, 0],
      [-r * 0.34, -r * 0.2],
      [-r * 0.34, r * 0.2]
    ]);
    ctx.fill();
    ctx.stroke();
    drawPolygon(ctx, [
      [0, 0],
      [r * 0.34, -r * 0.2],
      [r * 0.34, r * 0.2]
    ]);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (safeAcc === 'halo') {
    const hover = Math.sin(timeMs * 0.005) * (r * 0.05);
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = Math.max(2, r * 0.16);
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.ellipse(0, -r * 1.24 + hover, r * 0.58, r * 0.18, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  } else if (safeAcc === 'helmet') {
    // Space helmet dome glass over animal head
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = Math.max(1.5, r * 0.12);
    ctx.fillStyle = 'rgba(125, 211, 252, 0.16)';
    ctx.beginPath();
    ctx.arc(0, -r * 0.06, r * 1.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Visor gloss arc
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = Math.max(1.2, r * 0.1);
    ctx.beginPath();
    ctx.arc(0, -r * 0.06, r * 0.96, Math.PI * 1.15, Math.PI * 1.48);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draw the Spaceship + Animal Pilot + Accessory inside the transparent glass dome for all 3 rounds!
 */
export function drawAnimalSpaceshipCanvas(
  ctx,
  {
    x = 200,
    y = 300,
    animalId = 'cat',
    accessoryId = 'none',
    colorId = 'cyan',
    combo = 0,
    round = 1,
    isFrozen = false,
    paused = false,
    timeMs = Date.now(),
    avatarImg = null
  } = {}
) {
  const palette = CREWMATE_COLORS.find(c => c.id === colorId) || CREWMATE_COLORS[1];
  const hullColor = palette.fill;
  const hullShade = palette.shade;
  const roundGlow = round === 3 ? '#ec4899' : round === 2 ? '#f59e0b' : '#22d3ee';
  const isFever = combo >= 3;

  ctx.save();
  ctx.translate(x, y);

  // Subtle hover bobbing
  const bobY = paused ? 0 : Math.sin(timeMs * 0.006) * 2.2;
  ctx.translate(0, bobY);

  // Outer Aura for Freeze Boost or Fever Combo
  if (isFrozen) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 50, 44, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (isFever) {
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.78)';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.ellipse(0, 0, 48 + Math.sin(timeMs * 0.015) * 2, 42, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Twin Thruster Flames + Central Boost Flame
  if (!paused) {
    const flameMain = 14 + Math.random() * 8;
    const flameSide = 10 + Math.random() * 6;
    const flameColor = isFever ? '#fbbf24' : round === 3 ? '#f472b6' : '#38bdf8';

    for (const dir of [-1, 1]) {
      ctx.fillStyle = flameColor;
      ctx.beginPath();
      ctx.moveTo(dir * 18 - 4, 20);
      ctx.lineTo(dir * 18, 20 + flameSide);
      ctx.lineTo(dir * 18 + 4, 20);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = isFever ? '#f97316' : '#00f2fe';
    ctx.beginPath();
    ctx.moveTo(-7, 22);
    ctx.lineTo(0, 22 + flameMain);
    ctx.lineTo(7, 22);
    ctx.closePath();
    ctx.fill();
  }

  // Side Laser Wing Cannons
  ctx.fillStyle = '#94a3b8';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.roundRect(dir * 31 - 3, -12, 6, 22, 3);
    ctx.fill();
    ctx.stroke();
    // Glowing cannon tip matching round color
    ctx.fillStyle = roundGlow;
    ctx.beginPath();
    ctx.arc(dir * 31, -13, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
  }

  // Swept Spacecraft Wings
  ctx.fillStyle = hullShade;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2.2;
  drawPolygon(ctx, [
    [-38, 18],
    [-20, -10],
    [20, -10],
    [38, 18],
    [16, 16],
    [12, 23],
    [-12, 23],
    [-16, 16]
  ]);
  ctx.fill();
  ctx.stroke();

  // Main Central Hull Fuselage
  ctx.fillStyle = hullColor;
  drawPolygon(ctx, [
    [0, -34],
    [22, -6],
    [20, 20],
    [-20, 20],
    [-22, -6]
  ]);
  ctx.fill();
  ctx.stroke();

  // Nose Laser Cone Accent
  ctx.fillStyle = roundGlow;
  ctx.beginPath();
  ctx.moveTo(0, -34);
  ctx.lineTo(6, -24);
  ctx.lineTo(-6, -24);
  ctx.closePath();
  ctx.fill();

  // Cockpit Bay Dark Interior
  ctx.fillStyle = '#090d1a';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.ellipse(0, 1, 20, 18.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Draw the Player's Chosen Animal + Accessory sitting INSIDE the Ship Cockpit!
  ctx.save();
  ctx.translate(0, 3);
  drawAnimalPortraitCanvas(ctx, {
    animalId,
    accessoryId,
    colorId,
    radius: 12.2,
    timeMs,
    avatarImg,
    showShoulderSuit: true
  });
  ctx.restore();

  // Glass Dome Gloss Reflection Overlay
  ctx.fillStyle = 'rgba(186, 230, 253, 0.14)';
  ctx.beginPath();
  ctx.ellipse(0, 1, 19.5, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(-7, -7, 8, 3.2, -0.55, Math.PI, Math.PI * 1.9);
  ctx.stroke();

  ctx.restore();
}
