# music-timeline

Visualization of last.fm stats.

The idea is to collect all scrobbles for a given timeframe, slice by days (or weeks, months) into chunks, group by artists and sort by tags (genres) inside each chunk. Then, map to pixels (colored according to tags) and place on a timeline, forming some kind of summary bar chart.

That should aim to showcase the ratio between different tags over time.

```
^
|      ••
|  •• ••••
| ••••••••
| ••••••••
+---------->
           t (days)
```
