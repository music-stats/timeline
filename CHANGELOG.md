# Changelog
All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.2] - 2020-02-09
### Added
* Feature: a scrollbar-like indicator is added to the time axis.

### Changed
* Improvement: artist labels are better distributed vertically.
* Performance: using sliding indices for zooming/panning instead of slicing an array of points.

## [0.1.1] - 2020-02-08
### Changed
* Improvement: selected artist label stays closer to related scrobble point.
* Performance: generating scrobble colors once instead of doing it on the fly when points and labels are drawn.
* Bugfix: color saturation and lightness are sometimes larger than 1.

## [0.1.0] - 2020-01-23
### Added
* Feature: artist labels are distributed vertically to avoid collisions.

### Changed
* Improvement: genres selection on mouse enter instead of on click (consistent with scrobbles selection).
* Improvement: selected artist label is more recognizable because of background color.
* Bugfix: adjacent points flicker during zooming when their x-coords change from same to different and back (introduced by `v0.0.3`).

## [0.0.4] - 2020-01-17
### Changed
* Performance: avoiding reselecting of the same scrobble on mouse move.
* Performance: cleanup artist labels all at once.
* Bugfix: zoomed scrobbles collection contains one extra scrobble out of each side of zoomed time range.
* Bugfix: time axis labels show time of those extra scrobbles, not actual time range.

## [0.0.3] - 2020-01-16
### Changed
* Performance: avoiding redrawing of points with same coords.
* Bugfix: colors taken not from original but sometimes adjacent points (with tolerance) when highlighting is getting removed.

## [0.0.2] - 2020-01-12
### Added
* Feature: panning (horizontal shifting of the plot) - desktop only (no touch events).

### Changed
* Performance: avoiding re-rendering of DOM elements when their content doesn't change.

## [0.0.1] - 2020-01-08
### Added
* Canvas-based playcount chart:
  * X axis: time.
  * Y axis: artist playcount.
  * Color: album playcount.
* Summary: period, total numbers.
* Colorized genres (both on the plot and on the legend).
* Highlighting on selection:
  * An info box with artist, album and track.
  * Scrobble datetime on the time axis.
  * Brighter color for all scrobbles of a given artist.
* Keyboard navigation (traversing the timeline with arrow keys).
* Zooming (horizontal stretching of the plot) - desktop only (no touch events).

Screenshot:

<p align="center">
  <a href="https://user-images.githubusercontent.com/2470363/72014656-9b2eb480-3260-11ea-9ad0-bd9377b0788d.png">
    <img width="720" alt="screenshot" src="https://user-images.githubusercontent.com/2470363/72014656-9b2eb480-3260-11ea-9ad0-bd9377b0788d.png" />
  </a>
</p>

First working prototype screenshot:

<p align="center">
  <a href="https://user-images.githubusercontent.com/2470363/70378960-5e9d2f80-1927-11ea-8367-de163c2d7862.png">
    <img width="720" alt="screenshot" src="https://user-images.githubusercontent.com/2470363/70378960-5e9d2f80-1927-11ea-8367-de163c2d7862.png" />
  </a>
</p>

## [0.0.0] - 2019-08-23
### Added
* A list of ideas.
* README, CHANGELOG and initial scaffolding.
