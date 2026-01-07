import { Injectable } from '@nestjs/common';
import { AwsService } from './aws.service';
import {
  PutItemCommand,
  GetItemCommand,
  AttributeValue,
} from '@aws-sdk/client-dynamodb';

@Injectable()
export class DynamoDBService {
  constructor(private readonly awsService: AwsService) {}

  async putItem(
    tableName: string,
    item: Record<string, AttributeValue>,
  ) {
    const command = new PutItemCommand({
      TableName: tableName,
      Item: item,
    });
    return this.awsService.dynamodb.send(command);
  }

  async getItem(
    tableName: string,
    key: Record<string, AttributeValue>,
  ) {
    const command = new GetItemCommand({
      TableName: tableName,
      Key: key,
    });
    const result = await this.awsService.dynamodb.send(command);
    return result.Item;
  }
}
