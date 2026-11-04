(function () {
  'use strict';
  G.$('#btnHome').addEventListener('click', () => { G.sfx.tap(); G.home(); });
  G.$('#btnSound').addEventListener('click', () => G.setSound(!G.soundOn));
  G.setSound(G.soundOn);
  G.showStars();
  G.route();
})();
