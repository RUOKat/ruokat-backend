// 데일리 기록 질문 (1차 확정)
// 고정 체크 항목 5가지: 식사량, 음수량, 체중, 배변량, 배뇨량
export const CARE_QUESTIONS = {
  onboarding: {
    // 1. 식사량
    q1_food_intake: {
      id: "q1_food_intake",
      text: "오늘 식사량은 어땠나요?",
      description: "평소 식사량과 비교해서 선택해주세요.",
      type: "single",
      options: [
        { value: "none", label: "안 먹음", score: 3 },
        { value: "less", label: "평소보다 적게", score: 1 },
        { value: "normal", label: "평소만큼", score: 0 },
        { value: "more", label: "평소보다 많이", score: 1 }
      ],
      category: "DAILY"
    },
    // 2. 음수량
    q2_water_intake: {
      id: "q2_water_intake",
      text: "오늘 물은 얼마나 마셨나요?",
      description: "평소 음수량과 비교해서 선택해주세요.",
      type: "single",
      options: [
        { value: "none", label: "거의 안 마심", score: 3 },
        { value: "less", label: "평소보다 적음", score: 1 },
        { value: "normal", label: "평소 수준", score: 0 },
        { value: "more", label: "평소보다 많음", score: 1 }
      ],
      category: "DAILY"
    },
    // 3. 체중 (숫자 입력)
    q3_weight: {
      id: "q3_weight",
      text: "오늘 체중을 입력해주세요 (kg)",
      description: "소숫점 2자리까지 입력 가능해요. (예: 4.25)",
      type: "number",
      options: [],
      category: "DAILY",
      validation: {
        min: 0.1,
        max: 30,
        step: 0.01
      }
    },
    // 4. 배변량
    q4_poop: {
      id: "q4_poop",
      text: "오늘 배변 상태는 어땠나요?",
      description: "배변량과 상태를 선택해주세요.",
      type: "single",
      options: [
        { value: "none", label: "없음", score: 2 },
        { value: "diarrhea", label: "설사", score: 3 },
        { value: "less", label: "평소보다 적게", score: 1 },
        { value: "normal", label: "평소만큼", score: 0 },
        { value: "more", label: "평소보다 많이", score: 1 }
      ],
      category: "DAILY"
    },
    // 5. 배뇨량
    q5_urine: {
      id: "q5_urine",
      text: "오늘 배뇨량은 어땠나요?",
      description: "평소 배뇨량과 비교해서 선택해주세요.",
      type: "single",
      options: [
        { value: "none", label: "없음", score: 3 },
        { value: "less", label: "평소보다 적게", score: 1 },
        { value: "normal", label: "평소만큼", score: 0 },
        { value: "more", label: "평소보다 많이", score: 1 }
      ],
      category: "DAILY"
    }
  },
  followUp: {
    // followUp은 현재 사용하지 않음 (빈 객체)
    DAILY: []
  }
};

/* ============================================
 * 기존 온보딩/진단 질문 (주석 처리)
 * ============================================
export const CARE_QUESTIONS_OLD = {
  onboarding: {
    q1_urinary_male: {
      id: "q1_urinary_male",
      text: "화장실에서 소변 볼 때 평소보다 오래 앉아 있거나 힘들어하는 것 같나요?",
      description: "수컷 고양이는 요로 문제에 취약할 수 있어서 확인해요.",
      type: "single",
      options: [
        { value: "never", label: "전혀 없어요", score: 0 },
        { value: "rarely", label: "가끔 그래요", score: 1 },
        { value: "often", label: "자주 그래요", score: 2 },
        { value: "unknown", label: "잘 모르겠어요", score: 0 }
      ],
      category: "FLUTD"
    },
    q1_urinary_general: {
      id: "q1_urinary_general",
      text: "최근 화장실 사용 횟수나 패턴에 변화가 있었나요?",
      description: "화장실 습관 변화는 건강 상태의 중요한 지표예요.",
      type: "single",
      options: [
        { value: "same", label: "똑같아요", score: 0 },
        { value: "more", label: "더 자주 가요", score: 1 },
        { value: "less", label: "덜 가요", score: 1 },
        { value: "unknown", label: "잘 모르겠어요", score: 0 }
      ],
      category: "FLUTD"
    },
    q2_water_senior: {
      id: "q2_water_senior",
      text: "물을 마시는 양이 예전보다 늘었다고 느끼시나요?",
      description: "7살 이상 고양이는 신장 건강을 주의 깊게 봐야 해요.",
      type: "single",
      options: [
        { value: "same", label: "비슷해요", score: 0 },
        { value: "little_more", label: "조금 늘었어요", score: 1 },
        { value: "much_more", label: "많이 늘었어요", score: 2 },
        { value: "unknown", label: "잘 모르겠어요", score: 0 }
      ],
      category: "CKD"
    },
    q2_water_general: {
      id: "q2_water_general",
      text: "하루에 물을 얼마나 마시는 것 같나요?",
      description: "물 섭취량은 전반적인 건강 상태를 알려줘요.",
      type: "single",
      options: [
        { value: "little", label: "적게 마셔요", score: 1 },
        { value: "normal", label: "적당히 마셔요", score: 0 },
        { value: "much", label: "많이 마셔요", score: 1 },
        { value: "unknown", label: "잘 모르겠어요", score: 0 }
      ],
      category: "CKD"
    },
    q3_vomiting: {
      id: "q3_vomiting",
      text: "최근 2주 동안 구토한 적이 있나요?",
      description: "가끔 털 토는 건 정상이에요. 빈도가 중요해요.",
      type: "single",
      options: [
        { value: "none", label: "없어요", score: 0 },
        { value: "once", label: "1-2번", score: 0 },
        { value: "weekly", label: "주 1회 이상", score: 2 },
        { value: "daily", label: "거의 매일", score: 3 }
      ],
      category: "GI"
    },
    q4_mobility_senior: {
      id: "q4_mobility_senior",
      text: "높은 곳으로 뛰어오르거나 계단 오르는 걸 피하는 것 같나요?",
      description: "나이가 들면 관절이 불편할 수 있어요.",
      type: "single",
      options: [
        { value: "no", label: "아니요, 잘 뛰어요", score: 0 },
        { value: "sometimes", label: "가끔 주저해요", score: 1 },
        { value: "often", label: "자주 피해요", score: 2 },
        { value: "unknown", label: "잘 모르겠어요", score: 0 }
      ],
      category: "PAIN"
    },
    q4_activity_general: {
      id: "q4_activity_general",
      text: "평소 활동량은 어떤 편인가요?",
      description: "갑작스러운 활동량 변화가 있다면 체크해볼 필요가 있어요.",
      type: "single",
      options: [
        { value: "active", label: "활발해요", score: 0 },
        { value: "normal", label: "보통이에요", score: 0 },
        { value: "lazy", label: "조용한 편이에요", score: 0 },
        { value: "decreased", label: "최근 줄었어요", score: 2 }
      ],
      category: "PAIN"
    },
    q5_appetite: {
      id: "q5_appetite",
      text: "최근 식욕에 변화가 있었나요?",
      description: "식욕 변화는 여러 건강 문제의 초기 신호일 수 있어요.",
      type: "single",
      options: [
        { value: "same", label: "똑같아요", score: 0 },
        { value: "increased", label: "더 먹어요", score: 1 },
        { value: "decreased", label: "덜 먹어요", score: 2 },
        { value: "picky", label: "까다로워졌어요", score: 1 }
      ],
      category: "GI"
    }
  },
  followUp: {
    FLUTD: [
      {
        id: "fu_flutd_1",
        text: "배단 시 울음소리를 내거나 불편해 보이나요?",
        description: "배단 시 통증은 요로 문제의 중요한 신호예요.",
        type: "single",
        options: [
          { value: "yes", label: "예", score: 2 },
          { value: "no", label: "아니오", score: 0 },
          { value: "unknown", label: "모름", score: 0 }
        ],
        category: "FLUTD"
      },
      {
        id: "fu_flutd_2",
        text: "소변 색이 진하거나 피가 섞인 것 같나요?",
        description: "소변 색 변화는 주의가 필요해요.",
        type: "single",
        options: [
          { value: "yes", label: "예", score: 2 },
          { value: "no", label: "아니오", score: 0 },
          { value: "unknown", label: "모름", score: 0 }
        ],
        category: "FLUTD"
      },
      {
        id: "fu_flutd_3",
        text: "화장실에 자주 가는데 소변량이 적은 것 같나요?",
        description: "빈단은 방광 문제의 신호일 수 있어요.",
        type: "single",
        options: [
          { value: "none", label: "없어요", score: 0 },
          { value: "slight", label: "약간", score: 1 },
          { value: "clear", label: "뚜렷함", score: 2 },
          { value: "unknown", label: "모름", score: 0 }
        ],
        category: "FLUTD"
      }
    ],
    CKD: [
      {
        id: "fu_ckd_1",
        text: "물 섭취량이 눈에 띄게 증가했나요?",
        description: "다음다단는 신장 문제의 초기 신호일 수 있어요.",
        type: "single",
        options: [
          { value: "none", label: "없어요", score: 0 },
          { value: "slight", label: "약간", score: 1 },
          { value: "clear", label: "뚜렷함", score: 2 },
          { value: "unknown", label: "모름", score: 0 }
        ],
        category: "CKD"
      },
      {
        id: "fu_ckd_2",
        text: "배단 횟수나 소변량이 증가했나요?",
        description: "소변량 증가는 신장 기능과 관련있어요.",
        type: "single",
        options: [
          { value: "none", label: "없어요", score: 0 },
          { value: "slight", label: "약간", score: 1 },
          { value: "clear", label: "뚜렷함", score: 2 },
          { value: "unknown", label: "모름", score: 0 }
        ],
        category: "CKD"
      },
      {
        id: "fu_ckd_3",
        text: "체중이 감소한 것 같나요?",
        description: "원인 모를 체중 감소는 확인이 필요해요.",
        type: "single",
        options: [
          { value: "none", label: "없어요", score: 0 },
          { value: "slight", label: "약간", score: 1 },
          { value: "clear", label: "뚜렷함", score: 2 },
          { value: "unknown", label: "모름", score: 0 }
        ],
        category: "CKD"
      }
    ],
    GI: [
      {
        id: "fu_gi_1",
        text: "최근 2주 내 구토가 주 1회 이상 있었나요?",
        description: "잦은 구토는 소화기 문제일 수 있어요.",
        type: "single",
        options: [
          { value: "yes", label: "예", score: 2 },
          { value: "no", label: "아니오", score: 0 },
          { value: "unknown", label: "모름", score: 0 }
        ],
        category: "GI"
      },
      {
        id: "fu_gi_2",
        text: "묽은 변의 빈도는 어떤가요?",
        description: "설사 빈도로 소화기 상태를 파악해요.",
        type: "single",
        options: [
          { value: "rarely", label: "드물게", score: 0 },
          { value: "sometimes", label: "가끔", score: 1 },
          { value: "often", label: "자주", score: 2 },
          { value: "daily", label: "거의 매일", score: 3 },
          { value: "unknown", label: "모름", score: 0 }
        ],
        category: "GI"
      },
      {
        id: "fu_gi_3",
        text: "식욕이 감소했나요?",
        description: "식욕 저하는 다양한 문제의 신호예요.",
        type: "single",
        options: [
          { value: "none", label: "없어요", score: 0 },
          { value: "slight", label: "약간", score: 1 },
          { value: "clear", label: "뚜렷함", score: 2 },
          { value: "unknown", label: "모름", score: 0 }
        ],
        category: "GI"
      }
    ],
    PAIN: [
      {
        id: "fu_pain_1",
        text: "점프나 계단을 피하는 것 같나요?",
        description: "움직임 회피는 관절 불편의 신호예요.",
        type: "single",
        options: [
          { value: "none", label: "없어요", score: 0 },
          { value: "slight", label: "약간", score: 1 },
          { value: "clear", label: "뚜렷함", score: 2 },
          { value: "unknown", label: "모름", score: 0 }
        ],
        category: "PAIN"
      },
      {
        id: "fu_pain_2",
        text: "그루밍이 줄었거나 만지면 싫어하나요?",
        description: "자가 관리 변화는 불편함의 신호일 수 있어요.",
        type: "single",
        options: [
          { value: "yes", label: "예", score: 2 },
          { value: "no", label: "아니오", score: 0 },
          { value: "unknown", label: "모름", score: 0 }
        ],
        category: "PAIN"
      },
      {
        id: "fu_pain_3",
        text: "숨는 시간이 늘었나요?",
        description: "고양이는 아프면 숨으려는 경향이 있어요.",
        type: "single",
        options: [
          { value: "none", label: "없어요", score: 0 },
          { value: "slight", label: "약간", score: 1 },
          { value: "clear", label: "뚜렷함", score: 2 },
          { value: "unknown", label: "모름", score: 0 }
        ],
        category: "PAIN"
      }
    ]
  }
};
*/
