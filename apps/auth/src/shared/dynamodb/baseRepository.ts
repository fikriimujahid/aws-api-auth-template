import { DynamoDBDocumentClient, GetCommandInput, QueryCommandInput, ScanCommandInput } from "@aws-sdk/lib-dynamodb";
import { createItem, CreateItemInput } from "./createItem";
import { deleteItem, DeleteItemInput } from "./deleteItem";
import { getItem } from "./getItem";
import { queryItems, QueryItemsResult } from "./queryItems";
import { scanItems, ScanItemsResult } from "./scanItems";
import { updateItem, UpdateItemInput } from "./updateItem";

export abstract class BaseRepository<
  TItem extends Record<string, unknown>,
  TKey extends Record<string, unknown>
> {
  constructor(
    protected readonly tableName: string,
    protected readonly client: DynamoDBDocumentClient
  ) {}

  create(item: TItem, input: Omit<CreateItemInput<TItem>, "TableName" | "Item"> = {}): Promise<TItem> {
    return createItem(this.client, {
      ...input,
      TableName: this.tableName,
      Item: item
    });
  }

  update(input: Omit<UpdateItemInput, "TableName">): Promise<TItem | undefined> {
    return updateItem<TItem>(this.client, {
      ...input,
      TableName: this.tableName
    });
  }

  delete(key: TKey, input: Omit<DeleteItemInput, "TableName" | "Key"> = {}): Promise<TItem | undefined> {
    return deleteItem<TItem>(this.client, {
      ...input,
      TableName: this.tableName,
      Key: key
    });
  }

  get(key: TKey, input: Omit<GetCommandInput, "TableName" | "Key"> = {}): Promise<TItem | undefined> {
    return getItem<TItem>(this.client, {
      ...input,
      TableName: this.tableName,
      Key: key
    });
  }

  query(input: Omit<QueryCommandInput, "TableName">): Promise<QueryItemsResult<TItem>> {
    return queryItems<TItem>(this.client, {
      ...input,
      TableName: this.tableName
    });
  }

  scan(input: Omit<ScanCommandInput, "TableName"> = {}): Promise<ScanItemsResult<TItem>> {
    return scanItems<TItem>(this.client, {
      ...input,
      TableName: this.tableName
    });
  }
}
