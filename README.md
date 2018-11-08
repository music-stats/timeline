# music-timeline

  [![license][license-image]][license-url]
  ![code size][code-size-image]

Visualization of last.fm stats.

The idea is to collect all scrobbles for a given timeframe, slice by days (or weeks, months) into chunks, optionally group by artists and sort by tags (genres) inside each chunk. Then, map to pixels (colored according to tags) and place on a timeline, forming some kind of summary bar chart. Without grouping that might form an exact log of all scrobbles.

"Pixel" is a metaphoric term here, in fact there could be boxes of different height, depending on corresponding track duration. Those boxes could have some interaction, e.g. on hover reveals a tiny popup with metadata. Could also be a fixed info box, if a popup turns to be annoying. Another interactivity example - highlighting all scrobbles that relate to a hovered one (same track, album, artist or tag).

All that should aim to showcase the ratio between different aspects of how musical taste evolves (or prove that it doesn't).

```
// x-progression                   // y-progression

scrobbles                                     scrobbles
⌃                                  +---------->
|··········                        |●●········
|······●●··/------------⌝          |○○●·/------------⌝
|··●●·●●○●<  ♭ metadata |          |○●●<  ♭ metadata |
|·●○●●○○○●·\------------⌟          |●●··\------------⌟
|·●○○●○○○○·                        |○○●·······
+---------->                       ⌄
           t (days)                t (days)
```

## Tech stack

dev deps:
[`elm`](https://guide.elm-lang.org).

deps: TBD.

## APIs, datasets

last.fm:
- [ ] [`user.getTopArtists`](https://www.last.fm/api/show/user.getTopArtists) (pagination is fine)
- [ ] [`user.getArtistTracks`](https://www.last.fm/api/show/user.getArtistTracks) (pagination seems to be weird, always giving `"totalPages": "0"`)
- [ ] [`artist.getInfo`](https://www.last.fm/api/show/artist.getInfo) and [`track.getInfo`](https://www.last.fm/api/show/track.getInfo) (there are also `artist.getTags` and `track.getTags` endpoints but those simply return lists of tag names and URLs, while `.getInfo` also supplies tags plus additional data, e.g. track duration)

## Setup

### Environment variables

Create a `.env` file and fill its values according to [`.env.template`](.env.template):

* `LASTFM_API_KEY` (see last.fm [docs](https://www.last.fm/api/authentication))

### Commands

```bash
$ # TBD
```

## Scripts

TBD.

[license-image]: https://img.shields.io/github/license/oleksmarkh/music-timeline.svg?style=flat-square
[license-url]: https://github.com/oleksmarkh/music-timeline/blob/master/LICENSE
[code-size-image]: https://img.shields.io/github/languages/code-size/oleksmarkh/music-timeline.svg?style=flat-square
