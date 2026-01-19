import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBService } from '../aws/dynamodb.service';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import {
  DashboardSummaryDto,
  MetricDto,
  WeeklyReportDto,
  ChartPointDto,
} from './dto/dashboard-response.dto';

@Injectable()
export class DashboardService {
  private readonly tableName: string;

  constructor(
    private configService: ConfigService,
    private dynamoDBService: DynamoDBService,
  ) {
    this.tableName = this.configService.getOrThrow<string>('AWS_DYNAMODB_HIST_TABLE_NAME');
  }

  async getSummary(catId: string): Promise<DashboardSummaryDto> {
    try {
      const items = await this.dynamoDBService.query({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: { ':pk': { S: catId } },
        ScanIndexForward: false,
        Limit: 7,
      });

      if (!items || items.length === 0) {
        return this.getEmptyState(catId);
      }

      const history = items.map((item) => unmarshall(item));
      const latestData = history[0];

      const riskAnalysis = this.analyzeRisk(latestData);
      const chartHistory = [...history].reverse(); 

      return {
        catId,
        status: riskAnalysis.level,
        updatedAt: new Date(latestData.SK),
        coverage: {
          totalDays: 7,
          daysWithData: history.length,
        },
        metrics: [
          this.buildMetric('weight', '체중 (kg)', chartHistory, (d) => d.basic_profile?.weight_kg),
          this.buildMetric('meal', '식사량 (회)', chartHistory, (d) => d.lifestyle?.daily_meal_count),
          this.buildMetric('water', '음수량', chartHistory, (d) => this.mapTextToScore(d.lifestyle?.water_intake)),
          this.buildMetric('activity', '활동량', chartHistory, (d) => this.mapTextToScore(d.lifestyle?.activity_level)),
        ],
        insights: riskAnalysis.insights,
        riskStatus: riskAnalysis.level !== 'safe' ? {
            level: riskAnalysis.level,
            description: riskAnalysis.message
        } : undefined
      };

    } catch (error) {
      console.error('Dashboard Summary Error:', error);
      throw new InternalServerErrorException('대시보드 데이터를 불러오지 못했습니다.');
    }
  }

  async getReports(catId: string): Promise<WeeklyReportDto[]> {
    return [
      {
        id: 'rep_01',
        rangeLabel: '최근 분석 리포트',
        summary: '데이터가 쌓이고 있습니다. 7일 후 정확한 리포트가 생성됩니다.',
        score: 85,
        status: 'safe',
      },
    ];
  }

  private getEmptyState(catId: string): DashboardSummaryDto {
    return {
      catId,
      status: 'safe',
      updatedAt: new Date(),
      coverage: { totalDays: 7, daysWithData: 0 },
      metrics: [],
      insights: ['아직 기록이 없습니다. 고양이 프로필을 등록해주세요!'],
    };
  }

  private mapTextToScore(value: string): number {
    if (!value) return 0;
    const upperValue = value.toUpperCase(); 

    switch (upperValue) {
        case 'HIGH': return 3;
        case 'NORMAL': return 2;
        case 'LOW': return 1;
        default: return 0;
    }
  }

  private buildMetric(
    id: string, 
    label: string, 
    history: any[], 
    valueExtractor: (data: any) => number
  ): MetricDto {
    const chartData: ChartPointDto[] = history.map(item => {
        const date = new Date(item.SK);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }); 
        return {
            x: dayName,
            y: Number(valueExtractor(item)) || 0
        };
    });

    const current = chartData[chartData.length - 1]?.y || 0;
    const prev = chartData[chartData.length - 2]?.y || 0;
    const changePercent = prev === 0 ? 0 : ((current - prev) / prev) * 100;

    return {
        id,
        label,
        changePercent: parseFloat(changePercent.toFixed(1)),
        trendLabel: changePercent > 0 ? '늘었어요' : changePercent < 0 ? '줄었어요' : '변화 없음',
        chartData
    };
  }

  private analyzeRisk(data: any) {
    let score = 100;
    const insights: string[] = [];
    let level = 'safe'; 

    const lifestyle = data.lifestyle || {};
    const medicalHistory = data.medical_history || [];

    const waterIntake = lifestyle.water_intake?.toUpperCase() || '';
    const activityLevel = lifestyle.activity_level?.toUpperCase() || '';

    // Check Water Intake
    if (waterIntake === 'LOW') {
        score -= 20;
        insights.push('최근 음수량이 부족합니다. 💧');
    }

    // Check Activity Level
    if (activityLevel === 'LOW') {
        score -= 10;
        insights.push('활동량이 떨어졌습니다. 낚싯대로 놀아주세요! 🎣');
    }

    // Check Kidney Issues + Water Intake
    const hasKidneyIssue = medicalHistory.some((h: any) => 
        h.category?.toUpperCase().includes('KIDNEY')
    );
    
    if (hasKidneyIssue) {
        score -= 20;
        insights.push('신장 관련 병력이 감지되었습니다.');
        
        if (waterIntake === 'LOW') {
            score -= 30;
            level = 'danger';
            insights.unshift('🚨 신장 질환 위험! 음수량 관리가 시급합니다.');
        }
    } 

    if (level !== 'danger') {
        if (score < 70) level = 'warning';
        else level = 'safe';
    }

    if (insights.length === 0) insights.push('아주 건강하게 관리되고 있어요! 👍');

    return { 
        score, 
        level, 
        message: insights[0], 
        insights 
    };
  }
}