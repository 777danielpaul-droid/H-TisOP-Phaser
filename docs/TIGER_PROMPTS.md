# Tiger-Sheets: Prompts für Gemini
Für jedes Sheet: **tiger_referenz.png** (Ordner `assets/tiger/referenz/`) an Gemini anhängen, den Prompt einfügen, Bild in höchster Auflösung erzeugen und unter dem **Dateinamen** im Kopf des Abschnitts in `assets/tiger/sheets/` speichern. Dann `TIGER-UPDATE.bat` (Windows) bzw. `tiger-update.sh` doppelklicken.
**Reihenfolge-Tipp:** Fang mit den ersten acht an (idle_1 … hit) – schon damit sieht der Tiger komplett anders aus. Die restlichen kannst du später nachliefern; was fehlt, bleibt auf den alten Behelfs-Animationen.
**Wenn die Figur zwischen den Sheets anders aussieht:** hänge zusätzlich das erste gelungene Sheet an und schreibe dazu: *"Keep the character exactly identical to the first attached sheet."*
**Wenn Frames abgeschnitten sind oder sich berühren:** schreibe dazu: *"Leave much more empty green space between the cells and make the character smaller inside its cell."*

---

## 1. Idle, Teil 1 von 2  →  Dateiname: `idle_1.png`  (3×2 = 6 Zellen)
```text
Reference: the attached image shows the exact character – a muscular blue anthropomorphic tiger martial artist (blue fur with darker stripes, white chest and muzzle, bare torso, dark-blue karate pants with a dark belt, bare clawed feet, long striped tail). Keep face, stripes, proportions and outfit identical in every cell. Ignore the green background of the reference.

Create a SPRITE SHEET for a 2D fighting game (Marvel vs. Capcom 2 style, hand-painted, crisp clean dark outlines, high detail – same character and rendering style as the reference, but sharper and more detailed).

LAYOUT: exactly 3 columns x 2 rows = 6 equally sized cells, reading order left to right, top to bottom, with clear empty space between all cells. No numbers, no text, no labels, no grid lines, no borders.
BACKGROUND: one perfectly flat, solid pure green (#00FF00) across the entire image. No gradient, no floor, no ground shadow, no vignette.
CHARACTER: side view, facing RIGHT (3/4 view like in fighting games). In EVERY cell the character has the same scale (the neutral stance is about 65% of the cell height) and the lowest foot rests on the same invisible ground line near the bottom of the cell. The whole character including tail and glow effects stays completely inside its own cell and never touches the cell edge or a neighbouring cell.
CELL 1 = the neutral fight stance exactly like in the reference (it is only used to calibrate the size).
CELLS 2-6: Looping idle / breathing animation in fighting stance, part 1 of 2. Cell 1 is the neutral stance. Cells 2-6: a smooth slow bounce – chest rising and falling, guard fists drifting slightly, weight shifting gently from the back foot to the front foot, tail swaying. Each cell clearly different from the previous one but only by small movements.

Output in the highest resolution available.
```

---

## 2. Idle, Teil 2 von 2  →  Dateiname: `idle_2.png`  (3×2 = 6 Zellen)
```text
Reference: the attached image shows the exact character – a muscular blue anthropomorphic tiger martial artist (blue fur with darker stripes, white chest and muzzle, bare torso, dark-blue karate pants with a dark belt, bare clawed feet, long striped tail). Keep face, stripes, proportions and outfit identical in every cell. Ignore the green background of the reference.

Create a SPRITE SHEET for a 2D fighting game (Marvel vs. Capcom 2 style, hand-painted, crisp clean dark outlines, high detail – same character and rendering style as the reference, but sharper and more detailed).

LAYOUT: exactly 3 columns x 2 rows = 6 equally sized cells, reading order left to right, top to bottom, with clear empty space between all cells. No numbers, no text, no labels, no grid lines, no borders.
BACKGROUND: one perfectly flat, solid pure green (#00FF00) across the entire image. No gradient, no floor, no ground shadow, no vignette.
CHARACTER: side view, facing RIGHT (3/4 view like in fighting games). In EVERY cell the character has the same scale (the neutral stance is about 65% of the cell height) and the lowest foot rests on the same invisible ground line near the bottom of the cell. The whole character including tail and glow effects stays completely inside its own cell and never touches the cell edge or a neighbouring cell.
CELL 1 = the neutral fight stance exactly like in the reference (it is only used to calibrate the size).
CELLS 2-6: Looping idle / breathing animation in fighting stance, part 2 of 2 (continuing directly after part 1). Cell 1 is the neutral stance (calibration only). Cells 2-6: the bounce continues – chest, fists and weight moving back; cell 6 must flow seamlessly back into the neutral stance of cell 1 so the loop is smooth.

Output in the highest resolution available.
```

---

## 3. Gehen, Teil 1 von 2  →  Dateiname: `walk_1.png`  (3×2 = 6 Zellen)
```text
Reference: the attached image shows the exact character – a muscular blue anthropomorphic tiger martial artist (blue fur with darker stripes, white chest and muzzle, bare torso, dark-blue karate pants with a dark belt, bare clawed feet, long striped tail). Keep face, stripes, proportions and outfit identical in every cell. Ignore the green background of the reference.

Create a SPRITE SHEET for a 2D fighting game (Marvel vs. Capcom 2 style, hand-painted, crisp clean dark outlines, high detail – same character and rendering style as the reference, but sharper and more detailed).

LAYOUT: exactly 3 columns x 2 rows = 6 equally sized cells, reading order left to right, top to bottom, with clear empty space between all cells. No numbers, no text, no labels, no grid lines, no borders.
BACKGROUND: one perfectly flat, solid pure green (#00FF00) across the entire image. No gradient, no floor, no ground shadow, no vignette.
CHARACTER: side view, facing RIGHT (3/4 view like in fighting games). In EVERY cell the character has the same scale (the neutral stance is about 65% of the cell height) and the lowest foot rests on the same invisible ground line near the bottom of the cell. The whole character including tail and glow effects stays completely inside its own cell and never touches the cell edge or a neighbouring cell.
CELL 1 = the neutral fight stance exactly like in the reference (it is only used to calibrate the size).
CELLS 2-6: Walk cycle moving forward (to the right) in a low fighting stance, part 1 of 2: cell 2 front foot contact, cell 3 weight shifts down, cell 4 passing pose (back leg swings through), cell 5 up pose pushing off, cell 6 opposite foot contact. Guard fists stay up, torso bobbing slightly, tail swaying.

Output in the highest resolution available.
```

---

## 4. Gehen, Teil 2 von 2  →  Dateiname: `walk_2.png`  (3×2 = 6 Zellen)
```text
Reference: the attached image shows the exact character – a muscular blue anthropomorphic tiger martial artist (blue fur with darker stripes, white chest and muzzle, bare torso, dark-blue karate pants with a dark belt, bare clawed feet, long striped tail). Keep face, stripes, proportions and outfit identical in every cell. Ignore the green background of the reference.

Create a SPRITE SHEET for a 2D fighting game (Marvel vs. Capcom 2 style, hand-painted, crisp clean dark outlines, high detail – same character and rendering style as the reference, but sharper and more detailed).

LAYOUT: exactly 3 columns x 2 rows = 6 equally sized cells, reading order left to right, top to bottom, with clear empty space between all cells. No numbers, no text, no labels, no grid lines, no borders.
BACKGROUND: one perfectly flat, solid pure green (#00FF00) across the entire image. No gradient, no floor, no ground shadow, no vignette.
CHARACTER: side view, facing RIGHT (3/4 view like in fighting games). In EVERY cell the character has the same scale (the neutral stance is about 65% of the cell height) and the lowest foot rests on the same invisible ground line near the bottom of the cell. The whole character including tail and glow effects stays completely inside its own cell and never touches the cell edge or a neighbouring cell.
CELL 1 = the neutral fight stance exactly like in the reference (it is only used to calibrate the size).
CELLS 2-6: Walk cycle moving forward (to the right) in a low fighting stance, part 2 of 2, continuing the cycle of part 1 with the opposite leg: cell 2 weight shifts down, cell 3 passing pose, cell 4 up pose pushing off, cell 5 foot contact, cell 6 weight shifts down so that the cycle can loop back to part 1. Cell 1 is the neutral stance (calibration only).

Output in the highest resolution available.
```

---

## 5. Leichter Schlag (Jab)  →  Dateiname: `punch.png`  (3×2 = 6 Zellen)
```text
Reference: the attached image shows the exact character – a muscular blue anthropomorphic tiger martial artist (blue fur with darker stripes, white chest and muzzle, bare torso, dark-blue karate pants with a dark belt, bare clawed feet, long striped tail). Keep face, stripes, proportions and outfit identical in every cell. Ignore the green background of the reference.

Create a SPRITE SHEET for a 2D fighting game (Marvel vs. Capcom 2 style, hand-painted, crisp clean dark outlines, high detail – same character and rendering style as the reference, but sharper and more detailed).

LAYOUT: exactly 3 columns x 2 rows = 6 equally sized cells, reading order left to right, top to bottom, with clear empty space between all cells. No numbers, no text, no labels, no grid lines, no borders.
BACKGROUND: one perfectly flat, solid pure green (#00FF00) across the entire image. No gradient, no floor, no ground shadow, no vignette.
CHARACTER: side view, facing RIGHT (3/4 view like in fighting games). In EVERY cell the character has the same scale (the neutral stance is about 65% of the cell height) and the lowest foot rests on the same invisible ground line near the bottom of the cell. The whole character including tail and glow effects stays completely inside its own cell and never touches the cell edge or a neighbouring cell.
CELL 1 = the neutral fight stance exactly like in the reference (it is only used to calibrate the size).
CELLS 2-6: Fast jab with the front fist. Cell 2: slight windup, shoulder turns back. Cell 3: fist shoots forward, arm half extended. Cell 4: full extension, arm straight, clenched fist, body leaning into the punch. Cell 5: retracting the arm. Cell 6: back close to the guard pose.

Output in the highest resolution available.
```

---

## 6. Tritt  →  Dateiname: `kick.png`  (3×2 = 6 Zellen)
```text
Reference: the attached image shows the exact character – a muscular blue anthropomorphic tiger martial artist (blue fur with darker stripes, white chest and muzzle, bare torso, dark-blue karate pants with a dark belt, bare clawed feet, long striped tail). Keep face, stripes, proportions and outfit identical in every cell. Ignore the green background of the reference.

Create a SPRITE SHEET for a 2D fighting game (Marvel vs. Capcom 2 style, hand-painted, crisp clean dark outlines, high detail – same character and rendering style as the reference, but sharper and more detailed).

LAYOUT: exactly 3 columns x 2 rows = 6 equally sized cells, reading order left to right, top to bottom, with clear empty space between all cells. No numbers, no text, no labels, no grid lines, no borders.
BACKGROUND: one perfectly flat, solid pure green (#00FF00) across the entire image. No gradient, no floor, no ground shadow, no vignette.
CHARACTER: side view, facing RIGHT (3/4 view like in fighting games). In EVERY cell the character has the same scale (the neutral stance is about 65% of the cell height) and the lowest foot rests on the same invisible ground line near the bottom of the cell. The whole character including tail and glow effects stays completely inside its own cell and never touches the cell edge or a neighbouring cell.
CELL 1 = the neutral fight stance exactly like in the reference (it is only used to calibrate the size).
CELLS 2-6: High roundhouse / front kick. Cell 2: chamber, knee lifted, fists up. Cell 3: leg extends rapidly. Cell 4: full extension, leg straight at head height, body leaning back for balance. Cell 5: leg retracts. Cell 6: foot returns to the ground, back to stance.

Output in the highest resolution available.
```

---

## 7. Sprung  →  Dateiname: `jump.png`  (3×2 = 6 Zellen)
```text
Reference: the attached image shows the exact character – a muscular blue anthropomorphic tiger martial artist (blue fur with darker stripes, white chest and muzzle, bare torso, dark-blue karate pants with a dark belt, bare clawed feet, long striped tail). Keep face, stripes, proportions and outfit identical in every cell. Ignore the green background of the reference.

Create a SPRITE SHEET for a 2D fighting game (Marvel vs. Capcom 2 style, hand-painted, crisp clean dark outlines, high detail – same character and rendering style as the reference, but sharper and more detailed).

LAYOUT: exactly 3 columns x 2 rows = 6 equally sized cells, reading order left to right, top to bottom, with clear empty space between all cells. No numbers, no text, no labels, no grid lines, no borders.
BACKGROUND: one perfectly flat, solid pure green (#00FF00) across the entire image. No gradient, no floor, no ground shadow, no vignette.
CHARACTER: side view, facing RIGHT (3/4 view like in fighting games). In EVERY cell the character has the same scale (the neutral stance is about 65% of the cell height) and the lowest foot rests on the same invisible ground line near the bottom of the cell. The whole character including tail and glow effects stays completely inside its own cell and never touches the cell edge or a neighbouring cell.
CELL 1 = the neutral fight stance exactly like in the reference (it is only used to calibrate the size).
CELLS 2-6: Jump sequence, drawn in mid-air for cells 3-6 (the character floats; no ground). Cell 2: launch, rising fast with legs bent beneath, fists up. Cell 3: rising, legs tucked. Cell 4: peak of the jump, body curled, knees up. Cell 5: falling, legs extending downward. Cell 6: falling fast, legs stretched down ready to land.

Output in the highest resolution available.
```

---

## 8. Treffer  →  Dateiname: `hit.png`  (3×2 = 6 Zellen)
```text
Reference: the attached image shows the exact character – a muscular blue anthropomorphic tiger martial artist (blue fur with darker stripes, white chest and muzzle, bare torso, dark-blue karate pants with a dark belt, bare clawed feet, long striped tail). Keep face, stripes, proportions and outfit identical in every cell. Ignore the green background of the reference.

Create a SPRITE SHEET for a 2D fighting game (Marvel vs. Capcom 2 style, hand-painted, crisp clean dark outlines, high detail – same character and rendering style as the reference, but sharper and more detailed).

LAYOUT: exactly 3 columns x 2 rows = 6 equally sized cells, reading order left to right, top to bottom, with clear empty space between all cells. No numbers, no text, no labels, no grid lines, no borders.
BACKGROUND: one perfectly flat, solid pure green (#00FF00) across the entire image. No gradient, no floor, no ground shadow, no vignette.
CHARACTER: side view, facing RIGHT (3/4 view like in fighting games). In EVERY cell the character has the same scale (the neutral stance is about 65% of the cell height) and the lowest foot rests on the same invisible ground line near the bottom of the cell. The whole character including tail and glow effects stays completely inside its own cell and never touches the cell edge or a neighbouring cell.
CELL 1 = the neutral fight stance exactly like in the reference (it is only used to calibrate the size).
CELLS 2-6: Taking hits. Cell 2: light hit, head snaps back, grimace. Cell 3: light hit, recovering. Cell 4: heavy hit, torso bent backward, pained face. Cell 5: heavy hit, staggering backward, off balance. Cell 6: recovering back toward the guard.

Output in the highest resolution available.
```

---

## 9. Schwerer Schlag  →  Dateiname: `heavy.png`  (3×2 = 6 Zellen)
```text
Reference: the attached image shows the exact character – a muscular blue anthropomorphic tiger martial artist (blue fur with darker stripes, white chest and muzzle, bare torso, dark-blue karate pants with a dark belt, bare clawed feet, long striped tail). Keep face, stripes, proportions and outfit identical in every cell. Ignore the green background of the reference.

Create a SPRITE SHEET for a 2D fighting game (Marvel vs. Capcom 2 style, hand-painted, crisp clean dark outlines, high detail – same character and rendering style as the reference, but sharper and more detailed).

LAYOUT: exactly 3 columns x 2 rows = 6 equally sized cells, reading order left to right, top to bottom, with clear empty space between all cells. No numbers, no text, no labels, no grid lines, no borders.
BACKGROUND: one perfectly flat, solid pure green (#00FF00) across the entire image. No gradient, no floor, no ground shadow, no vignette.
CHARACTER: side view, facing RIGHT (3/4 view like in fighting games). In EVERY cell the character has the same scale (the neutral stance is about 65% of the cell height) and the lowest foot rests on the same invisible ground line near the bottom of the cell. The whole character including tail and glow effects stays completely inside its own cell and never touches the cell edge or a neighbouring cell.
CELL 1 = the neutral fight stance exactly like in the reference (it is only used to calibrate the size).
CELLS 2-6: Powerful heavy straight punch / haymaker with the whole body. Cell 2: deep windup, weight on back leg, fist pulled far back. Cell 3: explosive step forward, torso rotating. Cell 4: full extension, massive punch, wide stance, claws/fist forward. Cell 5: follow-through hold at the moment of impact. Cell 6: recovering back toward the guard.

Output in the highest resolution available.
```

---

## 10. Ducken  →  Dateiname: `crouch.png`  (3×2 = 6 Zellen)
```text
Reference: the attached image shows the exact character – a muscular blue anthropomorphic tiger martial artist (blue fur with darker stripes, white chest and muzzle, bare torso, dark-blue karate pants with a dark belt, bare clawed feet, long striped tail). Keep face, stripes, proportions and outfit identical in every cell. Ignore the green background of the reference.

Create a SPRITE SHEET for a 2D fighting game (Marvel vs. Capcom 2 style, hand-painted, crisp clean dark outlines, high detail – same character and rendering style as the reference, but sharper and more detailed).

LAYOUT: exactly 3 columns x 2 rows = 6 equally sized cells, reading order left to right, top to bottom, with clear empty space between all cells. No numbers, no text, no labels, no grid lines, no borders.
BACKGROUND: one perfectly flat, solid pure green (#00FF00) across the entire image. No gradient, no floor, no ground shadow, no vignette.
CHARACTER: side view, facing RIGHT (3/4 view like in fighting games). In EVERY cell the character has the same scale (the neutral stance is about 65% of the cell height) and the lowest foot rests on the same invisible ground line near the bottom of the cell. The whole character including tail and glow effects stays completely inside its own cell and never touches the cell edge or a neighbouring cell.
CELL 1 = the neutral fight stance exactly like in the reference (it is only used to calibrate the size).
CELLS 2-6: Cell 2: going down into a crouch, knees bent, back leaning forward. Cell 3: deep crouch hold, fists up, low guard. Cell 4: same crouch with a tiny breathing movement. Cell 5: crouching guard, both forearms raised in front of the face. Cell 6: crouching guard, pushed back slightly by an impact.

Output in the highest resolution available.
```

---

## 11. Duck-Angriffe  →  Dateiname: `crouch_atk.png`  (3×2 = 6 Zellen)
```text
Reference: the attached image shows the exact character – a muscular blue anthropomorphic tiger martial artist (blue fur with darker stripes, white chest and muzzle, bare torso, dark-blue karate pants with a dark belt, bare clawed feet, long striped tail). Keep face, stripes, proportions and outfit identical in every cell. Ignore the green background of the reference.

Create a SPRITE SHEET for a 2D fighting game (Marvel vs. Capcom 2 style, hand-painted, crisp clean dark outlines, high detail – same character and rendering style as the reference, but sharper and more detailed).

LAYOUT: exactly 3 columns x 2 rows = 6 equally sized cells, reading order left to right, top to bottom, with clear empty space between all cells. No numbers, no text, no labels, no grid lines, no borders.
BACKGROUND: one perfectly flat, solid pure green (#00FF00) across the entire image. No gradient, no floor, no ground shadow, no vignette.
CHARACTER: side view, facing RIGHT (3/4 view like in fighting games). In EVERY cell the character has the same scale (the neutral stance is about 65% of the cell height) and the lowest foot rests on the same invisible ground line near the bottom of the cell. The whole character including tail and glow effects stays completely inside its own cell and never touches the cell edge or a neighbouring cell.
CELL 1 = the neutral fight stance exactly like in the reference (it is only used to calibrate the size).
CELLS 2-6: Crouching attacks. Cells 2-3: crouching punch (cell 2 windup, cell 3 fist extended low and forward). Cells 4-6: crouching low sweep kick (cell 4 chamber, cell 5 leg fully extended low along the ground, cell 6 retracting). The character stays low in all cells.

Output in the highest resolution available.
```

---

## 12. Luft-Angriffe  →  Dateiname: `air_atk.png`  (4×2 = 8 Zellen)
```text
Reference: the attached image shows the exact character – a muscular blue anthropomorphic tiger martial artist (blue fur with darker stripes, white chest and muzzle, bare torso, dark-blue karate pants with a dark belt, bare clawed feet, long striped tail). Keep face, stripes, proportions and outfit identical in every cell. Ignore the green background of the reference.

Create a SPRITE SHEET for a 2D fighting game (Marvel vs. Capcom 2 style, hand-painted, crisp clean dark outlines, high detail – same character and rendering style as the reference, but sharper and more detailed).

LAYOUT: exactly 4 columns x 2 rows = 8 equally sized cells, reading order left to right, top to bottom, with clear empty space between all cells. No numbers, no text, no labels, no grid lines, no borders.
BACKGROUND: one perfectly flat, solid pure green (#00FF00) across the entire image. No gradient, no floor, no ground shadow, no vignette.
CHARACTER: side view, facing RIGHT (3/4 view like in fighting games). In EVERY cell the character has the same scale (the neutral stance is about 65% of the cell height) and the lowest foot rests on the same invisible ground line near the bottom of the cell. The whole character including tail and glow effects stays completely inside its own cell and never touches the cell edge or a neighbouring cell.
CELL 1 = the neutral fight stance exactly like in the reference (it is only used to calibrate the size).
CELLS 2-8: Aerial attacks, drawn in mid-air (the character floats; the lowest foot is the reference). Cells 2-3: jumping punch (windup, fist extended). Cells 4-6: jumping kick (cell 4 knees tucked, cell 5 leg extended diagonally downward, cell 6 hold). Cells 7-8: jumping heavy overhead claw slash (cell 7 arm raised high, cell 8 slashing downward with a glowing blue slash).

Output in the highest resolution available.
```

---

## 13. Dash  →  Dateiname: `dash.png`  (3×2 = 6 Zellen)
```text
Reference: the attached image shows the exact character – a muscular blue anthropomorphic tiger martial artist (blue fur with darker stripes, white chest and muzzle, bare torso, dark-blue karate pants with a dark belt, bare clawed feet, long striped tail). Keep face, stripes, proportions and outfit identical in every cell. Ignore the green background of the reference.

Create a SPRITE SHEET for a 2D fighting game (Marvel vs. Capcom 2 style, hand-painted, crisp clean dark outlines, high detail – same character and rendering style as the reference, but sharper and more detailed).

LAYOUT: exactly 3 columns x 2 rows = 6 equally sized cells, reading order left to right, top to bottom, with clear empty space between all cells. No numbers, no text, no labels, no grid lines, no borders.
BACKGROUND: one perfectly flat, solid pure green (#00FF00) across the entire image. No gradient, no floor, no ground shadow, no vignette.
CHARACTER: side view, facing RIGHT (3/4 view like in fighting games). In EVERY cell the character has the same scale (the neutral stance is about 65% of the cell height) and the lowest foot rests on the same invisible ground line near the bottom of the cell. The whole character including tail and glow effects stays completely inside its own cell and never touches the cell edge or a neighbouring cell.
CELL 1 = the neutral fight stance exactly like in the reference (it is only used to calibrate the size).
CELLS 2-6: Cell 2: anticipation, body leaning forward, knees bent. Cells 3-4: fast forward dash, torso low and leaning far forward, legs stretched in a long stride (two different running poses). Cells 5-6: air dash, body almost horizontal flying forward with fist leading (two slightly different poses).

Output in the highest resolution available.
```

---

## 14. Rising Claw (Aufwärts-Klaue)  →  Dateiname: `claw.png`  (4×2 = 8 Zellen)
```text
Reference: the attached image shows the exact character – a muscular blue anthropomorphic tiger martial artist (blue fur with darker stripes, white chest and muzzle, bare torso, dark-blue karate pants with a dark belt, bare clawed feet, long striped tail). Keep face, stripes, proportions and outfit identical in every cell. Ignore the green background of the reference.

Create a SPRITE SHEET for a 2D fighting game (Marvel vs. Capcom 2 style, hand-painted, crisp clean dark outlines, high detail – same character and rendering style as the reference, but sharper and more detailed).

LAYOUT: exactly 4 columns x 2 rows = 8 equally sized cells, reading order left to right, top to bottom, with clear empty space between all cells. No numbers, no text, no labels, no grid lines, no borders.
BACKGROUND: one perfectly flat, solid pure green (#00FF00) across the entire image. No gradient, no floor, no ground shadow, no vignette.
CHARACTER: side view, facing RIGHT (3/4 view like in fighting games). In EVERY cell the character has the same scale (the neutral stance is about 65% of the cell height) and the lowest foot rests on the same invisible ground line near the bottom of the cell. The whole character including tail and glow effects stays completely inside its own cell and never touches the cell edge or a neighbouring cell.
CELL 1 = the neutral fight stance exactly like in the reference (it is only used to calibrate the size).
CELLS 2-8: Rising claw uppercut special move with blue energy glow around the claw. Cell 2: crouch, claw pulled low behind the body. Cell 3: explosive launch upward, claw swinging up. Cell 4: rising, claw arcing high with blue energy trail. Cell 5: rising higher, body stretched. Cell 6: peak, claw fully raised overhead. Cell 7: starting to fall, body relaxed. Cell 8: falling with legs extending downward. Cells 3-8 are in mid-air.

Output in the highest resolution available.
```

---

## 15. Energie-Special  →  Dateiname: `special.png`  (4×2 = 8 Zellen)
```text
Reference: the attached image shows the exact character – a muscular blue anthropomorphic tiger martial artist (blue fur with darker stripes, white chest and muzzle, bare torso, dark-blue karate pants with a dark belt, bare clawed feet, long striped tail). Keep face, stripes, proportions and outfit identical in every cell. Ignore the green background of the reference.

Create a SPRITE SHEET for a 2D fighting game (Marvel vs. Capcom 2 style, hand-painted, crisp clean dark outlines, high detail – same character and rendering style as the reference, but sharper and more detailed).

LAYOUT: exactly 4 columns x 2 rows = 8 equally sized cells, reading order left to right, top to bottom, with clear empty space between all cells. No numbers, no text, no labels, no grid lines, no borders.
BACKGROUND: one perfectly flat, solid pure green (#00FF00) across the entire image. No gradient, no floor, no ground shadow, no vignette.
CHARACTER: side view, facing RIGHT (3/4 view like in fighting games). In EVERY cell the character has the same scale (the neutral stance is about 65% of the cell height) and the lowest foot rests on the same invisible ground line near the bottom of the cell. The whole character including tail and glow effects stays completely inside its own cell and never touches the cell edge or a neighbouring cell.
CELL 1 = the neutral fight stance exactly like in the reference (it is only used to calibrate the size).
CELLS 2-8: Energy special move. Cell 2: crouch, gathering blue energy in both hands. Cell 3: strong blue aura builds around the body. Cell 4: thrusting both palms forward, releasing energy (character only, no projectile). Cell 5: full extension, palms forward, intense glow. Cell 6: hold, glow fading. Cell 7: recovering. Cell 8: returning toward the neutral stance.

Output in the highest resolution available.
```

---

## 16. Block  →  Dateiname: `block.png`  (3×2 = 6 Zellen)
```text
Reference: the attached image shows the exact character – a muscular blue anthropomorphic tiger martial artist (blue fur with darker stripes, white chest and muzzle, bare torso, dark-blue karate pants with a dark belt, bare clawed feet, long striped tail). Keep face, stripes, proportions and outfit identical in every cell. Ignore the green background of the reference.

Create a SPRITE SHEET for a 2D fighting game (Marvel vs. Capcom 2 style, hand-painted, crisp clean dark outlines, high detail – same character and rendering style as the reference, but sharper and more detailed).

LAYOUT: exactly 3 columns x 2 rows = 6 equally sized cells, reading order left to right, top to bottom, with clear empty space between all cells. No numbers, no text, no labels, no grid lines, no borders.
BACKGROUND: one perfectly flat, solid pure green (#00FF00) across the entire image. No gradient, no floor, no ground shadow, no vignette.
CHARACTER: side view, facing RIGHT (3/4 view like in fighting games). In EVERY cell the character has the same scale (the neutral stance is about 65% of the cell height) and the lowest foot rests on the same invisible ground line near the bottom of the cell. The whole character including tail and glow effects stays completely inside its own cell and never touches the cell edge or a neighbouring cell.
CELL 1 = the neutral fight stance exactly like in the reference (it is only used to calibrate the size).
CELLS 2-6: Blocking. Cell 2: arms raised, forearms crossed in front of the face, braced. Cell 3: guard hold, leaning slightly forward, tense. Cell 4: guard pushed backward by an impact. Cell 5: guard hold again with a different arm position. Cell 6: relaxing back toward the stance.

Output in the highest resolution available.
```

---

## 17. Knockdown / KO  →  Dateiname: `down.png`  (4×2 = 8 Zellen)
```text
Reference: the attached image shows the exact character – a muscular blue anthropomorphic tiger martial artist (blue fur with darker stripes, white chest and muzzle, bare torso, dark-blue karate pants with a dark belt, bare clawed feet, long striped tail). Keep face, stripes, proportions and outfit identical in every cell. Ignore the green background of the reference.

Create a SPRITE SHEET for a 2D fighting game (Marvel vs. Capcom 2 style, hand-painted, crisp clean dark outlines, high detail – same character and rendering style as the reference, but sharper and more detailed).

LAYOUT: exactly 4 columns x 2 rows = 8 equally sized cells, reading order left to right, top to bottom, with clear empty space between all cells. No numbers, no text, no labels, no grid lines, no borders.
BACKGROUND: one perfectly flat, solid pure green (#00FF00) across the entire image. No gradient, no floor, no ground shadow, no vignette.
CHARACTER: side view, facing RIGHT (3/4 view like in fighting games). In EVERY cell the character has the same scale (the neutral stance is about 65% of the cell height) and the lowest foot rests on the same invisible ground line near the bottom of the cell. The whole character including tail and glow effects stays completely inside its own cell and never touches the cell edge or a neighbouring cell.
CELL 1 = the neutral fight stance exactly like in the reference (it is only used to calibrate the size).
CELLS 2-8: Knocked down and KO. Cell 2: launched into the air by a hit, body leaning back. Cell 3: tumbling backward in mid-air, body nearly horizontal. Cell 4: falling head first toward the ground in mid-air. Cell 5: slamming onto the ground, back arched. Cell 6: sliding on the ground, lying on the back. Cell 7: lying flat on the back, motionless. Cell 8: KO, lying flat, face up, eyes closed. Cells 2-4 are in mid-air, cells 5-8 on the ground.

Output in the highest resolution available.
```

---

## 18. Aufstehen  →  Dateiname: `getup.png`  (3×2 = 6 Zellen)
```text
Reference: the attached image shows the exact character – a muscular blue anthropomorphic tiger martial artist (blue fur with darker stripes, white chest and muzzle, bare torso, dark-blue karate pants with a dark belt, bare clawed feet, long striped tail). Keep face, stripes, proportions and outfit identical in every cell. Ignore the green background of the reference.

Create a SPRITE SHEET for a 2D fighting game (Marvel vs. Capcom 2 style, hand-painted, crisp clean dark outlines, high detail – same character and rendering style as the reference, but sharper and more detailed).

LAYOUT: exactly 3 columns x 2 rows = 6 equally sized cells, reading order left to right, top to bottom, with clear empty space between all cells. No numbers, no text, no labels, no grid lines, no borders.
BACKGROUND: one perfectly flat, solid pure green (#00FF00) across the entire image. No gradient, no floor, no ground shadow, no vignette.
CHARACTER: side view, facing RIGHT (3/4 view like in fighting games). In EVERY cell the character has the same scale (the neutral stance is about 65% of the cell height) and the lowest foot rests on the same invisible ground line near the bottom of the cell. The whole character including tail and glow effects stays completely inside its own cell and never touches the cell edge or a neighbouring cell.
CELL 1 = the neutral fight stance exactly like in the reference (it is only used to calibrate the size).
CELLS 2-6: Getting up from the ground. Cell 2: lying on the back on the ground. Cell 3: rolling over and pushing up with the arms. Cell 4: kneeling on one knee. Cell 5: rising to standing, fists coming up. Cell 6: back in the neutral fighting stance.

Output in the highest resolution available.
```

---

## 19. Siegerpose  →  Dateiname: `win.png`  (3×2 = 6 Zellen)
```text
Reference: the attached image shows the exact character – a muscular blue anthropomorphic tiger martial artist (blue fur with darker stripes, white chest and muzzle, bare torso, dark-blue karate pants with a dark belt, bare clawed feet, long striped tail). Keep face, stripes, proportions and outfit identical in every cell. Ignore the green background of the reference.

Create a SPRITE SHEET for a 2D fighting game (Marvel vs. Capcom 2 style, hand-painted, crisp clean dark outlines, high detail – same character and rendering style as the reference, but sharper and more detailed).

LAYOUT: exactly 3 columns x 2 rows = 6 equally sized cells, reading order left to right, top to bottom, with clear empty space between all cells. No numbers, no text, no labels, no grid lines, no borders.
BACKGROUND: one perfectly flat, solid pure green (#00FF00) across the entire image. No gradient, no floor, no ground shadow, no vignette.
CHARACTER: side view, facing RIGHT (3/4 view like in fighting games). In EVERY cell the character has the same scale (the neutral stance is about 65% of the cell height) and the lowest foot rests on the same invisible ground line near the bottom of the cell. The whole character including tail and glow effects stays completely inside its own cell and never touches the cell edge or a neighbouring cell.
CELL 1 = the neutral fight stance exactly like in the reference (it is only used to calibrate the size).
CELLS 2-6: Victory poses. Cell 2: roaring with the head thrown back, fist raised. Cell 3: flexing both arms, muscles tensed. Cell 4: fist pump. Cell 5: arms crossed, proud stance. Cell 6: confident pose with a slight smile, hold.

Output in the highest resolution available.
```
