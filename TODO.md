* redistribute artist labels vertically so they don't collide
* update summary numbers/links when zoomed range changes
* add a scale to the time axis (showing months/weeks/days), update it when zoomed range changes
* implement horizontal panning, but don't zoom and pan simultaneously
  * use `event.deltaX` for wheel events
  * use `mousedown/mouseup/mousemove` events for precise panning
* support zooming and panning on mobile devices via touch events
* add unit tests (use `tape`)
