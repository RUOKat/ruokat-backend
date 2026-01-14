import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import {
  DashboardSummaryDto,
  MetricDto,
  WeeklyReportDto,
  ChartPointDto,
} from './dto/dashboard-response.dto';

@Injectable()
export class DashboardService {
  private readonly client: DynamoDBClient;
  private readonly tableName: string;

  constructor(private configService: ConfigService) {
    this.client = new DynamoDBClient({
      region: this.configService.get('AWS_DYNAMODB_REGION'),
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
    // TypeScript 에러 방지를 위해 getOrThrow 사용
    this.tableName = this.configService.getOrThrow<string>('AWS_DYNAMODB_TABLE_NAME');
  }

  // 1. 대시보드 메인 요약 (Real Data)
  async getSummary(catId: string): Promise<DashboardSummaryDto> {
    try {
      // A. DynamoDB에서 최근 7개 데이터 조회 (차트용)
      const command = new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: { ':pk': { S: catId } },
        ScanIndexForward: false, // 내림차순 (최신순)
        Limit: 7, // 최근 7개 기록
      });

      const { Items } = await this.client.send(command);

      // 데이터가 아예 없을 경우 (신규 고양이)
      if (!Items || Items.length === 0) {
        return this.getEmptyState(catId);
      }

      // B. 데이터 변환 (Dynamo JSON -> JS Object)
      // 최신순으로 정렬되어 있으므로 [0]이 가장 최신
      const history = Items.map((item) => unmarshall(item));
      const latestData = history[0]; // 가장 최신 상태

      // C. 리스크 분석 실행
      const riskAnalysis = this.analyzeRisk(latestData);

      // D. 차트 데이터 가공 (과거 -> 현재 순으로 뒤집기)
      const chartHistory = [...history].reverse(); 

      return {
        catId,
        status: riskAnalysis.level, // safe, warning, danger
        updatedAt: new Date(latestData.SK), // 최근 측정일
        coverage: {
          totalDays: 7,
          daysWithData: history.length,
        },
        metrics: [
          this.buildMetric('weight', '체중 (kg)', chartHistory, (d) => d.basic_profile?.weight_kg),
          this.buildMetric('meal', '식사량 (회)', chartHistory, (d) => d.lifestyle?.daily_meal_count),
          // String 데이터(음수량 등)는 점수화해서 차트에 표현
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

  // 2. 주간 리포트 (아직 데이터가 부족하므로 Mock 유지)
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

  // ---------------------------------------------------------
  // 🛠️ Private Helper Methods
  // ---------------------------------------------------------

  // 빈 상태 리턴
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

  // 🛠️ [수정됨] 텍스트 데이터를 차트용 숫자로 변환 (대소문자 무시)
  private mapTextToScore(value: string): number {
    if (!value) return 0;
    const upperValue = value.toUpperCase(); // low -> LOW 변환

    switch (upperValue) {
        case 'HIGH': return 3;
        case 'NORMAL': return 2;
        case 'LOW': return 1;
        default: return 0;
    }
  }

  // 메트릭 객체 생성기
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

  // 🛠️ [수정됨] 리스크 분석 로직 (대소문자 무시 & 안전한 접근)
  private analyzeRisk(data: any) {
    let score = 100;
    const insights: string[] = [];
    let level = 'safe'; 

    const lifestyle = data.lifestyle || {};
    const medicalHistory = data.medical_history || [];

    // 데이터를 대문자로 변환해서 비교 (안전장치)
    const waterIntake = lifestyle.water_intake?.toUpperCase() || '';
    const activityLevel = lifestyle.activity_level?.toUpperCase() || '';

    // [규칙 1] 음수량 체크
    if (waterIntake === 'LOW') {
        score -= 20;
        insights.push('최근 음수량이 부족합니다. 💧');
    }

    // [규칙 2] 활동량 체크
    if (activityLevel === 'LOW') {
        score -= 10;
        insights.push('활동량이 떨어졌습니다. 낚싯대로 놀아주세요! 🎣');
    }

    // [규칙 3] 신장 질환 + 음수량 부족 = 위험
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

    // 점수에 따른 레벨 조정
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