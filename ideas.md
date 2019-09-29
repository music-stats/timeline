# Other ideas

There are many ways to show sliced data on a timeline. This file is meant to store drafts for some of them.

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
