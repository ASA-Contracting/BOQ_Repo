import type { ClientListItemDto } from "@/application/dto/client/clientDto";
import type { Client } from "@/domain/client/Client";

export function mapClientToListItemDto(client: Client): ClientListItemDto {
  return {
    id: client.id as number,
    name: client.name,
    abrdOwnerId: client.abrdOwnerId,
    externalSource: client.externalSource,
  };
}
