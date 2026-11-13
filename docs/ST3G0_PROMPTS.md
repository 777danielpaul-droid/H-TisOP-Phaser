# ST3-G0: Prompts für die fehlenden Posen-Bögen (Gemini)
**Stand:** 12 Bögen sind im Spiel (`assets/st3g0/sheets/bogen_1` … `bogen_12`, 48 Posen). Die Bögen 5-12 stammen aus `stego.zip` und decken Kick/Block, Flugkick, Idle, Aufwärtshaken, Schlagfolge, Sieg und Hyper ab (siehe HANDOVER.md). **Noch offen:** Ducken (Crouch-Block/-Schlag/-Kick), Treffer-Posen, Luft-Schlag und Knockdown/Aufstehen; die Prompts dafür unten gelten weiter, neue Dateien bitte als `bogen_13.png` ff. ablegen (Importer liest bis Bogen 20). ST3-G0 läuft damit schon komplett, ein Teil der Animationen (Ducken-/Luft-Angriffe, Treffer, Block, Special) nutzt aber noch Behelfs-Posen. Mit den folgenden Bögen werden sie ersetzt.

## So geht's
1. Bei Gemini **`assets/st3g0/sheets/bogen_1.jpeg`** als Referenz anhängen und den Prompt des Bogens einfügen (Gemini-Prompt unten, der Block „Gemeinsamer Anfang" gehört vor jeden Bogen).
2. Bild in höchster Auflösung erzeugen und unter dem **Dateinamen im Kopf des Abschnitts** in `assets/st3g0/sheets/` speichern (`bogen_5.png` … `bogen_12.png`; `.jpg`/`.jpeg` geht auch).
3. **`ST3G0-UPDATE.bat`** (Windows) bzw. **`st3g0-update.sh`** doppelklicken. Das liest alle Bögen ein, baut das Spiel neu und öffnet ein Kontrollbild (`assets/st3g0/sheets/_vorschau.png`).
4. Die neuen Posen den Animationen zuordnen: das mache ich anhand der Zellen-Beschreibung unten (Datei `src/render/sprites.js`, `ST3G0_ANIMS`). Sag mir einfach Bescheid, wenn ein Bogen drin ist.

**Reihenfolge-Tipp:** 5 (Treffer & Block) und 6 (Ducken) zuerst, damit sehen Kämpfe sofort viel besser aus. 7-10 danach, 11 und 12 sind optional.
**Wenn die Figur zwischen den Bögen anders aussieht:** zusätzlich den ersten gelungenen neuen Bogen anhängen und schreiben: *"Keep the character exactly identical to the attached sheets."*
**Wenn Posen abgeschnitten sind oder sich berühren:** *"Leave much more empty space between the four poses and make the character smaller inside its cell."*
**Hintergrund:** Bitte reines Grün (#00FF00), das ist sauberer als Weiß (Bandagen, Staub). Weiß funktioniert aber auch.

## Gemeinsamer Anfang (vor jeden Bogen kopieren)
```text
Reference: the attached image shows the exact character ST3-G0 – a muscular anthropomorphic green lizard / stegosaurus martial artist (green scaly skin, lighter yellow-green belly and chest, brown stegosaurus plates along the back and tail, bone-colored spikes at the tail tip, white hand wraps on both forearms, dark-green baggy karate pants, a bright-green sash belt with long ends, bare clawed feet). Keep face, scales, plates, proportions, hand wraps and outfit identical in every pose.

Create a POSE SHEET for a 2D fighting game (Marvel vs. Capcom 2 style, hand-painted, crisp clean dark outlines, same rendering style as the reference).

LAYOUT: exactly 2 columns x 2 rows = 4 poses, reading order left to right, top to bottom, with clear empty space between the poses. No numbers, no text, no labels, no grid lines, no borders.
BACKGROUND: one perfectly flat, solid pure green (#00FF00) across the entire image. No gradient, no floor, no ground shadow. Small dust puffs or impact marks are allowed, but they must not be green.
CHARACTER: side view, facing RIGHT (3/4 view like in fighting games). In EVERY pose the character has exactly the same scale as in the reference (the neutral fight stance is the size reference) and the lowest foot rests on the same invisible ground line (except in-air poses). The whole character including tail stays completely inside its own quarter of the image.
```

---

## Bogen 5: Treffer & Block  →  `bogen_5.png`
```text
POSES (reading order):
1. HIT HIGH: struck in the face – head snapped back, mouth open in pain, one arm flung up, body leaning back, feet still planted.
2. HIT CHEST: struck in the chest – torso bent forward and recoiling, eyes shut tight, arms pulled in.
3. HIT STOMACH: struck in the belly – doubled over, both arms clutching the stomach, head down.
4. BLOCK: standing block – both forearms crossed in front of the face, knees bent, braced stance, tail low.
```
Zuordnung: Treffer-Animation (hit), Block (block).

## Bogen 6: Ducken  →  `bogen_6.png`
```text
POSES (reading order):
1. CROUCH BLOCK: deep crouch, both forearms guarding the face, tail low.
2. CROUCH PUNCH: deep crouch, one fist punching forward at knee height, other fist guarding.
3. CROUCH SWEEP KICK: low leg sweep along the ground, the body low, the tail swinging for balance.
4. GET-UP CROUCH: upright crouch with both fists in front of the chest, ready to stand (used for the get-up animation).
```
Zuordnung: cblock, cpunch, ckick, wakeup.

## Bogen 7: Luft  →  `bogen_7.png`
```text
POSES (reading order):
1. JUMP PUNCH: in the air, one fist punching forward, knees tucked, feet off the ground.
2. JUMP KICK: in the air, one leg kicking diagonally downward, torso leaning back.
3. HEAVY AIR ATTACK: in the air, both fists clasped overhead, hammering down.
4. AIR DASH: in the air, body stretched out horizontally, arms trailing back, tail streaming behind.
```
Zuordnung: jpunch, jkick, jheavy, airdash. (Alle Posen in der Luft, ohne Bodenlinie.)

## Bogen 8: Aufwärts-Special  →  `bogen_8.png`
```text
POSES (reading order):
1. WIND-UP: deep low stance, one fist pulled back to the hip, the other hand open and forward, tail low.
2. RISING HOOK START: exploding upward, fist swinging up from the hip, one foot leaving the ground.
3. PEAK: at the top of the jump, fully stretched, fist raised high, tail whipping, in the air.
4. LANDING: crouched landing, one hand touching the ground, dust puff, head up.
```
Zuordnung: Aufwärts-Special (upper).

## Bogen 9: Energie-Special & Hyper  →  `bogen_9.png`
```text
POSES (reading order):
1. CHARGE: both hands pulled back to one hip, glowing green-white energy forming between the palms, intense look.
2. THRUST: both arms thrust forward, palms open, a bright green energy burst leaving the hands.
3. HYPER POSE: roaring head-up, fists clenched at the sides, body glowing with a green aura, plates raised.
4. RECOVERY: arms lowering, deep breath, smoke wisps from the hands.
```
Zuordnung: Special (Platten-Splitter), Hyper.

## Bogen 10: Sieg & Niederlage  →  `bogen_10.png`
```text
POSES (reading order):
1. ROAR: standing tall, head thrown back, mouth open, both fists clenched, victory roar.
2. MUSCLE POSE: flexing both arms (double biceps), proud grin.
3. ARMS CROSSED: standing with arms crossed, confident look, tail curled.
4. DEFEATED: kneeling on one knee, head down, one hand on the ground, exhausted.
```
Zuordnung: win, defeat.

## Bogen 11 (optional): Idle & Gehen  →  `bogen_11.png`
```text
POSES (reading order):
1. IDLE BREATH A: fight stance like the reference, chest raised slightly, guard fists a bit higher.
2. IDLE BREATH B: same stance, chest lowered, weight shifted onto the back foot.
3. WALK STEP: mid-stride, opposite leg forward compared to a normal walk step, fists up.
4. RETREAT STEP: stepping backwards, guard high, leaning slightly away.
```
Zuordnung: Idle-Schleife, Gehen.

## Bogen 12 (optional): Knockdown  →  `bogen_12.png`
```text
POSES (reading order):
1. KNOCKBACK: flying backwards through the air, head up, arms flailing, in the air.
2. HARD LANDING: hitting the ground on the back, dust cloud, limbs spread.
3. LYING: lying flat on the back, head to the LEFT, arms out, eyes closed.
4. PUSH-UP: pushing up from the ground with both hands, head up, one knee drawn in.
```
Zuordnung: airhit, kd, wakeup. **Wichtig:** bei Pose 3 liegt der Kopf links (so wie ein nach hinten geworfener Kämpfer, der nach rechts schaut).
