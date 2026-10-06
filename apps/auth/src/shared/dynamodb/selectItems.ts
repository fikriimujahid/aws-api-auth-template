import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { queryAllItems } from "./queryAllItems";
import { scanItems, ScanItemsResult } from "./scanItems";

export interface SelectItemsOptions {
  from: string;
  select?: string[];
  keyWhere?: Record<string, unknown>;
  keyBeginsWith?: Record<string, string>;
  where?: Record<string, SelectItemsWhereValue>;
}

export interface SelectItemsWhereOperator {
  eq?: unknown;
  lt?: unknown;
  lte?: unknown;
  gt?: unknown;
  gte?: unknown;
}

export type SelectItemsWhereValue = unknown | SelectItemsWhereOperator;

const FILTER_OPERATOR_MAP = {
  eq: "=",
  lt: "<",
  lte: "<=",
  gt: ">",
  gte: ">="
} as const;

type FilterOperatorKey = keyof typeof FILTER_OPERATOR_MAP;

const isFilterOperator = (
  value: SelectItemsWhereValue
): value is SelectItemsWhereOperator => {
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    return false;
  }

  const keys = Object.keys(value);

  return keys.length > 0
    && keys.every((key) => key in FILTER_OPERATOR_MAP);
};

const buildProjectionExpression = (
  columns: string[],
  attributeNames: Record<string, string>
): string | undefined => {
  if (columns.length === 0) {
    return undefined;
  }

  return columns
    .map((column, index) => {
      const token = `#select${index}`;
      attributeNames[token] = column;
      return token;
    })
    .join(", ");
};

const buildFilterExpression = (
  filters: Record<string, SelectItemsWhereValue>,
  attributeNames: Record<string, string>,
  attributeValues: Record<string, unknown>
): string | undefined => {
  const entries = Object.entries(filters);

  if (entries.length === 0) {
    return undefined;
  }

  return entries
    .flatMap(([column, value], index) => {
      const nameToken = `#where${index}`;

      attributeNames[nameToken] = column;

      if (isFilterOperator(value)) {
        return (Object.entries(value) as [FilterOperatorKey, unknown][]).map(
          ([operator, operatorValue]) => {
            const valueToken = `:where${index}${operator}`;

            attributeValues[valueToken] = operatorValue;

            return `${nameToken} ${FILTER_OPERATOR_MAP[operator]} ${valueToken}`;
          }
        );
      }

      const valueToken = `:where${index}`;

      attributeValues[valueToken] = value;

      return `${nameToken} = ${valueToken}`;
    })
    .join(" AND ");
};

const buildKeyConditionExpression = (
  filters: Record<string, unknown>,
  prefixFilters: Record<string, string>,
  attributeNames: Record<string, string>,
  attributeValues: Record<string, unknown>
): string | undefined => {
  const equalityEntries = Object.entries(filters);
  const prefixEntries = Object.entries(prefixFilters);

  if (equalityEntries.length === 0 && prefixEntries.length === 0) {
    return undefined;
  }

  const equalityExpressions = equalityEntries.map(([column, value], index) => {
      const nameToken = `#key${index}`;
      const valueToken = `:key${index}`;

      attributeNames[nameToken] = column;
      attributeValues[valueToken] = value;

      return `${nameToken} = ${valueToken}`;
    });

  const prefixExpressions = prefixEntries.map(([column, value], index) => {
    const nameToken = `#keyPrefix${index}`;
    const valueToken = `:keyPrefix${index}`;

    attributeNames[nameToken] = column;
    attributeValues[valueToken] = value;

    return `begins_with(${nameToken}, ${valueToken})`;
  });

  return [...equalityExpressions, ...prefixExpressions].join(" AND ");
};

export const selectItems = async <TItem extends Record<string, unknown>>(
  client: DynamoDBDocumentClient,
  options: SelectItemsOptions
): Promise<ScanItemsResult<TItem>> => {
  const attributeNames: Record<string, string> = {};
  const attributeValues: Record<string, unknown> = {};

  const projectionExpression = buildProjectionExpression(
    options.select ?? [],
    attributeNames
  );
  const keyConditionExpression = buildKeyConditionExpression(
    options.keyWhere ?? {},
    options.keyBeginsWith ?? {},
    attributeNames,
    attributeValues
  );
  const filterExpression = buildFilterExpression(
    options.where ?? {},
    attributeNames,
    attributeValues
  );

  if (keyConditionExpression) {
    const items = await queryAllItems<TItem>(client, {
      TableName: options.from,
      ProjectionExpression: projectionExpression,
      KeyConditionExpression: keyConditionExpression,
      FilterExpression: filterExpression,
      ExpressionAttributeNames: attributeNames,
      ExpressionAttributeValues: attributeValues
    });

    return {
      items,
      count: items.length
    };
  }

  return scanItems<TItem>(client, {
    TableName: options.from,
    ProjectionExpression: projectionExpression,
    FilterExpression: filterExpression,
    ExpressionAttributeNames:
      Object.keys(attributeNames).length > 0 ? attributeNames : undefined,
    ExpressionAttributeValues:
      Object.keys(attributeValues).length > 0 ? attributeValues : undefined
  });
};