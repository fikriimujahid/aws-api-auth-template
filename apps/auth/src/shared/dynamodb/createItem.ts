import { DynamoDBDocumentClient, PutCommand, PutCommandInput } from "@aws-sdk/lib-dynamodb";

export interface CreateItemInput<TItem extends Record<string, unknown>>
  extends Omit<PutCommandInput, "Item"> {
  Item: TItem;
}

export const createItem = async <TItem extends Record<string, unknown>>(
  client: DynamoDBDocumentClient,
  input: CreateItemInput<TItem>
): Promise<TItem> => {
  await client.send(new PutCommand(input));
  return input.Item;
};
