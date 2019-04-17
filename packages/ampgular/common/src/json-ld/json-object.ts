

export interface BaseObjectOptions {

}

export abstract class JsonObject<T> {

private _json: {};

constructor (options: T) {

    this._json = {...this._json, ...options};
}

get json() {
    return this._json;
}

}
