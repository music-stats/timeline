# Ideas
There are many ways to show sliced data on a timeline. This file is meant to store drafts for some of them.

## Grouped timeline
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

## Waveform-like monthly stacks
Every vertical bar represents a month. Each bar is sliced by genres (tags) starting from the center and growing in both vertical directions. Genres need to be preliminary ordered to assure the same placement on every stack.

**Design sketch:**

<a href="https://user-images.githubusercontent.com/2470363/65829987-9b0b3a00-e2ab-11e9-8eac-ed497a2e7c03.jpg">
  <img width="320" src="https://user-images.githubusercontent.com/2470363/65829987-9b0b3a00-e2ab-11e9-8eac-ed497a2e7c03.jpg" />
</a>

## Artists progress chart
The example graph below shows 2 artists for simplicity, but there could be as many as data provides. Each line represents progress of the number of accumulative scrobbles for a given artist.

Vertical bars represent actual tracks played at certain dates and horizontal lines (supposed to be thin and only shown when an artist is highlighted) represent no scrobbles between those dates.

Selection and highlighting:

* A track could be highlighted (by clicking on it or selecting with arrow keys) and the same track becomes highlighted in all other places when it was scrobbled.
* Corresponding dates are also marked on the `t` axis, scrobble counters appear near highlighted points and `{artist} / {year} - "{album}" / "{song}"` caption appears below the chart.
* All songs from that album are highlighted with a pale version of the same color.
* All other songs from the given artist are also highlighted - even paler color is applied.

Keyboard support: arrow keys allow to navigate between days and scrobbles.

**Design sketch:**

<a href="https://user-images.githubusercontent.com/2470363/58372852-60237f00-7f24-11e9-9e55-f0ed29e98d1b.jpg">
  <img width="320" src="https://user-images.githubusercontent.com/2470363/58372852-60237f00-7f24-11e9-9e55-f0ed29e98d1b.jpg" />
</a>
