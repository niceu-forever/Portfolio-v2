/* =========================================================================
   CONTENT — this is the file you edit.

   Add a project, save, refresh the browser. The wall repacks itself.
   No build step, no npm, nothing to install.

   Prose (the headline, the about paragraph, capabilities) lives in
   index.html instead, so Google can read it without running JavaScript.
   ========================================================================= */

window.CONTENT = {

  /* ---- THE WALL --------------------------------------------------------
     variants      how many poster tiles each project gets on the wall.
                   3 is a good wall. Drop to 2 if you add lots of projects.
     columns       column widths in virtual pixels. The number of values
                   IS the number of columns. Add one to get 5 columns.
     gap           space between tiles, same units.                       */
  wall: {
    variants: 3,
    columns: [420, 380, 440, 400],
    gap: 60
  },

  /* ---- EFFECTS ---------------------------------------------------------
     Flip any of these to false if you want it calmer.                    */
  effects: {
    grain:     true,   // the film grain over everything
    scanlines: true,   // the horizontal line screen
    drift:     true,   // the wall slowly drifting when left alone
    cursor:    true    // the custom ring cursor
  },

  /* ---- PROJECTS --------------------------------------------------------
     title    shown on the wall, in the index and in the detail panel
     kind     the small label. Keep it short.
     note     one or two sentences. Keep it short.
     code     2-4 letters, used on generated type posters. Optional.
     images   ['img/work/won-01.jpg', ...]
              Leave it as [] and posters are generated for you.
              One image is fine, it gets reused across the variants.
     link     optional URL. Shows a link in the detail panel.            */
  projects: [

    {
      title:  'Molde FK',
      kind:   'Motion · LED',
      note:   'LED panel animation for the stadium ribbon boards, built to the pixel pitch so it reads from the stands.',
      code:   'MFK',
      images: ['img/work/IMG_9172-web.jpg'],
      link:   ''
    },


    {
      title:  'Porsche',
      kind:   'Poster concept',
      note:   'Self-initiated poster concept. Unaffiliated with Porsche.',
      code:   '911',
      images: ['img/work/porsche-web.jpg'],
      link:   ''
    },

    {
      title:  'Ravn Esport',
      kind:   'Identity',
      note:   'Esports organisation I designed. Mark, kit and broadcast package.',
      code:   'RAVN',
      images: ['img/work/preikestolen-web.jpg'],
      link:   ''
    },

    {
      title:  'Proliferation',
      kind:   'Poster',
      note:   'Poster. A halftone study in one colour.',
      code:   'PROL',
      images: ['img/work/Proliferation-small-web.jpg'],
      link:   ''
    },

    /* RENAME ME — I titled this from the Japanese in the artwork
       (光と影のあいだ, "between light and shadow"). Your files were
       called mirrorsedgesque. Change the title and kind to whatever
       it actually is. */
    {
      title:  'Between Light and Shadow',
      kind:   'Poster series',
      note:   'Monochrome poster series. Halftone composites, heavy screen texture.',
      code:   'BLS',
      images: ['img/work/mirrorsedgesque-web.jpg', 'img/work/mirrorsedgesque2-web.jpg'],
      link:   ''
    }

    /* ---- COPY THIS BLOCK TO ADD ONE ------------------------------------
    ,{
      title:  'New project',
      kind:   'Brand identity',
      note:   'One or two sentences about it.',
      code:   'NEW',
      images: ['img/work/new-01.jpg'],
      link:   ''
    }
    --------------------------------------------------------------------- */

  ]
};
