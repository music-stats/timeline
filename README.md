# music-stats timeline

  [![license][license-image]][license-url]
  ![code size][code-size-image]

Visualization of last.fm stats.

The idea is to collect all scrobbles for a given timeframe, slice by days (or weeks, months) into chunks,
optionally group by artists and sort by tags (genres) inside each chunk.
Then, map to pixels (colored according to tags) and place on a timeline, forming some kind of summary bar chart.

Without grouping, that might form an exact log of all scrobbles. Speaking of which,
not only a bar chart is potentially interesting - another form is "playtime timeline within daily timeline", showing exact minutes with music on, for each day.
Basically, stripping silent time out leads to a stacked bar chart :)
And keeping it there means exact visualization of listening habits in terms of time.

"Pixel" is a metaphoric term here, in fact there could be boxes of different height,
depending on corresponding track duration. Those boxes could have some interaction,
e.g. on hover reveals a tiny popup with metadata. Could also be a fixed info box, if a popup turns to be annoying.

```
// x-progression                   // y-progression

scrobbles
⌃                                  +----------> scrobbles
|··········                        |●●········
|······●●··/------------⌝          |○○●·/------------⌝
|··●●·●●○●<  ♭ metadata |          |○●●<  ♭ metadata |
|·●○●●○○○●·\------------⌟          |●●··\------------⌟
|·●○○●○○○○·                        |○○●·······
+----------> t (days)              ⌄
                                   t (days)
```

Another interactivity example - highlighting all scrobbles that relate to a hovered one (same track, album, artist or tag).
The UI could also contain a list of tags below the timeline (genres, countries) - clicking a tag
will lead to highlighting all scrobbles that belong to that tag.
Tags should be sorted (descending order) according to number of related scrobbles.

With genres and scrobbles it can become a bit more complicated than a simple "one-to-many" relation,
because sub-genres are somewhat nested, i.e. expressed as a tree:

```
                  metal
                  |  |
         folk metal  ...
            |  |  |
medieval metal |  |
     viking metal |
        slavonic heathen metal
```

It can become even more convoluted if some exotic intersections appear, like "jazz-punk" or whatever :)
Genre correctness is an interesting problem of its own - some bands stay consistent and some keep changing, effectively meaning that tags could be assigned to individual releases.

There's also a notable UX challenge when it comes to timelines. Some questions to address:
* How to control the timeframe that defines what's visible on a single screen?
* Should there be a preview (minimap) telling a user that highlighted items could be also found outside of the visible area?
* Whether to tight the timeline state to URL, enabling shareable URLs?

All that should aim to showcase the ratio between different aspects of how musical taste evolves (or prove that it doesn't).

## Tech stack

dev deps: TBD.

deps: TBD.

## Setup commands

```bash
$ # TBD
```

[license-image]: https://img.shields.io/github/license/music-stats/timeline.svg?style=flat-square
[license-url]: https://github.com/music-stats/timeline/blob/master/LICENSE
[code-size-image]: https://img.shields.io/github/languages/code-size/music-stats/timeline.svg?style=flat-square
