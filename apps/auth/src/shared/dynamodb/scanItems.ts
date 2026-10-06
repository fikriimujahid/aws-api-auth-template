import { DynamoDBDocumentClient, ScanCommand, ScanCommandInput } from "@aws-sdk/lib-dynamodb";

export interface ScanItemsResult<TItem extends Record<string, unknown>> {
  items: TItem[];
  count: number;
  lastEvaluatedKey?: Record<string, unknown>;
}

export const scanItems = async <TItem extends Record<string, unknown>>(
  client: DynamoDBDocumentClient,
  input: ScanCommandInput
): Promise<ScanItemsResult<TItem>> => {
  const response = await client.send(new ScanCommand(input));

  return {
    items: (response.Items ?? []) as TItem[],
    count: response.Count ?? 0,
    lastEvaluatedKey: response.LastEvaluatedKey as Record<string, unknown> | undefined
  };
};
