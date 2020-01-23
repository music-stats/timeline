# TODO
## Performance improvements
* Use sliding indices instead of recreating the `scrobbleCollectionZoomed` on zooming/panning. This will also allow to rely on global indices in "Collection.prototype.getAdjacent()" and locate an item by index instead of running a ".find()" loop.

## Features
* Add a scale to the time axis (showing months/weeks/days), update it when zoomed range changes.
* Update summary numbers/links when zoomed range changes.
* Support zooming and panning on mobile devices via touch events, but don't zoom and pan simultaneously.
