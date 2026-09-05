/**
 * The flood's timing, shared by the two things that move with it.
 *
 * The pigment that takes the screen is a circle scaled up from the disc, and
 * the symbol field now rides on it — it comes out of the same circle and goes
 * back into it. Both read their durations from here so they cannot drift:
 * a field that arrives 100ms after its pigment is a field floating on nothing.
 */

/** How far the pigment grows. Covers the furthest viewport corner with room over. */
export const FLOOD_SCALE = 20;

/** How long the pigment takes to reach the edge of the screen. */
export const FLOOD_RISE = 700;

/**
 * How long the pigment takes to draw back into its circle once nothing is lit.
 *
 * Quicker than the rise on purpose. Opening is the interesting direction and
 * wants to be watched; closing is the visitor having moved on, and a slow
 * close reads as the page being slow to let go.
 */
export const FLOOD_FALL = 540;

/**
 * Where the symbols sit when they are inside the circle.
 *
 * The field is a full-screen layer scaled about the lit circle's centre. At
 * this scale every symbol lies within the disc's own painted circle (the disc
 * paints over the fixed layers), so a field going in disappears *into* the
 * pigment rather than fading in front of it. Checked against the geometry:
 * a symbol d pixels out at rest sits at d·(0.05 + 0.95·e) while the pigment's
 * edge is at R·(1 + 19·e), and for every d under 2800px the first is inside
 * the second for all e — the symbols never leave the colour on the way out or
 * on the way back.
 */
export const FIELD_MIN_SCALE = 0.05;
