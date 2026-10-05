import type { components } from './schema.generated';

type Schemas = components['schemas'];

type DeepRequired<T> = T extends (infer U)[]
  ? DeepRequired<U>[]
  : T extends object
    ? { [K in keyof T]-?: DeepRequired<T[K]> }
    : T;

type Model<K extends keyof Schemas> = DeepRequired<Schemas[K]>;

/**
 * A response body, generated from the backend's OpenAPI spec (api/openapi.json, regenerated with
 * `npm run gen:api`). The backend sends every field, but the spec cannot say which ones may be
 * null, so fields are non-null unless listed: `Opt` may be missing, `Nul` may be null.
 */
export type ApiModel<
  K extends keyof Schemas,
  Opt extends keyof Model<K> = never,
  Nul extends keyof Model<K> = never,
> = Omit<Model<K>, Opt | Nul>
  & { [P in Opt]?: Model<K>[P] | (P extends Nul ? null : never) }
  & { [P in Exclude<Nul, Opt>]: Model<K>[P] | null };

type NullableOptional<T> = T extends (infer U)[]
  ? NullableOptional<U>[]
  : T extends object
    ? { [P in keyof T]: undefined extends T[P] ? NullableOptional<T[P]> | null : NullableOptional<T[P]> }
    : T;

/** A request body. Fields the backend does not require stay optional, and may be sent as null. */
export type ApiInput<K extends keyof Schemas> = NullableOptional<Schemas[K]>;
