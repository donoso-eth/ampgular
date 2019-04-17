import {
  JsonObject,
  JsonParseMode,
  Path,
  normalize,
  parseJson,
  virtualFs,
} from '@angular-devkit/core';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { concatMap, map, tap } from 'rxjs/operators';

export function loadJsonFile(
  path: Path,
  host: virtualFs.Host<{}>,
): Observable<JsonObject> {
  return host.read(normalize(path)).pipe(
    map(buffer => virtualFs.fileBufferToString(buffer)),
    map(str => (parseJson(str, JsonParseMode.Loose) as {}) as JsonObject),
  );
}

export function getRoutes(path: string): string[] {
  return require(path + '/ampgular/routes').ROUTES;
}
