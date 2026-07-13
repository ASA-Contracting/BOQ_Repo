export type { Client, NewClient } from "@/domain/client/Client";
export { CLIENT_NAME_MAX_LENGTH } from "@/domain/client/constants";
export { toClientId, type ClientId } from "@/domain/client/ids";
export type {
  AbrdClientImportInput,
  ClientListQuery,
  ClientListResult,
  IClientRepository,
} from "@/domain/client/repositories/IClientRepository";
