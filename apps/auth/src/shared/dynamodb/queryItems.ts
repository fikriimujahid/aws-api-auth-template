import { DynamoDBDocumentClient, QueryCommand, QueryCommandInput } from "@aws-sdk/lib-dynamodb";

export interface QueryItemsResult<TItem extends Record<string, unknown>> {
  items: TItem[];
  count: number;
  lastEvaluatedKey?: Record<string, unknown>;
}

export const queryItems = async <TItem extends Record<string, unknown>>(
  client: DynamoDBDocumentClient,
  input: QueryCommandInput
): Promise<QueryItemsResult<TItem>> => {
  const response = await client.send(new QueryCommand(input));

  return {
    items: (response.Items ?? []) as TItem[],
    count: response.Count ?? 0,
    lastEvaluatedKey: response.LastEvaluatedKey as Record<string, unknown> | undefined
  };
};
