import { Injectable, Logger } from '@nestjs/common';
import { AwsService } from './aws.service';
import {
  PutItemCommand,
  GetItemCommand,
  QueryCommand,
  QueryCommandInput,
  UpdateItemCommand,
  UpdateItemCommandInput,
  DeleteItemCommand,
  AttributeValue,
} from '@aws-sdk/client-dynamodb';

@Injectable()
export class DynamoDBService {
  private readonly logger = new Logger(DynamoDBService.name);

  constructor(private readonly awsService: AwsService) { }

  async putItem(
    tableName: string,
    item: Record<string, AttributeValue>,
  ) {
    this.logger.log(`[PUT] Table: ${tableName}, PK: ${item.PK?.S || 'N/A'}, SK: ${item.SK?.S || 'N/A'}`);

    const command = new PutItemCommand({
      TableName: tableName,
      Item: item,
    });

    try {
      const result = await this.awsService.dynamodb.send(command);
      this.logger.log(`[PUT] Success`);
      return result;
    } catch (error) {
      this.logger.error(`[PUT] Failed - Error: ${error}`);
      throw error;
    }
  }

  async getItem(
    tableName: string,
    key: Record<string, AttributeValue>,
  ) {
    this.logger.log(`[GET] Table: ${tableName}, Key: ${JSON.stringify(key)}`);

    const command = new GetItemCommand({
      TableName: tableName,
      Key: key,
    });

    try {
      const result = await this.awsService.dynamodb.send(command);
      this.logger.log(`[GET] Success - Found: ${!!result.Item}`);
      return result.Item;
    } catch (error) {
      this.logger.error(`[GET] Failed - Error: ${error}`);
      throw error;
    }
  }

  async query(params: QueryCommandInput) {
    const stack = new Error().stack?.split('\n').slice(2, 5).join(' <- ') || '';
    this.logger.log(`[QUERY] Table: ${params.TableName}, KeyCondition: ${params.KeyConditionExpression}`);
    this.logger.log(`[QUERY] Caller: ${stack}`);

    const command = new QueryCommand(params);

    try {
      const result = await this.awsService.dynamodb.send(command);
      this.logger.log(`[QUERY] Success - Count: ${result.Items?.length || 0}`);
      return result.Items;
    } catch (error) {
      this.logger.error(`[QUERY] Failed - Error: ${error}`);
      throw error;
    }
  }

  async updateItem(params: UpdateItemCommandInput) {
    this.logger.log(`[UPDATE] Table: ${params.TableName}, Key: ${JSON.stringify(params.Key)}, Expression: ${params.UpdateExpression}`);

    const command = new UpdateItemCommand(params);

    try {
      const result = await this.awsService.dynamodb.send(command);
      this.logger.log(`[UPDATE] Success`);
      return result;
    } catch (error) {
      this.logger.error(`[UPDATE] Failed - Error: ${error}`);
      throw error;
    }
  }

  async deleteItem(
    tableName: string,
    key: Record<string, AttributeValue>,
  ) {
    this.logger.log(`[DELETE] Table: ${tableName}, Key: ${JSON.stringify(key)}`);

    const command = new DeleteItemCommand({
      TableName: tableName,
      Key: key,
    });

    try {
      const result = await this.awsService.dynamodb.send(command);
      this.logger.log(`[DELETE] Success`);
      return result;
    } catch (error) {
      this.logger.error(`[DELETE] Failed - Error: ${error}`);
      throw error;
    }
  }
}
