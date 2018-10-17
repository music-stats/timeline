# music-timeline

Visualization of last.fm stats.

The idea is to collect all scrobbles for a given timeframe, slice by days (or weeks, months) into chunks, group by artists and sort by tags (genres) inside each chunk. Then, map to pixels (colored according to tags) and place on a timeline, forming some kind of summary bar chart.

That should aim to showcase the ratio between different tags over time.

```
^
|··········
|······●●··
|··●●·●●○●·
|·●○●●○○○●·
|·●○○●○○○○·
+---------->
           t (days)
```

## Tech stack

dev deps:
[`elm`](https://guide.elm-lang.org).

deps: TBD.

## APIs, datasets

last.fm:
- [ ] [`user.getTopArtists`](https://www.last.fm/api/show/user.getTopArtists) (pagination is fine)
- [ ] [`user.getArtistTracks`](https://www.last.fm/api/show/user.getArtistTracks) (pagination seems to be weird, always giving `"totalPages": "0"`)
- [ ] [`artist.getTags`](https://www.last.fm/api/show/artist.getTags)
- [ ] [`track.getTags`](https://www.last.fm/api/show/track.getTags)

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
