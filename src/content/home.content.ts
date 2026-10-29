// 화면 문구 원본: docs/spec/content.json (Figma 라이트 시안). 문구를 바꿀 때는 사용자 확인 후 두 파일을 함께 고친다.
// \n은 Figma의 수동 줄바꿈이다. pc/mobile 값이 나뉜 문구는 BreakText로 그린다.
// 초안(사용자 확인 필요): meta, hero.device.screens[].alt, waitlistDialog.submitting · errors, a11y
export const homeContent = {
  meta: {
    title: "세이블리 — 직접 적으며 소비를 돌아보는 가계부",
    description:
      "하루 한 번 적고 마감하는 작은 습관으로 나와 가족의 소비를 함께 돌아봐요. 세이블리 출시 알림을 신청하세요.",
  },
  gnb: {
    menu: [
      {
        label: "소개",
        target: "#empathy",
      },
    ],
    cta: "출시 알림 신청",
  },
  hero: {
    eyebrow: "직접 적으며 소비를 돌아보는 가계부",
    title: {
      pc: "오늘의 기록이 습관이 되고,\n그 습관이 인생을 바꿉니다",
      mobile: "오늘의 기록이\n습관이 되고,\n그 습관이\n인생을 바꿉니다",
    },
    desc: "하루 한 번 적고 마감하는 작은 습관으로\n나와 가족의 소비를 함께 돌아봐요.",
    cta: "출시 알림 신청",
    note: "iOS · Android로 출시될 예정이에요",
    device: {
      screens: [
        {
          label: "홈 · 오늘의 기록",
          image: "savely_light_01_home.png",
          alt: "세이블리 앱 홈 화면 — 오늘 기록 전 상태와 이번 달 소비 요약, 목표 진행률",
        },
        {
          label: "기록 작성",
          image: "savely_light_02_record_input.png",
          alt: "세이블리 기록 작성 화면 — 카테고리, 금액, 지출 이유를 입력",
        },
        {
          label: "달력 · 정산 도장",
          image: "savely_light_03_calendar.png",
          alt: "세이블리 달력 화면 — 정산을 마친 날에 도장이 찍힌 10월 달력",
        },
        {
          label: "하루 기록 상세",
          image: "savely_light_04_day_detail.png",
          alt: "세이블리 하루 기록 상세 화면 — 정산 완료와 기록 3건",
        },
        {
          label: "AI 리포트",
          image: "savely_light_05_report.png",
          alt: "세이블리 AI 리포트 화면 — 이번 달 총지출과 주차별 지출 추이",
        },
      ],
    },
  },
  empathy: {
    id: "empathy",
    eyebrow: "이런 적 있으신가요",
    title: "가계부, 써 봤는데\n달라진 게 없었다면",
    bubbles: [
      "명세서를 봐도 뭘 샀는지 기억나지 않아요",
      "월말 카드값은 늘 생각보다 많아요",
      "그래프는 봤는데, 그다음을 모르겠어요",
    ],
    closing: {
      pc: "몇 번을 다시 시작해도 몇 주를 넘기기 어려웠다면,\n의지의 문제가 아닐 수 있어요.",
      mobile:
        "몇 번을 다시 시작해도\n몇 주를 넘기기 어려웠다면,\n의지의 문제가 아닐 수 있어요.",
    },
    typing: "•  •  •",
  },
  problem: {
    id: "problem",
    eyebrow: "문제는",
    title: {
      pc: "모르는 사이에 같은 한 달이 반복돼요",
      mobile: "모르는 사이에\n같은 한 달이\n반복돼요",
    },
    desc: "돈을 몰라서가 아니라, 돌아볼 틈이 없어서예요.",
    steps: [
      {
        title: "쓰고",
        desc: "결제는 터치\n한 번이면 끝나요",
      },
      {
        title: "잊고",
        desc: "작은 결제는 금방\n기억에서 사라져요",
      },
      {
        title: "놀라고",
        desc: "월말 명세서에서야\n합계를 봐요",
      },
      {
        title: "반복하고",
        desc: "무엇을 바꿀지 모른 채\n다음 달이 시작돼요",
      },
    ],
    repeat: "점검이 빠지면 이 흐름이 매달 반복돼요",
    example: {
      label: "그 사이 작은 지출이 쌓이면 (예시)",
      items: [
        {
          label: "하루",
          value: "5,000원",
        },
        {
          label: "한 달",
          value: "150,000원",
        },
        {
          label: "1년",
          value: "1,825,000원",
          emphasis: true,
        },
      ],
      note: "30일 · 365일 기준으로 단순 계산했어요.",
    },
  },
  literacy: {
    id: "literacy",
    eyebrow: "그래서 중요한 것",
    title: {
      pc: "금융 문해력이 왜 중요할까요",
      mobile: "금융 문해력이\n왜 중요할까요",
    },
    desc: {
      pc: "아는 것뿐 아니라, 챙기는 습관까지가 금융 문해력이에요",
      mobile: "아는 것뿐 아니라,\n챙기는 습관까지가 금융 문해력이에요",
    },
    stats: [
      {
        label: "돈에 대해 아는 것",
        value: "73.6",
        unit: "점",
        desc: "OECD 평균(66.9점)보다 높아요.",
        tooltip: "금융 지식 영역 점수예요. (OECD 평균 66.9점)",
      },
      {
        label: "미래를 대비하는 태도",
        value: "53.7",
        unit: "점",
        desc: "OECD 평균(58.0점)보다 낮아요.",
        tooltip: "미래 대비와 관련된 금융 태도 점수예요. (OECD 평균 58.0점)",
      },
      {
        label: "평소 내 돈 상황을 점검하는 습관",
        value: "43.4",
        unit: "점",
        desc: "절반에도 못 미쳐요.\n알고 있어도 꾸준히 챙기기는 쉽지 않아요.",
        tooltip: "금융 행위 영역의 세부 항목 ‘평소 재무 상황 점검’ 점수예요.",
      },
    ],
    tooltipSource:
      "출처: 한국은행 · 금융감독원 「2024 전국민 금융이해력 조사」 (2025.4.29 발표)",
    quote: {
      title: "금융문해력이란?",
      text: "“올바른 금융 결정을 내리고 결국 나의 금융 웰빙을 이루기 위해 필요한 인식, 지식, 기술, 태도, 행동을 모두 합한 것”",
      cite: "OECD/INFE (2020) · 번역 가안",
    },
    source:
      "출처: 한국은행 · 금융감독원 「2024 전국민 금융이해력 조사」(2025.4.29 발표) · OECD/INFE (2020)",
  },
  solution: {
    id: "solution",
    eyebrow: "해결책은 세이블리",
    title: {
      pc: "점검을 습관으로 만드는 가계부, 세이블리",
      mobile: "점검을 습관으로\n만드는 가계부,\n세이블리",
    },
    desc: {
      pc: "적고, 마감하고, 돌아보는 하루 한 번의 정리로 아는 것을 습관으로 바꿔요.",
      mobile:
        "적고, 마감하고, 돌아보는 하루 한 번의 정리로\n아는 것을 습관으로 바꿔요.",
    },
    steps: [
      {
        no: "01",
        title: "쓴 돈을 직접 적어요",
        desc: "자동으로 불러오지 않고 직접 적기 때문에, 쓰는 순간을 한 번 더 생각하게 돼요.",
        image: "savely_light_02_record_input.png",
      },
      {
        no: "02",
        title: "하루를 돌아보고 마감해요",
        desc: "정해 둔 정산 시간이 되면 오늘 기록을 확인하고 마감해요. 얼마를 썼고 어디에 많이 썼는지 바로 보여요.",
        image: "savely_light_03_calendar.png",
      },
      {
        no: "03",
        title: "쌓인 기록에서 내 습관을 발견해요",
        desc: "이번 달 어디에 많이 썼는지, 지난달과 무엇이 달라졌는지, 어떤 기분일 때 지갑이 열렸는지 리포트로 알려드려요.",
        image: "savely_light_05_report.png",
      },
    ],
  },
  reward: {
    id: "reward",
    eyebrow: "습관이 되도록",
    title: {
      pc: "매일의 마감이, 쓸 수 있는 포인트로 쌓여요",
      mobile: "매일의 마감이,\n쓸 수 있는 포인트로\n쌓여요",
    },
    desc: {
      pc: "꾸준히 마감할수록 포인트가 쌓이고, 쌓인 포인트가 내일 다시 기록할 이유가 돼요.",
      mobile:
        "꾸준히 마감할수록 포인트가 쌓이고,\n쌓인 포인트가 내일 다시 기록할 이유가 돼요.",
    },
    loop: ["적고", "마감하고", "포인트 받고", "내일 또 적고"],
    loopBadge: "+P",
    cards: [
      {
        title: "마감할 때마다",
        desc: "하루 기록을 마감하면\n세이블리 포인트가 쌓여요.",
      },
      {
        title: "꾸준할수록 더",
        desc: "한 주를 빠짐없이 채우면\n보너스 포인트가 더해져요.",
      },
      {
        title: "쓸 수 있는 포인트",
        desc: "마켓이 열리면 편의점 · 배달\n상품권 등으로 바꿀 수 있어요.",
      },
    ],
  },
  habit: {
    id: "habit",
    eyebrow: "달라지는 한 달",
    title: {
      pc: "점검이 습관이 되면, 한 달이 달라져요",
      mobile: "점검이 습관이 되면,\n한 달이 달라져요",
    },
    desc: "같은 한 달이라도, 매일 돌아보면 흐름이 바뀌어요.",
    before: {
      label: "점검이 빠진 한 달",
      steps: [
        {
          title: "쓰고",
          desc: "결제는 터치\n한 번이면 끝나요",
        },
        {
          title: "잊고",
          desc: "작은 결제는 금방\n기억에서 사라져요",
        },
        {
          title: "놀라고",
          desc: "월말 명세서에서야\n합계를 봐요",
        },
        {
          title: "반복하고",
          desc: "무엇을 바꿀지 모른 채\n다음 달이 시작돼요",
        },
      ],
    },
    after: {
      label: "세이블리와 함께한 한 달",
      steps: [
        {
          title: "적고",
          desc: "쓰는 순간 직접 적으며\n한 번 더 생각해요",
        },
        {
          title: "마감하고",
          desc: "정해 둔 시간에\n오늘 쓴 돈을 확인해요",
        },
        {
          title: "돌아보고",
          desc: "어디에 많이 썼는지\n리포트로 봐요",
        },
        {
          title: "바꾸고",
          desc: "작은 것 하나부터\n바꿔 봐요",
        },
      ],
    },
    repeat: {
      pc: "이 흐름이 반복될수록 습관이 되고, 습관이 되면 한 달이 달라져요.",
      mobile:
        "이 흐름이 반복될수록 습관이 되고,\n습관이 되면 한 달이 달라져요.",
    },
  },
  waitlistSection: {
    id: "waitlist",
    title: {
      pc: "출시되면 가장 먼저 알려드릴게요",
      mobile: "출시되면\n가장 먼저 알려드릴게요",
    },
    desc: {
      pc: "출시 알림을 신청하시면, 오픈 소식을 가장 먼저 보내 드려요.",
      mobile: "출시 알림을 신청하시면,\n오픈 소식을 가장 먼저 보내 드려요.",
    },
    cta: "출시 알림 신청",
  },
  waitlistDialog: {
    title: "출시 알림 신청",
    desc: "세이블리가 출시되면 가장 먼저 알려드릴게요.",
    emailLabel: "이메일",
    emailPlaceholder: "이메일 주소를 입력해 주세요",
    consent: "개인정보 수집 · 이용에 동의해요 (필수)",
    consentView: "보기",
    consentSummary:
      "수집 항목: 이메일 · 이용 목적: 출시 알림 발송 · 보관 기간: 출시 알림 발송 후 지체 없이 파기 (최대 신청일로부터 1년)",
    consentDetails: [
      "수집 항목: 이메일",
      "이용 목적: 출시 알림 발송",
      "보관 기간: 출시 알림 발송 후 지체 없이 파기 (최대 신청일로부터 1년)",
      "동의를 거부할 수 있어요. 거부하면 출시 알림을 받을 수 없어요.",
    ],
    consentHide: "접기",
    consentPrivacyLink: "개인정보처리방침",
    submit: "알림 신청하기",
    submitting: "신청 중…",
    doneTitle: "신청이 완료됐어요",
    doneDesc: "출시 소식을 {email}으로\n가장 먼저 보내 드릴게요.",
    doneConfirm: "확인",
    errors: {
      invalidEmail: "이메일 주소를 다시 확인해 주세요.",
      consentRequired: "개인정보 수집 · 이용에 동의해 주세요.",
      network: "잠시 후 다시 시도해 주세요.",
    },
  },
  mobileMenu: {
    items: [
      {
        label: "소개",
        target: "#empathy",
      },
    ],
    cta: "출시 알림 신청",
    note: "iOS · Android로 출시될 예정이에요",
  },
  footer: {
    company: "세이블리",
    contact: "문의 contact@savelyglobal.com",
    site: "www.savelyglobal.com",
    privacyLink: {
      label: "개인정보처리방침",
      href: "/privacy",
    },
    copyright: "© SAVELY. All rights reserved.",
  },
  floatingCta: "출시 알림 받기",
  privacy: {
    meta: {
      title: "개인정보처리방침 | 세이블리",
    },
    title: "개인정보처리방침",
    draft: "초안",
    draftNote: "정식 운영 전 전문가 검토를 거쳐 내용이 바뀔 수 있어요.",
    intro:
      "세이블리는 출시 알림 신청을 받기 위해 아래와 같이 개인정보를 처리해요.",
    sections: [
      {
        title: "1. 처리 목적",
        items: ["세이블리 앱 출시 소식을 이메일로 알려 드리는 데만 써요."],
      },
      {
        title: "2. 처리 항목",
        items: [
          "이메일 주소 (필수)",
          "동의 시각 · 신청 시각 · 신청한 위치(사이트 안의 버튼 위치)",
          "IP 주소 · 기기 정보 · 쿠키는 저장하지 않아요. 과도한 신청을 막기 위해 접속 IP를 잠깐 확인하지만 저장하지 않아요.",
        ],
      },
      {
        title: "3. 보유 기간과 파기",
        items: [
          "출시 알림 발송 후 지체 없이 파기해요. 출시가 늦어져도 신청일로부터 최대 1년까지만 보관해요.",
          "삭제를 요청하시면 바로 파기해요.",
          "파기는 데이터베이스에서 복구할 수 없게 지우는 방식으로 해요.",
        ],
      },
      {
        title: "4. 제3자 제공",
        items: ["개인정보를 다른 곳에 제공하지 않아요."],
      },
      {
        title: "5. 처리 위탁과 국외 이전",
        items: [
          "받는 곳: Cloudflare, Inc. (미국)",
          "이전 항목: 2번의 저장 항목",
          "목적과 방법: 사이트 운영과 신청 정보 저장(Cloudflare D1). 신청할 때 네트워크로 전송해요.",
          "보유 기간: 3번과 같아요.",
          "국외 이전을 원하지 않으시면 신청하지 않으셔도 돼요. 이 경우 출시 알림을 받을 수 없어요.",
        ],
      },
      {
        title: "6. 정보주체의 권리",
        items: [
          "언제든지 내 개인정보의 열람 · 정정 · 삭제 · 처리 정지를 요청할 수 있어요.",
          "contact@savelyglobal.com으로 요청하시면 지체 없이 처리해요.",
        ],
      },
      {
        title: "7. 안전성 확보 조치",
        items: [
          "관리 권한이 있는 사람만 신청 정보에 접근해요.",
          "모든 전송은 HTTPS로 암호화해요.",
          "이메일 주소를 기록(로그)에 남기지 않아요.",
        ],
      },
      {
        title: "8. 개인정보 보호책임자",
        items: ["세이블리 운영 담당 · contact@savelyglobal.com"],
      },
      {
        title: "9. 권익 침해 구제",
        items: [
          "개인정보 침해 신고나 상담이 필요하면 아래 기관에 문의할 수 있어요.",
          "개인정보침해신고센터 (privacy.kisa.or.kr)",
          "개인정보분쟁조정위원회 (www.kopico.go.kr)",
        ],
      },
      {
        title: "10. 방침 변경",
        items: ["내용이 바뀌면 이 페이지에서 알려 드려요."],
      },
    ],
    effective: "시행일: 2026년 10월 29일 (초안)",
  },
  a11y: {
    logo: "세이블리",
    mainNav: "주요 메뉴",
    menu: "메뉴",
    menuOpen: "메뉴 열기",
    menuClose: "메뉴 닫기",
    heroCarousel: "세이블리 앱 화면",
    prevScreen: "이전 화면",
    nextScreen: "다음 화면",
    screenDot: "{n}번째 화면: {label}",
    dialogClose: "닫기",
  },
} as const;

export type HomeContent = typeof homeContent;
