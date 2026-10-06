import { DynamoDBDocumentClient, QueryCommandInput } from "@aws-sdk/lib-dynamodb";
import { queryItems } from "./queryItems";

export const queryAllItems = async <TItem extends Record<string, unknown>>(
  client: DynamoDBDocumentClient,
  input: QueryCommandInput
): Promise<TItem[]> => {
  const items: TItem[] = [];
  let lastEvaluatedKey: Record<string, unknown> | undefined;

  do {
    const response = await queryItems<TItem>(client, {
      ...input,
      ExclusiveStartKey: lastEvaluatedKey
    });

    items.push(...response.items);
    lastEvaluatedKey = response.lastEvaluatedKey;
  } while (lastEvaluatedKey);

  return items;
};