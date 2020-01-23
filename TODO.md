# TODO
## Performance optimizations
* Generate scrobble colors once (in `enrichScrobbleList()`). Currently they are created on the fly - when points are drawn.
* Use sliding indices instead of recreating the `scrobbleCollectionZoomed` on zooming/panning. This will also allow to rely on global indices in `Collection.prototype.getAdjacent()` and locate an item by index instead of running a ".find()" loop.

## Improvements
* Place a selected artist label **before** placing other artists labels. That will make it stay close to related scrobble point. Currently it's being placed **after** other labels because highlighting points and rendering labels are coupled - see `TimelineInteractive.prototype.highlightGenre()` and `TimelineInteractive.prototype.highlightArtist()`.

## Features
* Add a scale to the time axis (showing months/weeks/days), update it when zoomed range changes.
* Update summary numbers/links when zoomed range changes.
* Support zooming and panning on mobile devices via touch events, but don't zoom and pan simultaneously.
