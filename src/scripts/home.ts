// Home-page entry point — wires up every interactive module.
// Order matters: audio + heroArt register window globals that
// feed/console rely on at event time.
import './audio';
import './heroArt';
import './effects';
import './feed';
import './console';
